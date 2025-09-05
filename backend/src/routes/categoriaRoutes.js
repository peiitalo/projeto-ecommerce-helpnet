const express = require('express');
const router = express.Router();
const {
  listarCategorias,
  buscarCategoriaPorId,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria
} = require('../controllers/categoriaController');

// Rotas públicas (para clientes)
router.get('/', listarCategorias);
router.get('/:id', buscarCategoriaPorId);

// Rotas administrativas
router.post('/', criarCategoria);
router.put('/:id', atualizarCategoria);
router.delete('/:id', excluirCategoria);

module.exports = router;