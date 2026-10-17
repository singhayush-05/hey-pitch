import { successResponse } from '../utils/response.js';

const GEO_TO_CURRENCY = {
  US: { currency: 'USD', symbol: '$' },
  GB: { currency: 'GBP', symbol: '£' },
  UK: { currency: 'GBP', symbol: '£' },
  AU: { currency: 'USD', symbol: '$' },
  AE: { currency: 'AED', symbol: 'AED ' },
  SA: { currency: 'AED', symbol: 'AED ' },
  IN: { currency: 'INR', symbol: '₹' },
  DE: { currency: 'EUR', symbol: '€' },
  FR: { currency: 'EUR', symbol: '€' },
  ES: { currency: 'EUR', symbol: '€' },
  IT: { currency: 'EUR', symbol: '€' },
  NL: { currency: 'EUR', symbol: '€' },
  IE: { currency: 'EUR', symbol: '€' },
  EU: { currency: 'EUR', symbol: '€' }
};

export class GeoController {
  /**
   * GET /api/v1/geo/lookup
   * Automatically resolves client IP into country and corresponding local currency.
   */
  static async getClientGeo(req, res, next) {
    try {
      let country = (req.headers['cf-ipcountry'] || req.headers['x-country-code'] || '').toUpperCase();
      let ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';

      // If country header not provided or placeholder, resolve via external IP lookup
      if (!country || country === 'XX') {
        try {
          const apiRes = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(2000) });
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data.country) country = data.country.toUpperCase();
            if (data.ip && (!ip || ip === '127.0.0.1' || ip === '::1')) ip = data.ip;
          }
        } catch {
          // Fallback to default
        }
      }

      country = country || 'US';
      const mapping = GEO_TO_CURRENCY[country] || { currency: 'USD', symbol: '$' };

      return successResponse(res, 200, {
        country,
        currency: mapping.currency,
        symbol: mapping.symbol,
        ip
      }, 'Geo location and local currency resolved');
    } catch (err) {
      next(err);
    }
  }
}
