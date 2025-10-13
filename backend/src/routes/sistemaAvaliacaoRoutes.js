// backend/src/routes/sistemaAvaliacaoRoutes.js
import express from 'express';
import {
  criarAvaliacaoSistema,
  obterAvaliacoesLanding,
  obterTodasAvaliacoes,
  obterAvaliacoesPublicas,
  atualizarStatusAvaliacao,
  deletarAvaliacao
} from '../controllers/sistemaAvaliacaoController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rota pública para criar avaliação do sistema
router.post('/', criarAvaliacaoSistema);

// Rota pública para obter avaliações para landing page
router.get('/landing', obterAvaliacoesLanding);

// Rota pública para obter avaliações com filtros (página de suporte)
router.get('/publicas', obterAvaliacoesPublicas);

// Rotas protegidas (admin)
router.get('/', authenticateToken, obterTodasAvaliacoes);
router.put('/:id/status', authenticateToken, atualizarStatusAvaliacao);
router.delete('/:id', authenticateToken, deletarAvaliacao);

export default router;