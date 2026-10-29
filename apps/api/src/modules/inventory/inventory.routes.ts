import { Router } from 'express';
import { inventoryController } from './inventory.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireHotelRole } from '../../middleware/rbac.js';

const router = Router({ mergeParams: true });

// Public availability check endpoints
router.get('/:hotelId/search', (req, res, next) =>
  inventoryController.searchAvailability(req, res, next)
);

router.get('/:hotelId/category/:categoryId', (req, res, next) =>
  inventoryController.checkCategory(req, res, next)
);

// Hotel Manager inventory grid endpoints
router.get(
  '/:hotelId/grid',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER']),
  (req, res, next) => inventoryController.getInventoryGrid(req, res, next)
);

router.post(
  '/:hotelId/batch-update',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER']),
  (req, res, next) => inventoryController.batchUpdateInventory(req, res, next)
);

export const inventoryRoutes = router;
