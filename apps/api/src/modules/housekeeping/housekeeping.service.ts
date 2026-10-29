import { HousekeepingTask, IHousekeepingTask } from '../../models/HousekeepingTask.js';
import { Room, PhysicalRoomStatus } from '../../models/Room.js';
import { AuditLog } from '../../models/AuditLog.js';

export class HousekeepingService {
  async getTasks(hotelId: string, status?: string): Promise<IHousekeepingTask[]> {
    const filter: any = { hotelId };
    if (status) filter.status = status;

    return (await HousekeepingTask.find(filter)
      .populate('roomId', 'roomNumber floor status')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ priority: -1, createdAt: -1 })
      .lean()) as unknown as IHousekeepingTask[];
  }

  async updateRoomStatus(
    hotelId: string,
    roomId: string,
    status: PhysicalRoomStatus,
    staffUserId: string
  ) {
    const room = await Room.findOne({ _id: roomId, hotelId });
    if (!room) {
      const err: any = new Error('Room not found.');
      err.statusCode = 404;
      throw err;
    }

    const prevStatus = room.status;
    room.status = status;
    await room.save();

    await AuditLog.create({
      hotelId,
      userId: staffUserId as any,
      action: 'ROOM_STATUS_UPDATED',
      resourceType: 'Room',
      resourceId: room._id.toString(),
      metadata: { roomNumber: room.roomNumber, prevStatus, newStatus: status },
    });

    return room;
  }

  async createTask(hotelId: string, data: Partial<IHousekeepingTask>, staffUserId: string) {
    const task = await HousekeepingTask.create({
      ...data,
      hotelId,
      status: 'PENDING',
    });

    await AuditLog.create({
      hotelId,
      userId: staffUserId as any,
      action: 'HOUSEKEEPING_TASK_CREATED',
      resourceType: 'HousekeepingTask',
      resourceId: task._id.toString(),
      metadata: { taskType: task.taskType, priority: task.priority },
    });

    return task;
  }

  async completeTask(hotelId: string, taskId: string, staffUserId: string) {
    const task = await HousekeepingTask.findOne({ _id: taskId, hotelId });
    if (!task) {
      const err: any = new Error('Task not found.');
      err.statusCode = 404;
      throw err;
    }

    task.status = 'COMPLETED';
    task.completedAt = new Date();
    await task.save();

    // If turnover or clean completed, upgrade room status to INSPECTED or AVAILABLE
    const room = await Room.findById(task.roomId);
    if (room && room.status !== 'OCCUPIED') {
      room.status = 'AVAILABLE';
      await room.save();
    }

    await AuditLog.create({
      hotelId,
      userId: staffUserId as any,
      action: 'HOUSEKEEPING_TASK_COMPLETED',
      resourceType: 'HousekeepingTask',
      resourceId: task._id.toString(),
    });

    return { task, room };
  }
}

export const housekeepingService = new HousekeepingService();
