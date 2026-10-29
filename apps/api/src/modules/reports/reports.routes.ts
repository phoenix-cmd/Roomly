import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireHotelRole } from '../../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.get(
  '/:hotelId/occupancy',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER']),
  (req, res, next) => reportsController.getOccupancy(req, res, next)
);

router.get(
  '/:hotelId/financial',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER']),
  (req, res, next) => reportsController.getFinancial(req, res, next)
);

export const reportsRoutes = router;
