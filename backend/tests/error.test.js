import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('Centralized Error and Validation Handling', () => {
  it('returns 404 NOT_FOUND for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint-xyz');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.ok(res.body.error.message.includes('Route not found'));
  });

  it('returns 400 MALFORMED_JSON when invalid JSON is sent in body', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ "email": "broken-json,');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'MALFORMED_JSON');
  });

  it('rejects requests from disallowed CORS origins', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://unauthorized-malicious-site.com');

    // CORS error handler or blocked response
    assert.ok(res.status === 500 || res.status === 403 || res.headers['access-control-allow-origin'] === undefined);
  });

  it('returns 400 for verification endpoint when url is missing', async () => {
    const res = await request(app)
      .post('/api/v1/verification/validate-url')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'MISSING_URL');
  });

  it('returns 400 for verification check when url is missing', async () => {
    const res = await request(app)
      .post('/api/v1/verification/check')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'MISSING_URL');
  });
});
