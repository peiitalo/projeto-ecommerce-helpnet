// backend/src/routes/carrinhoRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as carrinhoController from '../controllers/carrinhoController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', carrinhoController.listar);
router.post('/', carrinhoController.adicionar);
router.put('/produto/:produtoId', carrinhoController.atualizar);
router.delete('/produto/:produtoId', carrinhoController.remover);
router.delete('/', carrinhoController.limpar);

export default router;