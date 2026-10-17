import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import { validateCreateOrder, validateUpdateOrder } from '../validators/order.validator.js';

const router = Router();

router.post('/', optionalAuth, validateCreateOrder, OrderController.createOrder);
router.get('/', requireAuth, OrderController.listOrders);
router.get('/:orderId', optionalAuth, OrderController.getOrder);
router.patch('/:orderId', optionalAuth, validateUpdateOrder, OrderController.updateOrder);
router.post('/:orderId/cancel', optionalAuth, OrderController.cancelOrder);

export default router;
