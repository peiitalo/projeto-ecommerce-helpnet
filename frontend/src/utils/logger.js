// frontend/src/utils/logger.js
// Lightweight browser logger with structured console output

const env = import.meta?.env?.MODE || 'development';
const app = 'frontend';

const safe = (obj) => {
  try { return obj; } catch { return undefined; }
};

const base = (level, msg, meta = {}) => {
  const payload = { app, level, time: new Date().toISOString(), msg, ...safe(meta) };
  const line = `${payload.time} [${payload.level.toUpperCase()}] ${payload.msg}`;
  if (level === 'error') console.error(line, payload);
  else if (level === 'warn') console.warn(line, payload);
  else if (level === 'info') console.info(line, payload);
  else console.debug(line, payload);
};

export const log = {
  debug: (msg, meta) => base('debug', msg, meta),
  info: (msg, meta) => base('info', msg, meta),
  warn: (msg, meta) => base('warn', msg, meta),
  error: (msg, meta) => base('error', msg, meta),
};

export default log;