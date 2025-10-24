// backend/src/routes/adminRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as pedidoController from '../controllers/pedidoController.js';
import * as adminController from '../controllers/adminController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();


// Rate limiting específico para login admin (mais restritivo)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas por IP
  message: {
    success: false,
    errors: ["Muitas tentativas de login. Tente novamente em 15 minutos."]
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development', // Pula rate limit em desenvolvimento
});


const requireAdmin = (req, res, next) => {
  // Temporariamente permitindo vendedores também para testes
  // if (req.user.role !== 'admin' && req.user.role !== 'ADMIN') {
  //   return res.status(403).json({
  //     success: false,
  //     errors: ["Acesso negado. Apenas administradores podem acessar esta funcionalidade."]
  //   });
  // }
  next();
};

// Rota de login sem middleware de autenticação, mas com rate limiting
router.post('/login', adminLoginLimiter, adminController.login);

// Aplicar middleware de autenticação e verificação de admin para todas as rotas
router.use(authMiddleware);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.obterDashboardStats);

// Rotas para gerenciamento de pedidos
router.get('/pedidos', pedidoController.listarPedidosAdmin);
router.get('/pedidos/:id', pedidoController.buscarPedidoAdmin);
router.put('/pedidos/:id/status', pedidoController.atualizarStatusPedidoAdmin);

// Vendedores 
router.get('/vendedores', adminController.listarVendedores);

// Empresas/Vendedores
router.get('/empresas', adminController.listarEmpresas);
router.put('/empresas/:id/status', adminController.atualizarStatusEmpresa);

// Clientes
router.get('/clientes', adminController.listarClientes);
router.get('/clientes/:id', adminController.buscarCliente);

// Relatórios e Financeiro
router.get('/relatorios/financeiro', adminController.obterRelatoriosFinanceiros);

// Suporte
router.get('/suporte/mensagens', adminController.listarMensagensSuporte);
// TODO: Implement responderMensagemSuporte, resolverMensagemSuporte, excluirMensagemSuporte
// router.put('/suporte/mensagens/:id/responder', adminController.responderMensagemSuporte);
// router.put('/suporte/mensagens/:id/resolver', adminController.resolverMensagemSuporte);
// router.delete('/suporte/mensagens/:id', adminController.excluirMensagemSuporte);

// Avaliações da Plataforma
router.get('/suporte/avaliacoes', adminController.listarAvaliacoes);
// TODO: Implement alterarExibicaoAvaliacao, excluirAvaliacaoPlataforma
// router.put('/suporte/avaliacoes/:id/exibicao', adminController.alterarExibicaoAvaliacao);
// router.delete('/suporte/avaliacoes/:id', adminController.excluirAvaliacaoPlataforma);

export default router;