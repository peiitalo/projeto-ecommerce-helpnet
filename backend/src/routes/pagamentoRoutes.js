// backend/src/routes/pagamentoRoutes.js
import express from 'express';
import { webhookPagamento, verificarStatusPagamento } from '../controllers/pagamentoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Webhook do Mercado Pago (não precisa de autenticação)
router.post('/webhook', webhookPagamento);

// Verificar status do pagamento (cliente autenticado)
router.get('/status/:pedidoId', authMiddleware, verificarStatusPagamento);

export default router;