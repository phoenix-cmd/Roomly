# ADR 0003: Payment Gateway Abstraction & Idempotent Webhook Processing

## Context
Hospitality platforms operate across multiple countries and merchant accounts (e.g. Stripe for North America/Europe, Razorpay for South Asia, and Mock Sandbox for testing/CI). Tight coupling of payment vendor code in booking handlers harms testability, portability, and security. Furthermore, payment webhooks can be retried or delivered out of order by payment gateways.

## Decision
1. **Adapter Pattern (`IPaymentGateway`)**:
   Define a unified contract:
   - `createPaymentIntent(order: PaymentOrder): Promise<PaymentIntentResult>`
   - `verifyWebhookSignature(rawBody: Buffer, signature: string): WebhookEvent`
   - `processRefund(refundRequest: RefundRequest): Promise<RefundResult>`
   Implement `StripePaymentAdapter`, `RazorpayPaymentAdapter`, and `MockSandboxPaymentAdapter`.
2. **Idempotent Webhook Deduplication**:
   All incoming webhook events are recorded in `WebhookEvent` with a unique index on `(provider, eventId)`. If a duplicate arrives, the system immediately returns HTTP 200 without executing side effects (emails, inventory changes).
3. **No Frontend Authoritative Status**:
   Payment confirmation occurs strictly via verified webhook or verified server-to-server gateway query, never by trusting a client redirect query param.

## Consequences
- Testing flows without real Stripe credentials is clean, deterministic, and isolated.
- Zero duplicate charges or duplicate booking confirmations upon gateway webhook retries.
