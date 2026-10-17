import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { validateCreatePayment } from '../validators/payment.validator.js';

const router = Router();

router.post('/create', optionalAuth, validateCreatePayment, PaymentController.createPayment);
router.get('/:paymentId', optionalAuth, PaymentController.getPayment);
router.post('/webhook', PaymentController.handleWebhook);

export default router;
