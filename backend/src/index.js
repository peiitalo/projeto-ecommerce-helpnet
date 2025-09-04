const express = require('express');
const cors = require('cors');
const clienteRoutes = require('./routes/clienteRoutes');

const app = express();


// Configuração CORS para aceitar conexões de qualquer origem
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Usar as rotas diretamente
app.use('/', clienteRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT} e aceitando conexões de qualquer IP`);
});