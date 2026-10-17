import { VerificationService } from '../services/verification.service.js';
import { successResponse } from '../utils/response.js';

export class VerificationController {
  /**
   * POST /api/v1/verification/validate-url
   * Fast format and provider validation with SSRF protection.
   */
  static async validateUrl(req, res, next) {
    try {
      const { url } = req.body;
      const result = await VerificationService.validateUrl(url);
      return successResponse(res, 200, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/verification/check
   * Deep permission, sharing, and downloadability inspection.
   */
  static async checkResource(req, res, next) {
    try {
      const { url } = req.body;
      const result = await VerificationService.checkResource(url, { persist: true });
      return successResponse(res, 200, result);
    } catch (err) {
      next(err);
    }
  }
}
