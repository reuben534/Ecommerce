import { Router, Response } from 'express';
import { db } from '../../db/index.ts';
import { wishlists, products, carts, cartItems } from '../../db/schema.ts';
import { eq, and } from '../../db/index.ts';
import { requireAuth, AuthRequest } from '../../middleware/auth.ts';

const router = Router();

// GET wishlist items for user
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;

    const items = await db
      .select({
        id: wishlists.id,
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
        name: products.name,
        slug: products.slug,
        price: products.price,
        salePrice: products.salePrice,
        images: products.images,
        stock: products.stock,
        category: products.category,
        rating: products.rating,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userUid, userUid));

    const formatted = items.map((i) => {
      let imgs = [];
      try {
        imgs = JSON.parse(i.images);
      } catch {}
      return {
        id: i.id,
        productId: i.productId,
        name: i.name,
        slug: i.slug,
        price: Number(i.price),
        salePrice: i.salePrice ? Number(i.salePrice) : null,
        image: imgs[0] || '',
        stock: i.stock,
        isOutOfStock: i.stock <= 0,
        category: i.category,
        rating: Number(i.rating || 0),
        addedAt: i.createdAt,
      };
    });

    res.json(formatted);
  } catch (error: any) {
    console.error('Failed to get wishlist:', error);
    res.status(500).json({ error: 'Failed to retrieve wishlist' });
  }
});

// POST toggle/add item to wishlist
router.post('/:productId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const userUid = req.user!.uid;

    const existing = await db
      .select()
      .from(wishlists)
      .where(
        and(
          eq(wishlists.userUid, userUid),
          eq(wishlists.productId, productId)
        )
      );

    if (existing.length > 0) {
      await db
        .delete(wishlists)
        .where(
          and(
            eq(wishlists.userUid, userUid),
            eq(wishlists.productId, productId)
          )
        );
      return res.json({ saved: false, message: 'Removed from wishlist' });
    }

    await db.insert(wishlists).values({
      userId: req.dbUser?.id,
      userUid,
      productId,
    });

    res.json({ saved: true, message: 'Added to wishlist' });
  } catch (error: any) {
    console.error('Failed to toggle wishlist:', error);
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

// DELETE remove item from wishlist
router.delete('/:productId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const userUid = req.user!.uid;

    await db
      .delete(wishlists)
      .where(
        and(
          eq(wishlists.userUid, userUid),
          eq(wishlists.productId, productId)
        )
      );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to remove from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// POST move item from wishlist to cart
router.post('/:productId/move-to-cart', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const productId = Number(req.params.productId);
    const userUid = req.user!.uid;

    // Check product stock
    const pResult = await db.select().from(products).where(eq(products.id, productId));
    if (pResult.length === 0) return res.status(404).json({ error: 'Product not found' });
    const product = pResult[0];

    if (product.stock <= 0) {
      return res.status(400).json({ error: 'Product is currently out of stock' });
    }

    // Get or create cart for user
    let userCart = (await db.select().from(carts).where(eq(carts.userUid, userUid)))[0];
    if (!userCart) {
      const [newC] = await db.insert(carts).values({ userId: req.dbUser?.id, userUid }).returning();
      userCart = newC;
    }

    // Add to cart
    const price = product.salePrice ? product.salePrice : product.price;
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, userCart.id), eq(cartItems.productId, productId)));

    if (existing.length > 0) {
      await db
        .update(cartItems)
        .set({ quantity: existing[0].quantity + 1 })
        .where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({
        cartId: userCart.id,
        productId,
        quantity: 1,
        price: String(price),
      });
    }

    // Remove from wishlist
    await db
      .delete(wishlists)
      .where(and(eq(wishlists.userUid, userUid), eq(wishlists.productId, productId)));

    res.json({ success: true, message: 'Moved to cart successfully' });
  } catch (error: any) {
    console.error('Failed to move to cart:', error);
    res.status(500).json({ error: 'Failed to move to cart' });
  }
});

export default router;
