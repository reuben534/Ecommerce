import { Router, Response } from 'express';
import { db } from '../../db/index.ts';
import { products, coupons } from '../../db/schema.ts';
import { eq, inArray } from 'drizzle-orm';
import { optionalAuth, AuthRequest } from '../../middleware/auth.ts';
import { createPaymentReference } from '../payments.ts';

const router = Router();

// Create a local payment reference after validating the cart totals.
router.post('/create-intent', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      items,
      couponCode,
      shippingMethod = 'standard',
      customerEmail,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // 1. Fetch real products from database to prevent price manipulation
    const productIds = items.map((i: any) => Number(i.productId));
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map<number, typeof products.$inferSelect>();
    dbProducts.forEach((p) => productMap.set(p.id, p));

    // 2. Validate stock and compute real subtotal
    let subtotal = 0;
    for (const item of items) {
      const p = productMap.get(Number(item.productId));
      if (!p) {
        return res.status(400).json({ error: `Product ID ${item.productId} does not exist.` });
      }

      if (p.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${p.name}". Only ${p.stock} remaining.`,
        });
      }

      const price = p.salePrice ? Number(p.salePrice) : Number(p.price);
      subtotal += price * Number(item.quantity);
    }

    // 3. Validate coupon if provided
    let discount = 0;
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
        }
      }
    }

    // 4. Calculate shipping
    let shippingCost = 0;
    if (shippingMethod === 'express') {
      shippingCost = 28.0;
    } else {
      shippingCost = subtotal >= 150 ? 0.0 : 15.0;
    }

    // 5. Calculate tax
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Number((taxableAmount * 0.085).toFixed(2));
    const total = Number((taxableAmount + shippingCost + tax).toFixed(2));

    res.json({
      paymentReference: createPaymentReference(),
      mode: 'manual_payment',
      paymentStatus: 'pending',
      summary: {
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        shippingCost: Number(shippingCost.toFixed(2)),
        tax,
        total,
      },
    });
  } catch (error: any) {
    console.error('Failed to create payment intent:', error);
    res.status(500).json({ error: error.message || 'Failed to initialize payment' });
  }
});

export default router;
