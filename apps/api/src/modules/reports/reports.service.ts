import { Booking } from '../../models/Booking.js';
import { Payment } from '../../models/Payment.js';
import { Refund } from '../../models/Refund.js';
import { Room } from '../../models/Room.js';

export class ReportsService {
  async getOccupancyReport(hotelId: string) {
    const totalRooms = await Room.countDocuments({ hotelId });

    // Aggregate confirmed bookings by month
    const confirmedBookings = await Booking.find({
      hotelId,
      status: { $in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
    }).lean();

    let totalNightsBooked = 0;
    let totalRoomRevenueCents = 0;

    confirmedBookings.forEach((b) => {
      totalNightsBooked += b.nights || 1;
      totalRoomRevenueCents += b.pricingSnapshot?.subtotalCents || 0;
    });

    const adrCents = totalNightsBooked > 0 ? Math.round(totalRoomRevenueCents / totalNightsBooked) : 0;
    // Assuming 30-day period for basic calculation
    const totalCapacityNights = (totalRooms || 10) * 30;
    const occupancyRate = Math.min(100, Math.round((totalNightsBooked / totalCapacityNights) * 100));
    const revParCents = Math.round((adrCents * occupancyRate) / 100);

    return {
      totalRooms,
      totalNightsBooked,
      occupancyRate,
      averageDailyRateCents: adrCents,
      revParCents,
      totalRevenueCents: totalRoomRevenueCents,
    };
  }

  async getFinancialReport(hotelId: string) {
    const [payments, refunds] = await Promise.all([
      Payment.find({ hotelId, status: 'SUCCEEDED' }).lean(),
      Refund.find({ hotelId, status: 'SUCCEEDED' }).lean(),
    ]);

    let grossCollectedCents = 0;
    payments.forEach((p) => {
      grossCollectedCents += p.amountCents;
    });

    let totalRefundedCents = 0;
    refunds.forEach((r) => {
      totalRefundedCents += r.amountCents;
    });

    const netCollectedCents = grossCollectedCents - totalRefundedCents;

    return {
      grossCollectedCents,
      totalRefundedCents,
      netCollectedCents,
      totalTransactions: payments.length,
      totalRefundsCount: refunds.length,
    };
  }
}

export const reportsService = new ReportsService();
