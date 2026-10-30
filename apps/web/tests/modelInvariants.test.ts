import { describe, it, expect } from 'vitest';
import { IAvailabilityInfo, IRoomCategory } from '../src/types/index.js';

describe('Frontend Business Invariants & Type Models', () => {
  it('validates suite total pricing arithmetic invariant', () => {
    const availability: IAvailabilityInfo = {
      isAvailable: true,
      minAvailableRooms: 3,
      nightlyRates: [
        { date: '2026-11-01', priceCents: 45000, availableRooms: 3 },
        { date: '2026-11-02', priceCents: 45000, availableRooms: 3 },
      ],
      subtotalCents: 90000,
      taxPercent: 12,
      taxCents: 10800,
      cleaningFeeCents: 5000,
      totalCents: 105800,
      currency: 'USD',
    };

    expect(availability.subtotalCents + availability.taxCents + availability.cleaningFeeCents).toBe(
      availability.totalCents
    );
    expect(availability.isAvailable).toBe(true);
    expect(availability.minAvailableRooms).toBeGreaterThan(0);
  });

  it('validates room category occupancy boundaries', () => {
    const mockCategory: Partial<IRoomCategory> = {
      name: 'Panoramic Riviera Suite',
      maxOccupancy: 4,
      maxAdults: 3,
      maxChildren: 2,
      basePriceCents: 65000,
      totalRooms: 6,
    };

    expect(mockCategory.maxAdults! + mockCategory.maxChildren!).toBeGreaterThanOrEqual(
      mockCategory.maxOccupancy!
    );
    expect(mockCategory.basePriceCents).toBeGreaterThan(0);
  });
});

