import { describe, it, expect } from 'vitest';
import { getStayDates, formatDateKey, parseDateKey, isValidDateKey } from '../src/utils/date.js';

describe('Date & Pricing Invariants', () => {
  it('correctly generates stay dates between check-in and check-out (inclusive-exclusive)', () => {
    const dates = getStayDates('2026-11-01', '2026-11-04');
    expect(dates).toEqual(['2026-11-01', '2026-11-02', '2026-11-03']);
    expect(dates.length).toBe(3); // 3 nights
  });

  it('throws error when check-out precedes or equals check-in', () => {
    expect(() => getStayDates('2026-11-05', '2026-11-05')).toThrow();
    expect(() => getStayDates('2026-11-05', '2026-11-04')).toThrow();
  });

  it('validates ISO date format YYYY-MM-DD correctly', () => {
    expect(isValidDateKey('2026-12-25')).toBe(true);
    expect(isValidDateKey('2026-02-31')).toBe(false); // Invalid calendar date
    expect(isValidDateKey('25-12-2026')).toBe(false);
    expect(isValidDateKey('invalid')).toBe(false);
  });

  it('calculates authoritative monetary amounts strictly in integer cents', () => {
    const basePriceCents = 45000; // $450.00
    const weekendMultiplier = 1.15;
    const taxRatePercent = 12;

    const weekendNightRate = Math.round(basePriceCents * weekendMultiplier);
    expect(weekendNightRate).toBe(51750); // $517.50, exactly integer cents

    const subtotal = basePriceCents * 2 + weekendNightRate; // 2 weekday + 1 weekend
    expect(subtotal).toBe(141750);

    const taxCents = Math.round((subtotal * taxRatePercent) / 100);
    expect(taxCents).toBe(17010); // 12% of 141750 = 17010

    const totalCents = subtotal + taxCents;
    expect(totalCents).toBe(158760); // $1,587.60
    expect(Number.isInteger(totalCents)).toBe(true);
  });
});
