import { Payment } from '../models/payment.model.js';
import { Order } from '../models/order.model.js';
import { UnconfiguredPaymentProvider } from '../integrations/payment/unconfiguredProvider.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/response.js';

// Factory for payment provider instance
function getPaymentProvider() {
  switch (config.payment.provider) {
    case 'unconfigured':
    default:
      return new UnconfiguredPaymentProvider();
  }
}

export class PaymentService {
  /**
   * Initiate payment for an eligible order.
   */
  static async createPayment({ orderId, idempotencyKey = null, requestingUser = null }) {
    if (!orderId) {
      throw new AppError('orderId is required to create a payment', 400, 'MISSING_ORDER_ID');
    }

    // Look up order
    const isObjectId = orderId.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: orderId } : { orderId };
    const order = await Order.findOne(query);

    if (!order) {
      throw new AppError(`Order '${orderId}' not found`, 404, 'ORDER_NOT_FOUND');
    }

    // Enforce ownership
    if (requestingUser) {
      const isOwner =
        (order.user && order.user.toString() === requestingUser.userId) ||
        order.customerEmail.toLowerCase() === requestingUser.email.toLowerCase();
      if (!isOwner && requestingUser.role !== 'admin') {
        throw new AppError('You are not authorized to create a payment for this order', 403, 'FORBIDDEN');
      }
    }

    if (order.status !== 'pending_payment') {
      throw new AppError(
        `Order '${order.orderId}' is in status '${order.status}' and cannot accept payment`,
        422,
        'ORDER_NOT_PAYABLE'
      );
    }

    // Authoritative amount from server-calculated order pricing
    const amount = order.pricing.total;
    const currency = order.pricing.currency || 'USD';

    // Handle idempotency
    if (idempotencyKey) {
      const existingPayment = await Payment.findOne({ idempotencyKey });
      if (existingPayment) {
        return {
          payment: existingPayment,
          isIdempotentReplay: true
        };
      }
    }

    // Record pending payment in database
    const payment = new Payment({
      order: order._id,
      user: requestingUser ? requestingUser.userId : order.user,
      amount,
      currency,
      provider: config.payment.provider,
      status: 'requires_payment_method',
      idempotencyKey: idempotencyKey || null,
      metadata: {
        orderId: order.orderId,
        customerEmail: order.customerEmail
      }
    });

    await payment.save();

    // Link payment to order
    order.payment = payment._id;
    await order.save();

    // Call provider integration (Throws 503 if unconfigured)
    const provider = getPaymentProvider();
    const providerResult = await provider.createPayment({
      paymentId: payment.paymentId,
      orderId: order.orderId,
      amount,
      currency,
      customerEmail: order.customerEmail,
      idempotencyKey
    });

    return {
      payment,
      providerResult
    };
  }

  /**
   * Get payment by paymentId with authorization check.
   */
  static async getPaymentById(paymentId, requestingUser = null) {
    const isObjectId = paymentId.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: paymentId } : { paymentId };

    const payment = await Payment.findOne(query).populate('order', 'orderId status pricing customerEmail');
    if (!payment) {
      throw new AppError(`Payment '${paymentId}' not found`, 404, 'PAYMENT_NOT_FOUND');
    }

    if (requestingUser) {
      const isOwner =
        (payment.user && payment.user.toString() === requestingUser.userId) ||
        (payment.order && payment.order.customerEmail.toLowerCase() === requestingUser.email.toLowerCase());
      if (!isOwner && requestingUser.role !== 'admin') {
        throw new AppError('You are not authorized to view this payment', 403, 'FORBIDDEN');
      }
    }

    return payment;
  }

  /**
   * Process provider webhook event idempotently.
   */
  static async handleWebhook(rawBody, signature) {
    const provider = getPaymentProvider();
    // This will throw 503 if unconfigured
    return provider.verifyWebhook(rawBody, signature);
  }
}
