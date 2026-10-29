import { Request, Response, NextFunction } from 'express';
import { housekeepingService } from './housekeeping.service.js';
import { apiSuccess } from '../../utils/response.js';

export class HousekeepingController {
  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId } = req.params;
      const status = req.query.status as string | undefined;
      const tasks = await housekeepingService.getTasks(hotelId, status);
      return apiSuccess(res, { tasks });
    } catch (err) {
      return next(err);
    }
  }

  async updateRoomStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId, roomId } = req.params;
      const { status } = req.body;
      const room = await housekeepingService.updateRoomStatus(
        hotelId,
        roomId,
        status,
        req.user!.id
      );
      return apiSuccess(res, { room });
    } catch (err) {
      return next(err);
    }
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId } = req.params;
      const task = await housekeepingService.createTask(hotelId, req.body, req.user!.id);
      return apiSuccess(res, { task }, 201);
    } catch (err) {
      return next(err);
    }
  }

  async completeTask(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId, taskId } = req.params;
      const result = await housekeepingService.completeTask(hotelId, taskId, req.user!.id);
      return apiSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }
}

export const housekeepingController = new HousekeepingController();
