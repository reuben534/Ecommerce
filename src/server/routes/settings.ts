import { Router, Request, Response } from 'express';
import { db } from '../../db/index.ts';
import { storeSettings } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../middleware/auth.ts';

const router = Router();

// Default store config values
const defaultSettings: Record<string, string> = {
  storeName: 'AURA Minimal Goods',
  announcementBar: 'Complimentary express shipping on orders over $150. Use code WELCOME10 for 10% off.',
  heroTitle: 'Architectural Elegance for Modern Living',
  heroSubtitle: 'Curated minimalist goods crafted from pure ceramic, solid brass, and sustainably sourced woods.',
  contactEmail: 'concierge@auragoods.com',
  contactPhone: '+1 (800) 555-0199',
  freeShippingThreshold: '150.00',
  currency: 'USD',
  currencySymbol: '$',
};

// GET store settings (public)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const list = await db.select().from(storeSettings);
    const result: Record<string, string> = { ...defaultSettings };

    for (const item of list) {
      result[item.key] = item.value;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Failed to get settings:', error);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

// PUT store settings (Admin)
router.put('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    if (typeof updates !== 'object' || updates === null) {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }

    for (const [key, val] of Object.entries(updates)) {
      const stringVal = typeof val === 'string' ? val : JSON.stringify(val);
      const existing = await db
        .select()
        .from(storeSettings)
        .where(eq(storeSettings.key, key));

      if (existing.length > 0) {
        await db
          .update(storeSettings)
          .set({ value: stringVal, updatedAt: new Date() })
          .where(eq(storeSettings.key, key));
      } else {
        await db.insert(storeSettings).values({
          key,
          value: stringVal,
        });
      }
    }

    // Return merged settings
    const list = await db.select().from(storeSettings);
    const result: Record<string, string> = { ...defaultSettings };
    for (const item of list) {
      result[item.key] = item.value;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ error: 'Failed to update store settings' });
  }
});

export default router;
