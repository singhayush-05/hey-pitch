import { Order } from '../models/order.model.js';
import { PricingService } from './pricing.service.js';
import { AppError } from '../utils/response.js';

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

    const order = new Order({
      user: user ? user.userId : null,
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
    });

    await order.save();
    return order;
  }

  /**
   * List orders for the authenticated user with pagination.
   */
  static async listOrders({ userId, userEmail, page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

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
  }

  /**
   * Get single order by orderId or MongoDB ObjectId with authorization enforcement.
   */
  static async getOrderById(orderIdentifier, requestingUser = null) {
    const isObjectId = orderIdentifier.match(/^[0-9a-fA-F]{24}$/);
    const query = isObjectId ? { _id: orderIdentifier } : { orderId: orderIdentifier };

    const order = await Order.findOne(query);
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
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        order[field] = typeof updates[field] === 'string' ? updates[field].trim() : updates[field];
      }
    }

    await order.save();
    return order;
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

    order.status = 'cancelled';
    await order.save();
    return order;
  }
}
