// backend/src/routes/vendedorRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as suporteController from '../controllers/suporteController.js';
import * as vendedorController from '../controllers/vendedorController.js';

const router = express.Router();

// Middleware para verificar se é vendedor
const requireVendedor = (req, res, next) => {
  if (req.user.role !== 'vendedor' && req.user.role !== 'VENDEDOR') {
    return res.status(403).json({
      success: false,
      errors: ["Acesso negado. Apenas vendedores podem acessar esta funcionalidade."]
    });
  }
  next();
};

// Aplicar middleware de autenticação
router.use(authMiddleware);
router.use(requireVendedor);

// Rotas de suporte para vendedores
router.post('/suporte/mensagem', suporteController.enviarMensagem);
router.get('/suporte/avaliacao/minha', suporteController.buscarMinhaAvaliacao);
router.post('/suporte/avaliacao', suporteController.avaliarPlataforma);

// Outras rotas específicas do vendedor podem ser adicionadas aqui
router.get('/perfil', vendedorController.buscarPerfilVendedor);
router.put('/perfil', vendedorController.atualizarPerfilVendedor);

export default router;