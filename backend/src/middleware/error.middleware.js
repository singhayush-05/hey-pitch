import { AppError, errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

/**
 * 404 Not Found middleware for unmatched routes.
 */
export function notFoundHandler(req, res, next) {
  const err = new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
  next(err);
}

/**
 * Centralized application error handling middleware.
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected internal server error occurred';
  let details = err.details || null;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed for one or more fields';
    details = Object.keys(err.errors).map(field => ({
      field,
      message: err.errors[field].message
    }));
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID_FORMAT';
    message = `Invalid format for field '${err.path}': '${err.value}'`;
  }

  // Handle Mongo Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const fields = Object.keys(err.keyValue || {});
    message = `Duplicate value for field(s): ${fields.join(', ')}`;
    details = err.keyValue;
  }

  // Handle JSON parse error from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    code = 'MALFORMED_JSON';
    message = 'Invalid JSON payload in request body';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log error (redacted structured log)
  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      error: err.message,
      stack: config.isProduction ? undefined : err.stack,
      url: req.originalUrl,
      method: req.method
    });
  } else {
    logger.warn('Client request error', {
      statusCode,
      code,
      message,
      url: req.originalUrl
    });
  }

  // Don't leak stack traces in production
  return errorResponse(res, statusCode, code, message, details);
}
