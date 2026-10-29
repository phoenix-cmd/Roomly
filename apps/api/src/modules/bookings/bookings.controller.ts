import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingsService } from './bookings.service.js';
import { apiSuccess } from '../../utils/response.js';

const holdSchema = z.object({
  hotelId: z.string().min(1),
  roomCategoryId: z.string().min(1),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().min(1),
  children: z.number().min(0).optional(),
  guestDetails: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    specialRequests: z.string().optional(),
  }),
});

export class BookingsController {
  async createHold(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = holdSchema.parse(req.body);
      const booking = await bookingsService.createHold(req.user!.id, validated);
      return apiSuccess(res, { booking }, 201);
    } catch (err) {
      return next(err);
    }
  }

  async getBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const isStaffOrAdmin =
        req.user?.globalRole === 'PLATFORM_ADMIN' || !!req.hotelMembership;
      const booking = await bookingsService.getBookingById(
        req.params.id,
        req.user!.id,
        isStaffOrAdmin
      );
      return apiSuccess(res, { booking });
    } catch (err) {
      return next(err);
    }
  }

  async listGuestBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await bookingsService.listGuestBookings(req.user!.id);
      return apiSuccess(res, { bookings });
    } catch (err) {
      return next(err);
    }
  }

  async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const reason = req.body.reason || 'Guest requested cancellation';
      const isStaffOrAdmin =
        req.user?.globalRole === 'PLATFORM_ADMIN' || !!req.hotelMembership;
      const booking = await bookingsService.cancelBooking(
        req.params.id,
        req.user!.id,
        reason,
        isStaffOrAdmin
      );
      return apiSuccess(res, { booking, message: 'Reservation cancelled successfully.' });
    } catch (err) {
      return next(err);
    }
  }
}

export const bookingsController = new BookingsController();
