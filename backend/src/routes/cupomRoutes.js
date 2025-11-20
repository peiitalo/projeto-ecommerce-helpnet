import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  listarCupons,
  buscarCupomPorId,
  criarCupom,
  atualizarCupom,
  excluirCupom,
  toggleCupomStatus,
  listarClientesParaCupom,
  listarCuponsDisponiveisCliente,
  validarCupom
} from '../controllers/cupomController.js';

const router = express.Router();

// Rotas públicas para clientes (com authMiddleware)
const publicRouter = express.Router();
publicRouter.use(authMiddleware);

// Middlewares já aplicados no vendorRoutes.js (authMiddleware e vendorScope)

// Rotas para cupons
router.get('/', listarCupons);
router.get('/:id', buscarCupomPorId);
router.post('/', criarCupom);
router.put('/:id', atualizarCupom);
router.delete('/:id', excluirCupom);

// Rota para ativar/desativar cupom
router.patch('/:id/toggle-status', toggleCupomStatus);

// Rota para listar clientes disponíveis para cupons específicos
router.get('/clientes/disponiveis', listarClientesParaCupom);

// Rotas públicas para clientes
publicRouter.get('/meus', listarCuponsDisponiveisCliente);
publicRouter.post('/validar', validarCupom);

export { publicRouter };
export default router;