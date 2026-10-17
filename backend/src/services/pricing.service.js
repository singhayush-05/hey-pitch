/**
 * Authoritative Server-side Pricing Engine for HeyPitch.
 * Replicates the exact commercial configuration and pricing formulas
 * from the client-approved frontend specifications.
 */

export const CURRENCIES = {
  USD: { symbol: '$', rate: 1, round: 1 },
  GBP: { symbol: '£', rate: 0.79, round: 1 },
  EUR: { symbol: '€', rate: 0.92, round: 1 },
  AED: { symbol: 'AED ', rate: 3.67, round: 5 },
  INR: { symbol: '₹', rate: 84, round: 50 }
};

export const DURATION_TIERS = {
  s60: { id: 's60', label: 'Up to 60 sec', mult: 1 },
  s90: { id: 's90', label: 'Up to 90 sec', mult: 1.35 }
};

export const QUANTITY_DISCOUNTS = {
  1: 0,
  5: 0.08,
  10: 0.15,
  20: 0.22
};

export const REVISION_ADDON_RATE = 0.35;
export const TRIAL_CONFIG = {
  seconds: 15,
  removeLogoPriceUsd: 12,
  enabled: true
};

export const STYLES = {
  // Cut
  plain: { id: 'plain', name: 'Plain', price: 30, fam: 'cut', shortform: true },
  pulse: { id: 'pulse', name: 'Pulse', price: 39, fam: 'cut', shortform: true },
  stamp: { id: 'stamp', name: 'Stamp', price: 45, fam: 'cut', shortform: true },
  quiet: { id: 'quiet', name: 'Quiet', price: 45, fam: 'cut', shortform: true },
  note: { id: 'note', name: 'Note', price: 30, fam: 'cut', shortform: true },
  // Clip
  moment: { id: 'moment', name: 'Moment', price: 35, fam: 'clip', shortform: true },
  karaoke: { id: 'karaoke', name: 'Karaoke', price: 39, fam: 'clip', shortform: true },
  behindbig: { id: 'behindbig', name: 'Loud', price: 45, fam: 'clip', shortform: true },
  stage: { id: 'stage', name: 'Stage', price: 45, fam: 'clip', shortform: true },
  // Motion
  signal: { id: 'signal', name: 'Signal', price: 120, fam: 'motion', shortform: true },
  ledger: { id: 'ledger', name: 'Ledger', price: 140, fam: 'motion', shortform: true },
  promo: { id: 'promo', name: 'Promo', price: 190, fam: 'motion', shortform: true },
  neon: { id: 'neon', name: 'Neon', price: 130, fam: 'motion', shortform: true },
  reel: { id: 'reel', name: 'Faceless', price: 110, fam: 'motion', shortform: true },
  hookad: { id: 'hookad', name: 'Hook', price: 160, fam: 'motion', shortform: true },
  // Built
  twin: { id: 'twin', name: 'Twin', price: 49, fam: 'built', shortform: false, build: 190, kind: 'avatar' },
  explain: { id: 'explain', name: 'Explain', price: 1200, fam: 'built', shortform: false, kind: 'explainer', call: true },
  film: { id: 'film', name: 'Film', price: 390, fam: 'built', shortform: false, kind: 'genai', call: true }
};

export const PACKS = {
  single: { name: 'Single', price: null, credits: 1 },
  ten: { name: 'Ten', price: 1190, credits: 10 },
  thirty: { name: 'Thirty', price: 3290, credits: 30 }
};

export class PricingService {
  /**
   * Find style by id.
   */
  static getStyle(styleId) {
    return STYLES[styleId] || null;
  }

  /**
   * Calculate unit price at given length tier (before quantity discounts).
   */
  static getStyleUnit(style, lenId = 's60') {
    if (!style.shortform) {
      return style.price;
    }
    const tier = DURATION_TIERS[lenId] || DURATION_TIERS.s60;
    return Math.round(style.price * tier.mult);
  }

  /**
   * Calculate discounted unit price based on volume quantity.
   */
  static getDiscountedUnitPrice(style, qty = 1, lenId = 's60') {
    const discount = QUANTITY_DISCOUNTS[qty] || 0;
    const base = this.getStyleUnit(style, lenId);
    return Math.round(base * (1 - discount));
  }

  /**
   * Calculate total order price and item breakdown authoritatively on the server.
   */
  static calculateOrderPricing({
    styleId,
    qty = 1,
    len = 's60',
    revision = false,
    avatarMode = 'talking',
    isTrial = false,
    trialRemoveWatermark = false,
    currency = 'USD'
  }) {
    const style = this.getStyle(styleId);
    if (!style) {
      throw new Error(`Invalid style identifier: '${styleId}'`);
    }

    if (!Number.isInteger(qty) || qty < 1) {
      throw new Error(`Quantity must be a positive integer, received: ${qty}`);
    }

    // Free trial calculation
    if (isTrial) {
      const total = trialRemoveWatermark ? TRIAL_CONFIG.removeLogoPriceUsd : 0;
      return {
        styleId: style.id,
        styleName: style.name,
        qty: 1,
        len: 's60',
        unitPrice: 0,
        subtotal: 0,
        discountTotal: 0,
        revisionTotal: 0,
        buildFeeTotal: 0,
        total,
        currency,
        isTrial: true,
        trialRemoveWatermark
      };
    }

    // Base unit price at duration tier
    const baseUnit = this.getStyleUnit(style, len);
    const discountedUnit = this.getDiscountedUnitPrice(style, qty, len);
    const subtotal = discountedUnit * qty;
    const undiscountedSubtotal = baseUnit * qty;
    const discountTotal = undiscountedSubtotal - subtotal;

    // Revision add-on: 35% of base unit price per video
    let revisionTotal = 0;
    if (revision) {
      const revPerUnit = Math.round(baseUnit * REVISION_ADDON_RATE);
      revisionTotal = revPerUnit * qty;
    }

    // One-time avatar build fee
    let buildFeeTotal = 0;
    if (style.kind === 'avatar' && avatarMode !== 'have' && style.build) {
      buildFeeTotal = style.build;
    }

    const total = subtotal + revisionTotal + buildFeeTotal;

    return {
      styleId: style.id,
      styleName: style.name,
      qty,
      len: style.shortform ? len : undefined,
      baseUnit,
      unitPrice: discountedUnit,
      undiscountedSubtotal,
      subtotal,
      discountTotal,
      revisionTotal,
      buildFeeTotal,
      total,
      currency,
      isTrial: false
    };
  }

  /**
   * Converts USD price into regional currency using client rounding rules.
   */
  static convertCurrency(usdAmount, currencyCode = 'USD') {
    const c = CURRENCIES[currencyCode] || CURRENCIES.USD;
    let converted = usdAmount * c.rate;
    converted = Math.round(converted / c.round) * c.round;
    return {
      amount: converted,
      symbol: c.symbol,
      currency: currencyCode,
      formatted: `${c.symbol}${converted.toLocaleString('en-US')}`
    };
  }
}
