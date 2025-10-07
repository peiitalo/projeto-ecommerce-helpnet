// backend/src/routes/publicRoutes.js
import express from 'express';
import { obterEstatisticasPublicas, obterDepoimentos } from '../controllers/publicController.js';

const router = express.Router();

// Rotas públicas para landing page
router.get('/stats', obterEstatisticasPublicas);
router.get('/testimonials', obterDepoimentos);

export default router;