/**
 * Vercel entry point.
 *
 * Additive by design: `server/src/index.ts` remains the only thing that calls
 * `app.listen()`, and `npm run dev` / `npm start` are untouched. This file is
 * the deployment's equivalent of `index.ts` — it builds the app and hands it to
 * the platform instead of binding a port.
 *
 * `.mjs` rather than `.js`: the root package.json sets no `"type"`, so Vercel
 * compiles ES module syntax in a `.js` handler down to CommonJS, and a
 * CommonJS `require()` of `server/dist/app.js` — which is ESM — fails at
 * runtime.
 *
 * Imports the compiled output rather than the sources: the server is NodeNext
 * ESM and its relative imports carry `.js` extensions, which the function
 * bundler will not resolve back to `.ts` files. `npm run build --workspaces`
 * produces `server/dist` during the build command.
 */
import { createApp } from '../server/dist/app.js';

/**
 * Vercel does not set NODE_ENV for functions — it is normally set by a
 * framework, and this project declares none. Without it the app would run with
 * non-secure cookies, no `trust proxy`, and the SESSION_SECRET guard disarmed,
 * on an HTTPS origin behind a proxy.
 *
 * Set here rather than as a project environment variable: that value would also
 * apply during the build, where NODE_ENV=production risks the installer
 * omitting devDependencies (typescript, vite, tsx) that the build needs.
 *
 * Safe after the static import above. The only two readers of NODE_ENV in the
 * server are inside createApp() and createSessionMiddleware(); neither runs in
 * a module body, so nothing has observed it yet.
 */
process.env.NODE_ENV ??= 'production';

// An Express app is itself an (req, res) handler, which is what the Node.js
// runtime expects from a default export.
export default createApp();
