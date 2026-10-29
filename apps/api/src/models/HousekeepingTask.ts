import mongoose, { Document, Schema, Types } from 'mongoose';

export type HousekeepingTaskType =
  | 'TURNOVER_CLEAN'
  | 'DAILY_REFRESH'
  | 'DEEP_CLEAN'
  | 'INSPECTION';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface IHousekeepingTask extends Document {
  hotelId: Types.ObjectId;
  roomId: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  taskType: HousekeepingTaskType;
  priority: TaskPriority;
  status: TaskStatus;
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HousekeepingTaskSchema = new Schema<IHousekeepingTask>(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    taskType: {
      type: String,
      enum: ['TURNOVER_CLEAN', 'DAILY_REFRESH', 'DEEP_CLEAN', 'INSPECTION'],
      default: 'TURNOVER_CLEAN',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    notes: String,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const HousekeepingTask = mongoose.model<IHousekeepingTask>(
  'HousekeepingTask',
  HousekeepingTaskSchema
);
