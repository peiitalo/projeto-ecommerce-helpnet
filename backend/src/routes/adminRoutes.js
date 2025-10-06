// backend/src/routes/adminRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  listarPedidosAdmin,
  atualizarStatusPedidoAdmin,
  buscarPedidoAdmin
} from '../controllers/pedidoController.js';

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

// Rotas para gerenciamento de pedidos
router.get('/pedidos', listarPedidosAdmin);
router.get('/pedidos/:id', buscarPedidoAdmin);
router.put('/pedidos/:id/status', atualizarStatusPedidoAdmin);

export default router;