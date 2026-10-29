# Roomly — Database Schema & Data Integrity Design

## 1. Overview
Roomly utilizes MongoDB via Mongoose schemas. To guarantee consistency and prevent financial / booking integrity anomalies:
1. **Integer Minor Units**: All monetary values (`basePriceCents`, `totalCents`, `taxCents`, `refundCents`) are strictly stored as integer cents to avoid floating-point errors.
2. **Date Keys**: Service dates are normalized as standard ISO Date strings `YYYY-MM-DD` (UTC) to eliminate timezone boundary drift.
3. **Compound Unique Indexes**: Applied across all tenancy and concurrency boundaries to eliminate duplicate or race condition records at the database engine level.
4. **Transactions**: MongoDB multi-document transactions are utilized during reservation hold and booking confirmation to ensure atomic multi-night inventory updates.

---

## 2. Entity Relational Model & Collections

### 2.1 Users (`users`)
- `_id`: ObjectId
- `email`: String (lowercase, trimmed, unique indexed)
- `passwordHash`: String (bcrypt, select: false)
- `firstName`: String
- `lastName`: String
- `phone`: String (optional)
- `isEmailVerified`: Boolean (default: false)
- `verificationToken`: String (optional, select: false)
- `passwordResetToken`: String (optional, select: false)
- `passwordResetExpiresAt`: Date (optional)
- `globalRole`: Enum (`GUEST`, `PLATFORM_ADMIN`) (default: `GUEST`)
- `createdAt`, `updatedAt`: Timestamps

### 2.2 Hotels (`hotels`)
- `_id`: ObjectId
- `name`: String
- `slug`: String (unique indexed)
- `tagline`: String
- `description`: String
- `starRating`: Number (1-5)
- `address`: { street: String, city: String, state: String, country: String, postalCode: String, coordinates: { lat: Number, lng: Number } }
- `contact`: { email: String, phone: String, website: String }
- `policies`: { checkInTime: String ("15:00"), checkOutTime: String ("11:00"), cancellationWindowHours: Number (e.g. 48), taxRatePercent: Number (e.g. 12) }
- `currency`: String (ISO 4217, e.g. "USD")
- `images`: Array of { url: String, caption: String, isFeatured: Boolean }
- `amenities`: Array of String
- `isActive`: Boolean (default: true)
- `createdAt`, `updatedAt`: Timestamps

### 2.3 HotelMemberships (`hotel_memberships`)
Enforces multi-tenant staff and manager access control.
- `_id`: ObjectId
- `userId`: ObjectId (Ref: User, indexed)
- `hotelId`: ObjectId (Ref: Hotel, indexed)
- `role`: Enum (`HOTEL_MANAGER`, `FRONT_DESK`, `HOUSEKEEPING`, `SUPPORT`)
- `permissions`: Array of String (`manage_inventory`, `manage_pricing`, `check_in_out`, `housekeeping_write`, `view_reports`, `manage_staff`)
- `isActive`: Boolean (default: true)
- **Index**: Unique Compound Index on `{ userId: 1, hotelId: 1 }`

### 2.4 RoomCategories (`room_categories`)
- `_id`: ObjectId
- `hotelId`: ObjectId (Ref: Hotel, indexed)
- `name`: String (e.g. "Deluxe Ocean Suite")
- `slug`: String
- `description`: String
- `maxOccupancy`: Number (e.g. 4)
- `maxAdults`: Number (e.g. 2)
- `maxChildren`: Number (e.g. 2)
- `basePriceCents`: Number (e.g. 38500 = $385.00)
- `weekendMultiplier`: Number (default: 1.15)
- `sizeSqFt`: Number
- `bedConfiguration`: String (e.g. "1 King Bed")
- `viewType`: String (e.g. "Panoramic Oceanfront")
- `amenities`: Array of String
- `images`: Array of { url: String, caption: String, isPrimary: Boolean }
- `totalRooms`: Number (Total physical rooms in this category)
- `isActive`: Boolean (default: true)
- **Index**: Unique Compound Index on `{ hotelId: 1, slug: 1 }`

### 2.5 Physical Rooms (`rooms`)
- `_id`: ObjectId
- `hotelId`: ObjectId (Ref: Hotel, indexed)
- `roomCategoryId`: ObjectId (Ref: RoomCategory, indexed)
- `roomNumber`: String (e.g. "304")
- `floor`: Number
- `status`: Enum (`AVAILABLE`, `OCCUPIED`, `CLEANING_REQUIRED`, `CLEANING_IN_PROGRESS`, `INSPECTED`, `OUT_OF_SERVICE`)
- `notes`: String
- **Index**: Unique Compound Index on `{ hotelId: 1, roomNumber: 1 }`

### 2.6 InventoryDays (`inventory_days`)
The atomic concurrency foundation for date-based reservations.
- `_id`: ObjectId
- `hotelId`: ObjectId (Ref: Hotel, indexed)
- `roomCategoryId`: ObjectId (Ref: RoomCategory, indexed)
- `date`: String (Format: "YYYY-MM-DD", indexed)
- `totalInventory`: Number
- `bookedCount`: Number (default: 0)
- `heldCount`: Number (default: 0)
- `priceCents`: Number (Optional dynamic rate override for this specific date)
- **Index**: Unique Compound Index on `{ hotelId: 1, roomCategoryId: 1, date: 1 }`
- **Invariant**: `(bookedCount + heldCount) <= totalInventory`

### 2.7 Bookings (`bookings`)
- `_id`: ObjectId
- `confirmationCode`: String (Unique indexed, e.g. "RML-892341")
- `hotelId`: ObjectId (Ref: Hotel, indexed)
- `guestId`: ObjectId (Ref: User, indexed)
- `roomCategoryId`: ObjectId (Ref: RoomCategory, indexed)
- `assignedRoomId`: ObjectId (Ref: Room, optional until check-in)
- `checkInDate`: String ("YYYY-MM-DD")
- `checkOutDate`: String ("YYYY-MM-DD")
- `nights`: Number
- `adults`: Number
- `children`: Number
- `status`: Enum (`PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, `EXPIRED`, `NO_SHOW`)
- `pricingSnapshot`:
  - `nightlyRates`: Array of { date: String, rateCents: Number }
  - `subtotalCents`: Number
  - `taxPercent`: Number
  - `taxCents`: Number
  - `cleaningFeeCents`: Number
  - `totalCents`: Number
  - `currency`: String
  - `cancellationPolicy`: { freeCancellationUntil: Date, penaltyPercent: Number }
- `guestDetails`: { firstName: String, lastName: String, email: String, phone: String, specialRequests: String }
- `holdExpiresAt`: Date (Indexed TTL for PENDING_PAYMENT, e.g. now + 15 min)
- `cancelledAt`: Date
- `cancellationReason`: String
- `createdAt`, `updatedAt`: Timestamps

### 2.8 Payments (`payments`)
- `_id`: ObjectId
- `bookingId`: ObjectId (Ref: Booking, indexed)
- `hotelId`: ObjectId (Ref: Hotel, indexed)
- `guestId`: ObjectId (Ref: User, indexed)
- `amountCents`: Number
- `currency`: String (default: "USD")
- `provider`: Enum (`STRIPE`, `RAZORPAY`, `MOCK_SANDBOX`)
- `providerPaymentIntentId`: String (indexed)
- `status`: Enum (`CREATED`, `PENDING`, `SUCCEEDED`, `FAILED`, `REFUND_PENDING`, `PARTIALLY_REFUNDED`, `REFUNDED`)
- `paymentMethod`: String (e.g. "card", "test_pm")
- `failureMessage`: String
- `createdAt`, `updatedAt`: Timestamps

### 2.9 Refunds (`refunds`)
- `_id`: ObjectId
- `paymentId`: ObjectId (Ref: Payment, indexed)
- `bookingId`: ObjectId (Ref: Booking, indexed)
- `hotelId`: ObjectId (Ref: Hotel, indexed)
- `amountCents`: Number
- `reason`: String
- `status`: Enum (`PENDING`, `SUCCEEDED`, `FAILED`)
- `providerRefundId`: String
- `createdAt`, `updatedAt`: Timestamps

### 2.10 HousekeepingTasks (`housekeeping_tasks`)
- `_id`: ObjectId
- `hotelId`: ObjectId (Ref: Hotel, indexed)
- `roomId`: ObjectId (Ref: Room, indexed)
- `assignedTo`: ObjectId (Ref: User, optional)
- `taskType`: Enum (`TURNOVER_CLEAN`, `DAILY_REFRESH`, `DEEP_CLEAN`, `INSPECTION`)
- `priority`: Enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- `status`: Enum (`PENDING`, `IN_PROGRESS`, `COMPLETED`)
- `notes`: String
- `completedAt`: Date
- `createdAt`, `updatedAt`: Timestamps

### 2.11 WebhookEvents (`webhook_events`)
Guarantees strictly idempotent webhook event processing.
- `_id`: ObjectId
- `provider`: String ("STRIPE", "RAZORPAY")
- `eventId`: String (e.g. "evt_102834")
- `eventType`: String (e.g. "payment_intent.succeeded")
- `payload`: Object
- `status`: Enum (`PROCESSED`, `FAILED`, `IGNORED`)
- `processedAt`: Date
- **Index**: Unique Compound Index on `{ provider: 1, eventId: 1 }`

### 2.12 AuditLogs (`audit_logs`)
- `_id`: ObjectId
- `hotelId`: ObjectId (Ref: Hotel, optional if platform action)
- `userId`: ObjectId (Ref: User)
- `action`: String (e.g. "ROOM_PRICE_MODIFIED", "GUEST_CHECKED_IN", "BOOKING_CANCELLED")
- `resourceType`: String ("Booking", "Room", "User", "Inventory")
- `resourceId`: String
- `metadata`: Object
- `ipAddress`: String
- `createdAt`: Date
