// backend/src/routes/parceriaRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as parceriaController from '../controllers/parceriaController.js';

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

// Aplicar middleware de autenticação e verificação de vendedor
router.use(authMiddleware);
router.use(requireVendedor);

// Rotas de parcerias
router.get('/', parceriaController.listarParcerias);
router.post('/', parceriaController.enviarSolicitacaoParceria);
router.patch('/:parceriaId', parceriaController.responderSolicitacaoParceria);
router.delete('/:parceriaId', parceriaController.encerrarParceria);

// Rotas de produtos compartilhados
router.get('/produtos-compartilhados', parceriaController.listarProdutosCompartilhados);

export default router;