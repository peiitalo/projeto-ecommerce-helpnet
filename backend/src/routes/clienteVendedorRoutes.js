// backend/src/routes/clienteVendedorRoutes.js
import express from 'express';
import {
  listarClientesVendedor,
  buscarClienteVendedor,
  obterEstatisticasClientes
} from '../controllers/clienteVendedorController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Listar clientes do vendedor
router.get('/', listarClientesVendedor);

// Obter estatísticas dos clientes
router.get('/estatisticas', obterEstatisticasClientes);

// Buscar cliente específico
router.get('/:clienteId', buscarClienteVendedor);

export default router;