import { PaymentProviderInterface } from './paymentProvider.interface.js';
import { AppError } from '../../utils/response.js';

/**
 * Default provider implementation when no external gateway is configured.
 * Safely reports 503 SERVICE_UNAVAILABLE with PAYMENT_PROVIDER_NOT_CONFIGURED.
 */
export class UnconfiguredPaymentProvider extends PaymentProviderInterface {
  getProviderName() {
    return 'unconfigured';
  }

  async createPayment() {
    throw new AppError(
      'Payment provider is not yet configured. Please select and configure a payment gateway (e.g., Stripe) in backend environment.',
      503,
      'PAYMENT_PROVIDER_NOT_CONFIGURED',
      {
        provider: 'unconfigured',
        actionRequired: 'Set PAYMENT_PROVIDER and relevant API keys in backend/.env'
      }
    );
  }

  async getPaymentStatus(providerPaymentId) {
    throw new AppError(
      `Cannot inspect status for provider reference '${providerPaymentId}' because payment provider is unconfigured.`,
      503,
      'PAYMENT_PROVIDER_NOT_CONFIGURED'
    );
  }

  async verifyWebhook() {
    throw new AppError(
      'Payment webhooks cannot be processed because payment provider is unconfigured.',
      503,
      'PAYMENT_PROVIDER_NOT_CONFIGURED'
    );
  }
}
