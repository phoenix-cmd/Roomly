import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service.js';
import { apiSuccess } from '../../utils/response.js';

export class ReportsController {
  async getOccupancy(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportsService.getOccupancyReport(
        req.params.hotelId,
        startDate as string | undefined,
        endDate as string | undefined
      );
      return apiSuccess(res, { report });
    } catch (err) {
      return next(err);
    }
  }

  async getFinancial(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportsService.getFinancialReport(
        req.params.hotelId,
        startDate as string | undefined,
        endDate as string | undefined
      );
      return apiSuccess(res, { report });
    } catch (err) {
      return next(err);
    }
  }
}

export const reportsController = new ReportsController();
