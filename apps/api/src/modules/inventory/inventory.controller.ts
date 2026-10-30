import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service.js';
import { apiSuccess } from '../../utils/response.js';
import { InventoryDay } from '../../models/InventoryDay.js';
import { releaseExpiredHolds } from '../../jobs/holdExpirationJob.js';

export class InventoryController {
  async searchAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      // Lazily release any expired holds so inventory is accurate
      await releaseExpiredHolds().catch(() => {});

      const hotelId = req.params.hotelId;
      const checkInDate = req.query.checkInDate as string;
      const checkOutDate = req.query.checkOutDate as string;
      const adults = req.query.adults ? parseInt(req.query.adults as string, 10) : undefined;
      const children = req.query.children ? parseInt(req.query.children as string, 10) : undefined;

      if (!checkInDate || !checkOutDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DATES',
            message: 'Both checkInDate and checkOutDate parameters are required.',
          },
        });
      }

      const results = await inventoryService.searchAvailableCategories(
        hotelId,
        checkInDate,
        checkOutDate,
        { adults, children }
      );

      return apiSuccess(res, { availableCategories: results });
    } catch (err) {
      return next(err);
    }
  }

  async checkCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId, categoryId } = req.params;
      const checkInDate = req.query.checkInDate as string;
      const checkOutDate = req.query.checkOutDate as string;

      if (!checkInDate || !checkOutDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DATES',
            message: 'Both checkInDate and checkOutDate parameters are required.',
          },
        });
      }

      const availability = await inventoryService.checkCategoryAvailability(
        hotelId,
        categoryId,
        checkInDate,
        checkOutDate
      );

      return apiSuccess(res, { availability });
    } catch (err) {
      return next(err);
    }
  }

  async getInventoryGrid(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId } = req.params;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const query: any = { hotelId };
      if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      }

      const inventory = await InventoryDay.find(query)
        .populate('roomCategoryId', 'name slug totalRooms basePriceCents')
        .sort({ date: 1 })
        .lean();

      return apiSuccess(res, { inventory });
    } catch (err) {
      return next(err);
    }
  }

  async batchUpdateInventory(req: Request, res: Response, next: NextFunction) {
    try {
      const { hotelId } = req.params;
      const { updates } = req.body as {
        updates: Array<{
          roomCategoryId: string;
          date: string;
          totalInventory?: number;
          priceCents?: number;
        }>;
      };

      for (const item of updates) {
        await InventoryDay.findOneAndUpdate(
          { hotelId, roomCategoryId: item.roomCategoryId, date: item.date },
          {
            $set: {
              ...(item.totalInventory !== undefined && { totalInventory: item.totalInventory }),
              ...(item.priceCents !== undefined && { priceCents: item.priceCents }),
            },
          },
          { upsert: true }
        );
      }

      return apiSuccess(res, { message: 'Inventory grid updated successfully.' });
    } catch (err) {
      return next(err);
    }
  }
}

export const inventoryController = new InventoryController();
