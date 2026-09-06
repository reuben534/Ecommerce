import { Router, Response } from 'express';
import { db } from '../../db/index.ts';
import { carts, cartItems, products, coupons, storeSettings } from '../../db/schema.ts';
import { eq, and } from '../../db/index.ts';
import { optionalAuth, AuthRequest } from '../../middleware/auth.ts';

const router = Router();

// Helper to get or create cart
async function getOrCreateCart(req: AuthRequest) {
  const userUid = req.user?.uid;
  const sessionToken = (req.headers['x-session-token'] as string) || req.query.sessionToken as string;

  if (userUid) {
    const existing = await db
      .select()
      .from(carts)
      .where(eq(carts.userUid, userUid));
    if (existing.length > 0) return existing[0];

    const [newCart] = await db
      .insert(carts)
      .values({
        userId: req.dbUser?.id,
        userUid,
      })
      .returning();
    return newCart;
  }

  if (sessionToken) {
    const existing = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionToken, sessionToken));
    if (existing.length > 0) return existing[0];

    const [newCart] = await db
      .insert(carts)
      .values({
        sessionToken,
      })
      .returning();
    return newCart;
  }

  // Generate new session token
  const newSessionToken = 'guest_' + Math.random().toString(36).substring(2, 15);
  const [newCart] = await db
    .insert(carts)
    .values({
      sessionToken: newSessionToken,
    })
    .returning();
  return newCart;
}

// GET cart with items, product info, subtotal, discount, shipping, tax
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const cart = await getOrCreateCart(req);

    const items = await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        productId: cartItems.productId,
        variantId: cartItems.variantId,
        variantLabel: cartItems.variantLabel,
        quantity: cartItems.quantity,
        price: cartItems.price,
        productName: products.name,
        productSlug: products.slug,
        productImages: products.images,
        productStock: products.stock,
        productPrice: products.price,
        productSalePrice: products.salePrice,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id));

    let subtotal = 0;
    const formattedItems = items.map((item) => {
      let images = [];
      try {
        images = JSON.parse(item.productImages);
      } catch {}
      const effectivePrice = Number(item.price);
      const lineTotal = effectivePrice * item.quantity;
      subtotal += lineTotal;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        variantLabel: item.variantLabel,
        quantity: item.quantity,
        price: effectivePrice,
        lineTotal: Number(lineTotal.toFixed(2)),
        name: item.productName,
        slug: item.productSlug,
        image: images[0] || '',
        stock: item.productStock,
        isOutOfStock: item.productStock <= 0,
      };
    });

    // Check applied coupon from query
    let discount = 0;
    let appliedCoupon: any = null;
    const couponCode = req.query.coupon as string;
    if (couponCode) {
      const foundCoupons = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, couponCode.toUpperCase()));
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
            discount = Number(c.discountValue);
          }
          appliedCoupon = {
            code: c.code,
            description: c.description,
            discount: Number(discount.toFixed(2)),
          };
        }
      }
    }

    // Shipping & Tax thresholds
    const freeShippingThreshold = 150;
    const shippingCost = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 15;
    const taxRate = 0.085; // 8.5%
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Number((taxableAmount * taxRate).toFixed(2));
    const total = Number((taxableAmount + shippingCost + tax).toFixed(2));

    res.json({
      cartId: cart.id,
      sessionToken: cart.sessionToken,
      items: formattedItems,
      itemCount: formattedItems.reduce((acc, item) => acc + item.quantity, 0),
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      shippingCost,
      tax,
      total,
      appliedCoupon,
      freeShippingThreshold,
      remainingForFreeShipping: Math.max(0, Number((freeShippingThreshold - subtotal).toFixed(2))),
    });
  } catch (error: any) {
    console.error('Failed to get cart:', error);
    res.status(500).json({ error: 'Failed to retrieve cart' });
  }
});

// POST add product to cart (with stock validation)
router.post('/items', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, variantId, variantLabel, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const productResult = await db
      .select()
      .from(products)
      .where(eq(products.id, Number(productId)));

    if (productResult.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult[0];

    // Check total stock
    if (product.stock <= 0) {
      return res.status(400).json({ error: 'This product is currently out of stock.' });
    }

    const cart = await getOrCreateCart(req);

    // Check if item with same product and variant is already in cart
    const existingItems = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, product.id)
        )
      );

    const matchingItem = existingItems.find(
      (item) => (item.variantId || '') === (variantId || '')
    );

    const price = product.salePrice ? product.salePrice : product.price;

    if (matchingItem) {
      const newQty = matchingItem.quantity + Number(quantity);
      if (newQty > product.stock) {
        return res.status(400).json({
          error: `Cannot add more. Only ${product.stock} units available in stock.`,
        });
      }

      await db
        .update(cartItems)
        .set({ quantity: newQty })
        .where(eq(cartItems.id, matchingItem.id));
    } else {
      if (Number(quantity) > product.stock) {
        return res.status(400).json({
          error: `Only ${product.stock} units available in stock.`,
        });
      }

      await db.insert(cartItems).values({
        cartId: cart.id,
        productId: product.id,
        variantId: variantId || null,
        variantLabel: variantLabel || null,
        quantity: Number(quantity),
        price: String(price),
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to add to cart:', error);
    res.status(500).json({ error: error.message || 'Failed to add item to cart' });
  }
});

// PUT update quantity
router.put('/items/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { quantity } = req.body;
    const targetQty = Number(quantity);

    if (targetQty <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, id));
      return res.json({ success: true, deleted: true });
    }

    // Verify stock
    const itemResult = await db
      .select({
        cartItemId: cartItems.id,
        productId: cartItems.productId,
        productStock: products.stock,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.id, id));

    if (itemResult.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (targetQty > itemResult[0].productStock) {
      return res.status(400).json({
        error: `Only ${itemResult[0].productStock} units available in stock.`,
      });
    }

    await db
      .update(cartItems)
      .set({ quantity: targetQty })
      .where(eq(cartItems.id, id));

    res.json({ success: true, quantity: targetQty });
  } catch (error: any) {
    console.error('Failed to update cart item:', error);
    res.status(500).json({ error: 'Failed to update item quantity' });
  }
});

// DELETE single item from cart
router.delete('/items/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(cartItems).where(eq(cartItems.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to remove cart item:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// DELETE clear all cart items
router.delete('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const cart = await getOrCreateCart(req);
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to clear cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

// POST merge guest cart into user account cart on login
router.post('/merge', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionToken } = req.body;
    const userUid = req.user?.uid;

    if (!userUid || !sessionToken) {
      return res.json({ success: true, message: 'Nothing to merge' });
    }

    const guestCarts = await db
      .select()
      .from(carts)
      .where(eq(carts.sessionToken, sessionToken));

    if (guestCarts.length === 0) {
      return res.json({ success: true, message: 'No guest cart found' });
    }

    const guestCart = guestCarts[0];
    const userCart = await getOrCreateCart(req);

    // Get all items in guest cart
    const gItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCart.id));

    for (const item of gItems) {
      // Check if user cart already has it
      const existingUserItem = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, userCart.id),
            eq(cartItems.productId, item.productId)
          )
        );

      const matching = existingUserItem.find(
        (u) => (u.variantId || '') === (item.variantId || '')
      );

      if (matching) {
        await db
          .update(cartItems)
          .set({ quantity: matching.quantity + item.quantity })
          .where(eq(cartItems.id, matching.id));
      } else {
        await db.insert(cartItems).values({
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          variantLabel: item.variantLabel,
          quantity: item.quantity,
          price: item.price,
        });
      }
    }

    // Delete old guest cart items and cart
    await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
    await db.delete(carts).where(eq(carts.id, guestCart.id));

    res.json({ success: true, mergedCount: gItems.length });
  } catch (error: any) {
    console.error('Failed to merge cart:', error);
    res.status(500).json({ error: 'Failed to merge cart' });
  }
});

export default router;
