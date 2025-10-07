// backend/src/routes/vendorRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as vendorController from '../controllers/vendorController.js';
import { buscarPerfilVendedor, atualizarPerfilVendedor } from '../controllers/vendedorController.js';

const router = express.Router();

router.use(authMiddleware);

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

export default router;