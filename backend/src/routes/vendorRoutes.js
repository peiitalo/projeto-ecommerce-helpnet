// backend/src/routes/vendorRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as vendorController from '../controllers/vendorController.js';

const router = express.Router();

router.use(authMiddleware);

// Dashboard metrics
router.get('/dashboard', vendorController.dashboard);

export default router;