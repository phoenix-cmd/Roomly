import { Router } from 'express';
import { housekeepingController } from './housekeeping.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireHotelRole } from '../../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.get(
  '/:hotelId/tasks',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER', 'FRONT_DESK', 'HOUSEKEEPING']),
  (req, res, next) => housekeepingController.getTasks(req, res, next)
);

router.patch(
  '/:hotelId/rooms/:roomId/status',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER', 'FRONT_DESK', 'HOUSEKEEPING']),
  (req, res, next) => housekeepingController.updateRoomStatus(req, res, next)
);

router.post(
  '/:hotelId/tasks',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER', 'FRONT_DESK', 'HOUSEKEEPING']),
  (req, res, next) => housekeepingController.createTask(req, res, next)
);

router.post(
  '/:hotelId/tasks/:taskId/complete',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER', 'FRONT_DESK', 'HOUSEKEEPING']),
  (req, res, next) => housekeepingController.completeTask(req, res, next)
);

export const housekeepingRoutes = router;
