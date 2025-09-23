// backend/src/routes/produtoRoutes.js
import express from 'express';
import {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  excluirProduto,
  gerarSKU,
  acaoEmLote
} from '../controllers/produtoController.js';

const router = express.Router();

// Rotas administrativas (devem vir antes das rotas com parâmetros)
router.get('/gerar/sku', gerarSKU);
router.post('/acao-lote', acaoEmLote);

// Rotas públicas (para clientes)
router.get('/', listarProdutos);
router.get('/:id', buscarProdutoPorId);

// Rotas administrativas com parâmetros
router.post('/', criarProduto);
router.put('/:id', atualizarProduto);
router.delete('/:id', excluirProduto);

export default router;