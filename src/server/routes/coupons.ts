import { Router, Request, Response } from 'express';
import { db } from '../../db/index.ts';
import { coupons } from '../../db/schema.ts';
import { eq } from '../../db/index.ts';

const router = Router();

// Validate coupon code
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const orderSubtotal = Number(subtotal) || 0;
    const cleanCode = code.trim().toUpperCase();

    const results = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, cleanCode));

    if (results.length === 0) {
      return res.status(404).json({ error: 'Invalid coupon code. Please verify and try again.' });
    }

    const coupon = results[0];

    // Check if active
    if (!coupon.isActive) {
      return res.status(400).json({ error: 'This coupon code is no longer active.' });
    }

    // Check expiration
    if (coupon.expirationDate) {
      const expDate = new Date(coupon.expirationDate);
      if (new Date() > expDate) {
        return res.status(400).json({ error: 'This coupon code has expired.' });
      }
    }

    // Check usage limits
    if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
      return res.status(400).json({ error: 'This coupon has reached its maximum redemption limit.' });
    }

    // Check minimum order amount
    const minOrder = Number(coupon.minOrderAmount || 0);
    if (orderSubtotal < minOrder) {
      return res.status(400).json({
        error: `Minimum order amount of $${minOrder.toFixed(2)} required to apply this coupon.`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderSubtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      discount = Math.min(Number(coupon.discountValue), orderSubtotal);
    }

    res.json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discount: Number(discount.toFixed(2)),
      minOrderAmount: minOrder,
    });
  } catch (error: any) {
    console.error('Failed to validate coupon:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

export default router;
