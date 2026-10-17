import { Order } from '../models/order.model.js';
import { PricingService } from './pricing.service.js';
import { AppError } from '../utils/response.js';
import { isDbConnected } from '../config/database.js';
import { localStore } from '../utils/localStore.js';

export class OrderService {
  /**
   * Validate parameters, compute authoritative price, and persist new order.
   */
  static async createOrder({
    user = null,
    customerEmail,
    customerCompany,
    styleId,
    qty = 1,
    len = 's60',
    purpose = 'branding',
    sameStyle = true,
    revision = false,
    avatarMode,
    footageLink,
    footageDownloadOk = false,
    brandKitLink,
    handles,
    notes,
    script,
    oneThing,
    isTrial = false,
    trialRemoveWatermark = false,
    mode = 'order',
    currency = 'USD'
  }) {
    if (!customerEmail) {
      throw new AppError('Customer email is required', 400, 'MISSING_CUSTOMER_EMAIL');
    }

    const style = PricingService.getStyle(styleId);
    if (!style) {
      throw new AppError(`Style '${styleId}' is not supported`, 400, 'INVALID_STYLE_ID');
    }

    if (style.fam === 'cut' || style.fam === 'clip' || style.fam === 'motion') {
      if (!footageLink || !String(footageLink).trim()) {
        throw new AppError('A valid footage link is required for this video style', 400, 'MISSING_FOOTAGE_LINK');
      }
    }

    // Server-authoritative calculation
    const pricing = PricingService.calculateOrderPricing({
      styleId,
      qty,
      len,
      revision,
      avatarMode,
      isTrial,
      trialRemoveWatermark,
      currency
    });

    // Determine final mode
    let resolvedMode = mode;
    if (isTrial) {
      resolvedMode = 'trial';
    } else if (style.call) {
      resolvedMode = 'call';
    }

    let resolvedUserId = user ? (user.userId || user._id) : null;
    if (!resolvedUserId && isDbConnected() && customerEmail) {
      try {
        const { User } = await import('../models/user.model.js');
        const existingUser = await User.findOne({ email: customerEmail.trim().toLowerCase() }).select('_id');
        if (existingUser) resolvedUserId = existingUser._id;
      } catch {}
    }

    const payload = {
      user: resolvedUserId,
      customerEmail: customerEmail.trim().toLowerCase(),
      customerCompany: customerCompany ? customerCompany.trim() : '',
      styleId: style.id,
      styleName: style.name,
      len: style.shortform ? len : 's60',
      qty,
      purpose,
      sameStyle,
      revision,
      avatarMode: style.kind === 'avatar' ? avatarMode || 'talking' : null,
      footageLink: footageLink ? footageLink.trim() : '',
      footageDownloadOk,
      brandKitLink: brandKitLink ? brandKitLink.trim() : '',
      handles: handles ? handles.trim() : '',
      notes: notes ? notes.trim() : '',
      script: script ? script.trim() : '',
      oneThing: oneThing ? oneThing.trim() : '',
      pricing: {
        currency: pricing.currency,
        unitPrice: pricing.unitPrice,
        subtotal: pricing.subtotal,
        discountTotal: pricing.discountTotal,
        revisionTotal: pricing.revisionTotal,
        buildFeeTotal: pricing.buildFeeTotal,
        total: pricing.total
      },
      status: 'pending_payment',
      isTrial,
      trialRemoveWatermark,
      mode: resolvedMode
    };

    if (isDbConnected()) {
      const order = new Order(payload);
      await order.save();
      return order;
    } else {
      return localStore.createOrder(payload);
    }
  }

  /**
   * List orders for the authenticated user with pagination.
   */
  static async listOrders({ userId, userEmail, page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    if (isDbConnected()) {
      const query = {
        $or: [{ user: userId }, { customerEmail: userEmail.toLowerCase() }]
      };

      const [orders, total] = await Promise.all([
        Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Order.countDocuments(query)
      ]);

      return {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    } else {
      const { orders, total } = await localStore.listOrders({
        userId,
        userEmail,
        skip,
        limit: limitNum
      });
      return {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      };
    }
  }

  /**
   * Get single order by orderId or MongoDB ObjectId with authorization enforcement.
   */
  static async getOrderById(orderIdentifier, requestingUser = null) {
    let order;

    if (isDbConnected()) {
      const isObjectId = orderIdentifier.match(/^[0-9a-fA-F]{24}$/);
      const query = isObjectId ? { _id: orderIdentifier } : { orderId: orderIdentifier };
      order = await Order.findOne(query);
    } else {
      order = await localStore.findOrder({ orderId: orderIdentifier, _id: orderIdentifier });
    }

    if (!order) {
      throw new AppError(`Order '${orderIdentifier}' not found`, 404, 'ORDER_NOT_FOUND');
    }

    // Enforce authorization if requestingUser is provided
    if (requestingUser) {
      const isOwner =
        (order.user && order.user.toString() === requestingUser.userId) ||
        order.customerEmail.toLowerCase() === requestingUser.email.toLowerCase();
      const isAdmin = requestingUser.role === 'admin';

      if (!isOwner && !isAdmin) {
        throw new AppError('You are not authorized to view this order', 403, 'FORBIDDEN');
      }
    }

    return order;
  }

  /**
   * Update permitted fields for an existing order in eligible status.
   */
  static async updateOrder(orderIdentifier, updates, requestingUser = null) {
    const order = await this.getOrderById(orderIdentifier, requestingUser);

    const editableStatuses = ['pending_payment', 'intake_received'];
    if (!editableStatuses.includes(order.status)) {
      throw new AppError(
        `Order '${order.orderId}' cannot be modified because its status is '${order.status}'`,
        422,
        'ORDER_NOT_EDITABLE'
      );
    }

    // Only allow specific intake and client notes updates
    const allowedFields = ['notes', 'brandKitLink', 'handles', 'footageLink', 'script', 'oneThing'];
    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = typeof updates[field] === 'string' ? updates[field].trim() : updates[field];
      }
    }

    if (isDbConnected()) {
      for (const [k, v] of Object.entries(filteredUpdates)) {
        order[k] = v;
      }
      await order.save();
      return order;
    } else {
      return localStore.updateOrder(order.orderId, filteredUpdates);
    }
  }

  /**
   * Cancel an eligible order.
   */
  static async cancelOrder(orderIdentifier, requestingUser = null) {
    const order = await this.getOrderById(orderIdentifier, requestingUser);

    if (!order.canTransitionTo('cancelled')) {
      throw new AppError(
        `Order '${order.orderId}' cannot be cancelled from status '${order.status}'`,
        422,
        'INVALID_STATUS_TRANSITION'
      );
    }

    if (isDbConnected()) {
      order.status = 'cancelled';
      await order.save();
      return order;
    } else {
      return localStore.updateOrder(order.orderId, { status: 'cancelled' });
    }
  }
}
