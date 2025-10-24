// backend/src/routes/suporteRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as suporteController from '../controllers/suporteController.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Enviar mensagem de suporte (dúvida ou comentário da plataforma)
router.post('/mensagem', suporteController.enviarMensagem);

// Avaliar plataforma (5 estrelas)
router.post('/avaliacao', suporteController.avaliarPlataforma);
router.get('/avaliacao/minha', suporteController.buscarMinhaAvaliacao);

// Listar avaliações para exibir no site (público)
router.get('/avaliacoes/site', suporteController.listarAvaliacoesSite);

export default router;