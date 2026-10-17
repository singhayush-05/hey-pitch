import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { errorResponse } from '../utils/response.js';

/**
 * General API Rate Limiter
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
  handler: (req, res) => {
    return errorResponse(
      res,
      429,
      'TOO_MANY_REQUESTS',
      'Too many requests from this IP address, please try again later.'
    );
  }
});

/**
 * Stricter Rate Limiter for Authentication Endpoints
 */
export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.isTest,
  handler: (req, res) => {
    return errorResponse(
      res,
      429,
      'AUTH_RATE_LIMIT_EXCEEDED',
      'Too many authentication attempts, please try again in a few minutes.'
    );
  }
});
