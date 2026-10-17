import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Health and Readiness Endpoints', () => {
  it('GET /api/v1/health returns 200 with liveness metadata', async () => {
    const res = await request(app).get('/api/v1/health');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ok');
    assert.ok(typeof res.body.data.uptime === 'number');
    assert.ok(res.body.data.timestamp);
    assert.equal(res.body.data.version, '1.0.0');
    // Ensure secrets are NOT exposed
    assert.equal(res.body.data.mongodbUri, undefined);
    assert.equal(res.body.data.jwtSecret, undefined);
  });

  it('GET /api/v1/ready reports database readiness status without exposing credentials', async () => {
    const res = await request(app).get('/api/v1/ready');

    // If database is not connected, ready returns 503; if connected, 200
    assert.ok(res.status === 200 || res.status === 503);
    const body = res.body;

    if (res.status === 200) {
      assert.equal(body.success, true);
      assert.equal(body.data.status, 'ready');
      assert.equal(body.data.database.connected, true);
    } else {
      assert.equal(body.success, false);
      assert.equal(body.error.code, 'SERVICE_NOT_READY');
      assert.equal(body.error.details.database.connected, false);
    }

    // Verify no connection string or credentials leaked
    const rawText = JSON.stringify(body);
    assert.ok(!rawText.includes('password'));
    assert.ok(!rawText.includes('mongodb://'));
  });

  it('GET / returns 200 with API discovery directory', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'online');
    assert.ok(res.body.endpoints.health);
    assert.ok(res.body.endpoints.orders);
  });
});
