import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ALLOWED_STATUS_TRANSITIONS } from '../models/order.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, '../../data/local_store.json');

class LocalStore {
  constructor() {
    this.data = {
      users: [],
      orders: [],
      payments: [],
      verifications: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch {
      this.data = { users: [], orders: [], payments: [], verifications: [] };
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write local database store:', err.message);
    }
  }

  // --- User Operations ---
  async findUserByEmail(email) {
    const normalized = email.toLowerCase().trim();
    const user = this.data.users.find(u => u.email === normalized);
    if (!user) return null;
    return this._wrapUser(user);
  }

  async findUserById(id) {
    const user = this.data.users.find(u => u._id === id);
    if (!user) return null;
    return this._wrapUser(user);
  }

  async createUser({ email, password, name = '', company = '', role = 'client' }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();

    const user = {
      _id: crypto.randomBytes(12).toString('hex'),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name.trim(),
      company: company.trim(),
      role,
      createdAt: now,
      updatedAt: now
    };

    this.data.users.push(user);
    this.save();
    return this._wrapUser(user);
  }

  _wrapUser(user) {
    return {
      ...user,
      comparePassword: async (candidate) => bcrypt.compare(candidate, user.password),
      toJSON: () => {
        const copy = { ...user };
        delete copy.password;
        return copy;
      }
    };
  }

  // --- Order Operations ---
  async createOrder(orderPayload) {
    const now = new Date().toISOString();
    const orderId = `HP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const _id = crypto.randomBytes(12).toString('hex');

    const order = {
      _id,
      orderId,
      user: orderPayload.user || null,
      customerEmail: orderPayload.customerEmail.toLowerCase().trim(),
      customerCompany: orderPayload.customerCompany || '',
      styleId: orderPayload.styleId,
      styleName: orderPayload.styleName,
      len: orderPayload.len || 's60',
      qty: orderPayload.qty || 1,
      purpose: orderPayload.purpose || 'branding',
      sameStyle: orderPayload.sameStyle !== false,
      revision: Boolean(orderPayload.revision),
      avatarMode: orderPayload.avatarMode || null,
      footageLink: orderPayload.footageLink || '',
      footageDownloadOk: Boolean(orderPayload.footageDownloadOk),
      brandKitLink: orderPayload.brandKitLink || '',
      handles: orderPayload.handles || '',
      notes: orderPayload.notes || '',
      script: orderPayload.script || '',
      oneThing: orderPayload.oneThing || '',
      pricing: orderPayload.pricing,
      status: orderPayload.status || 'pending_payment',
      isTrial: Boolean(orderPayload.isTrial),
      trialRemoveWatermark: Boolean(orderPayload.trialRemoveWatermark),
      mode: orderPayload.mode || 'order',
      payment: null,
      createdAt: now,
      updatedAt: now
    };

    this.data.orders.unshift(order);
    this.save();
    return this._wrapOrder(order);
  }

  async findOrder(query) {
    const order = this.data.orders.find(o => {
      if (query._id && o._id === query._id) return true;
      if (query.orderId && o.orderId === query.orderId) return true;
      return false;
    });
    if (!order) return null;
    return this._wrapOrder(order);
  }

  async listOrders({ userId, userEmail, skip = 0, limit = 10 }) {
    const filtered = this.data.orders.filter(o => {
      if (userId && o.user === userId) return true;
      if (userEmail && o.customerEmail.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    });

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit).map(o => this._wrapOrder(o));
    return { orders: paginated, total };
  }

  async updateOrder(orderId, updates) {
    const idx = this.data.orders.findIndex(o => o.orderId === orderId || o._id === orderId);
    if (idx === -1) return null;

    const current = this.data.orders[idx];
    const allowed = ['notes', 'brandKitLink', 'handles', 'footageLink', 'script', 'oneThing', 'status'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        current[key] = updates[key];
      }
    }
    current.updatedAt = new Date().toISOString();
    this.save();
    return this._wrapOrder(current);
  }

  _wrapOrder(order) {
    return {
      ...order,
      canTransitionTo: (nextStatus) => {
        const allowed = ALLOWED_STATUS_TRANSITIONS[order.status] || [];
        return allowed.includes(nextStatus);
      },
      save: async function () {
        localStore.save();
        return this;
      }
    };
  }
}

export const localStore = new LocalStore();
