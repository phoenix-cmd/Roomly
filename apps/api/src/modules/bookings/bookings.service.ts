import { Booking, IBooking } from '../../models/Booking.js';
import { HotelMembership } from '../../models/HotelMembership.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { getStayDates } from '../../utils/date.js';
import { getEmailService } from '../../adapters/email/index.js';
import { AuditLog } from '../../models/AuditLog.js';
import { releaseExpiredHolds } from '../../jobs/holdExpirationJob.js';

export interface CreateHoldDTO {
  hotelId: string;
  roomCategoryId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children?: number;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    specialRequests?: string;
  };
}

export class BookingsService {
  /**
   * Atomically holds inventory and creates a PENDING_PAYMENT booking reservation.
   * Holds automatically expire in 15 minutes if unconfirmed.
   */
  async createHold(guestId: string, dto: CreateHoldDTO): Promise<IBooking> {
    // Lazily clean up any expired holds before evaluating availability
    await releaseExpiredHolds().catch(() => {});

    const dates = getStayDates(dto.checkInDate, dto.checkOutDate);

    // 1. Calculate authoritative pricing snapshot
    const pricing = await inventoryService.checkCategoryAvailability(
      dto.hotelId,
      dto.roomCategoryId,
      dto.checkInDate,
      dto.checkOutDate
    );

    if (!pricing.isAvailable) {
      const err: any = new Error('The selected room category is not available for all requested nights.');
      err.statusCode = 409;
      err.code = 'ROOM_UNAVAILABLE';
      throw err;
    }

    // 2. Concurrency-safe atomic inventory hold
    await inventoryService.holdInventory(dto.hotelId, dto.roomCategoryId, dates);

    // 3. Generate random unique confirmation code
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const confirmationCode = `RML-${randomDigits}`;

    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // 4. Create Booking document
    try {
      const booking = await Booking.create({
        confirmationCode,
        hotelId: dto.hotelId,
        guestId,
        roomCategoryId: dto.roomCategoryId,
        checkInDate: dto.checkInDate,
        checkOutDate: dto.checkOutDate,
        nights: dates.length,
        adults: dto.adults,
        children: dto.children || 0,
        status: 'PENDING_PAYMENT',
        pricingSnapshot: {
          nightlyRates: pricing.nightlyRates.map((nr) => ({
            date: nr.date,
            rateCents: (nr as any).rateCents ?? nr.priceCents,
            priceCents: nr.priceCents,
          })),
          subtotalCents: pricing.subtotalCents,
          taxPercent: pricing.taxPercent,
          taxCents: pricing.taxCents,
          cleaningFeeCents: pricing.cleaningFeeCents,
          totalCents: pricing.totalCents,
          currency: pricing.currency,
          cancellationPolicy: {
            freeCancellationUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
            penaltyPercent: 0,
          },
        },
        guestDetails: dto.guestDetails,
        holdExpiresAt,
      });

      return booking;
    } catch (err) {
      // If booking creation fails, rollback held inventory immediately
      await inventoryService.releaseHold(dto.hotelId, dto.roomCategoryId, dates);
      throw err;
    }
  }

  async getBookingById(bookingId: string, userId: string, isStaffOrAdmin: boolean): Promise<IBooking> {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(bookingId);
    const filter = isObjectId ? { _id: bookingId } : { confirmationCode: bookingId.toUpperCase() };

    const booking = await Booking.findOne(filter)
      .populate('hotelId', 'name slug address policies contact currency images')
      .populate('roomCategoryId', 'name slug sizeSqFt bedConfiguration viewType images')
      .populate('assignedRoomId', 'roomNumber floor status');

    if (!booking) {
      const err: any = new Error('Booking reservation not found.');
      err.statusCode = 404;
      err.code = 'BOOKING_NOT_FOUND';
      throw err;
    }

    // Verify tenant or guest ownership
    let isAuthorized = isStaffOrAdmin || booking.guestId.toString() === userId;
    if (!isAuthorized) {
      const hasMembership = await HotelMembership.exists({
        userId,
        hotelId: (booking.hotelId as any)?._id || booking.hotelId,
        isActive: true,
      });
      if (hasMembership) isAuthorized = true;
    }

    if (!isAuthorized) {
      const err: any = new Error('Access denied to this booking.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    return booking;
  }

  async listGuestBookings(guestId: string): Promise<IBooking[]> {
    return (await Booking.find({ guestId })
      .populate('hotelId', 'name slug address currency images')
      .populate('roomCategoryId', 'name slug bedConfiguration viewType images')
      .sort({ createdAt: -1 })
      .lean()) as unknown as IBooking[];
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    reason: string,
    isStaffOrAdmin: boolean
  ): Promise<IBooking> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err: any = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }

    let isAuthorized = isStaffOrAdmin || booking.guestId.toString() === userId;
    if (!isAuthorized) {
      const membership = await HotelMembership.findOne({
        userId,
        hotelId: booking.hotelId,
        isActive: true,
        role: { $in: ['HOTEL_MANAGER', 'FRONT_DESK'] },
      });
      if (membership) isAuthorized = true;
    }

    if (!isAuthorized) {
      const err: any = new Error('Access denied to cancel this booking.');
      err.statusCode = 403;
      throw err;
    }

    // ATOMIC conditional status transition to prevent double-cancellation race condition
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,
        status: { $in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      },
      {
        $set: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason || 'Guest requested cancellation',
        },
      },
      { new: true }
    );

    if (!updatedBooking) {
      const err: any = new Error(`Cannot cancel reservation in '${booking.status}' status.`);
      err.statusCode = 400;
      err.code = 'INVALID_CANCELLATION_STATUS';
      throw err;
    }

    const dates = getStayDates(booking.checkInDate, booking.checkOutDate);

    // Release inventory
    if (booking.status === 'CONFIRMED') {
      await inventoryService.releaseBookedInventory(
        booking.hotelId.toString(),
        booking.roomCategoryId.toString(),
        dates
      );
    } else if (booking.status === 'PENDING_PAYMENT') {
      await inventoryService.releaseHold(
        booking.hotelId.toString(),
        booking.roomCategoryId.toString(),
        dates
      );
    }

    // Trigger email notification
    const emailService = getEmailService();
    await emailService.sendCancellationNotification(updatedBooking);

    // Record audit event
    await AuditLog.create({
      hotelId: updatedBooking.hotelId,
      userId,
      action: 'BOOKING_CANCELLED',
      resourceType: 'Booking',
      resourceId: updatedBooking._id.toString(),
      metadata: { reason, previousStatus: booking.status },
    });

    return updatedBooking;
  }
}

export const bookingsService = new BookingsService();
