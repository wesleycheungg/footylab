import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import { load } from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import pool from './db/pool.js';
import { createSessionMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import productsRouter from './routes/products.js';

/**
 * The spec lives next to the source as YAML so it stays readable and
 * diffable. One directory up from this module resolves to `server/` whether
 * running from `src` under tsx or from the compiled `dist`, so the file does
 * not need copying into the build.
 */
function loadOpenApiSpec(): object {
  const here = dirname(fileURLToPath(import.meta.url));
  const specPath = join(here, '..', 'openapi.yaml');
  return load(readFileSync(specPath, 'utf-8')) as object;
}

/**
 * Builds the Express app without binding a port, so tests (Phase B2) can
 * mount it with supertest. `index.ts` is the only place that listens.
 */
export function createApp() {
  const app = express();

  if (process.env.NODE_ENV === 'production') {
    // Required for `secure` cookies to be set when TLS terminates upstream;
    // without it Express sees plain HTTP and silently drops the cookie.
    app.set('trust proxy', 1);
  }

  app.use(
    helmet({
      // The API serves JSON only, and the Vite dev server sets its own CSP
      // for the app; helmet's default policy here would just block the dev
      // client without protecting anything.
      contentSecurityPolicy: false,
    })
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(createSessionMiddleware());

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

  // Mounted before the /api routers, but on its own path — Express matches
  // mount paths on segment boundaries, so "/api-docs" never collides with
  // the "/api" JSON 404 handler below.
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(loadOpenApiSpec(), {
      customSiteTitle: 'FootyLab API',
      // "Try it out" has to send the session cookie or every authenticated
      // endpoint would 401 from the docs page.
      swaggerOptions: { withCredentials: true, persistAuthorization: true },
    })
  );

  app.use('/api/auth', authRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/products', productsRouter);

  // Order matters: unmatched /api routes 404 as JSON, then the terminal
  // error handler converts thrown HttpErrors into responses.
  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}
