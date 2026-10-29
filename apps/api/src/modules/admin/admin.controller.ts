import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import { apiSuccess } from '../../utils/response.js';

export class AdminController {
  async getOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getOverview();
      return apiSuccess(res, { stats });
    } catch (err) {
      return next(err);
    }
  }

  async listHotels(_req: Request, res: Response, next: NextFunction) {
    try {
      const hotels = await adminService.listAllHotels();
      return apiSuccess(res, { hotels });
    } catch (err) {
      return next(err);
    }
  }

  async createHotel(req: Request, res: Response, next: NextFunction) {
    try {
      const hotel = await adminService.createHotel(req.body, req.user!.id);
      return apiSuccess(res, { hotel }, 201);
    } catch (err) {
      return next(err);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const logs = await adminService.listAuditLogs(limit);
      return apiSuccess(res, { logs });
    } catch (err) {
      return next(err);
    }
  }

  async getHealth(_req: Request, res: Response) {
    const health = adminService.getSystemHealth();
    return res.status(200).json(health);
  }
}

export const adminController = new AdminController();
