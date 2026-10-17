import { PaymentService } from '../services/payment.service.js';
import { successResponse } from '../utils/response.js';

export class PaymentController {
  /**
   * POST /api/v1/payments/create
   */
  static async createPayment(req, res, next) {
    try {
      const { orderId } = req.body;
      const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey || null;

      const result = await PaymentService.createPayment({
        orderId,
        idempotencyKey,
        requestingUser: req.user
      });

      return successResponse(res, 201, result, 'Payment initiated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/payments/:paymentId
   */
  static async getPayment(req, res, next) {
    try {
      const payment = await PaymentService.getPaymentById(req.params.paymentId, req.user);
      return successResponse(res, 200, { payment });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/payments/webhook
   */
  static async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['stripe-signature'] || req.headers['x-webhook-signature'] || '';
      const result = await PaymentService.handleWebhook(req.body, signature);
      return successResponse(res, 200, result, 'Webhook processed successfully');
    } catch (err) {
      next(err);
    }
  }
}
