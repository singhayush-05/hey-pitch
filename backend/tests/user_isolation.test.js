import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { AuthService } from '../src/services/auth.service.js';
import { OrderService } from '../src/services/order.service.js';

describe('User Space Isolation — Cart & Orders Security', () => {
  const userA = { _id: '60d5ecb8b5c9c82b9c8b4111', userId: '60d5ecb8b5c9c82b9c8b4111', email: 'user_a@heypitch.in', role: 'client' };
  const userB = { _id: '60d5ecb8b5c9c82b9c8b4222', userId: '60d5ecb8b5c9c82b9c8b4222', email: 'user_b@heypitch.in', role: 'client' };
  const admin = { _id: '60d5ecb8b5c9c82b9c8b4999', userId: '60d5ecb8b5c9c82b9c8b4999', email: 'admin@heypitch.in', role: 'admin' };

  const tokenA = AuthService.generateToken(userA);
  const tokenB = AuthService.generateToken(userB);
  const tokenAdmin = AuthService.generateToken(admin);

  let orderA;

  it('allows User A to create an order associated with User A', async () => {
    orderA = await OrderService.createOrder({
      user: userA,
      customerEmail: userA.email,
      styleId: 'pulse',
      qty: 1,
      footageLink: 'https://drive.google.com/file/d/testuserA/view?usp=sharing',
      footageDownloadOk: true
    });

    assert.ok(orderA);
    assert.ok(orderA.orderId);
    assert.equal(orderA.customerEmail, userA.email);
  });

  it('User A can successfully retrieve their own order', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${orderA.orderId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.order.orderId, orderA.orderId);
  });

  it('rejects unauthenticated attempts to view User A order with 401 UNAUTHORIZED', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${orderA.orderId}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.error.code, 'UNAUTHORIZED');
  });

  it('rejects User B attempts to view User A order with 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${orderA.orderId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.error.code, 'FORBIDDEN');
  });

  it('rejects User B attempts to cancel or modify User A order with 403 FORBIDDEN', async () => {
    const resCancel = await request(app)
      .post(`/api/v1/orders/${orderA.orderId}/cancel`)
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(resCancel.status, 403);
    assert.equal(resCancel.body.error.code, 'FORBIDDEN');

    const resUpdate = await request(app)
      .patch(`/api/v1/orders/${orderA.orderId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ notes: 'Malicious modification attempt' });

    assert.equal(resUpdate.status, 403);
    assert.equal(resUpdate.body.error.code, 'FORBIDDEN');
  });

  it('User B dashboard does NOT include User A orders (strict query isolation)', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${tokenB}`);

    assert.equal(res.status, 200);
    const orders = res.body.data.orders;
    assert.ok(Array.isArray(orders));
    assert.ok(!orders.some(o => o.orderId === orderA.orderId));
  });

  it('User A dashboard includes User A order', async () => {
    const res = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${tokenA}`);

    assert.equal(res.status, 200);
    const orders = res.body.data.orders;
    assert.ok(Array.isArray(orders));
    assert.ok(orders.some(o => o.orderId === orderA.orderId));
  });

  it('Admin can view order with elevated operational access', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${orderA.orderId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.order.orderId, orderA.orderId);
  });
});
