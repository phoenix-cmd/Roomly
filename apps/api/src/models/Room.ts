import mongoose, { Document, Schema, Types } from 'mongoose';

export type PhysicalRoomStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'CLEANING_REQUIRED'
  | 'CLEANING_IN_PROGRESS'
  | 'INSPECTED'
  | 'OUT_OF_SERVICE';

export interface IRoom extends Document {
  hotelId: Types.ObjectId;
  roomCategoryId: Types.ObjectId;
  roomNumber: string;
  floor: number;
  status: PhysicalRoomStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    roomCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'RoomCategory',
      required: true,
      index: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: [
        'AVAILABLE',
        'OCCUPIED',
        'CLEANING_REQUIRED',
        'CLEANING_IN_PROGRESS',
        'INSPECTED',
        'OUT_OF_SERVICE',
      ],
      default: 'AVAILABLE',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

RoomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });

export const Room = mongoose.model<IRoom>('Room', RoomSchema);
