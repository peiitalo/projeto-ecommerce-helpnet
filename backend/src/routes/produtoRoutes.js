const express = require('express');
const router = express.Router();
const {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  excluirProduto,
  acaoEmLote,
  gerarSKU
} = require('../controllers/produtoController');

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

module.exports = router;