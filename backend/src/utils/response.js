/**
 * Standardized API response format and AppError class.
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function successResponse(res, statusCode = 200, data = null, message = null, meta = null) {
  const response = {
    success: true,
    ...(message ? { message } : {}),
    ...(data !== null ? { data } : {}),
    ...(meta ? { meta } : {})
  };
  return res.status(statusCode).json(response);
}

export function errorResponse(res, statusCode = 500, code = 'INTERNAL_ERROR', message = 'An unexpected error occurred', details = null) {
  const response = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  };
  return res.status(statusCode).json(response);
}
