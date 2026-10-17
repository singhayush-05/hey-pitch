import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { UnconfiguredPaymentProvider } from '../src/integrations/payment/unconfiguredProvider.js';

describe('Payment Security and Provider Abstraction Tests', () => {
  it('rejects client attempts to submit payment amounts directly', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create')
      .send({ orderId: 'HP-1234', amount: 10 });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'CLIENT_AMOUNT_REJECTED');
  });

  it('rejects client attempts to spoof payment status', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create')
      .send({ orderId: 'HP-1234', status: 'succeeded' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'CLIENT_STATUS_REJECTED');
  });

  it('rejects payment creation with missing orderId', async () => {
    const res = await request(app)
      .post('/api/v1/payments/create')
      .send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'MISSING_ORDER_ID');
  });

  it('unconfigured payment provider cleanly throws 503 PAYMENT_PROVIDER_NOT_CONFIGURED', async () => {
    const provider = new UnconfiguredPaymentProvider();
    assert.equal(provider.getProviderName(), 'unconfigured');

    await assert.rejects(
      async () => {
        await provider.createPayment({});
      },
      (err) => {
        assert.equal(err.statusCode, 503);
        assert.equal(err.code, 'PAYMENT_PROVIDER_NOT_CONFIGURED');
        return true;
      }
    );
  });

  it('POST /api/v1/payments/webhook returns safe 503 when provider is unconfigured', async () => {
    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .send({ event: 'payment_intent.succeeded' });

    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, 'PAYMENT_PROVIDER_NOT_CONFIGURED');
    assert.ok(res.body.error.message.includes('unconfigured'));
  });
});
