// backend/src/routes/vendorPedidoRoutes.js
import express from 'express';
import { listarPedidosVendedor, obterEstatisticasDashboardVendedor } from '../controllers/pedidoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Estatísticas do dashboard do vendedor
router.get('/stats', obterEstatisticasDashboardVendedor);

// Listar pedidos do vendedor (produtos da empresa do vendedor)
router.get('/', listarPedidosVendedor);

export default router;