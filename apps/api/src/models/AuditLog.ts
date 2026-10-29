import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  hotelId?: Types.ObjectId;
  userId?: Types.ObjectId;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
