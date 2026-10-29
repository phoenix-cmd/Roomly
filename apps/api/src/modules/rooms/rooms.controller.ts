import { Request, Response, NextFunction } from 'express';
import { roomsService } from './rooms.service.js';
import { apiSuccess } from '../../utils/response.js';

export class RoomsController {
  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const hotelId = req.params.hotelId;
      const adults = req.query.adults ? parseInt(req.query.adults as string, 10) : undefined;
      const children = req.query.children ? parseInt(req.query.children as string, 10) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

      const categories = await roomsService.listCategories(hotelId, { adults, children, maxPrice });
      return apiSuccess(res, { categories });
    } catch (err) {
      return next(err);
    }
  }

  async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId, categoryId } = req.params;
      const category = await roomsService.getCategoryByIdOrSlug(hotelId, categoryId);
      return apiSuccess(res, { category });
    } catch (err) {
      return next(err);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId } = req.params;
      const category = await roomsService.createCategory(hotelId, req.body);
      return apiSuccess(res, { category }, 201);
    } catch (err) {
      return next(err);
    }
  }

  async listPhysicalRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId } = req.params;
      const categoryId = req.query.categoryId as string | undefined;
      const rooms = await roomsService.listPhysicalRooms(hotelId, categoryId);
      return apiSuccess(res, { rooms });
    } catch (err) {
      return next(err);
    }
  }
}

export const roomsController = new RoomsController();
