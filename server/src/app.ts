import express from 'express';
import pool from './db/pool.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import productsRouter from './routes/products.js';

/**
 * Builds the Express app without binding a port, so tests (Phase B2) can
 * mount it with supertest. `index.ts` is the only place that listens.
 */
export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({ ok: true });
  });

  // CI polls this before starting E2E tests, so it reports DB reachability
  // rather than just "the process is up".
  app.get('/api/health', async (_req, res) => {
    let db = false;
    try {
      await pool.query('SELECT 1');
      db = true;
    } catch {
      db = false;
    }
    res.status(db ? 200 : 503).json({ ok: true, db });
  });

  app.use('/api/products', productsRouter);

  // Order matters: unmatched /api routes 404 as JSON, then the terminal
  // error handler converts thrown HttpErrors into responses.
  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
