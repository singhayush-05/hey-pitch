import { AppError } from '../utils/response.js';
import { STYLES } from '../services/pricing.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_PURPOSES = ['branding', 'ads', 'vsl', 'content', 'product', 'other'];
const ALLOWED_AVATAR_MODES = ['talking', 'walking', 'photo', 'have'];
const ALLOWED_LENS = ['s60', 's90'];

export function validateCreateOrder(req, res, next) {
  const { styleId, customerEmail, qty, len, purpose, avatarMode } = req.body || {};
  const errors = [];

  if (!styleId || !STYLES[styleId]) {
    errors.push({
      field: 'styleId',
      message: `Invalid or missing styleId. Must be one of: ${Object.keys(STYLES).join(', ')}`
    });
  }

  // If user is authenticated, customerEmail can fallback to user.email
  const effectiveEmail = customerEmail || (req.user && req.user.email);
  if (!effectiveEmail || !EMAIL_REGEX.test(effectiveEmail.trim())) {
    errors.push({ field: 'customerEmail', message: 'Valid customer email is required' });
  } else if (!customerEmail && req.user) {
    req.body.customerEmail = req.user.email;
  }

  if (qty !== undefined) {
    const parsedQty = Number(qty);
    if (!Number.isInteger(parsedQty) || parsedQty < 1 || parsedQty > 100) {
      errors.push({ field: 'qty', message: 'Quantity must be an integer between 1 and 100' });
    }
  }

  if (len !== undefined && !ALLOWED_LENS.includes(len)) {
    errors.push({ field: 'len', message: `Invalid duration tier 'len'. Allowed: ${ALLOWED_LENS.join(', ')}` });
  }

  if (purpose !== undefined && !ALLOWED_PURPOSES.includes(purpose)) {
    errors.push({ field: 'purpose', message: `Invalid purpose. Allowed: ${ALLOWED_PURPOSES.join(', ')}` });
  }

  if (avatarMode !== undefined && !ALLOWED_AVATAR_MODES.includes(avatarMode)) {
    errors.push({ field: 'avatarMode', message: `Invalid avatarMode. Allowed: ${ALLOWED_AVATAR_MODES.join(', ')}` });
  }

  const selectedStyle = styleId ? STYLES[styleId] : null;
  if (selectedStyle && (selectedStyle.fam === 'cut' || selectedStyle.fam === 'clip' || selectedStyle.fam === 'motion')) {
    const { footageLink } = req.body || {};
    if (!footageLink || typeof footageLink !== 'string' || !footageLink.trim()) {
      errors.push({
        field: 'footageLink',
        message: 'A valid footage link (Google Drive, Dropbox, etc.) is required for this video style'
      });
    }
  }

  if (errors.length > 0) {
    return next(new AppError('Invalid order parameters', 400, 'VALIDATION_ERROR', errors));
  }

  next();
}

export function validateUpdateOrder(req, res, next) {
  const body = req.body || {};
  const prohibitedFields = ['orderId', '_id', 'status', 'pricing', 'styleId', 'styleName', 'qty', 'user'];
  const presentProhibited = prohibitedFields.filter(f => body[f] !== undefined);

  if (presentProhibited.length > 0) {
    return next(
      new AppError(
        `Direct modification of fields [${presentProhibited.join(', ')}] is prohibited.`,
        400,
        'IMMUTABLE_FIELD_MODIFICATION'
      )
    );
  }

  const allowedFields = ['notes', 'brandKitLink', 'handles', 'footageLink', 'script', 'oneThing'];
  const hasAllowedField = allowedFields.some(f => body[f] !== undefined);

  if (!hasAllowedField) {
    return next(
      new AppError(
        `Update payload must include at least one permitted field: ${allowedFields.join(', ')}`,
        400,
        'EMPTY_UPDATE_PAYLOAD'
      )
    );
  }

  next();
}
