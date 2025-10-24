// backend/src/routes/adminSuporteRoutes.js
import express from 'express';
import * as adminSuporteController from '../controllers/adminSuporteController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Por enquanto, usar o middleware de cliente autenticado (TODO: implementar admin específico)
router.use(authMiddleware);

// Rotas para mensagens de suporte
router.get('/mensagens', adminSuporteController.listarMensagensSuporte);
router.put('/mensagens/:id/responder', adminSuporteController.responderMensagem);
router.put('/mensagens/:id/resolver', adminSuporteController.marcarComoResolvida);

// Rotas para avaliações da plataforma
router.get('/avaliacoes', adminSuporteController.listarAvaliacoesPlataforma);
router.put('/avaliacoes/:id/exibicao', adminSuporteController.gerenciarExibicaoAvaliacao);

// Estatísticas
router.get('/estatisticas', adminSuporteController.estatisticasSuporte);

export default router;