import mongoose, { Document, Schema, Types } from 'mongoose';

export type RefundStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED';

export interface IRefund extends Document {
  paymentId: Types.ObjectId;
  bookingId: Types.ObjectId;
  hotelId: Types.ObjectId;
  amountCents: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  providerRefundId?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    amountCents: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCEEDED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    providerRefundId: String,
    failureReason: String,
  },
  {
    timestamps: true,
  }
);

export const Refund = mongoose.model<IRefund>('Refund', RefundSchema);
