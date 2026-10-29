export interface CreateOrderParams {
  amountCents: number;
  currency: string;
  bookingId: string;
  customerEmail: string;
  metadata?: Record<string, string>;
}

export interface PaymentOrderResult {
  provider: 'MOCK_SANDBOX' | 'STRIPE' | 'RAZORPAY';
  providerTransactionId: string;
  clientSecret?: string;
  amountCents: number;
  currency: string;
  status: 'PENDING' | 'SUCCEEDED';
}

export interface RefundParams {
  providerTransactionId: string;
  amountCents: number;
  currency: string;
  reason: string;
}

export interface RefundResult {
  providerRefundId: string;
  status: 'SUCCEEDED' | 'PENDING' | 'FAILED';
  failureReason?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  eventId: string;
  eventType: string;
  payload: any;
  bookingId?: string;
  providerTransactionId?: string;
  amountCents?: number;
}

export interface IPaymentGateway {
  readonly providerName: string;
  createOrder(params: CreateOrderParams): Promise<PaymentOrderResult>;
  verifyWebhook(rawBody: Buffer | string, signature: string): Promise<WebhookVerificationResult>;
  processRefund(params: RefundParams): Promise<RefundResult>;
}
