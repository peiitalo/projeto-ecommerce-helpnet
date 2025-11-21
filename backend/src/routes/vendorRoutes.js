// backend/src/routes/vendorRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import vendorScope from '../middleware/vendorScope.js';
import * as vendorController from '../controllers/vendorController.js';
import { buscarPerfilVendedor, atualizarPerfilVendedor } from '../controllers/vendedorController.js';
import cupomRoutes from './cupomRoutes.js';

const router = express.Router();

router.use(authMiddleware);
router.use(vendorScope);

// Dashboard metrics
router.get('/dashboard', vendorController.dashboard);

// Vendor profile
router.get('/perfil', buscarPerfilVendedor);
router.put('/perfil', atualizarPerfilVendedor);

// Vendor addresses CRUD
router.get('/enderecos', vendorController.listarEnderecos);
router.post('/enderecos', vendorController.criarEndereco);
router.put('/enderecos/:enderecoId', vendorController.atualizarEndereco);
router.delete('/enderecos/:enderecoId', vendorController.excluirEndereco);

// Vendor financial data
router.get('/financeiro', vendorController.getFinanceiro);

// Vendor coupons
router.use('/cupons', cupomRoutes);

export default router;