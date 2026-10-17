import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { AuthService } from '../src/services/auth.service.js';

describe('Authentication & Token Security Tests', () => {
  it('hashes passwords securely using bcrypt with appropriate salt rounds', async () => {
    const rawPassword = 'SecurePassword123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.notEqual(hash, rawPassword);
    assert.ok(hash.startsWith('$2'));

    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.equal(isMatch, true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert.equal(isWrongMatch, false);
  });

  it('generates, verifies, and decodes signed JWT tokens', () => {
    const dummyUser = {
      _id: '60d5ecb8b5c9c82b9c8b4567',
      email: 'creator@heypitch.in',
      role: 'client'
    };

    const token = AuthService.generateToken(dummyUser);
    assert.ok(typeof token === 'string');
    assert.ok(token.length > 20);

    const decoded = AuthService.verifyToken(token);
    assert.equal(decoded.userId, dummyUser._id);
    assert.equal(decoded.email, dummyUser.email);
    assert.equal(decoded.role, dummyUser.role);
  });

  it('rejects tampered or forged JWT tokens with 401 INVALID_TOKEN', () => {
    const dummyUser = { _id: '123', email: 'test@heypitch.in', role: 'client' };
    const validToken = AuthService.generateToken(dummyUser);
    const forgedToken = validToken.slice(0, -5) + 'abcde';

    assert.throws(() => {
      AuthService.verifyToken(forgedToken);
    }, /Invalid authentication token signature/);
  });

  it('rejects registration with invalid email or short password (< 8 chars)', async () => {
    const invalidEmailRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'validPassword123' });

    assert.equal(invalidEmailRes.status, 400);
    assert.equal(invalidEmailRes.body.error.code, 'VALIDATION_ERROR');

    const shortPassRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'valid@heypitch.in', password: 'short' });

    assert.equal(shortPassRes.status, 400);
    assert.equal(shortPassRes.body.error.code, 'VALIDATION_ERROR');
  });

  it('rejects login with missing password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@heypitch.in' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('rejects unauthorized access to GET /api/v1/auth/me without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('invalidates token on logout and rejects subsequent usage', async () => {
    const dummyUser = { _id: '60d5ecb8b5c9c82b9c8b4567', email: 'user@heypitch.in', role: 'client' };
    const token = AuthService.generateToken(dummyUser);

    // Verify token works before logout
    const decodedBefore = AuthService.verifyToken(token);
    assert.equal(decodedBefore.email, 'user@heypitch.in');

    // Logout
    await AuthService.logout(token);

    // Verify token is now rejected as invalidated
    assert.throws(() => {
      AuthService.verifyToken(token);
    }, /Token has been invalidated/);
  });
});
