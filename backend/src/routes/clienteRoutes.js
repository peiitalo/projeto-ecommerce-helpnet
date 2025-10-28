// backend/src/routes/clienteRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as clienteController from '../controllers/clienteController.js';
import * as suporteController from '../controllers/suporteController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas por IP
  message: {
    success: false,
    errors: ["Muitas tentativas de login. Tente novamente em 15 minutos."]
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});

// Middleware para verificar se é cliente
const requireCliente = (req, res, next) => {
  if (req.user.role !== 'cliente' && req.user.role !== 'CLIENTE') {
    return res.status(403).json({
      success: false,
      errors: ["Acesso negado. Apenas clientes podem acessar esta funcionalidade."]
    });
  }
  next();
};

// Rotas públicas (sem autenticação)
router.post('/login', loginLimiter, clienteController.login);
router.post('/cadastro', clienteController.criarCliente);
router.post('/reset-senha', clienteController.solicitarResetSenha);
router.post('/reset-senha/:token', clienteController.resetarSenha);

// Aplicar middleware de autenticação para rotas protegidas
router.use(authMiddleware);
router.use(requireCliente);

// Rotas de suporte para clientes
router.post('/suporte/mensagem', suporteController.enviarMensagem);
router.get('/suporte/mensagens', suporteController.buscarMinhasMensagens);
router.get('/suporte/avaliacao/minha', suporteController.buscarMinhaAvaliacao);
router.post('/suporte/avaliacao', suporteController.avaliarPlataforma);

// Rota para buscar avaliações do cliente
router.get('/avaliacoes', clienteController.buscarAvaliacoesCliente);

// Rotas de perfil e configurações
router.get('/perfil', clienteController.buscarPerfil);
router.put('/perfil', clienteController.atualizarPerfil);
router.put('/senha', clienteController.alterarSenha);
router.post('/validar-senha-atual', clienteController.validarSenhaAtual);

// Rotas de endereços
router.get('/enderecos', clienteController.listarEnderecos);
router.post('/enderecos', clienteController.criarEndereco);
router.put('/enderecos/:id', clienteController.atualizarEndereco);
router.delete('/enderecos/:id', clienteController.excluirEndereco);
router.put('/enderecos/:id/padrao', clienteController.definirEnderecoPadrao);

// Rotas de autenticação
router.post('/refresh', clienteController.refreshToken);
router.post('/logout', clienteController.logout);
router.get('/auto-login', clienteController.autoLoginClient);

export default router;
