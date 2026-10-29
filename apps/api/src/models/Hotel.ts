import mongoose, { Document, Schema } from 'mongoose';

export interface IHotelImage {
  url: string;
  caption: string;
  isFeatured?: boolean;
}

export interface IHotelPolicies {
  checkInTime: string;
  checkOutTime: string;
  cancellationWindowHours: number;
  taxRatePercent: number;
}

export interface IHotel extends Document {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  starRating: number;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  policies: IHotelPolicies;
  currency: string;
  images: IHotelImage[];
  amenities: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HotelSchema = new Schema<IHotel>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    tagline: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    starRating: { type: Number, required: true, min: 1, max: 5, default: 5 },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true, index: true },
      state: { type: String, required: true },
      country: { type: String, required: true, index: true },
      postalCode: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    contact: {
      email: { type: String, required: true },
      phone: { type: String, required: true },
      website: String,
    },
    policies: {
      checkInTime: { type: String, default: '15:00' },
      checkOutTime: { type: String, default: '11:00' },
      cancellationWindowHours: { type: Number, default: 48 },
      taxRatePercent: { type: Number, default: 12 },
    },
    currency: { type: String, default: 'USD', uppercase: true },
    images: [
      {
        url: { type: String, required: true },
        caption: { type: String, default: '' },
        isFeatured: { type: Boolean, default: false },
      },
    ],
    amenities: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const Hotel = mongoose.model<IHotel>('Hotel', HotelSchema);
