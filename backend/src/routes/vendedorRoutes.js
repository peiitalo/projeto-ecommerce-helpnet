// backend/src/routes/vendedorRoutes.js
import express from 'express';
import {
  listarVendedores,
  buscarVendedor,
  criarVendedor,
  atualizarVendedor,
  excluirVendedor
} from '../controllers/vendedorController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas para gestão de vendedores
router.get('/', listarVendedores);
router.get('/:vendedorId', buscarVendedor);
router.post('/', criarVendedor);
router.put('/:vendedorId', atualizarVendedor);
router.delete('/:vendedorId', excluirVendedor);

export default router;