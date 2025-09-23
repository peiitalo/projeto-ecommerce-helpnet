// backend/src/routes/entregaRoutes.js
import express from 'express';
import {
  criarEntrega,
  atualizarStatusEntrega,
  atualizarStatusEntregaPorPedido,
  buscarEntregaCliente,
  buscarEntregaVendedor,
  listarEntregasVendedor
} from '../controllers/entregaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas para vendedores
router.post('/', criarEntrega); // Criar entrega
router.put('/:entregaId/status', atualizarStatusEntrega); // Atualizar status
router.put('/pedido/:pedidoId/status', atualizarStatusEntregaPorPedido); // Atualizar status por pedido
router.get('/vendedor', listarEntregasVendedor); // Listar entregas do vendedor
router.get('/vendedor/:pedidoId', buscarEntregaVendedor); // Buscar entrega específica do vendedor

// Rotas para clientes
router.get('/cliente/:pedidoId', buscarEntregaCliente); // Buscar entrega de um pedido

export default router;