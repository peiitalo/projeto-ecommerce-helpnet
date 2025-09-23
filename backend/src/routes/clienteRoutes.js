import express from 'express';
import * as clienteController from '../controllers/clienteController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();    


// Rotas para clientes (compatível com montagens em /api/clientes e /clientes)
router.post('/cadastro', clienteController.criarCliente);
router.post('/login', clienteController.login);

// Sessão e auto-login (Access curto + Refresh em cookie httpOnly)
router.post('/refresh', clienteController.refreshToken);
router.post('/logout', clienteController.logout);
router.get('/auto-login', authMiddleware, clienteController.autoLoginClient);
router.get('/perfil', authMiddleware, clienteController.buscarPerfil);
router.put('/perfil', authMiddleware, clienteController.atualizarPerfil);
router.post('/validar-senha-atual', authMiddleware, clienteController.validarSenhaAtual);
router.put('/alterar-senha', authMiddleware, clienteController.alterarSenha);
router.get('/enderecos', authMiddleware, clienteController.listarEnderecos);
router.post('/enderecos', authMiddleware, clienteController.criarEndereco);
router.put('/enderecos/:id', authMiddleware, clienteController.atualizarEndereco);
router.delete('/enderecos/:id', authMiddleware, clienteController.excluirEndereco);
router.put('/enderecos/:id/padrao', authMiddleware, clienteController.definirEnderecoPadrao);
router.post('/solicitar-reset-senha', clienteController.solicitarResetSenha);
router.post('/resetar-senha', clienteController.resetarSenha);

export default router;
