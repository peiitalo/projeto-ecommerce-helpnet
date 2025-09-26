// backend/src/routes/favoritoRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as favoritoController from '../controllers/favoritoController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', favoritoController.listar);
router.post('/', favoritoController.adicionar);
router.delete('/:produtoId', favoritoController.remover);

export default router;