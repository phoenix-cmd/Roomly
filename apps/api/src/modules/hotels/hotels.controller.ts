import { Request, Response, NextFunction } from 'express';
import { hotelsService } from './hotels.service.js';
import { apiSuccess } from '../../utils/response.js';

export class HotelsController {
  async listHotels(req: Request, res: Response, next: NextFunction) {
    try {
      const city = req.query.city as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const hotels = await hotelsService.listHotels({ city, limit });
      return apiSuccess(res, { hotels });
    } catch (err) {
      return next(err);
    }
  }

  async getHotel(req: Request, res: Response, next: NextFunction) {
    try {
      const hotel = await hotelsService.getHotelByIdOrSlug(req.params.id);
      return apiSuccess(res, { hotel });
    } catch (err) {
      return next(err);
    }
  }

  async updateHotel(req: Request, res: Response, next: NextFunction) {
    try {
      const hotel = await hotelsService.updateHotel(req.params.hotelId, req.body);
      return apiSuccess(res, { hotel });
    } catch (err) {
      return next(err);
    }
  }
}

export const hotelsController = new HotelsController();
