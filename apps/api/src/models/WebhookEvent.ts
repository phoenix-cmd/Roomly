import mongoose, { Document, Schema } from 'mongoose';

export type WebhookEventStatus = 'PROCESSED' | 'FAILED' | 'IGNORED';

export interface IWebhookEvent extends Document {
  provider: string; // 'STRIPE' | 'RAZORPAY'
  eventId: string;
  eventType: string;
  payload: any;
  status: WebhookEventStatus;
  processedAt: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    provider: {
      type: String,
      required: true,
      uppercase: true,
    },
    eventId: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['PROCESSED', 'FAILED', 'IGNORED'],
      default: 'PROCESSED',
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    errorMessage: String,
  },
  {
    timestamps: true,
  }
);

// Absolute idempotency guard: unique compound index on provider + eventId
WebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
