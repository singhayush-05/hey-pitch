import { AppError } from '../utils/response.js';

export function validateVerificationUrl(req, res, next) {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string' || !url.trim()) {
    return next(new AppError('A valid "url" string is required in the request body', 400, 'MISSING_URL'));
  }

  next();
}
