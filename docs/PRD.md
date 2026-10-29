# Roomly — Product Requirements Document (PRD)

## 1. Executive Summary & Vision
**Roomly** is an end-to-end hotel booking and operations management platform crafted for boutique luxury hotels and hospitality groups. It unites a high-conversion, luxury editorial public booking engine with a robust operational management system for front-desk staff, housekeepers, hotel managers, and platform administrators.

Built on a modular monolith MERN stack with TypeScript, Roomly enforces strict domain boundaries, multi-tenant isolation, inventory concurrency correctness, idempotent payment processing, and granular role-based access control (RBAC).

---

## 2. Core Personas & Roles

| Role | Scope | Primary Needs |
|---|---|---|
| **Guest** | Public & Authenticated Personal Account | Seamless room discovery, intuitive date/occupancy filters, transparent pricing breakdown, secure instant checkout, booking management, self-service cancellation/refund requests, and stay history. |
| **Hotel Staff (Front Desk / Housekeeping / Support)** | Assigned Hotel Property | Today's arrivals and departures, real-time room assignment, check-in / check-out processing, housekeeping clean/inspect workflow, and guest service request ticketing. |
| **Hotel Manager** | Assigned Hotel Property | Room category and physical room configuration, dynamic pricing & seasonal rules, inventory allotment, staff shift/permission assignments, occupancy & revenue analytics, audit logs. |
| **Platform Administrator** | Global (All Hotels) | Multi-property onboarding, global user and membership oversight, dispute and refund monitoring, system health metrics, security audits, and global platform settings. |

---

## 3. High-Level User Journeys

### 3.1 Guest Discovery & Reservation Journey
1. **Explore**: Guest arrives at the homepage featuring a luxury editorial aesthetic, curated property photography, and an interactive booking search widget (Check-in, Check-out, Adults, Children, Room Count).
2. **Filter & Select**: Guest browses available room categories with real-time rate calculation, amenity tags, high-resolution imagery, and capacity restrictions.
3. **Room Details**: Deep-dive into room specifics, bed configurations, view details, accessibility notes, transparent tax & fee calculations, and cancellation terms.
4. **Checkout**: 
   - Guest logs in or registers seamlessly during checkout.
   - Server reserves an atomic temporary inventory hold (15-minute TTL) to prevent race conditions.
   - Authoritative pricing snapshot computed server-side in integer minor units (cents).
   - Guest enters payment via secure gateway (Stripe / Razorpay / Mock sandbox).
5. **Confirmation**: Webhook / verified callback validates server payment; reservation transitions from `PENDING_PAYMENT` to `CONFIRMED`. Instant email confirmation and printable invoice generated.

### 3.2 Staff Front-Desk Operations Journey
1. **Daily Overview**: View live stats on Today's Expected Arrivals, Expected Departures, Stayovers, and Current In-House Guests.
2. **Check-In**: Look up guest reservation by confirmation code or guest name. Verify balance, assign a cleaned & inspected physical room, collect keycard acknowledgement, and mark `CHECKED_IN`.
3. **Check-Out**: Review final billing / incidentals, accept settlement if balance remains, transition booking to `CHECKED_OUT`, and automatically queue physical room for Housekeeping (`CLEANING_REQUIRED`).

### 3.3 Housekeeping & Maintenance Journey
1. **Task Board**: Housekeeper views prioritized room cleaning board (`DIRTY`, `CLEANING_IN_PROGRESS`, `CLEANED`, `INSPECTED`, `OUT_OF_SERVICE`).
2. **Status Update**: Real-time room status update updates front desk instantly without page refreshes.
3. **Service Requests**: Front desk or guest requests extra amenities/towels; housekeeper marks tasks in progress and completed.

### 3.4 Hotel Manager Configuration & Analytics
1. **Inventory & Rates**: Define base rates, weekend surcharges, seasonal modifiers, and blackout dates.
2. **Staff Oversight**: Invite staff members, assign roles (Front Desk, Housekeeping, Manager), and review staff action audit logs.
3. **Reporting**: View occupancy rates (RevPAR, ADR, Occupancy percentage), revenue over custom date ranges, and cancellation ratios.

---

## 4. Key Functional Requirements

### 4.1 Multi-Tenant Hotel Isolation
- Every operational resource (`RoomCategory`, `Room`, `Booking`, `InventoryDay`, `HousekeepingTask`, `Invoice`, `AuditLog`) is strictly scoped by `hotelId`.
- Access permissions are derived exclusively from the authenticated user's active `HotelMembership` record, never blindly trusted from client request headers or route parameters.

### 4.2 Inventory & Concurrency Correctness
- Date-based inventory records per `(hotelId, roomCategoryId, date)`.
- Multi-night reservations atomically lock inventory across all included nights via conditional atomic increments with bounds check (`bookedCount + heldCount + requestedCount <= totalInventory`).
- Temporary holds auto-expire after 15 minutes if payment is not initiated, safely restoring inventory allotments.
- Confirmed booking cancellations release room allocations exactly once.

### 4.3 Financial Integrity
- Authoritative monetary values computed exclusively in integer minor units (e.g. `$350.00` = `35000` cents). Zero floating point rounding issues.
- Fixed commercial snapshot persisted on booking record (rates, discounts, taxes, cancellation terms) immutable to subsequent room rate changes.
- Abstracted payment gateway with idempotent webhook processing (`WebhookEvent` record deduplication).

### 4.4 Luxury Editorial UX Standards
- Visual Identity: Warm ivory (`#F7F3EC`), Deep charcoal (`#24231F`), Champagne gold (`#B69A68`), Sandstone (`#E6DED2`), Muted olive (`#737866`).
- Typography: Cormorant Garamond for display headlines; Inter for high-legibility UI text.
- Generous whitespace, asymmetric editorial photo grids, no jarring bright saturation, responsive mobile-first layouts with accessible focus rings and semantic HTML.
