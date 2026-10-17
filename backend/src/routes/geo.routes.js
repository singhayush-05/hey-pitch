import { Router } from 'express';
import { GeoController } from '../controllers/geo.controller.js';

const router = Router();

// GET /api/v1/geo/lookup - Detects user IP country and currency
router.get('/lookup', GeoController.getClientGeo);

export default router;
