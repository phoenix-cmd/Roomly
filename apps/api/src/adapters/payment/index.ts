import { env } from '../../config/env.js';
import { IPaymentGateway } from './paymentGateway.interface.js';
import { MockPaymentAdapter } from './mockPaymentAdapter.js';

let paymentGatewayInstance: IPaymentGateway;

export function getPaymentGateway(): IPaymentGateway {
  if (!paymentGatewayInstance) {
    switch (env.PAYMENT_PROVIDER) {
      case 'MOCK_SANDBOX':
      default:
        paymentGatewayInstance = new MockPaymentAdapter();
        break;
    }
  }
  return paymentGatewayInstance;
}

export * from './paymentGateway.interface.js';
export * from './mockPaymentAdapter.js';
