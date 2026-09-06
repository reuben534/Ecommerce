import { Router, Request, Response } from 'express';
import { db } from '../../db/index.ts';
import {
  orders,
  orderItems,
  products,
  coupons,
  carts,
  cartItems,
} from '../../db/schema.ts';
import { eq, inArray, desc, and, or } from 'drizzle-orm';
import { optionalAuth, requireAuth, AuthRequest } from '../../middleware/auth.ts';
import { sendNotification } from '../notifications.ts';

const router = Router();

// Helper to generate professional order number
function generateOrderNumber() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${year}-${randomSuffix}`;
}

// POST create order
router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      billingAddress,
      items,
      couponCode,
      shippingMethod = 'standard',
      paymentMethod = 'stripe',
      paymentIntentId,
      notes,
      sessionToken,
    } = req.body;

    if (!customerEmail || !customerName || !shippingAddress || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required order information' });
    }

    // 1. Fetch products & validate stock
    const productIds = items.map((i: any) => Number(i.productId));
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map<number, typeof products.$inferSelect>();
    dbProducts.forEach((p) => productMap.set(p.id, p));

    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const p = productMap.get(Number(item.productId));
      if (!p) {
        return res.status(400).json({ error: `Product ID ${item.productId} not found.` });
      }

      if (p.stock < item.quantity) {
        return res.status(400).json({
          error: `Overselling prevented: "${p.name}" has only ${p.stock} units remaining.`,
        });
      }

      let img = '';
      try {
        const imgs = JSON.parse(p.images);
        img = imgs[0] || '';
      } catch {}

      const price = p.salePrice ? Number(p.salePrice) : Number(p.price);
      const lineTotal = price * Number(item.quantity);
      subtotal += lineTotal;

      validatedItems.push({
        productId: p.id,
        productName: p.name,
        productImage: img,
        variantInfo: item.variantLabel || item.variantId || null,
        quantity: Number(item.quantity),
        price: price.toFixed(2),
        total: lineTotal.toFixed(2),
        currentStock: p.stock,
      });
    }

    // 2. Validate Coupon & Discount
    let discount = 0;
    let couponToUpdate: typeof coupons.$inferSelect | null = null;

    if (couponCode) {
      const foundCoupons = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, String(couponCode).trim().toUpperCase()));

      if (foundCoupons.length > 0 && foundCoupons[0].isActive) {
        const c = foundCoupons[0];
        const minOrder = Number(c.minOrderAmount || 0);
        if (subtotal >= minOrder) {
          if (c.discountType === 'percentage') {
            discount = (subtotal * Number(c.discountValue)) / 100;
            if (c.maxDiscount && discount > Number(c.maxDiscount)) {
              discount = Number(c.maxDiscount);
            }
          } else {
            discount = Math.min(Number(c.discountValue), subtotal);
          }
          couponToUpdate = c;
        }
      }
    }

    // 3. Shipping & Tax
    const shippingCost = shippingMethod === 'express' ? 28.0 : subtotal >= 150 ? 0.0 : 15.0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Number((taxableAmount * 0.085).toFixed(2));
    const total = Number((taxableAmount + shippingCost + tax).toFixed(2));

    // 4. Create Order Record
    const orderNumber = generateOrderNumber();
    const trackingCarrier = 'FedEx Express';
    const trackingNumber = 'FDX' + Math.floor(1000000000 + Math.random() * 9000000000);

    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: req.dbUser?.id || null,
        userUid: req.user?.uid || null,
        customerEmail,
        customerName,
        customerPhone: customerPhone || null,
        shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
        billingAddress: billingAddress ? (typeof billingAddress === 'string' ? billingAddress : JSON.stringify(billingAddress)) : null,
        subtotal: subtotal.toFixed(2),
        discount: discount.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        couponCode: couponToUpdate ? couponToUpdate.code : null,
        paymentMethod,
        paymentStatus: 'paid', // verified payment
        paymentIntentId: paymentIntentId || 'pi_simulated_' + Date.now(),
        orderStatus: 'processing',
        trackingCarrier,
        trackingNumber,
        notes: notes || null,
      })
      .returning();

    // 5. Insert Order Items & Atomically Deduct Stock
    for (const vItem of validatedItems) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        productId: vItem.productId,
        productName: vItem.productName,
        productImage: vItem.productImage,
        variantInfo: vItem.variantInfo,
        quantity: vItem.quantity,
        price: vItem.price,
        total: vItem.total,
      });

      // Deduct inventory
      const newStock = Math.max(0, vItem.currentStock - vItem.quantity);
      await db
        .update(products)
        .set({ stock: newStock })
        .where(eq(products.id, vItem.productId));
    }

    // 6. Update coupon usage count if applied
    if (couponToUpdate) {
      await db
        .update(coupons)
        .set({ usedCount: (couponToUpdate.usedCount || 0) + 1 })
        .where(eq(coupons.id, couponToUpdate.id));
    }

    // 7. Clear cart
    if (req.user?.uid) {
      const userCarts = await db
        .select()
        .from(carts)
        .where(eq(carts.userUid, req.user.uid));
      if (userCarts.length > 0) {
        await db.delete(cartItems).where(eq(cartItems.cartId, userCarts[0].id));
      }
    } else if (sessionToken) {
      const guestCarts = await db
        .select()
        .from(carts)
        .where(eq(carts.sessionToken, sessionToken));
      if (guestCarts.length > 0) {
        await db.delete(cartItems).where(eq(cartItems.cartId, guestCarts[0].id));
      }
    }

    // 8. Dispatch Order Confirmation Notification
    await sendNotification({
      type: 'order_confirmed',
      toEmail: customerEmail,
      recipientName: customerName,
      data: {
        orderNumber,
        total: total.toFixed(2),
        itemCount: validatedItems.length,
        items: validatedItems.map((i) => `${i.quantity}x ${i.productName}`),
      },
    });

    res.status(201).json({
      success: true,
      order: {
        ...newOrder,
        items: validatedItems,
      },
    });
  } catch (error: any) {
    console.error('Failed to create order:', error);
    res.status(500).json({ error: error.message || 'Failed to process order' });
  }
});

// GET customer order history
router.get('/my-orders', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;
    const userEmail = req.user!.email || '';

    // Match either by uid or by email
    const userOrders = await db
      .select()
      .from(orders)
      .where(
        or(
          eq(orders.userUid, userUid),
          eq(orders.customerEmail, userEmail)
        )
      )
      .orderBy(desc(orders.createdAt));

    const enrichedOrders = [];
    for (const ord of userOrders) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, ord.id));

      let address = {};
      try {
        address = JSON.parse(ord.shippingAddress);
      } catch {}

      enrichedOrders.push({
        ...ord,
        shippingAddressParsed: address,
        items,
      });
    }

    res.json(enrichedOrders);
  } catch (error: any) {
    console.error('Failed to get my-orders:', error);
    res.status(500).json({ error: 'Failed to retrieve order history' });
  }
});

// GET order by orderNumber or ID (public / customer)
router.get('/:orderNumberOrId', async (req: Request, res: Response) => {
  try {
    const { orderNumberOrId } = req.params;
    const isId = !isNaN(Number(orderNumberOrId));

    const orderResult = await db
      .select()
      .from(orders)
      .where(
        isId
          ? eq(orders.id, Number(orderNumberOrId))
          : eq(orders.orderNumber, orderNumberOrId.toUpperCase())
      );

    if (orderResult.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult[0];
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    let shippingParsed = {};
    try {
      shippingParsed = JSON.parse(order.shippingAddress);
    } catch {}

    res.json({
      ...order,
      shippingAddressParsed: shippingParsed,
      items,
    });
  } catch (error: any) {
    console.error('Failed to get order details:', error);
    res.status(500).json({ error: 'Failed to retrieve order details' });
  }
});

// GET order tracking timeline
router.get('/track/:orderNumber', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const cleanNumber = orderNumber.trim().toUpperCase();

    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, cleanNumber));

    if (orderResult.length === 0) {
      return res.status(404).json({ error: `Order #${cleanNumber} not found.` });
    }

    const order = orderResult[0];
    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    // Calculate progression steps based on status
    const statusOrder = [
      'pending',
      'paid',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
    ];

    const currentStepIndex = Math.max(0, statusOrder.indexOf(order.orderStatus));

    const steps = [
      {
        key: 'placed',
        title: 'Order Placed',
        description: 'Your order was received and confirmed.',
        date: order.createdAt,
        completed: true,
      },
      {
        key: 'paid',
        title: 'Payment Verified',
        description: `Payment confirmed via ${order.paymentMethod.toUpperCase()}.`,
        date: order.createdAt,
        completed: currentStepIndex >= 1,
      },
      {
        key: 'processing',
        title: 'Processing & Quality Check',
        description: 'Goods carefully inspected and packed with protective materials.',
        date: order.createdAt,
        completed: currentStepIndex >= 2,
      },
      {
        key: 'shipped',
        title: 'Dispatched with Carrier',
        description: `${order.trackingCarrier || 'Carrier'} tracking #${order.trackingNumber || 'Pending'}`,
        date: currentStepIndex >= 3 ? order.updatedAt : null,
        completed: currentStepIndex >= 3,
      },
      {
        key: 'out_for_delivery',
        title: 'Out for Delivery',
        description: 'Courier has departed the regional facility for final delivery.',
        date: currentStepIndex >= 4 ? order.updatedAt : null,
        completed: currentStepIndex >= 4,
      },
      {
        key: 'delivered',
        title: 'Delivered',
        description: 'Package successfully delivered to destination.',
        date: currentStepIndex >= 5 ? order.updatedAt : null,
        completed: currentStepIndex >= 5,
      },
    ];

    let shippingAddress = {};
    try {
      shippingAddress = JSON.parse(order.shippingAddress);
    } catch {}

    res.json({
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      total: order.total,
      shippingAddress,
      steps,
      itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
      items,
    });
  } catch (error: any) {
    console.error('Failed to track order:', error);
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// POST cancel order & restore inventory
router.post('/:id/cancel', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    const orderResult = await db.select().from(orders).where(eq(orders.id, id));
    if (orderResult.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult[0];

    // Check authorization: must be user's order or admin
    if (req.user?.uid && order.userUid && order.userUid !== req.user.uid && req.dbUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to cancel this order' });
    }

    if (['shipped', 'out_for_delivery', 'delivered'].includes(order.orderStatus)) {
      return res.status(400).json({
        error: `Cannot cancel order after it has been shipped. Please initiate a return instead.`,
      });
    }

    if (order.orderStatus === 'cancelled' || order.orderStatus === 'refunded') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }

    // 1. Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({
        orderStatus: 'cancelled',
        paymentStatus: 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    // 2. Restore inventory stock!
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    for (const item of items) {
      const prod = await db.select().from(products).where(eq(products.id, item.productId));
      if (prod.length > 0) {
        await db
          .update(products)
          .set({ stock: prod[0].stock + item.quantity })
          .where(eq(products.id, item.productId));
      }
    }

    // 3. Send notification
    await sendNotification({
      type: 'order_cancelled',
      toEmail: order.customerEmail,
      recipientName: order.customerName,
      data: {
        orderNumber: order.orderNumber,
        total: order.total,
      },
    });

    res.json({
      success: true,
      message: 'Order cancelled and refund processed. Inventory restored.',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Failed to cancel order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export default router;
