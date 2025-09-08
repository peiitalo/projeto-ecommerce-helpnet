import express from 'express';
import * as clienteController from '../controllers/clienteController.js';

const router = express.Router();    


// Rotas para clientes (compatível com montagens em /api/clientes e /clientes)
router.post('/cadastro', clienteController.criarCliente);
router.post('/login', clienteController.login);

export default router;
