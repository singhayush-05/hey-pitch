import mongoose from 'mongoose';
import crypto from 'crypto';

export const PAYMENT_STATUSES = [
  'requires_payment_method',
  'processing',
  'succeeded',
  'failed',
  'cancelled'
];

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    provider: {
      type: String,
      default: 'unconfigured'
    },
    providerPaymentId: {
      type: String,
      default: null,
      index: true,
      sparse: true
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'requires_payment_method',
      index: true
    },
    idempotencyKey: {
      type: String,
      default: null,
      index: true,
      sparse: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.pre('validate', function (next) {
  if (!this.paymentId) {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.paymentId = `PAY-${randomHex}`;
  }
  next();
});

export const Payment = mongoose.model('Payment', paymentSchema);
