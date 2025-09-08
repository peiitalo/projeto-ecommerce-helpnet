import express from 'express';
import { 
  listarCategorias, 
  buscarCategoriaPorId, 
  criarCategoria, 
  atualizarCategoria, 
  excluirCategoria 
} from '../controllers/categoriaController.js';

const router = express.Router();

// Rotas públicas (para clientes)
router.get('/', listarCategorias);
router.get('/:id', buscarCategoriaPorId);

// Rotas administrativas
router.post('/', criarCategoria);
router.put('/:id', atualizarCategoria);
router.delete('/:id', excluirCategoria);

export default router;