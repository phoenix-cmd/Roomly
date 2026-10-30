import { Router } from 'express';
import { paymentsController } from './payments.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireHotelRole } from '../../middleware/rbac.js';

const router = Router();

router.post('/create-intent', authenticate, (req, res, next) =>
  paymentsController.createIntent(req, res, next)
);

router.post('/confirm-mock', authenticate, (req, res, next) =>
  paymentsController.confirmMock(req, res, next)
);

// Webhook endpoint (public with cryptographic signature verification)
router.post('/webhook', (req, res, next) =>
  paymentsController.handleWebhook(req, res, next)
);

router.post(
  '/:paymentId/refund',
  authenticate,
  (req, res, next) => paymentsController.processRefund(req, res, next)
);

export const paymentsRoutes = router;
