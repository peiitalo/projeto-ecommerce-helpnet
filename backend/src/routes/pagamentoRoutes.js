// backend/src/routes/pagamentoRoutes.js
import express from 'express';
import { webhookPagamento, verificarStatusPagamento, simularPagamentoSandbox, registrarPagamentoParcial, obterResumoPagamentos, atualizarStatusPagamento } from '../controllers/pagamentoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Webhook do Mercado Pago (não precisa de autenticação)
router.post('/webhook', webhookPagamento);

// Verificar status do pagamento (cliente autenticado)
router.get('/status/:pedidoId', authMiddleware, verificarStatusPagamento);

// Sandbox: simular pagamento (aprovado/rejeitado/pendente) - cliente autenticado
router.post('/sandbox/simular/:pedidoId', authMiddleware, simularPagamentoSandbox);

// Registrar pagamento parcial
router.post('/:pedidoId/registrar', authMiddleware, registrarPagamentoParcial);

// Obter resumo / retomar pagamentos pendentes
router.get('/:pedidoId/resumo', authMiddleware, obterResumoPagamentos);

// Atualizar status de pagamento do pedido (uso administrativo)
router.patch('/:pedidoId/status', authMiddleware, atualizarStatusPagamento);

export default router;