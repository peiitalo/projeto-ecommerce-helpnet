// backend/src/utils/logger.js
// Lightweight structured logger for production-friendly logs without external deps

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const CURRENT_LEVEL = process.env.LOG_LEVEL?.toLowerCase() || 'info';
const THRESHOLD = LEVELS[CURRENT_LEVEL] ?? LEVELS.info;

const toPlainObject = (obj) => {
  try {
    if (!obj) return undefined;
    if (obj instanceof Error) {
      return { message: obj.message, name: obj.name, stack: obj.stack, code: obj.code };
    }
    return obj;
  } catch {
    return undefined;
  }
};

const baseLog = (level, msg, meta) => {
  if ((LEVELS[level] ?? 999) < THRESHOLD) return;
  const entry = {
    level,
    time: new Date().toISOString(),
    msg,
    ...toPlainObject(meta),
  };
  const line = JSON.stringify(entry);
  // Map level to console method
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else if (level === 'info') console.info(line);
  else console.debug(line);
};

export const logger = {
  debug: (msg, meta) => baseLog('debug', msg, meta),
  info: (msg, meta) => baseLog('info', msg, meta),
  warn: (msg, meta) => baseLog('warn', msg, meta),
  error: (msg, meta) => baseLog('error', msg, meta),
};

// Express middleware to log requests and response times
export const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  const { method, originalUrl } = req;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  logger.info('http_request_start', { method, url: originalUrl, ip });
  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = Math.round(durationNs / 1e6);
    logger.info('http_request_end', {
      method,
      url: originalUrl,
      status: res.statusCode,
      duration_ms: durationMs,
      ip,
    });
  });
  next();
};

// Error logging helper for controllers
export const logControllerError = (tag, error, req, extra = {}) => {
  const safeBody = (() => {
    try {
      if (!req?.body) return undefined;
      const { senha, password, Senha, SenhaHash, CPF_CNPJ, cpf, cnpj, token, ...rest } = req.body;
      return rest;
    } catch {
      return undefined;
    }
  })();

  logger.error(tag, {
    error: toPlainObject(error),
    method: req?.method,
    url: req?.originalUrl,
    params: req?.params,
    query: req?.query,
    body: safeBody,
    ...extra,
  });
};

export default logger;