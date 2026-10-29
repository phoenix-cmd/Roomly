import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInventoryDay extends Document {
  hotelId: Types.ObjectId;
  roomCategoryId: Types.ObjectId;
  date: string; // ISO Date string: "YYYY-MM-DD"
  totalInventory: number;
  bookedCount: number;
  heldCount: number;
  priceCents?: number;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryDaySchema = new Schema<IInventoryDay>(
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
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    totalInventory: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    bookedCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    heldCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    priceCents: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Crucial: unique compound index prevents duplicate allotment records per date & category
InventoryDaySchema.index({ hotelId: 1, roomCategoryId: 1, date: 1 }, { unique: true });

export const InventoryDay = mongoose.model<IInventoryDay>('InventoryDay', InventoryDaySchema);
