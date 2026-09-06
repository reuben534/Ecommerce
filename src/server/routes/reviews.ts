import { Router, Response } from 'express';
import { db } from '../../db/index.ts';
import { reviews, products, orders, orderItems } from '../../db/schema.ts';
import { eq, and, sql, desc } from '../../db/index.ts';
import { requireAuth, optionalAuth, requireAdmin, AuthRequest } from '../../middleware/auth.ts';

const router = Router();

// GET reviews for a product
router.get('/product/:productId', async (req, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const prodReviews = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.status, 'approved')))
      .orderBy(desc(reviews.createdAt));

    res.json(prodReviews);
  } catch (error: any) {
    console.error('Failed to get reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST submit review
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const userUid = req.user!.uid;
    const userName = req.user!.name || req.dbUser?.name || 'Customer';

    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({ error: 'Please provide rating, title, and comments.' });
    }

    const numericRating = Math.min(5, Math.max(1, Number(rating)));

    // Check if user already reviewed this product
    const existing = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, Number(productId)), eq(reviews.userUid, userUid)));

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this product.' });
    }

    // Check verified purchase: user has an order with this product
    const customerOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(
        and(
          eq(orders.userUid, userUid),
          eq(orders.paymentStatus, 'paid')
        )
      );

    let isVerified = false;
    if (customerOrders.length > 0) {
      const orderIds = customerOrders.map((o) => o.id);
      for (const oid of orderIds) {
        const item = await db
          .select()
          .from(orderItems)
          .where(
            and(
              eq(orderItems.orderId, oid),
              eq(orderItems.productId, Number(productId))
            )
          );
        if (item.length > 0) {
          isVerified = true;
          break;
        }
      }
    }

    const [newReview] = await db
      .insert(reviews)
      .values({
        productId: Number(productId),
        userId: req.dbUser?.id,
        userUid,
        userName,
        rating: numericRating,
        title,
        comment,
        verifiedPurchase: isVerified,
        status: 'approved',
      })
      .returning();

    // Recompute product average rating & reviewCount
    const allReviews = await db
      .select({
        avg: sql<number>`cast(avg(rating) as numeric(3,2))`,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, Number(productId)), eq(reviews.status, 'approved')));

    if (allReviews.length > 0) {
      await db
        .update(products)
        .set({
          rating: String(allReviews[0].avg || numericRating),
          reviewCount: allReviews[0].count || 1,
        })
        .where(eq(products.id, Number(productId)));
    }

    res.status(201).json(newReview);
  } catch (error: any) {
    console.error('Failed to submit review:', error);
    res.status(500).json({ error: error.message || 'Failed to submit review' });
  }
});

// Admin: Moderate review
router.put('/:id/status', requireAdmin, async (req: AuthRequest, res: Response) => {
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
    console.error('Failed to moderate review:', error);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

export default router;
