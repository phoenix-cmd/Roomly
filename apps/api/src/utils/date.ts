/**
 * Date utility helpers for standardizing hotel service dates as YYYY-MM-DD
 */

export function formatDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Returns array of YYYY-MM-DD date strings for each night between checkIn (inclusive) and checkOut (exclusive).
 */
export function getStayDates(checkInDateStr: string, checkOutDateStr: string): string[] {
  const dates: string[] = [];
  const current = parseDateKey(checkInDateStr);
  const end = parseDateKey(checkOutDateStr);

  if (current >= end) {
    throw new Error('Check-out date must be strictly after check-in date');
  }

  while (current < end) {
    dates.push(formatDateKey(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

export function isValidDateKey(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = parseDateKey(dateStr);
  return !isNaN(d.getTime()) && formatDateKey(d) === dateStr;
}
