import { Router } from 'express';
import { VerificationController } from '../controllers/verification.controller.js';
import { validateVerificationUrl } from '../validators/verification.validator.js';

const router = Router();

router.post('/validate-url', validateVerificationUrl, VerificationController.validateUrl);
router.post('/check', validateVerificationUrl, VerificationController.checkResource);

export default router;
