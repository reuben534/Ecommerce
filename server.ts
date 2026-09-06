import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectMongo, db } from './src/db/index.ts';
import { products } from './src/db/schema.ts';
import { seedDatabase } from './src/db/seed.ts';

// Route imports
import productsRouter from './src/server/routes/products.ts';
import categoriesRouter from './src/server/routes/categories.ts';
import cartRouter from './src/server/routes/cart.ts';
import wishlistRouter from './src/server/routes/wishlist.ts';
import checkoutRouter from './src/server/routes/checkout.ts';
import ordersRouter from './src/server/routes/orders.ts';
import couponsRouter from './src/server/routes/coupons.ts';
import reviewsRouter from './src/server/routes/reviews.ts';
import addressesRouter from './src/server/routes/addresses.ts';
import adminRouter from './src/server/routes/admin.ts';
import settingsRouter from './src/server/routes/settings.ts';
import authRouter from './src/server/routes/auth.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  await connectMongo();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Seed database automatically if empty on boot
  try {
    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0) {
      console.log('Database is empty. Running initial store seeding...');
      await seedDatabase();
      console.log('Initial store seeding completed successfully.');
    } else {
      console.log('Database already contains products. Skipping seed.');
    }
  } catch (seedErr) {
    console.error('Notice during auto-seed verification:', seedErr);
  }

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/products', productsRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/wishlist', wishlistRouter);
  app.use('/api/checkout', checkoutRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/coupons', couponsRouter);
  app.use('/api/reviews', reviewsRouter);
  app.use('/api/addresses', addressesRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/auth', authRouter);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`E-Commerce Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
