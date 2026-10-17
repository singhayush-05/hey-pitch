import { OrderService } from '../services/order.service.js';
import { successResponse } from '../utils/response.js';

export class OrderController {
  /**
   * POST /api/v1/orders
   */
  static async createOrder(req, res, next) {
    try {
      const order = await OrderService.createOrder({
        user: req.user,
        ...req.body
      });
      return successResponse(res, 201, { order }, 'Order created successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/orders
   */
  static async listOrders(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await OrderService.listOrders({
        userId: req.user.userId,
        userEmail: req.user.email,
        page,
        limit
      });
      return successResponse(res, 200, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/orders/:orderId
   */
  static async getOrder(req, res, next) {
    try {
      const order = await OrderService.getOrderById(req.params.orderId, req.user);
      return successResponse(res, 200, { order });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/orders/:orderId
   */
  static async updateOrder(req, res, next) {
    try {
      const order = await OrderService.updateOrder(req.params.orderId, req.body, req.user);
      return successResponse(res, 200, { order }, 'Order updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/orders/:orderId/cancel
   */
  static async cancelOrder(req, res, next) {
    try {
      const order = await OrderService.cancelOrder(req.params.orderId, req.user);
      return successResponse(res, 200, { order }, 'Order cancelled successfully');
    } catch (err) {
      next(err);
    }
  }
}
