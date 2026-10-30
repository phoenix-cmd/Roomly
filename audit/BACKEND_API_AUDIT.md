# Roomly Backend Architecture, Controller & API Audit

## 1. Overview & Technology Stack

- **Runtime**: Node.js v25.6.1 with TypeScript 5.7.3 and Express 4.21.2
- **Database & ODM**: MongoDB with Mongoose 8.9.5
- **Authentication**: JWT (`jsonwebtoken` v9.0.2) with short-lived access tokens (15m) and HttpOnly refresh cookies (7d)
- **Validation**: Zod v3.24.1 for request body schemas
- **Security Middleware**: Helmet 8.0.0, CORS 2.8.5, Express-Rate-Limit 7.5.0
- **Logging**: Winston 3.17.0

---

## 2. Critical & High-Priority Backend Defects

### Finding API-001: Staff & Hotel Managers Locked Out of `GET /api/v1/bookings/:id`
- **Severity**: HIGH
- **Priority**: HIGH
- **Component**: [`apps/api/src/modules/bookings/bookings.routes.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/bookings/bookings.routes.ts#L19-L21) and [`apps/api/src/modules/bookings/bookings.controller.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/bookings/bookings.controller.ts#L35-L42)
- **Description**: When a Front Desk staff member or Hotel Manager attempts to view a booking dossier via `GET /api/v1/bookings/:id`, the API returns HTTP 403 Forbidden with `{ code: "FORBIDDEN", message: "Access denied to this booking." }`.
- **Reproduction**:
  1. Authenticate as Hotel Manager (`manager@riviera.luxury`) or Front Desk (`frontdesk@riviera.luxury`).
  2. Send `GET /api/v1/bookings/<bookingId>` using the staff bearer token.
  3. API responds with status code 403.
- **Root Cause**:
  In `bookings.routes.ts`:
  ```ts
  router.get('/:id', authenticate, (req, res, next) => bookingsController.getBooking(req, res, next));
  ```
  Notice that `requireHotelRole` middleware was not attached. In `bookings.controller.ts`:
  ```ts
  const isStaffOrAdmin = req.user?.globalRole === 'PLATFORM_ADMIN' || !!req.hotelMembership;
  ```
  Because `requireHotelRole` was omitted from the route, `req.hotelMembership` is **always undefined**. Unless the user is a `PLATFORM_ADMIN` or the exact `guestId` who made the booking, `isStaffOrAdmin` evaluates to `false`, causing `getBookingById` to throw a 403 Forbidden error.
- **Recommended Solution**:
  In `getBookingById`, dynamically look up whether the requesting user has an active `HotelMembership` for `booking.hotelId`, or update the route to support optional tenant resolution.

---

### Finding API-002: Missing Tenant Context on `POST /api/v1/payments/:paymentId/refund`
- **Severity**: HIGH
- **Priority**: HIGH
- **Component**: [`apps/api/src/modules/payments/payments.routes.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/payments/payments.routes.ts#L21-L26) and [`apps/api/src/middleware/rbac.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/middleware/rbac.ts#L52-L61)
- **Description**: The refund route expects `:paymentId` as a route parameter. However, `requireHotelRole(['HOTEL_MANAGER'])` inspects `req.params.hotelId || req.body.hotelId || req.query.hotelId`.
- **Reproduction**:
  1. Send a standard refund request: `POST /api/v1/payments/<paymentId>/refund` with body `{ amountCents: 50000, reason: "Refund" }`.
  2. API responds with HTTP 400 Bad Request:
     ```json
     {
       "success": false,
       "error": {
         "code": "MISSING_TENANT_CONTEXT",
         "message": "Missing hotel property context (hotelId)."
       }
     }
     ```
- **Expected Behavior**: The refund handler should resolve `payment.hotelId` directly from the database and verify that the requesting manager belongs to that hotel.
- **Actual Behavior**: The endpoint fails unless the client artificially appends `?hotelId=...` in the query string or body.
- **Recommended Solution**: Implement a dedicated payment-level authorization middleware (`requirePaymentHotelManager`) that loads the payment and verifies tenant ownership before permitting the refund.

---

### Finding API-003: Unbounded Historical Aggregation in Reporting Service
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Component**: [`apps/api/src/modules/reports/reports.service.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/reports/reports.service.ts#L11-L64)
- **Description**:
  1. In `getOccupancyReport`:
     ```ts
     const confirmedBookings = await Booking.find({
       hotelId,
       status: { $in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
     }).lean();
     ```
     This query fetches **all reservations ever made in hotel history** into memory with no date boundaries. It then divides total historical nights by a hardcoded 30-day capacity (`(totalRooms || 10) * 30`). Over time, occupancy rate is guaranteed to hit the hardcoded 100% cap and become completely inaccurate.
  2. In `getFinancialReport`:
     ```ts
     const [payments, refunds] = await Promise.all([
       Payment.find({ hotelId, status: 'SUCCEEDED' }).lean(),
       Refund.find({ hotelId, status: 'SUCCEEDED' }).lean(),
     ]);
     ```
     This loads every payment and refund record in history into application memory for client-side summation, creating high memory consumption and latency (N+1 memory bloat).
- **Recommended Solution**:
  Require `startDate` and `endDate` query parameters and utilize MongoDB aggregation pipelines (`$match`, `$group`, `$sum`) to compute metrics inside the database engine.

---

### Finding API-004: Missing Endpoints for Password Recovery and Email Verification
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Component**: [`apps/api/src/modules/auth/auth.routes.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/auth/auth.routes.ts)
- **Description**: The authentication module only implements `register`, `login`, `refresh`, `logout`, and `me`. There are no endpoints for:
  - `POST /api/v1/auth/forgot-password`
  - `POST /api/v1/auth/reset-password`
  - `POST /api/v1/auth/verify-email`
  - `POST /api/v1/auth/change-password`
- **Impact**: Guests who forget their passwords have no recovery path and must contact an administrator or create a new account.

---

## 3. Complete API Endpoint Inventory & Test Status

| Route Path | HTTP Method | Auth Required | Permitted Roles | Request Validation | Status | Findings / Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Authentication Module** | | | | | | |
| `/api/v1/auth/register` | `POST` | Public | Anyone | Zod (`registerSchema`) | **PASS** | Auto-verifies email in development |
| `/api/v1/auth/login` | `POST` | Public | Anyone | Zod (`loginSchema`) | **PASS** | Issues access token & refresh cookie |
| `/api/v1/auth/refresh` | `POST` | Public | Anyone | Refresh cookie check | **PASS** | Validates JWT refresh token |
| `/api/v1/auth/logout` | `POST` | Public | Anyone | None | **PASS** | Clears `refresh_token` cookie |
| `/api/v1/auth/me` | `GET` | Authenticated | Any logged-in user | Token verification | **PASS** | Returns profile & hotel memberships |
| `/api/v1/auth/forgot-password` | - | - | - | - | **NOT IMPLEMENTED** | Documented in PRD but omitted |
| `/api/v1/auth/verify-email` | - | - | - | - | **NOT IMPLEMENTED** | Auto-verified flag hardcoded true |
| **Hotels Module** | | | | | | |
| `/api/v1/hotels` | `GET` | Public | Anyone | None | **PASS** | Lists active hotel properties |
| `/api/v1/hotels/:id` | `GET` | Public | Anyone | None | **PASS** | Resolves hotel by ID or slug |
| `/api/v1/hotels/:hotelId` | `PUT` | Authenticated | `HOTEL_MANAGER` | None | **PASS** | Enforces property membership |
| **Rooms & Categories Module** | | | | | | |
| `/api/v1/rooms/:hotelId/categories` | `GET` | Public | Anyone | None | **PASS** | Lists suite categories |
| `/api/v1/rooms/:hotelId/categories/:id` | `GET` | Public | Anyone | None | **PASS** | Resolves single category |
| `/api/v1/rooms/:hotelId/categories` | `POST` | Authenticated | `HOTEL_MANAGER` | None | **PASS** | Requires manager role |
| `/api/v1/rooms/:hotelId/physical-rooms`| `GET` | Authenticated | Staff / Manager | None | **PASS** | Lists physical room matrix |
| **Inventory & Availability Module** | | | | | | |
| `/api/v1/inventory/:hotelId/search` | `GET` | Public | Anyone | None | **PASS** | Checks live date availability |
| `/api/v1/inventory/:hotelId/category/:id`| `GET` | Public | Anyone | None | **PASS** | Checks category date range pricing |
| `/api/v1/inventory/:hotelId/grid` | `GET` | Authenticated | `HOTEL_MANAGER` | None | **PASS** | Returns 30-day allotment grid |
| `/api/v1/inventory/:hotelId/batch-update`| `POST`| Authenticated | `HOTEL_MANAGER` | None | **PASS** | Atomic upsert of allotments & rates |
| **Bookings Module** | | | | | | |
| `/api/v1/bookings/hold` | `POST` | Authenticated | Logged-in Guest | Zod (`holdSchema`) | **PARTIAL** | Race condition on uninitialized dates |
| `/api/v1/bookings/my-bookings` | `GET` | Authenticated | Logged-in Guest | None | **PASS** | Returns guest reservations |
| `/api/v1/bookings/:id` | `GET` | Authenticated | Guest / Staff | None | **FAIL** | Staff locked out with 403 (API-001) |
| `/api/v1/bookings/:id/cancel` | `POST` | Authenticated | Guest / Staff | None | **FAIL** | Concurrency flaw wipes inventory |
| **Payments Module** | | | | | | |
| `/api/v1/payments/create-intent` | `POST` | Authenticated | Booking Owner | None | **PASS** | Creates order with mock provider |
| `/api/v1/payments/confirm-mock` | `POST` | Authenticated | Booking Owner | None | **FAIL** | Double-confirmation negative hold |
| `/api/v1/payments/webhook` | `POST` | Public | Webhook caller | Signature check | **FAIL** | All non-literal signatures accepted |
| `/api/v1/payments/:paymentId/refund` | `POST`| Authenticated | `HOTEL_MANAGER` | None | **FAIL** | IDOR: cross-tenant refund possible |
| **Operations Module** | | | | | | |
| `/api/v1/operations/:hotelId/dashboard`| `GET` | Authenticated | Front Desk / Mgr | None | **PASS** | Live KPIs for today |
| `/api/v1/operations/:hotelId/arrivals` | `GET` | Authenticated | Front Desk / Mgr | None | **PASS** | Scheduled arrivals for date |
| `/api/v1/operations/:hotelId/departures`| `GET` | Authenticated | Front Desk / Mgr | None | **PASS** | Scheduled departures for date |
| `/api/v1/operations/:hotelId/check-in` | `POST` | Authenticated | Front Desk / Mgr | None | **PASS** | Assigns room & sets OCCUPIED |
| `/api/v1/operations/:hotelId/check-out`| `POST` | Authenticated | Front Desk / Mgr | None | **PASS** | Sets CHECKED_OUT & queues clean |
| **Housekeeping Module** | | | | | | |
| `/api/v1/housekeeping/:hotelId/tasks` | `GET` | Authenticated | Staff / Housekeeper | None | **PASS** | Lists priority cleaning tasks |
| `/api/v1/housekeeping/:hotelId/rooms/:id/status`| `PATCH`| Authenticated | Staff / Housekeeper | None | **PASS** | Updates physical room status |
| `/api/v1/housekeeping/:hotelId/tasks` | `POST` | Authenticated | Staff / Housekeeper | None | **PASS** | Dispatches new cleaning task |
| `/api/v1/housekeeping/:hotelId/tasks/:id/complete`| `POST`| Authenticated | Staff / Housekeeper | None | **PASS** | Marks task done & room AVAILABLE |
| **Reports Module** | | | | | | |
| `/api/v1/reports/:hotelId/occupancy` | `GET` | Authenticated | `HOTEL_MANAGER` | None | **FAIL** | Flawed all-time division (API-003) |
| `/api/v1/reports/:hotelId/financial` | `GET` | Authenticated | `HOTEL_MANAGER` | None | **PARTIAL** | Unbounded all-time query (API-003) |
| **Platform Administration Module** | | | | | | |
| `/api/v1/admin/health` | `GET` | Public | Anyone | None | **PASS** | Process uptime & DB readyState |
| `/api/v1/admin/overview` | `GET` | Authenticated | `PLATFORM_ADMIN` | None | **PASS** | Global platform metrics |
| `/api/v1/admin/hotels` | `GET` | Authenticated | `PLATFORM_ADMIN` | None | **PASS** | All properties system-wide |
| `/api/v1/admin/hotels` | `POST` | Authenticated | `PLATFORM_ADMIN` | None | **PASS** | Onboards new property |
| `/api/v1/admin/audit-logs` | `GET` | Authenticated | `PLATFORM_ADMIN` | None | **PASS** | System-wide audit log trail |
| `/api/v1/health` | `GET` | Public | Anyone | None | **PASS** | Central health check |

