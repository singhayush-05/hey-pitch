import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PricingService, STYLES, CURRENCIES } from '../src/services/pricing.service.js';

describe('PricingService — Authoritative Pricing Engine', () => {
  it('correctly calculates base single shortform item at s60 tier', () => {
    const pricing = PricingService.calculateOrderPricing({
      styleId: 'pulse',
      qty: 1,
      len: 's60'
    });
    assert.equal(pricing.styleId, 'pulse');
    assert.equal(pricing.qty, 1);
    assert.equal(pricing.baseUnit, 39);
    assert.equal(pricing.unitPrice, 39);
    assert.equal(pricing.subtotal, 39);
    assert.equal(pricing.discountTotal, 0);
    assert.equal(pricing.revisionTotal, 0);
    assert.equal(pricing.buildFeeTotal, 0);
    assert.equal(pricing.total, 39);
  });

  it('correctly scales price for s90 duration tier (1.35x)', () => {
    // Pulse at s90: Math.round(39 * 1.35) = Math.round(52.65) = 53
    const pricing = PricingService.calculateOrderPricing({
      styleId: 'pulse',
      qty: 1,
      len: 's90'
    });
    assert.equal(pricing.baseUnit, 53);
    assert.equal(pricing.total, 53);
  });

  it('applies tiered volume discounts for qty 5 (8%), 10 (15%), 20 (22%)', () => {
    // Plain (30 at s60)
    // Qty 5: unit price = Math.round(30 * 0.92) = 28. Subtotal = 28 * 5 = 140
    const p5 = PricingService.calculateOrderPricing({ styleId: 'plain', qty: 5, len: 's60' });
    assert.equal(p5.unitPrice, 28);
    assert.equal(p5.subtotal, 140);
    assert.equal(p5.total, 140);

    // Qty 10: unit price = Math.round(30 * 0.85) = 26. Subtotal = 26 * 10 = 260
    const p10 = PricingService.calculateOrderPricing({ styleId: 'plain', qty: 10, len: 's60' });
    assert.equal(p10.unitPrice, 26);
    assert.equal(p10.subtotal, 260);

    // Qty 20: unit price = Math.round(30 * 0.78) = 23. Subtotal = 23 * 20 = 460
    const p20 = PricingService.calculateOrderPricing({ styleId: 'plain', qty: 20, len: 's60' });
    assert.equal(p20.unitPrice, 23);
    assert.equal(p20.subtotal, 460);
  });

  it('applies revision add-on (+35% of base unit price per video)', () => {
    // Pulse at s60: baseUnit = 39. Revision = Math.round(39 * 0.35) = 14 per video.
    // Qty 1: total = 39 + 14 = 53
    const p1 = PricingService.calculateOrderPricing({
      styleId: 'pulse',
      qty: 1,
      len: 's60',
      revision: true
    });
    assert.equal(p1.revisionTotal, 14);
    assert.equal(p1.total, 53);

    // Qty 5: subtotal = 36 * 5 = 180 (39 * 0.92 = 35.88 -> 36). Revision = 14 * 5 = 70. Total = 250
    const p5 = PricingService.calculateOrderPricing({
      styleId: 'pulse',
      qty: 5,
      len: 's60',
      revision: true
    });
    assert.equal(p5.revisionTotal, 70);
    assert.equal(p5.total, p5.subtotal + 70);
  });

  it('adds one-time avatar build fee unless avatarMode === have', () => {
    // Twin: price 49, build 190
    const withBuild = PricingService.calculateOrderPricing({
      styleId: 'twin',
      qty: 1,
      avatarMode: 'talking'
    });
    assert.equal(withBuild.buildFeeTotal, 190);
    assert.equal(withBuild.total, 239);

    const noBuild = PricingService.calculateOrderPricing({
      styleId: 'twin',
      qty: 1,
      avatarMode: 'have'
    });
    assert.equal(noBuild.buildFeeTotal, 0);
    assert.equal(noBuild.total, 49);
  });

  it('correctly calculates free trial orders ($0, or $12 to remove watermark)', () => {
    const trialFree = PricingService.calculateOrderPricing({
      styleId: 'pulse',
      isTrial: true,
      trialRemoveWatermark: false
    });
    assert.equal(trialFree.total, 0);
    assert.equal(trialFree.isTrial, true);

    const trialClean = PricingService.calculateOrderPricing({
      styleId: 'pulse',
      isTrial: true,
      trialRemoveWatermark: true
    });
    assert.equal(trialClean.total, 12);
  });

  it('rejects unsupported styles', () => {
    assert.throws(() => {
      PricingService.calculateOrderPricing({ styleId: 'non_existent_style' });
    }, /Invalid style identifier/);
  });

  it('correctly converts regional currencies with configured rounding rules', () => {
    // USD $100 -> GBP (0.79, round 1) -> £79
    const gbp = PricingService.convertCurrency(100, 'GBP');
    assert.equal(gbp.amount, 79);
    assert.equal(gbp.symbol, '£');

    // USD $100 -> EUR (0.92, round 1) -> €92
    const eur = PricingService.convertCurrency(100, 'EUR');
    assert.equal(eur.amount, 92);
    assert.equal(eur.symbol, '€');

    // USD $100 -> AED (3.67, round 5) -> 367 -> rounded to nearest 5 -> 365
    const aed = PricingService.convertCurrency(100, 'AED');
    assert.equal(aed.amount, 365);

    // USD $100 -> INR (84, round 50) -> 8400 -> rounded to 50 -> 8400
    const inr = PricingService.convertCurrency(100, 'INR');
    assert.equal(inr.amount, 8400);
    assert.equal(inr.symbol, '₹');
  });
});
