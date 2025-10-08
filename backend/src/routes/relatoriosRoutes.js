// backend/src/routes/relatoriosRoutes.js
import express from 'express';
import {
  obterEstatisticasGerais,
  obterDadosVendas,
  obterDadosClientes,
  exportarRelatorio
} from '../controllers/relatoriosController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas para relatórios
router.get('/gerais', obterEstatisticasGerais);
router.get('/vendas', obterDadosVendas);
router.get('/clientes', obterDadosClientes);
router.get('/export', exportarRelatorio);

export default router;