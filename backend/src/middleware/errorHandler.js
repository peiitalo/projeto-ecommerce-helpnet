// backend/src/middleware/errorHandler.js
// Middleware centralizado de erros e 404, com logging estruturado e respostas consistentes

import { logger } from '../utils/logger.js';

/**
 * Normaliza mensagens de erro para o cliente (evitando vazamento de detalhes sensíveis).
 * @param {unknown} err Objeto de erro
 * @returns {string} mensagem segura para o cliente
 */
function sanitizeErrorMessage(err) {
  if (!err) return 'Erro interno do servidor';
  const msg = typeof err?.message === 'string' ? err.message : 'Erro interno do servidor';

  // Evita expor detalhes técnicos em produção
  if (process.env.NODE_ENV === 'production') {
    // Mapeia mensagens comuns para respostas genéricas
    if (/jwt|token|auth|unauthor/i.test(msg)) return 'Não autorizado';
    if (/forbidden|permission/i.test(msg)) return 'Acesso negado';
    if (/not found|no such|does not exist/i.test(msg)) return 'Recurso não encontrado';
    return 'Erro interno do servidor';
  }

  // Em dev, retornamos a mensagem original para facilitar debugging
  return msg;
}

/**
 * Mapeia erros conhecidos (ex.: ORM, validação) para códigos HTTP adequados.
 * @param {unknown} err
 * @returns {number} status HTTP sugerido
 */
function mapStatusCode(err) {
  // Prisma/ORM constraints (ex.: unique violation)
  if (err?.code === 'P2002') return 400; // conflito de chave única
  if (err?.code === 'P2025') return 404; // registro não encontrado

  // Erros de autenticação/autorização
  if (err?.name === 'UnauthorizedError') return 401;

  // Se o controlador já definiu o status, respeite
  if (typeof err?.status === 'number') return err.status;

  // Default
  return 500;
}

/**
 * Middleware 404 para rotas não encontradas.
 */
export function notFound(req, res, next) {
  // Loga com contexto (rota não mapeada)
  logger.warn('route_not_found', {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
  });

  return res.status(404).json({
    success: false,
    errors: ['Rota não encontrada'],
  });
}

/**
 * Middleware centralizado de tratamento de erros.
 * - Loga o erro com contexto
 * - Padroniza a resposta ao cliente
 * - Evita vazar detalhes sensíveis em produção
 */
export function errorHandler(err, req, res, next) {
  const status = mapStatusCode(err);
  const message = sanitizeErrorMessage(err);

  // Log estruturado do erro
  logger.error('unhandled_error', {
    status,
    error: {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      stack: process.env.NODE_ENV === 'production' ? undefined : err?.stack,
    },
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    // body é sanitizado dentro do logger util
    body: req.body,
  });

  // Resposta padronizada
  return res.status(status).json({
    success: false,
    errors: [message],
    ...(process.env.NODE_ENV !== 'production' && err?.stack ? { stack: err.stack } : {}),
  });
}