# ADR 0002: Date-Based Inventory Concurrency and Temporary Holds

## Context
Hotel bookings span multiple contiguous nights (`checkInDate` to `checkOutDate`). Naive architectures check availability with a `countDocuments` query and then insert a reservation. Under concurrent user traffic (e.g. holiday rushes or popular suites), two users can simultaneously pass the availability check and book the same last room, causing double-bookings.

## Decision
We implement a **Date-Based Inventory Allocation Strategy**:
1. An `InventoryDay` document exists for each unique tuple `(hotelId, roomCategoryId, date)`.
2. Each document tracks `totalInventory`, `bookedCount`, and `heldCount`.
3. To place a hold for dates $D_1, \dots, D_n$, the server executes an atomic conditional increment within a session/transaction:
   ```typescript
   db.inventory_days.updateOne(
     {
       hotelId,
       roomCategoryId,
       date,
       $expr: { $lte: [ { $add: ["$bookedCount", "$heldCount", 1] }, "$totalInventory" ] }
     },
     { $inc: { heldCount: 1 } }
   );
   ```
4. If ANY night in the date range fails this conditional update (matchedCount === 0), the entire operation rolls back and returns `INSUFFICIENT_INVENTORY`.
5. A temporary hold record is created with a 15-minute TTL (`holdExpiresAt`).
6. Upon verified payment, `heldCount` is decremented by 1 and `bookedCount` is incremented by 1.
7. If the hold expires before payment, a background job restores `heldCount` by decrementing 1 and marks the reservation `EXPIRED`.

## Consequences
- Guaranteed zero overselling, even under heavy concurrent load.
- Avoids locking physical rooms prematurely; physical rooms can be assigned at check-in or upon confirmation based on housekeeping status.
- Requires reliable transaction support or atomic multi-write rollback logic.
