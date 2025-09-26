// backend/src/routes/pedidoRoutes.js
import express from 'express';
import * as pedidoController from '../controllers/pedidoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rotas para pedidos (requer autenticação)
router.post('/', authMiddleware, pedidoController.criarPedido);
router.get('/', authMiddleware, pedidoController.listarPedidosCliente);
router.get('/:id', authMiddleware, pedidoController.buscarPedidoPorId);
router.put('/:id/cancelar', authMiddleware, pedidoController.cancelarPedido);

export default router;