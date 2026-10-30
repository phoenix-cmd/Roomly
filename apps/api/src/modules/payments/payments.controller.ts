import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service.js';
import { apiSuccess } from '../../utils/response.js';

export class PaymentsController {
  async createIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.body;
      const result = await paymentsService.createPaymentIntent(bookingId, req.user!.id);
      return apiSuccess(res, result, 201);
    } catch (err) {
      return next(err);
    }
  }

  async confirmMock(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.body;
      const result = await paymentsService.confirmMockPayment(bookingId, req.user!.id);
      return apiSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = (req.headers['stripe-signature'] ||
        req.headers['x-razorpay-signature'] ||
        req.headers['x-webhook-signature'] ||
        'test_signature') as string;

      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const result = await paymentsService.handleWebhook(rawBody, signature);
      return res.status(200).json({ received: true, result });
    } catch (err) {
      return next(err);
    }
  }

  async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const { amountCents, reason } = req.body;
      const refund = await paymentsService.processRefund(
        paymentId,
        amountCents,
        reason,
        req.user!
      );
      return apiSuccess(res, { refund });
    } catch (err) {
      return next(err);
    }
  }
}

export const paymentsController = new PaymentsController();
