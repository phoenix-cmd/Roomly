import mongoose, { Document, Schema } from 'mongoose';

export type GlobalRole = 'GUEST' | 'PLATFORM_ADMIN';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isEmailVerified: boolean;
  verificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  globalRole: GlobalRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
    },
    globalRole: {
      type: String,
      enum: ['GUEST', 'PLATFORM_ADMIN'],
      default: 'GUEST',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
