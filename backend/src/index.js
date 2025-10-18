// backend/src/index.js
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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
import vendorRoutes from './routes/vendorRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { logger, requestLogger } from './utils/logger.js';
// Middlewares de erro centralizados
import { notFound, errorHandler } from './middleware/errorHandler.js';
// Middlewares de cache e performance
import { cacheMiddleware, etagMiddleware } from './middleware/cacheMiddleware.js';
// Segurança HTTP: adiciona cabeçalhos padrão de proteção (XSS, clickjacking, etc.)
import helmet from 'helmet';
// Rate limiting: mitiga brute-force e abusos (limita requisições por IP)
import rateLimit from 'express-rate-limit';

const app = express();

// Configuração CORS mais segura
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sem origin (como mobile apps, Postman)
    if (!origin) return callback(null, true);

    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:5173', // Desenvolvimento frontend
      'http://localhost:3000', // Desenvolvimento alternativo
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://frontend:5173', // Docker development
      'http://frontend:80', // Docker production
      'https://helpnet.com.br', // Domínio de produção (exemplo)
      'https://www.helpnet.com.br',
      /^https:\/\/.*\.helpnet\.com\.br$/, // Subdomínios
    ];

    // Verificar se a origem está na lista permitida
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Empresa-ID',
    'X-Requested-With',
    'Accept',
    'Accept-Encoding',
    'Accept-Language',
    'Cache-Control'
  ],
  exposedHeaders: ['Set-Cookie', 'X-Total-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400, // Cache preflight por 24 horas
};

app.use(cors(corsOptions));

// Middlewares
// Parser de JSON e URL-encoded com limites (previne DoS por payloads grandes)
app.use(express.json({ limit: '10mb' })); // Aumentar limite para upload de imagens
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
/**
 * Middlewares de performance e cache
 * Aplicados antes de outros middlewares para otimizar resposta
 */
app.use(cacheMiddleware); // Cache headers inteligentes
// app.use(etagMiddleware);  // ETags temporariamente desabilitadas para debug

// Logger de requisições (correlaciona erros/diagnóstico)
app.use(requestLogger);

// Segurança HTTP (helmet):
// - Desabilita CSP padrão no dev para evitar conflitos com Vite/React; habilitar em produção com política definida
// - Libera CORP para servir uploads entre domínios quando necessário
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Rate limiting (aplicado apenas em produção)
const isProd = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // mais permissivo em prod para evitar falsos positivos
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProd, // ignora rate limit em desenvolvimento
});
app.use(limiter);

// Respostas comprimidas e cache curto para assets (quando servido estático)
try {
  const compression = (await import('compression')).default;
  app.use(compression());
} catch {}

// Servir arquivos estáticos (imagens, uploads, etc.)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
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
app.use('/api/vendedor', vendorRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);

// Helper: healthcheck simples
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Cache performance monitoring
app.get('/api/cache/stats', (req, res) => {
  const stats = apiCache.getStats();
  res.json({
    cache: stats,
    timestamp: new Date().toISOString()
  });
});

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API HelpNet funcionando!' });
});

// 404 para rotas não mapeadas
app.use(notFound);
// Tratamento centralizado de erros com logging e respostas padronizadas
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  logger.info('server_started', { port: PORT, host: '0.0.0.0' });
});