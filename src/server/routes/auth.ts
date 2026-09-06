import { Router, Response } from 'express';
import { db } from '../../db/index.ts';
import { users, orders, addresses } from '../../db/schema.ts';
import { eq, sql } from 'drizzle-orm';
import { optionalAuth, requireAuth, AuthRequest } from '../../middleware/auth.ts';

const router = Router();

// GET current authenticated user profile
router.get('/me', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.uid) {
      return res.json({ authenticated: false, user: null });
    }

    const userUid = req.user.uid;
    const dbUserResult = await db.select().from(users).where(eq(users.uid, userUid));

    let dbUser = dbUserResult[0];
    if (!dbUser) {
      // Sync immediately
      const [newUser] = await db
        .insert(users)
        .values({
          uid: userUid,
          email: req.user.email || 'customer@auragoods.com',
          name: req.user.name || 'Valued Customer',
          avatar: req.user.picture || null,
          role: 'user',
        })
        .returning();
      dbUser = newUser;
    }

    // Get order count
    const orderCountResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(orders)
      .where(eq(orders.userUid, userUid));

    // Get addresses count
    const addressCountResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(addresses)
      .where(eq(addresses.userUid, userUid));

    res.json({
      authenticated: true,
      user: {
        id: dbUser.id,
        uid: dbUser.uid,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        avatar: dbUser.avatar,
        createdAt: dbUser.createdAt,
        orderCount: orderCountResult[0]?.count || 0,
        addressCount: addressCountResult[0]?.count || 0,
      },
    });
  } catch (error: any) {
    console.error('Failed to get current user:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Switch / Toggle demo admin mode (convenient for testing store management & admin dashboard)
router.post('/toggle-admin-role', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userUid = req.user!.uid;
    const current = await db.select().from(users).where(eq(users.uid, userUid));
    if (current.length === 0) return res.status(404).json({ error: 'User not found' });

    const newRole = current[0].role === 'admin' ? 'user' : 'admin';
    const [updated] = await db
      .update(users)
      .set({ role: newRole })
      .where(eq(users.uid, userUid))
      .returning();

    res.json({ success: true, role: updated.role });
  } catch (error: any) {
    console.error('Failed to toggle admin role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

export default router;
