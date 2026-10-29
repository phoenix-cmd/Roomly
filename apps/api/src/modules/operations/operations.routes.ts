import { Router } from 'express';
import { operationsController } from './operations.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireHotelRole } from '../../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.get(
  '/:hotelId/dashboard',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER', 'FRONT_DESK']),
  (req, res, next) => operationsController.getDashboard(req, res, next)
);

router.get(
  '/:hotelId/arrivals',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER', 'FRONT_DESK']),
  (req, res, next) => operationsController.getArrivals(req, res, next)
);

router.get(
  '/:hotelId/departures',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER', 'FRONT_DESK']),
  (req, res, next) => operationsController.getDepartures(req, res, next)
);

router.post(
  '/:hotelId/check-in',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER', 'FRONT_DESK']),
  (req, res, next) => operationsController.checkIn(req, res, next)
);

router.post(
  '/:hotelId/check-out',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER', 'FRONT_DESK']),
  (req, res, next) => operationsController.checkOut(req, res, next)
);

export const operationsRoutes = router;
