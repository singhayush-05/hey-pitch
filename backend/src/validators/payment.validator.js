import { AppError } from '../utils/response.js';

export function validateCreatePayment(req, res, next) {
  const { orderId, amount, status } = req.body || {};

  if (!orderId || typeof orderId !== 'string') {
    return next(new AppError('orderId is required to initiate a payment', 400, 'MISSING_ORDER_ID'));
  }

  // Security check: Reject client attempts to dictate charge amount or mark payment success
  if (amount !== undefined) {
    return next(
      new AppError(
        'Client-submitted payment amounts are not accepted. The amount is derived authoritatively from the order.',
        400,
        'CLIENT_AMOUNT_REJECTED'
      )
    );
  }

  if (status !== undefined) {
    return next(
      new AppError(
        'Client cannot submit payment status. Status is updated exclusively through verified payment provider webhooks.',
        400,
        'CLIENT_STATUS_REJECTED'
      )
    );
  }

  next();
}
