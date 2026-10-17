/**
 * Structured server-side logger.
 * Formats logs with timestamps, levels, and redacts sensitive data
 * (passwords, tokens, authorization headers, credit cards, secrets).
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'jwt',
  'jwt_secret',
  'authorization',
  'cookie',
  'creditcard',
  'cardnumber',
  'cvv',
  'secret',
  'key',
  'payment_provider_key',
  'stripe_secret_key'
]);

function redact(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redact);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redact(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatLog(level, message, meta = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(meta ? { meta: redact(meta) } : {})
  };

  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? JSON.stringify(logEntry) : `[${timestamp}] [${level.toUpperCase()}]: ${message}${meta ? ' ' + JSON.stringify(redact(meta)) : ''}`;
}

export const logger = {
  info: (message, meta) => {
    console.log(formatLog('info', message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatLog('warn', message, meta));
  },
  error: (message, meta) => {
    console.error(formatLog('error', message, meta));
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog('debug', message, meta));
    }
  }
};
