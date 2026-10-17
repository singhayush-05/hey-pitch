import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { Order, ALLOWED_STATUS_TRANSITIONS } from '../src/models/order.model.js';

describe('Order Validation and State Transition Tests', () => {
  it('rejects order creation with missing or unsupported styleId', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ styleId: 'fictional_style', customerEmail: 'client@heypitch.in' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some(d => d.field === 'styleId'));
  });

  it('rejects order creation with invalid customer email', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ styleId: 'pulse', customerEmail: 'not-an-email-format' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some(d => d.field === 'customerEmail'));
  });

  it('rejects order creation with negative or non-integer quantity', async () => {
    const res = await request(app)
      .post('/api/v1/orders')
      .send({ styleId: 'pulse', customerEmail: 'client@heypitch.in', qty: -5 });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.some(d => d.field === 'qty'));
  });

  it('rejects order update attempts on immutable fields (pricing, status, styleId)', async () => {
    const res = await request(app)
      .patch('/api/v1/orders/HP-1234')
      .send({
        pricing: { total: 10 },
        status: 'paid'
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'IMMUTABLE_FIELD_MODIFICATION');
    assert.ok(res.body.error.message.includes('pricing'));
    assert.ok(res.body.error.message.includes('status'));
  });

  it('rejects empty update payloads with 400 EMPTY_UPDATE_PAYLOAD', async () => {
    const res = await request(app)
      .patch('/api/v1/orders/HP-1234')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'EMPTY_UPDATE_PAYLOAD');
  });

  it('enforces allowed order status transitions correctly', () => {
    const dummyOrder = new Order({
      orderId: 'HP-TEST01',
      customerEmail: 'test@heypitch.in',
      styleId: 'pulse',
      styleName: 'Pulse',
      qty: 1,
      pricing: { unitPrice: 39, subtotal: 39, total: 39 },
      status: 'pending_payment'
    });

    // Allowed from pending_payment: paid, cancelled
    assert.equal(dummyOrder.canTransitionTo('paid'), true);
    assert.equal(dummyOrder.canTransitionTo('cancelled'), true);
    assert.equal(dummyOrder.canTransitionTo('completed'), false);
    assert.equal(dummyOrder.canTransitionTo('in_production'), false);

    // From completed: no transitions allowed
    dummyOrder.status = 'completed';
    assert.equal(dummyOrder.canTransitionTo('cancelled'), false);
    assert.equal(dummyOrder.canTransitionTo('in_production'), false);
  });
});
