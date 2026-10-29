import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Types } from 'mongoose';
import { InventoryDay } from '../src/models/InventoryDay.js';
import { inventoryService } from '../src/modules/inventory/inventory.service.js';

describe('Inventory Concurrency & Race Condition Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await InventoryDay.deleteMany({});
  });

  it('prevents overselling when 10 simultaneous concurrent requests compete for the last available room', async () => {
    const hotelId = new Types.ObjectId().toString();
    const roomCategoryId = new Types.ObjectId().toString();
    const date = '2026-12-31';

    // Set up inventory record with only 1 room available
    await InventoryDay.create({
      hotelId,
      roomCategoryId,
      date,
      totalInventory: 1,
      bookedCount: 0,
      heldCount: 0,
    });

    // Concurrently trigger 10 simultaneous hold requests for the single available room
    const attempts = Array.from({ length: 10 }, () =>
      inventoryService.holdInventory(hotelId, roomCategoryId, [date])
    );

    const results = await Promise.allSettled(attempts);

    const successfulHolds = results.filter((r) => r.status === 'fulfilled');
    const failedHolds = results.filter((r) => r.status === 'rejected');

    // Invariant: EXACTLY 1 request must succeed; 9 must be rejected
    expect(successfulHolds.length).toBe(1);
    expect(failedHolds.length).toBe(9);

    // Verify database state: heldCount must be exactly 1, total must be 1
    const finalRecord = await InventoryDay.findOne({ hotelId, roomCategoryId, date });
    expect(finalRecord).not.toBeNull();
    expect(finalRecord!.heldCount).toBe(1);
    expect(finalRecord!.bookedCount).toBe(0);
    expect(finalRecord!.totalInventory).toBe(1);
  });

  it('atomically rolls back multi-night holds if any single night in the range is exhausted', async () => {
    const hotelId = new Types.ObjectId().toString();
    const roomCategoryId = new Types.ObjectId().toString();
    const dates = ['2026-11-10', '2026-11-11', '2026-11-12'];

    // Night 1 & 3 have 2 available rooms, but Night 2 is already completely booked
    await InventoryDay.insertMany([
      { hotelId, roomCategoryId, date: dates[0], totalInventory: 2, bookedCount: 0, heldCount: 0 },
      { hotelId, roomCategoryId, date: dates[1], totalInventory: 2, bookedCount: 2, heldCount: 0 }, // Fully booked
      { hotelId, roomCategoryId, date: dates[2], totalInventory: 2, bookedCount: 0, heldCount: 0 },
    ]);

    await expect(
      inventoryService.holdInventory(hotelId, roomCategoryId, dates)
    ).rejects.toThrow('Insufficient inventory');

    // Invariant: Night 1 must have been rolled back to 0 held rooms
    const night1 = await InventoryDay.findOne({ hotelId, roomCategoryId, date: dates[0] });
    expect(night1!.heldCount).toBe(0);
  });
});
