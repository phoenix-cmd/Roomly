import { Request, Response, NextFunction } from 'express';
import { operationsService } from './operations.service.js';
import { apiSuccess } from '../../utils/response.js';

export class OperationsController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await operationsService.getDashboardStats(req.params.hotelId);
      return apiSuccess(res, { stats });
    } catch (err) {
      return next(err);
    }
  }

  async getArrivals(req: Request, res: Response, next: NextFunction) {
    try {
      const arrivals = await operationsService.getArrivals(
        req.params.hotelId,
        req.query.date as string
      );
      return apiSuccess(res, { arrivals });
    } catch (err) {
      return next(err);
    }
  }

  async getDepartures(req: Request, res: Response, next: NextFunction) {
    try {
      const departures = await operationsService.getDepartures(
        req.params.hotelId,
        req.query.date as string
      );
      return apiSuccess(res, { departures });
    } catch (err) {
      return next(err);
    }
  }

  async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId } = req.params;
      const { bookingId, assignedRoomId } = req.body;
      const result = await operationsService.checkIn(
        hotelId,
        bookingId,
        assignedRoomId,
        req.user!.id
      );
      return apiSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }

  async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId } = req.params;
      const { bookingId } = req.body;
      const result = await operationsService.checkOut(hotelId, bookingId, req.user!.id);
      return apiSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }
}

export const operationsController = new OperationsController();
