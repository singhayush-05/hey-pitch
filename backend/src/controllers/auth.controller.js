import { AuthService } from '../services/auth.service.js';
import { successResponse } from '../utils/response.js';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  static async register(req, res, next) {
    try {
      const { email, password, name, company } = req.body;
      const result = await AuthService.register({ email, password, name, company });
      return successResponse(res, 201, result, 'User registered successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      return successResponse(res, 200, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getCurrentUser(req.user.userId);
      return successResponse(res, 200, { user });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(req, res, next) {
    try {
      const result = await AuthService.logout(req.token);
      return successResponse(res, 200, result, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }
}
