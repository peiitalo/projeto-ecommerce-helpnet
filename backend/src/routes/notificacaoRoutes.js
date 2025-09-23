import express from 'express';
import * as notificacaoController from '../controllers/notificacaoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import vendorScope from '../middleware/vendorScope.js';

const router = express.Router();

// Rotas para clientes
router.get('/cliente', authMiddleware, notificacaoController.listarNotificacoesCliente);
router.put('/:id/lida', authMiddleware, notificacaoController.marcarComoLida);
router.put('/cliente/lidas', authMiddleware, notificacaoController.marcarTodasComoLidas);

// Rotas para vendedores
router.get('/vendedor', authMiddleware, vendorScope, notificacaoController.listarNotificacoesVendedor);
router.post('/vendedor/clientes', authMiddleware, vendorScope, notificacaoController.criarNotificacaoClientes);
router.post('/vendedor/todos', authMiddleware, vendorScope, notificacaoController.criarNotificacaoTodosClientes);
router.get('/vendedor/clientes', authMiddleware, vendorScope, notificacaoController.buscarClientesVendedor);
router.put('/vendedor/lidas', authMiddleware, vendorScope, notificacaoController.marcarTodasComoLidas);

export default router;