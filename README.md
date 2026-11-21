# FootyLab

A full-stack football-jersey shop built as a work sample: browse and filter a
catalogue, sign up, add to a cart that survives logout, and check out into a
real order. Nothing is sold and nothing is charged.

**Live demo: <https://footylab-demo.vercel.app>** — [API docs](https://footylab-demo.vercel.app/api-docs)
· [health check](https://footylab-demo.vercel.app/api/health)

It is a public demo on one shared database, so sign up with a throwaway email
and treat anything you create there as disposable.

## Quickstart

Needs **Node 26** (`.nvmrc`; `engines` requires ≥22) and **Docker** for
PostgreSQL 16.

```bash
git clone https://github.com/wesleycheungg/footylab.git
cd footylab
npm install

cp server/.env.example server/.env     # defaults match docker-compose.yml
docker compose up -d --wait            # PostgreSQL on :5432
npm run db:setup                       # creates tables, seeds 20 jerseys

npm run dev                            # API :3000, web app :5173
```

Open <http://localhost:5173>. API docs are at <http://localhost:3000/api-docs>.

`db:setup` is idempotent — re-run it to reset the catalogue. It will not delete
your accounts.

## Configuration

Server config is environment variables in `server/.env`, loaded by Node's
built-in `--env-file`. The client needs none: it calls relative `/api` paths,
which Vite proxies to the API, so session cookies work without CORS.

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/footylab` | The only required variable. |
| `SESSION_SECRET` | `change-me-in-production` | Signs session cookies. The server refuses to start in production if unset. |
| `PORT` | `3000` | Change it and you must change the proxy target in `client/vite.config.ts` too. |

## Project structure

An npm-workspaces monorepo; `npm run dev` starts both halves.

```
server/          Express + TypeScript API
  src/routes/    auth, products, cart, orders — one file per resource
  src/db/        schema.sql (the single source of truth) and the seed script
  src/money.ts   the shipping rule, in one place, imported by cart and orders
  openapi.yaml   the API spec served at /api-docs
client/          React 19 + Vite, plain CSS
  src/contexts/  user and cart state; each split into context + provider
  src/pages/     one per route
  src/api.ts     the only module that calls fetch
PLAN.md          the build plan, phase by phase, with what was verified
```

Two conventions worth knowing: money is always an integer number of cents in a
`*_cents` field and totals are calculated server-side only; ownership checks
scope the SQL by `user_id` and return 404 rather than 403, so the API never
confirms another account's record exists.

## Tech stack

TypeScript throughout. **Server:** Node 26, Express 4, PostgreSQL 16 via `pg`
(no ORM — the SQL is the point), `express-session` with `connect-pg-simple`,
`bcrypt`, `helmet`, `express-rate-limit`. **Client:** React 19, Vite 8, React
Router 6, no UI or CSS framework.

## Licence

MIT. Not affiliated with any club or league; no real products are sold.
