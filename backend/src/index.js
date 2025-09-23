// backend/src/index.js
import express from 'express';
import cors from 'cors';
import clienteRoutes from './routes/clienteRoutes.js';
import produtoRoutes from './routes/produtoRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import vendorProdutoRoutes from './routes/vendorProdutoRoutes.js';
import carrinhoRoutes from './routes/carrinhoRoutes.js';
import favoritoRoutes from './routes/favoritoRoutes.js';
import avaliacaoRoutes from './routes/avaliacaoRoutes.js';
import freteRoutes from './routes/freteRoutes.js';
import notificacaoRoutes from './routes/notificacaoRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import pagamentoRoutes from './routes/pagamentoRoutes.js';
import clienteVendedorRoutes from './routes/clienteVendedorRoutes.js';
import vendorPedidoRoutes from './routes/vendorPedidoRoutes.js';
import entregaRoutes from './routes/entregaRoutes.js';
import vendedorRoutes from './routes/vendedorRoutes.js';
import relatoriosRoutes from './routes/relatoriosRoutes.js';
import { logger, requestLogger } from './utils/logger.js';

const app = express();

// Configuração CORS com credenciais (para cookies httpOnly de refresh)
app.use(cors({
  origin: (origin, callback) => callback(null, true), // reflete a origem da requisição
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Empresa-ID'],
  exposedHeaders: ['Set-Cookie'],
}));

// Middlewares
app.use(express.json({ limit: '10mb' })); // Aumentar limite para upload de imagens
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Respostas comprimidas e cache curto para assets (quando servido estático)
try {
  const compression = (await import('compression')).default;
  app.use(compression());
} catch {}

// Servir arquivos estáticos (imagens, uploads, etc.)
app.use('/uploads', express.static('uploads', {
  maxAge: '1d', // Cache de 1 dia para imagens
  etag: true
}));

// Rotas
app.use('/api/clientes', clienteRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/vendedor/produtos', vendorProdutoRoutes);
app.use('/api/carrinho', carrinhoRoutes);
app.use('/api/favoritos', favoritoRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);
app.use('/api/frete', freteRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/vendedor/clientes', clienteVendedorRoutes);
app.use('/api/vendedor/pedidos', vendorPedidoRoutes);
app.use('/api/entregas', entregaRoutes);
app.use('/api/vendedor/vendedores', vendedorRoutes);
app.use('/api/vendedor/relatorios', relatoriosRoutes);

// Helper: healthcheck simples
app.get('/api/health', (req, res) => res.json({ ok: true }));

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