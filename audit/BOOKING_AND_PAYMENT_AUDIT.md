# Roomly Booking Lifecycle, Inventory Concurrency & Payment Audit

## 1. Executive Summary: Core Business Logic Invariants

Hotel reservation platforms require absolute mathematical correctness. An invariant violation (such as overselling a room, holding inventory indefinitely, or corrupting allotment counts) results in immediate financial liability and guest displacement.

The Roomly booking engine incorporates strong design principles (15-minute temporary holds, integer cents monetary calculations, inclusive check-in and exclusive check-out dates). However, automated stress testing revealed **three critical race conditions** in the booking and cancellation lifecycle that corrupt database state under real-world concurrency.

---

## 2. Critical Booking & Concurrency Defects

### Finding INV-001: Race Condition on Uninitialized Inventory Provisioning Crashes with `E11000`
- **Severity**: CRITICAL
- **Priority**: IMMEDIATE
- **Component**: [`apps/api/src/modules/inventory/inventory.service.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/inventory/inventory.service.ts#L168-L186)
- **Description**: When guests attempt to reserve rooms on future dates where an `InventoryDay` document has not yet been provisioned, concurrent requests trigger a race condition that crashes with an unhandled MongoDB duplicate key error (`E11000`), rejecting valid bookings even when rooms are available.
- **Reproduction & Evidence**:
  Executed automated concurrency test with 5 simultaneous hold requests on an uninitialized date with 3 total suites available.
  **Test Output**:
  ```text
  Results of 5 concurrent holds on uninitialized date:
    Request 0: Fulfilled
    Request 1: Rejected with E11000 duplicate key error collection: test.inventorydays index: hotelId_1_roomCategoryId_1_date_1 dup key: { hotelId: ObjectId('...'), roomCategoryId: ObjectId('...'), date: "2027-01-01" }
    Request 2: Rejected with E11000 duplicate key error ...
    Request 3: Rejected with E11000 duplicate key error ...
    Request 4: Rejected with E11000 duplicate key error ...
  ```
- **Root Cause**:
  ```ts
  const res = await InventoryDay.updateOne({
    hotelId,
    roomCategoryId,
    date,
    $expr: { $lte: [{ $add: ['$bookedCount', '$heldCount', 1] }, '$totalInventory'] },
  }, { $inc: { heldCount: 1 } });

  if (res.matchedCount === 0) {
    const exists = await InventoryDay.findOne({ hotelId, roomCategoryId, date });
    if (!exists) {
      // NON-ATOMIC CHECK-THEN-ACT:
      await InventoryDay.create({ ... }); // Concurrent threads hit unique compound index and crash!
    }
  }
  ```
  Multiple threads find `matchedCount === 0` and `exists === null`. The first thread creates the document; all subsequent threads crash with `E11000` duplicate key error instead of acquiring available allotments!
- **Recommended Solution**:
  Use atomic `findOneAndUpdate` with `upsert: true` and `$setOnInsert` for default capacity, or pre-seed 365-day inventory allotments when categories are created.

---

### Finding INV-002: Double Confirmation / Expired Hold Confirmation Drives `heldCount` Negative
- **Severity**: CRITICAL
- **Priority**: IMMEDIATE
- **Component**: [`apps/api/src/modules/inventory/inventory.service.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/inventory/inventory.service.ts#L236-L251) and [`apps/api/src/modules/payments/payments.service.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/payments/payments.service.ts#L174-L184)
- **Description**: Converting a held room to booked upon payment lacks an atomic boundary guard. If duplicate payment webhooks or test confirmations are processed, or if payment completes after the hold was released, `heldCount` decrements below zero into negative numbers (`-1`, `-2`).
- **Reproduction & Evidence**:
  Executed duplicate payment confirmation on a held reservation:
  ```text
  Testing confirmHoldToBooked when hold count is 0...
  Held count after double confirm: -1
  Booked count after double confirm: 2
  ```
- **Root Cause**:
  In `inventory.service.ts`:
  ```ts
  await InventoryDay.updateMany(
    { hotelId, roomCategoryId, date: { $in: dates } },
    { $inc: { heldCount: -1, bookedCount: 1 } }
  );
  ```
  Notice there is **no condition `{ heldCount: { $gt: 0 } }`**. In Mongoose, `updateMany` bypasses schema `min: 0` validators. Consequently, `heldCount` decrements to `-1`, inflating the computed available capacity (`total - (booked + held)`) and allowing the room to be oversold!
- **Recommended Solution**:
  Add an atomic precondition:
  ```ts
  await InventoryDay.updateMany(
    { hotelId, roomCategoryId, date: { $in: dates }, heldCount: { $gt: 0 } },
    { $inc: { heldCount: -1, bookedCount: 1 } }
  );
  ```
  Additionally, wrap the transition in an atomic booking status update:
  ```ts
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'PENDING_PAYMENT' },
    { $set: { status: 'CONFIRMED' } }
  );
  if (!updated) return; // Deduplicated
  ```

---

### Finding INV-003: Duplicate Cancellation Wipes Out Other Guests' Booked Inventory
- **Severity**: CRITICAL
- **Priority**: IMMEDIATE
- **Component**: [`apps/api/src/modules/bookings/bookings.service.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/bookings/bookings.service.ts#L128-L175)
- **Description**: When a reservation is cancelled, `bookingsService.cancelBooking` reads the booking document into memory, checks its status, calls `releaseBookedInventory`, and then saves `status = 'CANCELLED'`. Concurrent cancellation requests (e.g. rapid double-clicks or concurrent network retries) execute simultaneously, releasing inventory **twice**.
- **Reproduction & Evidence**:
  Executed two concurrent cancellation requests for a single booking where total booked count on that date was 2 (1 belonging to this guest, 1 belonging to another guest):
  ```text
  Initial booked count was 2.
  After double-cancellation of 1 single booking, booked count is: 0
  ```
- **Business Impact**: A single cancellation erroneously decremented `bookedCount` by 2, releasing the reserved room of an unrelated innocent guest and opening the hotel to catastrophic overbooking!
- **Root Cause**: Non-atomic status transition. Both threads see `booking.status === 'CONFIRMED'`, and both call `releaseBookedInventory`.
- **Recommended Solution**:
  Execute an atomic state transition before releasing inventory:
  ```ts
  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, status: { $nin: ['CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'] } },
    { $set: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason } }
  );
  if (!booking) {
    throw new Error('Reservation was already cancelled or cannot be cancelled.');
  }
  // Release inventory exactly once
  await inventoryService.releaseBookedInventory(...);
  ```

---

### Finding INV-004: In-Memory Background Hold Expiration Fails in Serverless Deployments
- **Severity**: HIGH
- **Priority**: HIGH
- **Component**: [`apps/api/src/jobs/holdExpirationJob.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/jobs/holdExpirationJob.ts#L41-L52) and [`apps/api/src/server.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/server.ts#L82)
- **Description**: Temporary 15-minute holds rely on `setInterval(..., 60000)` running inside the Node process.
  1. On Vercel, `bootstrap()` is explicitly skipped (`if (!process.env.VERCEL) { bootstrap(); }`), meaning `startHoldExpirationScheduler()` is **never invoked**.
  2. Even if invoked, serverless functions freeze between incoming requests, halting `setInterval`.
- **Impact**: Unpaid reservation holds remain permanently in `PENDING_PAYMENT` with `heldCount = 1`, permanently locking out legitimate guests from reserving those rooms.
- **Recommended Solution**:
  Implement a dedicated, secure HTTP trigger (`POST /api/v1/jobs/release-expired-holds`) configured via Vercel Cron in `vercel.json` (`schedule: "* * * * *"`), and verify holds lazily when availability queries run.

---

### Finding INV-005: Physical Room Check-In Concurrency Race Condition
- **Severity**: HIGH
- **Priority**: MEDIUM
- **Component**: [`apps/api/src/modules/operations/operations.service.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/modules/operations/operations.service.ts#L97-L118)
- **Description**: Front desk check-in reads `Room.findOne({ _id: assignedRoomId })`, checks `if (room.status === 'OCCUPIED')`, assigns the room, and updates `room.status = 'OCCUPIED'`.
- **Reproduction**: If two front-desk agents check in two different guests simultaneously and select the same physical room, both threads read `room.status === 'AVAILABLE'`, and both assign the same physical room to different guests.
- **Recommended Solution**:
  Use atomic update with status condition:
  ```ts
  const updatedRoom = await Room.findOneAndUpdate(
    { _id: assignedRoomId, hotelId, status: 'AVAILABLE' },
    { $set: { status: 'OCCUPIED' } },
    { new: true }
  );
  if (!updatedRoom) {
    throw new Error('Selected room is no longer available or is undergoing turnover.');
  }
  ```

---

## 3. Payment Gateway & Webhook Audit

### Finding INV-006: Real Payment Gateways & Email Transports Are Non-Existent
- **Severity**: MEDIUM
- **Priority**: MEDIUM
- **Components**:
  - [`apps/api/src/adapters/payment/index.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/adapters/payment/index.ts)
  - [`apps/api/src/adapters/email/index.ts`](file:///c:/Users/bs162/Desktop/Roomly/apps/api/src/adapters/email/index.ts)
- **Description**:
  1. `getPaymentGateway()` exclusively instantiates `MockPaymentAdapter()`, even when `PAYMENT_PROVIDER` is set to `STRIPE` or `RAZORPAY`. Neither the Stripe SDK (`stripe`) nor the Razorpay SDK is installed or implemented.
  2. `getEmailService()` exclusively instantiates `MockEmailService()`, which outputs log statements to the terminal instead of sending actual SMTP emails.
- **Verification**: The codebase currently only supports mock sandbox transactions and mock email delivery.

