import { Router, Response } from 'express';
import { db } from '../../db/index.ts';
import { addresses } from '../../db/schema.ts';
import { eq, and } from '../../db/index.ts';
import { requireAuth, AuthRequest } from '../../middleware/auth.ts';

const router = Router();

// GET user addresses
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;
    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userUid, userUid));

    res.json(userAddresses);
  } catch (error: any) {
    console.error('Failed to get addresses:', error);
    res.status(500).json({ error: 'Failed to retrieve addresses' });
  }
});

// POST add address
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;
    const { fullName, street, city, state, postalCode, country, phone, isDefault } = req.body;

    if (!fullName || !street || !city || !state || !postalCode || !country || !phone) {
      return res.status(400).json({ error: 'All address fields are required.' });
    }

    if (isDefault) {
      // Clear existing default
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userUid, userUid));
    }

    const [newAddress] = await db
      .insert(addresses)
      .values({
        userId: req.dbUser?.id,
        userUid,
        fullName,
        street,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault: Boolean(isDefault),
      })
      .returning();

    res.status(201).json(newAddress);
  } catch (error: any) {
    console.error('Failed to save address:', error);
    res.status(500).json({ error: 'Failed to save address' });
  }
});

// PUT update address
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userUid = req.user!.uid;
    const { fullName, street, city, state, postalCode, country, phone, isDefault } = req.body;

    if (isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userUid, userUid));
    }

    const [updated] = await db
      .update(addresses)
      .set({
        fullName,
        street,
        city,
        state,
        postalCode,
        country,
        phone,
        isDefault: Boolean(isDefault),
      })
      .where(and(eq(addresses.id, id), eq(addresses.userUid, userUid)))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Failed to update address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// DELETE address
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const userUid = req.user!.uid;

    await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.userUid, userUid)));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

export default router;
