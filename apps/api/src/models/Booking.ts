import mongoose, { Document, Schema, Types } from 'mongoose';

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW';

export interface INightlyRate {
  date: string;
  rateCents: number;
}

export interface IPricingSnapshot {
  nightlyRates: INightlyRate[];
  subtotalCents: number;
  taxPercent: number;
  taxCents: number;
  cleaningFeeCents: number;
  totalCents: number;
  currency: string;
  cancellationPolicy: {
    freeCancellationUntil: Date;
    penaltyPercent: number;
  };
}

export interface IGuestDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialRequests?: string;
}

export interface IBooking extends Document {
  confirmationCode: string;
  hotelId: Types.ObjectId;
  guestId: Types.ObjectId;
  roomCategoryId: Types.ObjectId;
  assignedRoomId?: Types.ObjectId;
  checkInDate: string; // "YYYY-MM-DD"
  checkOutDate: string; // "YYYY-MM-DD"
  nights: number;
  adults: number;
  children: number;
  status: BookingStatus;
  pricingSnapshot: IPricingSnapshot;
  guestDetails: IGuestDetails;
  holdExpiresAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    confirmationCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roomCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'RoomCategory',
      required: true,
      index: true,
    },
    assignedRoomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
    },
    checkInDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    checkOutDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    nights: {
      type: Number,
      required: true,
      min: 1,
    },
    adults: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    children: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'CONFIRMED',
        'CHECKED_IN',
        'CHECKED_OUT',
        'CANCELLED',
        'EXPIRED',
        'NO_SHOW',
      ],
      default: 'PENDING_PAYMENT',
      index: true,
    },
    pricingSnapshot: {
      nightlyRates: [
        {
          date: { type: String, required: true },
          rateCents: { type: Number, required: true },
        },
      ],
      subtotalCents: { type: Number, required: true },
      taxPercent: { type: Number, required: true },
      taxCents: { type: Number, required: true },
      cleaningFeeCents: { type: Number, default: 0 },
      totalCents: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
      cancellationPolicy: {
        freeCancellationUntil: { type: Date },
        penaltyPercent: { type: Number, default: 0 },
      },
    },
    guestDetails: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: String,
      specialRequests: String,
    },
    holdExpiresAt: {
      type: Date,
      index: true,
    },
    cancelledAt: Date,
    cancellationReason: String,
    checkedInAt: Date,
    checkedOutAt: Date,
  },
  {
    timestamps: true,
  }
);

BookingSchema.index({ hotelId: 1, checkInDate: 1 });
BookingSchema.index({ hotelId: 1, status: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
