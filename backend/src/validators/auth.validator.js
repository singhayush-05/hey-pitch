import { AppError } from '../utils/response.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'Valid email address is required' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
  }

  if (errors.length > 0) {
    return next(new AppError('Invalid registration parameters', 400, 'VALIDATION_ERROR', errors));
  }

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'Valid email address is required' });
  }

  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return next(new AppError('Invalid login parameters', 400, 'VALIDATION_ERROR', errors));
  }

  next();
}
