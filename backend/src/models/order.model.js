import mongoose from 'mongoose';
import crypto from 'crypto';

export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'intake_received',
  'in_production',
  'review_ready',
  'completed',
  'cancelled'
];

// Valid state transitions
export const ALLOWED_STATUS_TRANSITIONS = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['intake_received', 'in_production', 'cancelled'],
  intake_received: ['in_production', 'cancelled'],
  in_production: ['review_ready'],
  review_ready: ['completed', 'in_production'],
  completed: [],
  cancelled: []
};

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
      index: true
    },
    customerCompany: {
      type: String,
      trim: true,
      default: ''
    },
    styleId: {
      type: String,
      required: [true, 'Style ID is required'],
      trim: true
    },
    styleName: {
      type: String,
      required: true
    },
    len: {
      type: String,
      enum: ['s60', 's90'],
      default: 's60'
    },
    qty: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    purpose: {
      type: String,
      enum: ['branding', 'ads', 'vsl', 'content', 'product', 'other'],
      default: 'branding'
    },
    sameStyle: {
      type: Boolean,
      default: true
    },
    revision: {
      type: Boolean,
      default: false
    },
    avatarMode: {
      type: String,
      enum: ['talking', 'walking', 'photo', 'have'],
      default: null
    },
    footageLink: {
      type: String,
      trim: true,
      default: ''
    },
    footageDownloadOk: {
      type: Boolean,
      default: false
    },
    brandKitLink: {
      type: String,
      trim: true,
      default: ''
    },
    handles: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    script: {
      type: String,
      trim: true,
      default: ''
    },
    oneThing: {
      type: String,
      trim: true,
      default: ''
    },
    pricing: {
      currency: { type: String, default: 'USD' },
      unitPrice: { type: Number, required: true },
      subtotal: { type: Number, required: true },
      discountTotal: { type: Number, default: 0 },
      revisionTotal: { type: Number, default: 0 },
      buildFeeTotal: { type: Number, default: 0 },
      total: { type: Number, required: true }
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending_payment',
      index: true
    },
    isTrial: {
      type: Boolean,
      default: false
    },
    trialRemoveWatermark: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      enum: ['order', 'call', 'trial'],
      default: 'order'
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    }
  },
  {
    timestamps: true
  }
);

/**
 * Generate unique opaque order ID before validation if not already set.
 */
orderSchema.pre('validate', function (next) {
  if (!this.orderId) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.orderId = `HP-${randomHex}`;
  }
  next();
});

/**
 * Method to check if transition to nextStatus is allowed.
 */
orderSchema.methods.canTransitionTo = function (nextStatus) {
  const allowed = ALLOWED_STATUS_TRANSITIONS[this.status] || [];
  return allowed.includes(nextStatus);
};

export const Order = mongoose.model('Order', orderSchema);
