import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireGlobalRole } from '../../middleware/rbac.js';

const router = Router();

// Public health check
router.get('/health', (req, res) => adminController.getHealth(req, res));

// Platform Admin protected endpoints
router.get(
  '/overview',
  authenticate,
  requireGlobalRole(['PLATFORM_ADMIN']),
  (req, res, next) => adminController.getOverview(req, res, next)
);

router.get(
  '/hotels',
  authenticate,
  requireGlobalRole(['PLATFORM_ADMIN']),
  (req, res, next) => adminController.listHotels(req, res, next)
);

router.post(
  '/hotels',
  authenticate,
  requireGlobalRole(['PLATFORM_ADMIN']),
  (req, res, next) => adminController.createHotel(req, res, next)
);

router.get(
  '/audit-logs',
  authenticate,
  requireGlobalRole(['PLATFORM_ADMIN']),
  (req, res, next) => adminController.getAuditLogs(req, res, next)
);

export const adminRoutes = router;
