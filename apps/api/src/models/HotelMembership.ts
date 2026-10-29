import mongoose, { Document, Schema, Types } from 'mongoose';

export type HotelRole = 'HOTEL_MANAGER' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'SUPPORT';

export interface IHotelMembership extends Document {
  userId: Types.ObjectId;
  hotelId: Types.ObjectId;
  role: HotelRole;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HotelMembershipSchema = new Schema<IHotelMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['HOTEL_MANAGER', 'FRONT_DESK', 'HOUSEKEEPING', 'SUPPORT'],
      required: true,
      index: true,
    },
    permissions: [{ type: String }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique compound index so a user cannot have duplicate memberships for the same hotel
HotelMembershipSchema.index({ userId: 1, hotelId: 1 }, { unique: true });

export const HotelMembership = mongoose.model<IHotelMembership>('HotelMembership', HotelMembershipSchema);
