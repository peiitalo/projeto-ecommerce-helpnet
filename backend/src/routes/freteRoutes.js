// backend/src/routes/freteRoutes.js
import express from 'express';
import { calcularFrete } from '../controllers/freteController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rota para calcular frete
router.post('/calcular', authMiddleware, calcularFrete);

export default router;