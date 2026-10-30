import { Booking, IBooking } from '../../models/Booking.js';
import { Room } from '../../models/Room.js';
import { HousekeepingTask } from '../../models/HousekeepingTask.js';
import { AuditLog } from '../../models/AuditLog.js';
import { formatDateKey } from '../../utils/date.js';

export class OperationsService {
  async getDashboardStats(hotelId: string) {
    const todayStr = formatDateKey(new Date());

    const [
      expectedArrivals,
      expectedDepartures,
      inHouseBookings,
      totalRooms,
      occupiedRooms,
      cleaningRooms,
    ] = await Promise.all([
      Booking.countDocuments({
        hotelId,
        checkInDate: todayStr,
        status: 'CONFIRMED',
      }),
      Booking.countDocuments({
        hotelId,
        checkOutDate: todayStr,
        status: 'CHECKED_IN',
      }),
      Booking.countDocuments({
        hotelId,
        status: 'CHECKED_IN',
      }),
      Room.countDocuments({ hotelId }),
      Room.countDocuments({ hotelId, status: 'OCCUPIED' }),
      Room.countDocuments({
        hotelId,
        status: { $in: ['CLEANING_REQUIRED', 'CLEANING_IN_PROGRESS'] },
      }),
    ]);

    const availableRooms = Math.max(0, totalRooms - occupiedRooms - cleaningRooms);
    const occupancyPercent = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      today: todayStr,
      expectedArrivals,
      expectedDepartures,
      inHouseBookings,
      totalRooms,
      occupiedRooms,
      availableRooms,
      cleaningRooms,
      occupancyPercent,
    };
  }

  async getArrivals(hotelId: string, dateStr?: string): Promise<IBooking[]> {
    const date = dateStr || formatDateKey(new Date());
    return (await Booking.find({
      hotelId,
      checkInDate: date,
      status: { $in: ['CONFIRMED', 'CHECKED_IN'] },
    })
      .populate('roomCategoryId', 'name slug basePriceCents')
      .populate('assignedRoomId', 'roomNumber floor status')
      .sort({ createdAt: 1 })
      .lean()) as unknown as IBooking[];
  }

  async getDepartures(hotelId: string, dateStr?: string): Promise<IBooking[]> {
    const date = dateStr || formatDateKey(new Date());
    return (await Booking.find({
      hotelId,
      checkOutDate: date,
      status: { $in: ['CHECKED_IN', 'CHECKED_OUT'] },
    })
      .populate('roomCategoryId', 'name slug basePriceCents')
      .populate('assignedRoomId', 'roomNumber floor status')
      .sort({ createdAt: 1 })
      .lean()) as unknown as IBooking[];
  }

  async checkIn(hotelId: string, bookingId: string, assignedRoomId: string, staffUserId: string) {
    const booking = await Booking.findOne({ _id: bookingId, hotelId });
    if (!booking) {
      const err: any = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }

    if (booking.status !== 'CONFIRMED') {
      const err: any = new Error(`Cannot check in booking with status '${booking.status}'.`);
      err.statusCode = 400;
      throw err;
    }

    const room = await Room.findOne({ _id: assignedRoomId, hotelId });
    if (!room) {
      const err: any = new Error('Physical room not found.');
      err.statusCode = 404;
      throw err;
    }

    // Verify room category match
    if (room.roomCategoryId && room.roomCategoryId.toString() !== booking.roomCategoryId.toString()) {
      const err: any = new Error('Selected physical room does not match the reserved suite category.');
      err.statusCode = 400;
      err.code = 'ROOM_CATEGORY_MISMATCH';
      throw err;
    }

    // Atomic conditional status transition to prevent concurrent double-assignment
    const updatedRoom = await Room.findOneAndUpdate(
      { _id: assignedRoomId, hotelId, status: { $ne: 'OCCUPIED' } },
      { $set: { status: 'OCCUPIED' } },
      { new: true }
    );

    if (!updatedRoom) {
      const err: any = new Error(`Room ${room.roomNumber} is currently occupied.`);
      err.statusCode = 409;
      throw err;
    }

    // Assign room and transition booking state
    booking.assignedRoomId = updatedRoom._id as any;
    booking.status = 'CHECKED_IN';
    booking.checkedInAt = new Date();
    await booking.save();

    await AuditLog.create({
      hotelId,
      userId: staffUserId as any,
      action: 'GUEST_CHECKED_IN',
      resourceType: 'Booking',
      resourceId: booking._id.toString(),
      metadata: { roomNumber: updatedRoom.roomNumber, confirmationCode: booking.confirmationCode },
    });

    return { booking, room: updatedRoom };
  }

  async checkOut(hotelId: string, bookingId: string, staffUserId: string) {
    const booking = await Booking.findOne({ _id: bookingId, hotelId });
    if (!booking) {
      const err: any = new Error('Booking not found.');
      err.statusCode = 404;
      throw err;
    }

    if (booking.status !== 'CHECKED_IN') {
      const err: any = new Error(`Cannot check out booking with status '${booking.status}'.`);
      err.statusCode = 400;
      throw err;
    }

    booking.status = 'CHECKED_OUT';
    booking.checkedOutAt = new Date();
    await booking.save();

    if (booking.assignedRoomId) {
      const room = await Room.findById(booking.assignedRoomId);
      if (room) {
        room.status = 'CLEANING_REQUIRED';
        await room.save();

        // Automatically dispatch turnover housekeeping task
        await HousekeepingTask.create({
          hotelId,
          roomId: room._id,
          taskType: 'TURNOVER_CLEAN',
          priority: 'HIGH',
          status: 'PENDING',
          notes: `Departure turnover for room ${room.roomNumber}`,
        });
      }
    }

    await AuditLog.create({
      hotelId,
      userId: staffUserId as any,
      action: 'GUEST_CHECKED_OUT',
      resourceType: 'Booking',
      resourceId: booking._id.toString(),
      metadata: { confirmationCode: booking.confirmationCode },
    });

    return { booking };
  }
}

export const operationsService = new OperationsService();
