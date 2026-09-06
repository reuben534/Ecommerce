import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from '../db/index.ts';
import { AuthTokenPayload, verifyAuthToken } from '../server/auth-token.ts';

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
  dbUser?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = verifyAuthToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    req.user = decodedToken;

    // Get or upsert user in DB
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.uid, decodedToken.uid));

    if (existing.length > 0) {
      req.dbUser = existing[0];
    } else {
      const email = decodedToken.email || '';
      const isAdmin =
        email.toLowerCase() === 'reuben534@gmail.com' ||
        email.toLowerCase().includes('admin');
      const [newUser] = await db
        .insert(users)
        .values({
          uid: decodedToken.uid,
          email,
          name: decodedToken.name || email.split('@')[0],
          avatar: decodedToken.picture || '',
          role: isAdmin ? 'admin' : 'customer',
        })
        .returning();
      req.dbUser = newUser;
    }

    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = verifyAuthToken(token);
    if (!decodedToken) return next();
    req.user = decodedToken;

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.uid, decodedToken.uid));

    if (existing.length > 0) {
      req.dbUser = existing[0];
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, () => {
    if (req.dbUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
};
