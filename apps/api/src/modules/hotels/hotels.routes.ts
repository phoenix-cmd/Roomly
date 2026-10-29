import { Router } from 'express';
import { hotelsController } from './hotels.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireHotelRole } from '../../middleware/rbac.js';

const router = Router();

router.get('/', (req, res, next) => hotelsController.listHotels(req, res, next));
router.get('/:id', (req, res, next) => hotelsController.getHotel(req, res, next));
router.put(
  '/:hotelId',
  authenticate,
  requireHotelRole(['HOTEL_MANAGER']),
  (req, res, next) => hotelsController.updateHotel(req, res, next)
);

export const hotelsRoutes = router;
