export interface IHotelImage {
  url: string;
  caption: string;
  isFeatured?: boolean;
}

export interface IHotel {
  _id: string;
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
    coordinates?: { lat: number; lng: number };
  };
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  policies: {
    checkInTime: string;
    checkOutTime: string;
    cancellationWindowHours: number;
    taxRatePercent: number;
  };
  currency: string;
  amenities: string[];
  images: IHotelImage[];
  isActive: boolean;
}

export interface IRoomImage {
  url: string;
  caption: string;
  isPrimary?: boolean;
}

export interface IRoomCategory {
  _id: string;
  hotelId: string;
  name: string;
  slug: string;
  description: string;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  basePriceCents: number;
  weekendMultiplier: number;
  sizeSqFt: number;
  bedConfiguration: string;
  viewType: string;
  amenities: string[];
  images: IRoomImage[];
  totalRooms: number;
  isActive: boolean;
}

export interface INightlyRate {
  date: string;
  priceCents: number;
  availableRooms: number;
}

export interface IAvailabilityInfo {
  isAvailable: boolean;
  minAvailableRooms: number;
  nightlyRates: INightlyRate[];
  subtotalCents: number;
  taxPercent: number;
  taxCents: number;
  cleaningFeeCents: number;
  totalCents: number;
  currency: string;
}

export interface IAvailableCategoryResult {
  category: IRoomCategory;
  availability: IAvailabilityInfo;
}

export interface IPricingSnapshot {
  nightlyRates: { date: string; rateCents: number }[];
  subtotalCents: number;
  taxPercent: number;
  taxCents: number;
  cleaningFeeCents: number;
  totalCents: number;
  currency: string;
  cancellationPolicy: {
    freeCancellationUntil?: string;
    penaltyPercent: number;
  };
}

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'NO_SHOW';

export interface IBooking {
  _id: string;
  confirmationCode: string;
  hotelId: IHotel | string;
  guestId: string;
  roomCategoryId: IRoomCategory | string;
  assignedRoomId?: { _id: string; roomNumber: string; floor: number; status: string } | string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  adults: number;
  children: number;
  status: BookingStatus;
  pricingSnapshot: IPricingSnapshot;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    specialRequests?: string;
  };
  holdExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  globalRole: 'GUEST' | 'PLATFORM_ADMIN';
  isEmailVerified: boolean;
  memberships: Array<{
    hotelId: string;
    hotelName?: string;
    role: 'HOTEL_MANAGER' | 'FRONT_DESK' | 'HOUSEKEEPING' | 'SUPPORT';
    permissions: string[];
  }>;
}

export interface IPhysicalRoom {
  _id: string;
  hotelId: string;
  roomCategoryId: { _id: string; name: string; slug: string; basePriceCents: number };
  roomNumber: string;
  floor: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING_REQUIRED' | 'CLEANING_IN_PROGRESS' | 'INSPECTED' | 'OUT_OF_SERVICE';
  notes?: string;
}

export interface IHousekeepingTask {
  _id: string;
  hotelId: string;
  roomId: { _id: string; roomNumber: string; floor: number; status: string };
  assignedTo?: { firstName: string; lastName: string; email: string };
  taskType: 'TURNOVER_CLEAN' | 'DAILY_REFRESH' | 'DEEP_CLEAN' | 'INSPECTION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  createdAt: string;
}
