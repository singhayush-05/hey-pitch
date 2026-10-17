import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Geo IP Currency Detection Endpoint', () => {
  it('GET /api/v1/geo/lookup returns 200 with country and currency data', async () => {
    const res = await request(app).get('/api/v1/geo/lookup');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.country);
    assert.ok(res.body.data.currency);
    assert.ok(res.body.data.symbol);
  });

  it('GET /api/v1/geo/lookup respects CF-IPCountry header', async () => {
    const res = await request(app)
      .get('/api/v1/geo/lookup')
      .set('cf-ipcountry', 'GB');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.country, 'GB');
    assert.equal(res.body.data.currency, 'GBP');
    assert.equal(res.body.data.symbol, '£');
  });

  it('GET /api/v1/geo/lookup maps IN to INR', async () => {
    const res = await request(app)
      .get('/api/v1/geo/lookup')
      .set('cf-ipcountry', 'IN');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.country, 'IN');
    assert.equal(res.body.data.currency, 'INR');
    assert.equal(res.body.data.symbol, '₹');
  });

  it('GET /api/v1/geo/lookup maps AE to AED', async () => {
    const res = await request(app)
      .get('/api/v1/geo/lookup')
      .set('cf-ipcountry', 'AE');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.country, 'AE');
    assert.equal(res.body.data.currency, 'AED');
    assert.equal(res.body.data.symbol, 'AED ');
  });

  it('GET /api/v1/geo/lookup defaults unknown country to USD', async () => {
    const res = await request(app)
      .get('/api/v1/geo/lookup')
      .set('cf-ipcountry', 'ZZ');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.country, 'ZZ');
    assert.equal(res.body.data.currency, 'USD');
    assert.equal(res.body.data.symbol, '$');
  });
});
