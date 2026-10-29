import {
  CreateOrderParams,
  IPaymentGateway,
  PaymentOrderResult,
  RefundParams,
  RefundResult,
  WebhookVerificationResult,
} from './paymentGateway.interface.js';

export class MockPaymentAdapter implements IPaymentGateway {
  readonly providerName = 'MOCK_SANDBOX';

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    const mockTxId = `mock_pi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      provider: 'MOCK_SANDBOX',
      providerTransactionId: mockTxId,
      clientSecret: `${mockTxId}_secret_test`,
      amountCents: params.amountCents,
      currency: params.currency,
      status: 'PENDING',
    };
  }

  async verifyWebhook(
    rawBody: Buffer | string,
    signature: string
  ): Promise<WebhookVerificationResult> {
    // In mock mode, if signature starts with 'valid_', accept it; otherwise accept if signature is provided
    try {
      const parsed = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf-8'));
      const isValid = signature !== 'invalid_signature';

      return {
        isValid,
        eventId: parsed.id || `mock_evt_${Date.now()}`,
        eventType: parsed.type || 'payment_intent.succeeded',
        payload: parsed,
        bookingId: parsed.data?.object?.metadata?.bookingId,
        providerTransactionId: parsed.data?.object?.id || `mock_pi_${Date.now()}`,
        amountCents: parsed.data?.object?.amount,
      };
    } catch {
      return {
        isValid: false,
        eventId: '',
        eventType: '',
        payload: null,
      };
    }
  }

  async processRefund(params: RefundParams): Promise<RefundResult> {
    const mockRefundId = `mock_re_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      providerRefundId: mockRefundId,
      status: 'SUCCEEDED',
    };
  }
}
