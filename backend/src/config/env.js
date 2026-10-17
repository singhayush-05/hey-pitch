import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env relative to backend root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

const PORT = parseInt(process.env.PORT, 10) || 5000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Parse comma-separated frontend origins
const rawOrigins = process.env.FRONTEND_ORIGINS || 'http://localhost:8080';
const FRONTEND_ORIGINS = rawOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const MONGODB_URI = process.env.MONGODB_URI || '';

const JWT_SECRET = process.env.JWT_SECRET || (isTest ? 'test_jwt_secret_min_32_chars_long_1234567890' : '');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;
const AUTH_RATE_LIMIT_MAX = parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 15;

const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'unconfigured';
const PAYMENT_PROVIDER_KEY = process.env.PAYMENT_PROVIDER_KEY || '';
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || '';

/**
 * Validates critical environment variables.
 * Fails clearly if critical variables are missing.
 */
export function validateEnv() {
  const missing = [];

  if (isProduction) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      missing.push('JWT_SECRET (must be at least 32 characters in production)');
    }
    if (!MONGODB_URI) {
      missing.push('MONGODB_URI');
    }
  }

  if (missing.length > 0) {
    const errorMsg = `[FATAL] Missing or invalid required environment variables: ${missing.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export const config = {
  env: NODE_ENV,
  isProduction,
  isTest,
  port: PORT,
  apiPrefix: API_PREFIX,
  frontendOrigins: FRONTEND_ORIGINS,
  mongodbUri: MONGODB_URI,
  jwt: {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRES_IN
  },
  rateLimit: {
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    authMax: AUTH_RATE_LIMIT_MAX
  },
  payment: {
    provider: PAYMENT_PROVIDER,
    key: PAYMENT_PROVIDER_KEY,
    webhookSecret: PAYMENT_WEBHOOK_SECRET
  }
};
