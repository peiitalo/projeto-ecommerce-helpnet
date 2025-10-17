// backend/src/routes/avaliacaoRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as avaliacaoController from '../controllers/avaliacaoController.js';

const router = express.Router();

router.get('/produto/:produtoId', avaliacaoController.listarPorProduto);
router.use(authMiddleware);
router.get('/produto/:produtoId/minha', avaliacaoController.minhaDoProduto);
router.post('/produto/:produtoId', avaliacaoController.avaliar);
router.delete('/produto/:produtoId', avaliacaoController.remover);

export default router;