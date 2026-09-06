import { Router, Request, Response } from 'express';
import { db } from '../../db/index.ts';
import { products, reviews, categories, brands } from '../../db/schema.ts';
import { eq, and, gte, lte, ilike, or, desc, asc, sql } from '../../db/index.ts';
import { requireAdmin } from '../../middleware/auth.ts';

const router = Router();

// GET all products with filtering, search, and sorting
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      brand,
      minPrice,
      maxPrice,
      inStock,
      featured,
      sort = 'recommended',
      limit = '24',
      offset = '0',
    } = req.query;

    const conditions = [];

    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(
        or(
          ilike(products.name, searchTerm),
          ilike(products.description, searchTerm),
          ilike(products.sku, searchTerm),
          ilike(products.brand, searchTerm),
          ilike(products.category, searchTerm),
          ilike(products.tags, searchTerm)
        )
      );
    }

    if (category && typeof category === 'string' && category !== 'all') {
      conditions.push(eq(products.category, category));
    }

    if (brand && typeof brand === 'string' && brand !== 'all') {
      conditions.push(eq(products.brand, brand));
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      conditions.push(gte(products.price, String(minPrice)));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      conditions.push(lte(products.price, String(maxPrice)));
    }

    if (inStock === 'true') {
      conditions.push(gte(products.stock, 1));
    }

    if (featured === 'true') {
      conditions.push(eq(products.isFeatured, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    switch (sort) {
      case 'newest':
        orderBy = desc(products.createdAt);
        break;
      case 'price-asc':
        orderBy = asc(products.price);
        break;
      case 'price-desc':
        orderBy = desc(products.price);
        break;
      case 'rating':
        orderBy = desc(products.rating);
        break;
      case 'bestselling':
        orderBy = desc(products.isBestseller);
        break;
      case 'recommended':
      default:
        orderBy = desc(products.isFeatured);
        break;
    }

    const parsedLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
    const parsedOffset = Math.max(Number(offset) || 0, 0);

    const items = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(parsedLimit)
      .offset(parsedOffset);

    // Total count for pagination
    const countResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(products)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    res.json({
      items,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + items.length < total,
    });
  } catch (error: any) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product by slug or id
router.get('/:slugOrId', async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;
    const isNumericId = !isNaN(Number(slugOrId));

    let productResult;
    if (isNumericId) {
      productResult = await db
        .select()
        .from(products)
        .where(eq(products.id, Number(slugOrId)));
    } else {
      productResult = await db
        .select()
        .from(products)
        .where(eq(products.slug, slugOrId));
    }

    if (productResult.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult[0];

    // Fetch related products from same category
    const related = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.category, product.category),
          sql`${products.id} != ${product.id}`
        )
      )
      .limit(4);

    // Fetch approved reviews
    const productReviews = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, product.id),
          eq(reviews.status, 'approved')
        )
      )
      .orderBy(desc(reviews.createdAt));

    res.json({
      product,
      related,
      reviews: productReviews,
    });
  } catch (error: any) {
    console.error('Failed to fetch product details:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// POST create product (Admin)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.name || !data.price || !data.category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' +
        Date.now().toString(36);

    const [newProduct] = await db
      .insert(products)
      .values({
        name: data.name,
        slug,
        sku: data.sku || 'SKU-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        description: data.description || '',
        shortDescription: data.shortDescription || '',
        price: String(data.price),
        salePrice: data.salePrice ? String(data.salePrice) : null,
        images: typeof data.images === 'string' ? data.images : JSON.stringify(data.images || []),
        category: data.category,
        subcategory: data.subcategory || null,
        brand: data.brand || 'AURA',
        variants: typeof data.variants === 'string' ? data.variants : JSON.stringify(data.variants || []),
        sizes: typeof data.sizes === 'string' ? data.sizes : JSON.stringify(data.sizes || []),
        colors: typeof data.colors === 'string' ? data.colors : JSON.stringify(data.colors || []),
        stock: Number(data.stock) || 0,
        lowStockThreshold: Number(data.lowStockThreshold) || 5,
        specifications: typeof data.specifications === 'string' ? data.specifications : JSON.stringify(data.specifications || {}),
        tags: typeof data.tags === 'string' ? data.tags : JSON.stringify(data.tags || []),
        isFeatured: Boolean(data.isFeatured),
        isBestseller: Boolean(data.isBestseller),
      })
      .returning();

    res.status(201).json(newProduct);
  } catch (error: any) {
    console.error('Failed to create product:', error);
    res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

// PUT update product (Admin)
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    const [updated] = await db
      .update(products)
      .set({
        name: data.name,
        sku: data.sku,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price ? String(data.price) : undefined,
        salePrice: data.salePrice ? String(data.salePrice) : null,
        images: typeof data.images === 'string' ? data.images : data.images ? JSON.stringify(data.images) : undefined,
        category: data.category,
        subcategory: data.subcategory,
        brand: data.brand,
        variants: typeof data.variants === 'string' ? data.variants : data.variants ? JSON.stringify(data.variants) : undefined,
        sizes: typeof data.sizes === 'string' ? data.sizes : data.sizes ? JSON.stringify(data.sizes) : undefined,
        colors: typeof data.colors === 'string' ? data.colors : data.colors ? JSON.stringify(data.colors) : undefined,
        stock: data.stock !== undefined ? Number(data.stock) : undefined,
        lowStockThreshold: data.lowStockThreshold !== undefined ? Number(data.lowStockThreshold) : undefined,
        specifications: typeof data.specifications === 'string' ? data.specifications : data.specifications ? JSON.stringify(data.specifications) : undefined,
        tags: typeof data.tags === 'string' ? data.tags : data.tags ? JSON.stringify(data.tags) : undefined,
        isFeatured: data.isFeatured !== undefined ? Boolean(data.isFeatured) : undefined,
        isBestseller: data.isBestseller !== undefined ? Boolean(data.isBestseller) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update product:', error);
    res.status(500).json({ error: error.message || 'Failed to update product' });
  }
});

// DELETE product (Admin)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await db.delete(products).where(eq(products.id, id));
    res.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to delete product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
