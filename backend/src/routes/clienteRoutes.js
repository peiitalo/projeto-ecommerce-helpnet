const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Rotas para clientes
router.post('/clientes', clienteController.criarCliente);
router.post('/clientes/login', clienteController.login);

module.exports = router;