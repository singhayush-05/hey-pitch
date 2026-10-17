/**
 * Payment Provider Interface.
 * Defines the contract that any payment provider (Stripe, Razorpay, LemonSqueezy, etc.)
 * must implement.
 */

export class PaymentProviderInterface {
  /**
   * Returns provider identifier name (e.g., 'unconfigured', 'stripe').
   */
  getProviderName() {
    throw new Error('getProviderName() must be implemented');
  }

  /**
   * Creates a payment session/intent with provider.
   * @param {Object} paymentData - { orderId, amount, currency, customerEmail, idempotencyKey }
   * @returns {Promise<Object>} - { providerPaymentId, clientSecret, checkoutUrl, status }
   */
  async createPayment(paymentData) {
    throw new Error('createPayment() must be implemented');
  }

  /**
   * Retrieves payment status from provider.
   * @param {string} providerPaymentId
   * @returns {Promise<Object>} - { providerPaymentId, status, amount, currency }
   */
  async getPaymentStatus(providerPaymentId) {
    throw new Error('getPaymentStatus() must be implemented');
  }

  /**
   * Verifies incoming webhook signature and parses payload.
   * @param {Object} rawBody
   * @param {string} signature
   * @returns {Promise<Object>} - { eventType, providerPaymentId, status, metadata }
   */
  async verifyWebhook(rawBody, signature) {
    throw new Error('verifyWebhook() must be implemented');
  }
}
