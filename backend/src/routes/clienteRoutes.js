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

export default router;
