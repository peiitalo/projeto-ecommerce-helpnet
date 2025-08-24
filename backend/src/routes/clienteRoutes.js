const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.post('/api/clientes', clienteController.criarCliente);
router.post('/api/clientes/login', clienteController.login);

module.exports = router;