import { Booking } from '../models/Booking.js';
import { inventoryService } from '../modules/inventory/inventory.service.js';
import { getStayDates } from '../utils/date.js';
import { logger } from '../utils/logger.js';

let intervalId: NodeJS.Timeout | null = null;

export async function releaseExpiredHolds(): Promise<number> {
  const now = new Date();
  const expiredBookings = await Booking.find({
    status: 'PENDING_PAYMENT',
    holdExpiresAt: { $lte: now },
  });

  if (expiredBookings.length === 0) return 0;

  logger.info(`⏳ Found ${expiredBookings.length} expired reservation holds. Releasing inventory...`);

  let count = 0;
  for (const booking of expiredBookings) {
    try {
      // Atomic status transition ensures each expired hold is released exactly once
      const updated = await Booking.findOneAndUpdate(
        { _id: booking._id, status: 'PENDING_PAYMENT' },
        { $set: { status: 'EXPIRED' } }
      );

      if (updated) {
        const dates = getStayDates(booking.checkInDate, booking.checkOutDate);
        await inventoryService.releaseHold(
          booking.hotelId.toString(),
          booking.roomCategoryId.toString(),
          dates
        );
        count++;
        logger.info(`🔓 Hold expired & released for reservation ${booking.confirmationCode}`);
      }
    } catch (err) {
      logger.error(`Failed to release expired hold for booking ${booking._id}:`, err);
    }
  }

  return count;
}

export function startHoldExpirationScheduler(intervalMs = 60000) {
  if (intervalId) return;

  logger.info(`⏰ Started Hold Expiration background scheduler (interval: ${intervalMs}ms)`);
  intervalId = setInterval(async () => {
    try {
      await releaseExpiredHolds();
    } catch (err) {
      logger.error('Error during hold expiration background run:', err);
    }
  }, intervalMs);
}

export function stopHoldExpirationScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('⏹️ Stopped Hold Expiration background scheduler');
  }
}
