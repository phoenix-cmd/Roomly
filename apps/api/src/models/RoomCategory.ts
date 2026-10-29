import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRoomImage {
  url: string;
  caption: string;
  isPrimary?: boolean;
}

export interface IRoomCategory extends Document {
  hotelId: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  basePriceCents: number; // Stored in integer cents!
  weekendMultiplier: number;
  sizeSqFt: number;
  bedConfiguration: string;
  viewType: string;
  amenities: string[];
  images: IRoomImage[];
  totalRooms: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomCategorySchema = new Schema<IRoomCategory>(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    maxOccupancy: { type: Number, required: true, min: 1, default: 2 },
    maxAdults: { type: Number, required: true, min: 1, default: 2 },
    maxChildren: { type: Number, default: 0 },
    basePriceCents: { type: Number, required: true, min: 0 }, // e.g. 45000 = $450.00
    weekendMultiplier: { type: Number, default: 1.15 },
    sizeSqFt: { type: Number, required: true },
    bedConfiguration: { type: String, required: true },
    viewType: { type: String, default: 'Courtyard View' },
    amenities: [{ type: String }],
    images: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    totalRooms: { type: Number, required: true, min: 1, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

RoomCategorySchema.index({ hotelId: 1, slug: 1 }, { unique: true });

export const RoomCategory = mongoose.model<IRoomCategory>('RoomCategory', RoomCategorySchema);
