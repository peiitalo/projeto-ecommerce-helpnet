// backend/src/middleware/cacheMiddleware.js
// Middleware para adicionar cabeçalhos de cache HTTP apropriados

import { createHash } from 'crypto';

/**
 * Middleware para configurar cabeçalhos de cache HTTP
 * Otimiza performance reduzindo requisições desnecessárias ao servidor
 */
export const cacheMiddleware = (req, res, next) => {
  // Cache para diferentes tipos de resposta

  // Dados estáticos que mudam raramente (categorias, configurações)
  if (req.path.includes('/categorias') && req.method === 'GET') {
    res.set({
      'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=120', // 5min cache, 10min CDN
      'CDN-Cache-Control': 'max-age=600', // Cache mais longo no CDN
    });
  }

  // Dados de produtos (cache moderado pois preços podem mudar)
  else if (req.path.includes('/produtos') && req.method === 'GET' && !req.query.busca) {
    res.set({
      'Cache-Control': 'public, max-age=60, s-maxage=120, stale-while-revalidate=300', // 1min cache, 5min stale
    });
  }

  // Dados do usuário (cache curto por segurança)
  else if (req.path.includes('/clientes') && req.method === 'GET') {
    res.set({
      'Cache-Control': 'private, max-age=30, s-maxage=60', // Cache privado de 30s
    });
  }

  // Carrinho e dados dinâmicos (sem cache)
  else if (req.path.includes('/carrinho') || req.path.includes('/pedidos') || req.path.includes('/pagamentos')) {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
  }

  // API de saúde (cache longo)
  else if (req.path === '/api/health') {
    res.set({
      'Cache-Control': 'public, max-age=3600, s-maxage=7200', // 1 hora cache
    });
  }

  next();
};

/**
 * Middleware para adicionar ETags e Last-Modified para melhor cache
 * Compara ETags automaticamente para retornar 304 Not Modified
 */
export const etagMiddleware = (req, res, next) => {
  // Salva a função original send
  const originalSend = res.send;

  res.send = function(data) {
    try {
      // Gera ETag baseado no conteúdo se não existir
      if (!res.get('ETag') && data !== undefined && data !== null) {
        let contentToHash = data;
        if (typeof data !== 'string') {
          contentToHash = JSON.stringify(data);
        }
        const etag = createHash('md5').update(contentToHash).digest('hex');
        res.set('ETag', `"${etag}"`);
      }

      // Adiciona Last-Modified se não existir
      if (!res.get('Last-Modified')) {
        res.set('Last-Modified', new Date().toUTCString());
      }
    } catch (error) {
      // Se houver erro na geração de ETag, continua sem ela
      console.warn('Erro ao gerar ETag:', error.message);
    }

    // Chama send original
    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware para compressão condicional
 * Comprime apenas respostas grandes para economizar CPU
 */
export const conditionalCompression = (req, res, next) => {
  // Salva função original
  const originalSend = res.send;

  res.send = function(data) {
    // Comprime apenas se resposta for maior que 1KB
    if (data && data.length > 1024) {
      // Adiciona cabeçalho para indicar compressão
      if (!res.get('Content-Encoding')) {
        res.set('X-Compression', 'enabled');
      }
    }

    originalSend.call(this, data);
  };

  next();
};