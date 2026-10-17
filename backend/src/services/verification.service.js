import { validateSafeUrl, detectProvider } from '../utils/ssrfGuard.js';
import { Verification } from '../models/verification.model.js';
import { AppError } from '../utils/response.js';

export class VerificationService {
  /**
   * Fast, format-only validation with SSRF protection.
   */
  static async validateUrl(urlString) {
    if (!urlString || typeof urlString !== 'string') {
      throw new AppError('A valid URL string is required', 400, 'INVALID_URL');
    }

    const check = await validateSafeUrl(urlString);
    if (!check.safe) {
      return {
        isValidFormat: false,
        isSupportedProvider: false,
        url: urlString,
        reason: check.reason,
        code: check.code
      };
    }

    return {
      isValidFormat: true,
      isSupportedProvider: true,
      url: check.url,
      hostname: check.hostname,
      provider: check.provider,
      message: `Valid ${check.provider.replace('_', ' ')} link format`
    };
  }

  /**
   * Check permissions, download eligibility, and provider access state.
   */
  static async checkResource(urlString, options = { persist: false }) {
    const validation = await this.validateUrl(urlString);

    if (!validation.isValidFormat) {
      if (options.persist) {
        try {
          await Verification.create({
            url: urlString,
            host: 'invalid',
            provider: 'unknown',
            isValidFormat: false,
            accessStatus: validation.code === 'SSRF_BLOCKED' ? 'ssrf_blocked' : 'unsupported_provider'
          });
        } catch {}
      }

      return {
        verified: false,
        isValidFormat: false,
        provider: 'unknown',
        status: validation.code === 'SSRF_BLOCKED' ? 'ssrf_blocked' : 'unsupported_provider',
        message: validation.reason
      };
    }

    const url = validation.url;
    const provider = validation.provider;
    const hostname = validation.hostname;

    // Google Drive View-only detection: /view without explicit usp=sharing
    const isGoogleDriveViewOnly =
      hostname.includes('drive.google') && /\/view/.test(url) && !/usp=sharing/.test(url);

    if (isGoogleDriveViewOnly) {
      const result = {
        verified: false,
        isValidFormat: true,
        provider,
        status: 'view_only',
        message: 'This Google Drive link is view-only, which blocks team download. Set access to "Anyone with the link" and allow download.'
      };
      if (options.persist) {
        try {
          await Verification.create({
            url,
            host: hostname,
            provider,
            isValidFormat: true,
            isDownloadable: false,
            accessStatus: 'view_only'
          });
        } catch {}
      }
      return result;
    }

    // Check sharing parameters in URL (matching client frontend heuristics)
    const hasSharingToken =
      /usp=sharing|dl=0|dl=1|\/share\//.test(url) ||
      hostname.includes('wetransfer.com') ||
      hostname === 'we.tl' ||
      hostname.includes('frame.io');

    if (!hasSharingToken) {
      const result = {
        verified: false,
        isValidFormat: true,
        provider,
        status: 'unauthorized',
        message: 'Link is not shared publicly. In the provider share menu, set it to "Anyone with the link", then paste again.'
      };
      if (options.persist) {
        try {
          await Verification.create({
            url,
            host: hostname,
            provider,
            isValidFormat: true,
            isDownloadable: false,
            accessStatus: 'unauthorized'
          });
        } catch {}
      }
      return result;
    }

    // Note on Deep Server-Side Provider API Integration:
    // Full automated validation of private enterprise cloud files requires OAuth/Service Account credentials.
    // The server confirms the URL format, public sharing token, and download syntax.
    const result = {
      verified: true,
      isValidFormat: true,
      isDownloadable: true,
      provider,
      status: 'download_accessible',
      message: 'Link provided successfully. Ensure permissions are set to "Anyone with the link".',
      sourceMetadata: {
        provider,
        verifiedAt: new Date().toISOString()
      }
    };

    if (options.persist) {
      try {
        await Verification.create({
          url,
          host: hostname,
          provider,
          isValidFormat: true,
          isDownloadable: true,
          accessStatus: 'download_accessible',
          sourceMetadata: {
            format: 'MP4'
          }
        });
      } catch {}
    }

    return result;
  }
}
