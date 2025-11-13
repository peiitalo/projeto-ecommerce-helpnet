import express from 'express';
const router = express.Router();
import cupomController from '../controllers/cupomController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import vendorScope from '../middleware/vendorScope.js';

// Rotas que requerem autenticação de vendedor
const vendorRoutes = express.Router();
vendorRoutes.use(authMiddleware);
vendorRoutes.use(vendorScope);

// CRUD de cupons (vendedores)
vendorRoutes.post('/', cupomController.criarCupom);
vendorRoutes.get('/', cupomController.listarCupons);
vendorRoutes.get('/:id', cupomController.buscarCupomPorId);
vendorRoutes.put('/:id', cupomController.atualizarCupom);
vendorRoutes.delete('/:id', cupomController.deletarCupom);

// Aplicar rotas de vendedor
router.use('/vendedor', vendorRoutes);

// Rotas públicas para clientes (requerem apenas autenticação básica)
router.use(authMiddleware); // Todas as rotas abaixo requerem autenticação

// Gestão de cupons por clientes (clientes)
router.get('/', cupomController.listarCuponsPublicos); // Novo endpoint principal
router.get('/disponiveis', cupomController.listarCuponsDisponiveis); // Manter para compatibilidade
router.post('/resgatar', cupomController.resgatarCupom);
router.get('/meus', cupomController.listarMeusCupons);

// Validação e cálculo de desconto (clientes)
router.post('/validar', cupomController.validarCupom);
router.post('/calcular-desconto', cupomController.calcularDesconto);

export default router;