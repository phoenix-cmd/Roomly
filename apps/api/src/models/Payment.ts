import mongoose, { Document, Schema, Types } from 'mongoose';

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'REFUND_PENDING'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';

export type PaymentProvider = 'STRIPE' | 'RAZORPAY' | 'MOCK_SANDBOX';

export interface IPayment extends Document {
  bookingId: Types.ObjectId;
  hotelId: Types.ObjectId;
  guestId: Types.ObjectId;
  amountCents: number;
  currency: string;
  provider: PaymentProvider;
  providerTransactionId: string;
  status: PaymentStatus;
  paymentMethod?: string;
  failureMessage?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
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
    guestId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amountCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    provider: {
      type: String,
      enum: ['STRIPE', 'RAZORPAY', 'MOCK_SANDBOX'],
      required: true,
    },
    providerTransactionId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'CREATED',
        'PENDING',
        'SUCCEEDED',
        'FAILED',
        'REFUND_PENDING',
        'PARTIALLY_REFUNDED',
        'REFUNDED',
      ],
      default: 'CREATED',
      index: true,
    },
    paymentMethod: String,
    failureMessage: String,
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
