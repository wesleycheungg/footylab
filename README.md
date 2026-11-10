# FootyLab

A full-stack football-jersey shop built as a work sample: browse and filter a
catalogue, sign up, add to a cart that survives logout, and check out into a
real order. It is not a product and not a library — there is nothing to install
as a dependency and nothing is sold. It exists so the decisions behind it can be
read: a Postgres schema with real constraints, session auth with bcrypt,
transactional order creation, optimistic cart updates with rollback, and an
OpenAPI spec that is checked against the running API rather than maintained on
trust. If you want to see how the pieces fit, the fastest route is to run it
locally — about two minutes — and then read `server/src/routes/`.

## Prerequisites

- **Node 26** (`.nvmrc`; `engines` requires ≥22)
- **Docker** — runs PostgreSQL 16; nothing else needs installing
- macOS or Linux

## Quickstart

```bash
git clone https://github.com/wesleycheungg/footylab.git
cd footylab
npm install

cp server/.env.example server/.env     # defaults match docker-compose.yml
docker compose up -d --wait            # PostgreSQL on :5432
npm run db:setup                       # creates tables, seeds 20 jerseys

npm run dev                            # API :3000, web app :5173
```

Open <http://localhost:5173>. The API is on <http://localhost:3000>, and the
browsable docs are at <http://localhost:3000/api-docs>.

`db:setup` is idempotent — re-run it any time to reset the catalogue to its
seeded state. It will not delete your accounts.

Checking the stack without the browser:

```bash
# Is the service up and can it reach the database?
curl localhost:3000/api/health
# {"ok":true,"db":true}

# Filters combine; an unknown value is rejected rather than ignored
curl 'localhost:3000/api/products?league=La%20Liga&size=M&sort=price-asc'

# Sign up, then read the session back using a cookie jar
curl -c jar -X POST localhost:3000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"password123"}'

curl -b jar localhost:3000/api/auth/me
# {"id":3,"email":"you@example.com"}
```

## Configuration

All server configuration is environment variables in `server/.env`, loaded by
Node's built-in `--env-file` (there is no `dotenv` dependency). The client needs
no configuration: it calls relative `/api` paths, which the Vite dev server
proxies to the API, so the browser sees one origin and session cookies work
without CORS.

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/footylab` | Matches `docker-compose.yml`. The only required variable. |
| `SESSION_SECRET` | `change-me-in-production` | Signs session cookies. The server **refuses to start** in production if it is unset, rather than falling back to a guessable key. |
| `PORT` | `3000` | API port. Change it and you must change the proxy target in `client/vite.config.ts` too. |

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

Two conventions worth knowing before reading the code. Money is always an
integer number of cents in a `*_cents` field, and totals are calculated by the
server only. Ownership checks scope the SQL query by `user_id` and return 404
rather than 403, so the API never confirms that another account's record exists.

## Tech stack

TypeScript throughout. **Server:** Node 26, Express 4, PostgreSQL 16 via `pg`
(no ORM — the SQL is the point), `express-session` with `connect-pg-simple`,
`bcrypt`, `helmet`, `express-rate-limit`. **Client:** React 19, Vite 8, React
Router 6, no UI or CSS framework.

## Documentation

- **API reference:** <http://localhost:3000/api-docs> (Swagger UI) or
  [`server/openapi.yaml`](server/openapi.yaml)
- **Build log and decisions:** [`PLAN.md`](PLAN.md)
- **Full docs:** _TODO — link once published_

## Licence

MIT. Not affiliated with any club or league; no real products are sold.
