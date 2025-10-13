// backend/src/routes/adminRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  listarPedidosAdmin,
  atualizarStatusPedidoAdmin,
  buscarPedidoAdmin
} from '../controllers/pedidoController.js';
import {
  obterDashboardStats,
  listarEmpresas,
  atualizarStatusEmpresa,
  listarClientes,
  buscarCliente,
  obterRelatoriosFinanceiros,
  listarMensagensSuporte,
  listarAvaliacoes,
  atualizarVisibilidadeAvaliacao
} from '../controllers/adminController.js';

const router = express.Router();

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      errors: ["Acesso negado. Apenas administradores podem acessar esta funcionalidade."]
    });
  }
  next();
};

// Aplicar middleware de autenticação e verificação de admin para todas as rotas
router.use(authMiddleware);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', obterDashboardStats);

// Rotas para gerenciamento de pedidos
router.get('/pedidos', listarPedidosAdmin);
router.get('/pedidos/:id', buscarPedidoAdmin);
router.put('/pedidos/:id/status', atualizarStatusPedidoAdmin);

// Empresas/Vendedores
router.get('/empresas', listarEmpresas);
router.put('/empresas/:id/status', atualizarStatusEmpresa);

// Clientes
router.get('/clientes', listarClientes);
router.get('/clientes/:id', buscarCliente);

// Relatórios e Financeiro
router.get('/relatorios/financeiro', obterRelatoriosFinanceiros);

// Suporte
router.get('/suporte/mensagens', listarMensagensSuporte);
router.get('/avaliacoes', listarAvaliacoes);
router.put('/avaliacoes/:id/visibilidade', atualizarVisibilidadeAvaliacao);

export default router;