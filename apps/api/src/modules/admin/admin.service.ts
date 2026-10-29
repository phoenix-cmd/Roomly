import { Hotel, IHotel } from '../../models/Hotel.js';
import { User } from '../../models/User.js';
import { Booking } from '../../models/Booking.js';
import { Payment } from '../../models/Payment.js';
import { AuditLog } from '../../models/AuditLog.js';
import mongoose from 'mongoose';

export class AdminService {
  async getOverview() {
    const [totalHotels, totalUsers, totalBookings, payments] = await Promise.all([
      Hotel.countDocuments(),
      User.countDocuments(),
      Booking.countDocuments(),
      Payment.find({ status: 'SUCCEEDED' }, 'amountCents').lean(),
    ]);

    let totalPlatformGrossCents = 0;
    payments.forEach((p) => {
      totalPlatformGrossCents += p.amountCents;
    });

    return {
      totalHotels,
      totalUsers,
      totalBookings,
      totalPlatformGrossCents,
    };
  }

  async listAllHotels(): Promise<IHotel[]> {
    return Hotel.find().sort({ createdAt: -1 }).lean() as unknown as IHotel[];
  }

  async createHotel(data: Partial<IHotel>, adminUserId: string): Promise<IHotel> {
    const hotel = await Hotel.create({
      ...data,
      slug: data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    });

    await AuditLog.create({
      hotelId: hotel._id,
      userId: adminUserId as any,
      action: 'HOTEL_PROPERTY_ONBOARDED',
      resourceType: 'Hotel',
      resourceId: hotel._id.toString(),
      metadata: { hotelName: hotel.name },
    });

    return hotel;
  }

  async listAuditLogs(limit = 50) {
    return AuditLog.find()
      .populate('userId', 'firstName lastName email')
      .populate('hotelId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  getSystemHealth() {
    return {
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        readyState: mongoose.connection.readyState,
        status: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
      },
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}

export const adminService = new AdminService();
