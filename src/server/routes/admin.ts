import { Router, Response } from 'express';
import { db } from '../../db/index.ts';
import {
  orders,
  orderItems,
  products,
  coupons,
  reviews,
  users,
  storeSettings,
} from '../../db/schema.ts';
import { eq, desc, sql, and, gte, lte, ilike, or } from '../../db/index.ts';
import { requireAdmin, AuthRequest } from '../../middleware/auth.ts';
import { sendNotification } from '../notifications.ts';

const router = Router();

// Apply admin protection to all admin endpoints
router.use(requireAdmin);

// 1. Admin Analytics & Overview
router.get('/analytics', async (_req: AuthRequest, res: Response) => {
  try {
    // Total revenue from paid / delivered / processing orders
    const revResult = await db
      .select({
        totalRevenue: sql<string>`coalesce(sum(case when payment_status = 'paid' and order_status != 'cancelled' then total else 0 end), 0)`,
        orderCount: sql<number>`cast(count(*) as integer)`,
        pendingCount: sql<number>`cast(sum(case when order_status = 'pending' or order_status = 'processing' then 1 else 0 end) as integer)`,
      })
      .from(orders);

    const totalRevenue = Number(revResult[0]?.totalRevenue || 0);
    const orderCount = revResult[0]?.orderCount || 0;
    const pendingOrders = revResult[0]?.pendingCount || 0;

    // Today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayResult = await db
      .select({
        todaySales: sql<string>`coalesce(sum(case when payment_status = 'paid' and order_status != 'cancelled' then total else 0 end), 0)`,
        todayOrders: sql<number>`cast(count(*) as integer)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, today));

    const todaySales = Number(todayResult[0]?.todaySales || 0);

    // Total products & low-stock products
    const lowStockProducts = await db
      .select()
      .from(products)
      .where(lte(products.stock, products.lowStockThreshold))
      .orderBy(products.stock);

    const totalProductsResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(products);
    const totalProducts = totalProductsResult[0]?.count || 0;

    // Total customers
    const customersCount = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(users);

    // Recent 8 orders
    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8);

    // Top selling products from orderItems
    const topSelling = await db
      .select({
        productId: orderItems.productId,
        productName: orderItems.productName,
        totalSold: sql<number>`cast(sum(${orderItems.quantity}) as integer)`,
        totalRevenue: sql<string>`coalesce(sum(${orderItems.total}), 0)`,
      })
      .from(orderItems)
      .groupBy(orderItems.productId, orderItems.productName)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5);

    // Daily sales trends for the last 7 days (formatted for charts)
    const salesChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const dayResult = await db
        .select({
          rev: sql<string>`coalesce(sum(case when payment_status = 'paid' and order_status != 'cancelled' then total else 0 end), 0)`,
          orders: sql<number>`cast(count(*) as integer)`,
        })
        .from(orders)
        .where(and(gte(orders.createdAt, startOfDay), lte(orders.createdAt, endOfDay)));

      salesChart.push({
        date: dayName,
        revenue: Number(dayResult[0]?.rev || 0),
        orders: dayResult[0]?.orders || 0,
      });
    }

    res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      todaySales: Number(todaySales.toFixed(2)),
      orderCount,
      pendingOrders,
      totalProducts,
      totalCustomers: customersCount[0]?.count || 0,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      topSelling,
      recentOrders,
      salesChart,
    });
  } catch (error: any) {
    console.error('Failed to get admin analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics data' });
  }
});

// 2. Orders Management
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const { status, q, limit = '50', offset = '0' } = req.query;

    const conditions = [];
    if (status && status !== 'all') {
      conditions.push(eq(orders.orderStatus, String(status)));
    }

    if (q && typeof q === 'string' && q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(
        or(
          ilike(orders.orderNumber, term),
          ilike(orders.customerEmail, term),
          ilike(orders.customerName, term),
          ilike(orders.trackingNumber, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const allOrders = await db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const enriched = [];
    for (const ord of allOrders) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, ord.id));

      let address = {};
      try {
        address = JSON.parse(ord.shippingAddress);
      } catch {}

      enriched.push({
        ...ord,
        shippingAddressParsed: address,
        items,
      });
    }

    res.json(enriched);
  } catch (error: any) {
    console.error('Failed to get admin orders:', error);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

// Update order status, tracking, and handle inventory restock on cancellation
router.put('/orders/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { orderStatus, paymentStatus, trackingCarrier, trackingNumber } = req.body;

    const existing = await db.select().from(orders).where(eq(orders.id, id));
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const currentOrder = existing[0];

    const [updated] = await db
      .update(orders)
      .set({
        orderStatus: orderStatus || currentOrder.orderStatus,
        paymentStatus: paymentStatus || currentOrder.paymentStatus,
        trackingCarrier: trackingCarrier !== undefined ? trackingCarrier : currentOrder.trackingCarrier,
        trackingNumber: trackingNumber !== undefined ? trackingNumber : currentOrder.trackingNumber,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    // If order transitioned into cancelled/refunded from an active status, RESTORE STOCK
    if (
      (orderStatus === 'cancelled' || orderStatus === 'refunded') &&
      currentOrder.orderStatus !== 'cancelled' &&
      currentOrder.orderStatus !== 'refunded'
    ) {
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

      await sendNotification({
        type: 'order_cancelled',
        toEmail: updated.customerEmail,
        recipientName: updated.customerName,
        data: { orderNumber: updated.orderNumber, total: updated.total },
      });
    }

    // If order was marked as shipped, send shipped notification
    if (orderStatus === 'shipped' && currentOrder.orderStatus !== 'shipped') {
      await sendNotification({
        type: 'order_shipped',
        toEmail: updated.customerEmail,
        recipientName: updated.customerName,
        data: {
          orderNumber: updated.orderNumber,
          carrier: updated.trackingCarrier,
          trackingNumber: updated.trackingNumber,
        },
      });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 3. Coupons Management
router.get('/coupons', async (_req: AuthRequest, res: Response) => {
  try {
    const list = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    res.json(list);
  } catch (error: any) {
    console.error('Failed to get coupons:', error);
    res.status(500).json({ error: 'Failed to retrieve coupons' });
  }
});

router.post('/coupons', async (req: AuthRequest, res: Response) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscount, expirationDate, usageLimit, isActive } = req.body;
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ error: 'Code, type, and value are required.' });
    }

    const [newCoupon] = await db
      .insert(coupons)
      .values({
        code: code.trim().toUpperCase(),
        description: description || null,
        discountType,
        discountValue: String(discountValue),
        minOrderAmount: minOrderAmount ? String(minOrderAmount) : '0.00',
        maxDiscount: maxDiscount ? String(maxDiscount) : null,
        expirationDate: expirationDate || null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      })
      .returning();

    res.status(201).json(newCoupon);
  } catch (error: any) {
    console.error('Failed to create coupon:', error);
    res.status(500).json({ error: error.message || 'Failed to create coupon' });
  }
});

router.put('/coupons/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    const [updated] = await db
      .update(coupons)
      .set({
        code: data.code ? data.code.trim().toUpperCase() : undefined,
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue ? String(data.discountValue) : undefined,
        minOrderAmount: data.minOrderAmount ? String(data.minOrderAmount) : undefined,
        maxDiscount: data.maxDiscount ? String(data.maxDiscount) : null,
        expirationDate: data.expirationDate,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      })
      .where(eq(coupons.id, id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update coupon:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

router.delete('/coupons/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(coupons).where(eq(coupons.id, id));
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete coupon:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// 4. Inventory Management
router.get('/inventory', async (_req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        stock: products.stock,
        lowStockThreshold: products.lowStockThreshold,
        price: products.price,
        category: products.category,
        images: products.images,
      })
      .from(products)
      .orderBy(products.stock);

    res.json(list);
  } catch (error: any) {
    console.error('Failed to get inventory:', error);
    res.status(500).json({ error: 'Failed to retrieve inventory' });
  }
});

router.put('/inventory/:productId', async (req: AuthRequest, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const { stock, lowStockThreshold } = req.body;

    const [updated] = await db
      .update(products)
      .set({
        stock: stock !== undefined ? Number(stock) : undefined,
        lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update inventory:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// 5. Customers List
router.get('/customers', async (_req: AuthRequest, res: Response) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    
    // Enrich with order counts & total spend
    const enriched = [];
    for (const u of allUsers) {
      const uOrders = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
          spend: sql<string>`coalesce(sum(case when payment_status = 'paid' then total else 0 end), 0)`,
        })
        .from(orders)
        .where(eq(orders.userUid, u.uid));

      enriched.push({
        ...u,
        orderCount: uOrders[0]?.count || 0,
        totalSpend: Number(Number(uOrders[0]?.spend || 0).toFixed(2)),
      });
    }

    res.json(enriched);
  } catch (error: any) {
    console.error('Failed to get customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// 6. Reviews Moderation
router.get('/reviews', async (_req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        id: reviews.id,
        productId: reviews.productId,
        productName: products.name,
        userName: reviews.userName,
        rating: reviews.rating,
        title: reviews.title,
        comment: reviews.comment,
        status: reviews.status,
        verifiedPurchase: reviews.verifiedPurchase,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(products, eq(reviews.productId, products.id))
      .orderBy(desc(reviews.createdAt));

    res.json(list);
  } catch (error: any) {
    console.error('Failed to get reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.put('/reviews/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const [updated] = await db
      .update(reviews)
      .set({ status })
      .where(eq(reviews.id, id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

export default router;
