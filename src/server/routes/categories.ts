import { Router, Request, Response } from 'express';
import { db } from '../../db/index.ts';
import { categories, brands, products } from '../../db/schema.ts';
import { eq, sql } from '../../db/index.ts';
import { requireAdmin } from '../../middleware/auth.ts';

const router = Router();

// GET all categories with product count
router.get('/', async (_req: Request, res: Response) => {
  try {
    const allCategories = await db.select().from(categories);

    // Get count per category
    const countResults = await db
      .select({
        category: products.category,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(products)
      .groupBy(products.category);

    const countMap = new Map<string, number>();
    for (const c of countResults) {
      if (c.category) countMap.set(c.category, c.count);
    }

    const categoriesWithCount = allCategories.map((cat) => ({
      ...cat,
      productCount: countMap.get(cat.name) || 0,
    }));

    res.json(categoriesWithCount);
  } catch (error: any) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET all brands
router.get('/brands', async (_req: Request, res: Response) => {
  try {
    const allBrands = await db.select().from(brands);
    res.json(allBrands);
  } catch (error: any) {
    console.error('Failed to fetch brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// POST add category (Admin)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, image } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const [newCat] = await db
      .insert(categories)
      .values({
        name,
        slug,
        description,
        image,
      })
      .returning();

    res.status(201).json(newCat);
  } catch (error: any) {
    console.error('Failed to create category:', error);
    res.status(500).json({ error: error.message || 'Failed to create category' });
  }
});

export default router;
