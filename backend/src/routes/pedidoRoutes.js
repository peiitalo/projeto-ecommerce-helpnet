// backend/src/routes/pedidoRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as pedidoController from '../controllers/pedidoController.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', pedidoController.criar);

export default router;