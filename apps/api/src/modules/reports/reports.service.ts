import mongoose from 'mongoose';
import { Booking } from '../../models/Booking.js';
import { Payment } from '../../models/Payment.js';
import { Refund } from '../../models/Refund.js';
import { Room } from '../../models/Room.js';

export class ReportsService {
  async getOccupancyReport(hotelId: string, startDate?: string, endDate?: string) {
    const matchHotelId = mongoose.Types.ObjectId.isValid(hotelId)
      ? new mongoose.Types.ObjectId(hotelId)
      : hotelId;

    const matchFilter: Record<string, any> = {
      hotelId: matchHotelId,
      status: { $in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
    };

    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    const [totalRooms, bookingStats] = await Promise.all([
      Room.countDocuments({ hotelId }),
      Booking.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalNightsBooked: { $sum: '$nights' },
            totalRoomRevenueCents: { $sum: '$pricingSnapshot.subtotalCents' },
          },
        },
      ]),
    ]);

    const totalNightsBooked = bookingStats[0]?.totalNightsBooked || 0;
    const totalRoomRevenueCents = bookingStats[0]?.totalRoomRevenueCents || 0;

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

  async getFinancialReport(hotelId: string, startDate?: string, endDate?: string) {
    const matchHotelId = mongoose.Types.ObjectId.isValid(hotelId)
      ? new mongoose.Types.ObjectId(hotelId)
      : hotelId;

    const paymentFilter: Record<string, any> = {
      hotelId: matchHotelId,
      status: 'SUCCEEDED',
    };
    const refundFilter: Record<string, any> = {
      hotelId: matchHotelId,
      status: 'SUCCEEDED',
    };

    if (startDate || endDate) {
      paymentFilter.createdAt = {};
      refundFilter.createdAt = {};
      if (startDate) {
        paymentFilter.createdAt.$gte = new Date(startDate);
        refundFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        paymentFilter.createdAt.$lte = new Date(endDate);
        refundFilter.createdAt.$lte = new Date(endDate);
      }
    }

    const [paymentAgg, refundAgg] = await Promise.all([
      Payment.aggregate([
        { $match: paymentFilter },
        {
          $group: {
            _id: null,
            grossCollectedCents: { $sum: '$amountCents' },
            totalTransactions: { $sum: 1 },
          },
        },
      ]),
      Refund.aggregate([
        { $match: refundFilter },
        {
          $group: {
            _id: null,
            totalRefundedCents: { $sum: '$amountCents' },
            totalRefundsCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const grossCollectedCents = paymentAgg[0]?.grossCollectedCents || 0;
    const totalTransactions = paymentAgg[0]?.totalTransactions || 0;
    const totalRefundedCents = refundAgg[0]?.totalRefundedCents || 0;
    const totalRefundsCount = refundAgg[0]?.totalRefundsCount || 0;
    const netCollectedCents = grossCollectedCents - totalRefundedCents;

    return {
      grossCollectedCents,
      totalRefundedCents,
      netCollectedCents,
      totalTransactions,
      totalRefundsCount,
    };
  }
}

export const reportsService = new ReportsService();
