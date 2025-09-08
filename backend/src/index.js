// backend/src/index.js
import express from 'express';
import cors from 'cors';
import clienteRoutes from './routes/clienteRoutes.js';
import produtoRoutes from './routes/produtoRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';  
import vendorProdutoRoutes from './routes/vendorProdutoRoutes.js';  
import { logger, requestLogger } from './utils/logger.js';

const app = express();

// Configuração CORS para aceitar conexões de qualquer origem
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Empresa-ID']
}));

// Middlewares
app.use(express.json({ limit: '10mb' })); // Aumentar limite para upload de imagens
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Rotas
app.use('/api/clientes', clienteRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/vendedor/produtos', vendorProdutoRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API HelpNet funcionando!' });
});

// Middleware de tratamento de erros (único, com logger)
app.use((error, req, res, next) => {
  logger.error('unhandled_error', {
    error: { message: error.message, stack: error.stack, code: error.code },
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    // Sanitizado em logger util
    body: req.body,
  });
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  logger.info('server_started', { port: PORT, host: '0.0.0.0' });
});