import { AuthService } from '../services/auth.service.js';
import { AppError } from '../utils/response.js';

/**
 * Required authentication middleware.
 * Verifies Bearer JWT token in Authorization header.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing or malformed Authorization header.', 401, 'UNAUTHORIZED'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication middleware.
 * If token is present, verifies and populates req.user. If absent, allows request as guest.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    req.token = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    req.token = token;
    next();
  } catch {
    // If token is invalid in optional mode, treat as unauthenticated guest
    req.user = null;
    req.token = null;
    next();
  }
}
