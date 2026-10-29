import { Router } from 'express';
import { roomsController } from './rooms.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireHotelRole } from '../../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.get('/:hotelId/categories', (req, res, next) =>
  roomsController.listCategories(req, res, next)
);

router.get('/:hotelId/categories/:categoryId', (req, res, next) =>
  roomsController.getCategory(req, res, next)
);

router.post(
  '/:hotelId/categories',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER']),
  (req, res, next) => roomsController.createCategory(req, res, next)
);

router.get(
  '/:hotelId/physical-rooms',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER', 'FRONT_DESK', 'HOUSEKEEPING']),
  (req, res, next) => roomsController.listPhysicalRooms(req, res, next)
);

export const roomsRoutes = router;
