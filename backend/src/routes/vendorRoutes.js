// backend/src/routes/vendorRoutes.js
import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as vendorController from '../controllers/vendorController.js';
import { buscarPerfilVendedor } from '../controllers/vendedorController.js';

const router = express.Router();

router.use(authMiddleware);

// Dashboard metrics
router.get('/dashboard', vendorController.dashboard);

// Vendor profile
router.get('/perfil', buscarPerfilVendedor);

export default router;