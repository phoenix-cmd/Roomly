import { Router } from 'express';
import { bookingsController } from './bookings.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { bookingHoldLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post(
  '/hold',
  authenticate,
  bookingHoldLimiter,
  (req, res, next) => bookingsController.createHold(req, res, next)
);

router.get('/my-bookings', authenticate, (req, res, next) =>
  bookingsController.listGuestBookings(req, res, next)
);

router.get('/:id', authenticate, (req, res, next) =>
  bookingsController.getBooking(req, res, next)
);

router.post('/:id/cancel', authenticate, (req, res, next) =>
  bookingsController.cancelBooking(req, res, next)
);

export const bookingsRoutes = router;
