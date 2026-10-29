import { Booking, IBooking } from '../../models/Booking.js';
import { Payment, IPayment } from '../../models/Payment.js';
import { Refund } from '../../models/Refund.js';
import { WebhookEvent } from '../../models/WebhookEvent.js';
import { AuditLog } from '../../models/AuditLog.js';
import { getPaymentGateway } from '../../adapters/payment/index.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { getStayDates } from '../../utils/date.js';
import { getEmailService } from '../../adapters/email/index.js';
import { logger } from '../../utils/logger.js';

export class PaymentsService {
  /**
   * Initializes a payment intent with the active payment provider.
   * Calculates authoritative payable amount from booking pricing snapshot.
   */
  async createPaymentIntent(bookingId: string, guestId: string) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err: any = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }

    if (booking.guestId.toString() !== guestId) {
      const err: any = new Error('Unauthorized access to booking payment.');
      err.statusCode = 403;
      throw err;
    }

    if (booking.status !== 'PENDING_PAYMENT') {
      const err: any = new Error(`Cannot initiate payment for booking in '${booking.status}' status.`);
      err.statusCode = 400;
      throw err;
    }

    if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
      const err: any = new Error('Reservation hold has expired. Please reselect your room.');
      err.statusCode = 410;
      err.code = 'HOLD_EXPIRED';
      throw err;
    }

    const gateway = getPaymentGateway();
    const orderResult = await gateway.createOrder({
      amountCents: booking.pricingSnapshot.totalCents,
      currency: booking.pricingSnapshot.currency,
      bookingId: booking._id.toString(),
      customerEmail: booking.guestDetails.email,
    });

    const payment = await Payment.create({
      bookingId: booking._id,
      hotelId: booking.hotelId,
      guestId: booking.guestId,
      amountCents: booking.pricingSnapshot.totalCents,
      currency: booking.pricingSnapshot.currency,
      provider: orderResult.provider,
      providerTransactionId: orderResult.providerTransactionId,
      status: 'PENDING',
    });

    return {
      paymentId: payment._id.toString(),
      provider: orderResult.provider,
      clientSecret: orderResult.clientSecret,
      amountCents: orderResult.amountCents,
      currency: orderResult.currency,
      confirmationCode: booking.confirmationCode,
    };
  }

  /**
   * Controlled test-double confirmation helper for dev and non-production testing.
   */
  async confirmMockPayment(bookingId: string, guestId: string) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err: any = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }

    if (booking.guestId.toString() !== guestId) {
      const err: any = new Error('Unauthorized.');
      err.statusCode = 403;
      throw err;
    }

    const payment = await Payment.findOne({ bookingId: booking._id }).sort({ createdAt: -1 });
    if (!payment) {
      const err: any = new Error('No pending payment order found.');
      err.statusCode = 404;
      throw err;
    }

    return this.finalizePaymentSuccess(booking, payment);
  }

  /**
   * Cryptographically verified and idempotent webhook processor.
   */
  async handleWebhook(rawBody: Buffer | string, signature: string) {
    const gateway = getPaymentGateway();
    const verification = await gateway.verifyWebhook(rawBody, signature);

    if (!verification.isValid) {
      logger.warn('⚠️ Rejected webhook with invalid signature.');
      const err: any = new Error('Invalid webhook signature');
      err.statusCode = 400;
      throw err;
    }

    // 1. Idempotency Check: check if eventId was already processed
    const existing = await WebhookEvent.findOne({
      provider: gateway.providerName,
      eventId: verification.eventId,
    });

    if (existing) {
      logger.info(`ℹ️ Idempotent webhook deduplicated: event ${verification.eventId} already processed.`);
      return { duplicate: true, status: existing.status };
    }

    // 2. Persist event
    const eventRecord = await WebhookEvent.create({
      provider: gateway.providerName,
      eventId: verification.eventId,
      eventType: verification.eventType,
      payload: verification.payload,
      status: 'PROCESSED',
      processedAt: new Date(),
    });

    // 3. Process business action if payment succeeded
    if (verification.eventType === 'payment_intent.succeeded' && verification.bookingId) {
      const booking = await Booking.findById(verification.bookingId);
      if (booking && booking.status === 'PENDING_PAYMENT') {
        let payment = await Payment.findOne({
          providerTransactionId: verification.providerTransactionId,
        });

        if (!payment) {
          payment = await Payment.create({
            bookingId: booking._id,
            hotelId: booking.hotelId,
            guestId: booking.guestId,
            amountCents: verification.amountCents || booking.pricingSnapshot.totalCents,
            currency: booking.pricingSnapshot.currency,
            provider: gateway.providerName as any,
            providerTransactionId: verification.providerTransactionId || `tx_${Date.now()}`,
            status: 'SUCCEEDED',
          });
        }

        await this.finalizePaymentSuccess(booking, payment);
      }
    }

    return { success: true, eventId: eventRecord.eventId };
  }

  /**
   * Authoritative transition from PENDING_PAYMENT to CONFIRMED.
   * Atomically converts held inventory to booked inventory.
   */
  async finalizePaymentSuccess(booking: IBooking, payment: IPayment) {
    if (booking.status === 'CONFIRMED') {
      return { booking, payment, alreadyConfirmed: true };
    }

    const dates = getStayDates(booking.checkInDate, booking.checkOutDate);

    // Atomic inventory conversion from hold to booked
    await inventoryService.confirmHoldToBooked(
      booking.hotelId.toString(),
      booking.roomCategoryId.toString(),
      dates
    );

    booking.status = 'CONFIRMED';
    booking.holdExpiresAt = undefined;
    await booking.save();

    payment.status = 'SUCCEEDED';
    await payment.save();

    // Send confirmation email
    const emailService = getEmailService();
    await emailService.sendBookingConfirmation(booking);

    // Audit log
    await AuditLog.create({
      hotelId: booking.hotelId,
      userId: booking.guestId,
      action: 'BOOKING_PAYMENT_CONFIRMED',
      resourceType: 'Booking',
      resourceId: booking._id.toString(),
      metadata: {
        amountCents: payment.amountCents,
        confirmationCode: booking.confirmationCode,
        providerTransactionId: payment.providerTransactionId,
      },
    });

    return { booking, payment, confirmed: true };
  }

  /**
   * Processes a refund for a confirmed booking
   */
  async processRefund(paymentId: string, amountCents: number, reason: string, staffUserId: string) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      const err: any = new Error('Payment record not found.');
      err.statusCode = 404;
      throw err;
    }

    const gateway = getPaymentGateway();
    const refundResult = await gateway.processRefund({
      providerTransactionId: payment.providerTransactionId,
      amountCents,
      currency: payment.currency,
      reason,
    });

    const refund = await Refund.create({
      paymentId: payment._id,
      bookingId: payment.bookingId,
      hotelId: payment.hotelId,
      amountCents,
      currency: payment.currency,
      reason,
      status: refundResult.status,
      providerRefundId: refundResult.providerRefundId,
    });

    if (refundResult.status === 'SUCCEEDED') {
      payment.status = amountCents >= payment.amountCents ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      await payment.save();
    }

    await AuditLog.create({
      hotelId: payment.hotelId,
      userId: staffUserId as any,
      action: 'PAYMENT_REFUNDED',
      resourceType: 'Refund',
      resourceId: refund._id.toString(),
      metadata: { amountCents, reason, refundResult },
    });

    return refund;
  }
}

export const paymentsService = new PaymentsService();
