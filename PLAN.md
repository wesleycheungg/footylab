# FootyLab: Full-Stack Soccer Jersey E-Commerce Site

**Portfolio project** to demonstrate full-stack development (TypeScript, React, Express, PostgreSQL) and QA/SDET skills (unit tests, API tests, E2E with Playwright, CI/CD).

---

## Project Overview

FootyLab is a clean, minimal jersey shop selling authentic club and national team kits. Users can sign up, browse products with filters and search, add to a cart, and checkout with a fake card form. No real payments; orders go into the database. The design is Allbirds-style: warm grays, pill buttons, warm green accents, and a focus on product cards and usability.

---

## Current State

**Last updated:** 2026-11-09

| | |
|---|---|
| **Done** | Phases 1, 2, 3, 4a, 4b, 5 (all verified end to end) |
| **Next** | Phase 6 — Authentication (signup, login, sessions) |

**Verified vs. assumed — read this before trusting any ✅ below:**

- Phase 2 is **fully verified against a live database.** Schema applied, 20 products seeded with ids 1–20, re-seed confirmed idempotent, CHECK constraints confirmed to reject bad data.
- Docker is installed and `footylab-postgres` runs on :5432 (`docker compose up -d --wait`).
- The server builds, boots, loads `.env`, and answers `GET /` and `GET /api/health` (`{"ok":true,"db":true}`). The Vite dev proxy is confirmed to reach Express.
- Phase 3's products endpoints are **verified against real data**, including filter combinations, input validation, LIKE escaping, and a parameterized-query injection probe.
- The app shell is live and checked in a real browser: routing, header, footer, API client, and the 404 paths.
- The shop page is complete: sidebar filters, search, sort, responsive grid, loading skeletons and an empty state, all driven by the URL.
- The product detail page is complete: gallery, size grid, quantity stepper, expandable sections.
- **`useCart` is a placeholder** — nothing persists. Phase 8 replaces its body with a real `POST /api/cart`; the signature is meant to survive that.
- Phase 4b also finished **Phase 10's URL-state, loading and no-results tasks** early — see the strikethroughs there.
- **Nothing in Phase 6+ has been started.** Those checkboxes are plans, not results.

**Actual installed versions** (keep this table honest — it is the first thing a new contributor or agent reads):

| Package | Version |
|---|---|
| Node | 26 (pinned in `.nvmrc`, `engines.node >=22`) |
| React / react-dom | 19.3.1 |
| react-router-dom | 6.20.1 |
| Vite | 8.3.6 |
| TypeScript | 7.0.2 (both workspaces) |
| Linter | **oxlint** 1.90 (not eslint/prettier) |
| Express | 4.18 |
| pg | 8.11 |
| TS runner | **tsx** (not ts-node) |
| PostgreSQL | 16-alpine |

> If you have a server running from before 2026-11-09, restart it. The old
> `node --loader ts-node/esm` dev command has been removed.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Vite 8 + React 19 + TypeScript 7 + React Router v6 + plain CSS |
| **Backend** | Node.js 26 + Express + TypeScript (run via `tsx`) |
| **Database** | PostgreSQL 16 (via Docker Compose) |
| **SQL** | Plain SQL (no ORM); `pg` client library |
| **Dev tools** | Docker Compose, oxlint, OpenAPI/Swagger |
| **Testing (Phase B)** | Vitest, supertest, Playwright, axe, k6 |
| **CI/CD (Phase B)** | GitHub Actions |

---

## Data Model

### users
- `id` (integer, primary key)
- `email` (text, unique)
- `password_hash` (text)
- `created_at` (timestamp)

### products
- `id` (integer, primary key)
- `name` (text)
- `team` (text)
- `league` (text)
- `kit_type` (text) — CHECK in (Home, Away, Third, Retro)
- `price_cents` (integer) — CHECK > 0
- `primary_color` (text) — e.g., "#DC0000"
- `trim_color` (text) — e.g., "#FFFFFF"
- `sold_out_sizes` (text) — e.g., "S,L" (comma-separated or empty)
- `created_at` (timestamp)

> **On `sold_out_sizes` being a CSV string:** this is a deliberate simplicity
> tradeoff, not an oversight. There is no per-size stock count anywhere in this
> project, so a `product_sizes` join table would add a layer without adding
> information. The cost is that size filtering needs a delimiter-padded
> predicate so `'S'` cannot match `'XS'`:
>
> ```sql
> AND ',' || sold_out_sizes || ',' NOT LIKE '%,' || $1 || ',%'
> ```
>
> Use exactly that predicate everywhere a size filter is needed, rather than
> re-inventing it per phase.

### cart_items
- `id` (integer, primary key)
- `user_id` (integer, foreign key)
- `product_id` (integer, foreign key)
- `size` (text) — CHECK in (S, M, L, XL)
- `quantity` (integer) — CHECK > 0
- `created_at` (timestamp)
- **unique constraint:** `(user_id, product_id, size)`

### orders
- `id` (integer, primary key)
- `user_id` (integer, foreign key)
- `subtotal_cents` (integer) — must equal `SUM(order_items.price_cents * quantity)` exactly
- `shipping_cents` (integer) — 0 at or above the free-shipping threshold, flat fee below it
- `total_cents` (integer) — `subtotal_cents + shipping_cents`
- `shipping_name` (text)
- `shipping_email` (text)
- `shipping_address` (text)
- `shipping_city` (text)
- `shipping_state` (text)
- `shipping_zip` (text)
- `created_at` (timestamp)

> **Money is stored as a breakdown, not one number, and there is no tax.**
> A single `total_cents` cannot express "free shipping over $150" — you could
> not tell whether a stored total included shipping, so orders would never
> reconcile against their items. Tax was dropped outright: it was undecided in
> three places in earlier drafts and would have added churn to every
> order-total assertion in Phase B2 for no learning value.

### order_items
- `id` (integer, primary key)
- `order_id` (integer, foreign key)
- `product_id` (integer, foreign key)
- `size` (text) — CHECK in (S, M, L, XL)
- `quantity` (integer) — CHECK > 0
- `price_cents` (integer) — locked price at time of order

---

## API Routes (Express)

### Health
- `GET /api/health` — returns `{ok: true, db: <bool>}`; 200 when the DB is reachable, 503 when not. CI polls this before starting E2E tests. **Implemented.**

### Authentication
- `POST /api/auth/signup` — email, password → creates user, returns session cookie
- `POST /api/auth/login` — email, password → validates, returns session cookie
- `POST /api/auth/logout` — clears session
- `GET /api/auth/me` — returns logged-in user or 401

### Products
- `GET /api/products` — query params: `team`, `league`, `kit`, `size`, `q` (search), `sort` (featured, price-asc, price-desc)
- `GET /api/products/:id` — single product details

### Cart (requires logged-in user)
- `GET /api/cart` — returns array of cart items with product details
- `POST /api/cart` — body: `{productId, size, quantity}` → adds/updates item
- `PATCH /api/cart/:itemId` — body: `{quantity}` → updates quantity
- `DELETE /api/cart/:itemId` — removes item

### Orders (requires logged-in user)
- `POST /api/orders` — body: shipping form only (**never card data**) → creates order, clears cart, returns order ID
- `GET /api/orders` — returns user's orders (id, total, created_at)
- `GET /api/orders/:id` — returns order detail with order_items; **scoped by `user_id` in the WHERE clause**, so another user's order returns **404, not 403** (403 would leak that the order exists)

---

## Frontend Routes

| Path | Page | Auth |
|------|------|------|
| `/` | ShopPage (all jerseys) | public |
| `/jerseys` | ShopPage (filters via query params) | public |
| `/products/:id` | ProductPage | public |
| `/login`, `/signup` | LoginPage, SignupPage | public |
| `/checkout` | CheckoutPage | **protected** |
| `/orders` | OrderHistoryPage | **protected** |
| `/orders/:id` | OrderDetailPage / OrderConfirmationPage | **protected** |

Header nav links (Clubs, National Teams, Retro, New Arrivals) are **filter
presets on `/jerseys`**, not separate pages — e.g. `/jerseys?kit=Retro`,
`/jerseys?league=International`. The cart is a drawer overlay, not a route.

---

## Design Direction

### Colors & Typography
- **Page background:** white (`#FFFFFF`)
- **Image backgrounds:** warm gray (`#F3F1EC`)
- **Text:** near-black (`#212121`)
- **Accent:** warm green (`#1E5A3C`)
- **Button style:** pill-shaped, outlined or filled
- **Fonts:** Space Grotesk (headings), Inter (body) — Google Fonts

### Layout
- **Announcement bar:** thin black banner at top ("Free shipping on orders over $150 · Free 30-day returns")
- **Header:** logo, nav links (Clubs, National Teams, Retro, New Arrivals), search icon, account icon, cart icon with count
- **Shop page:** left sidebar filters (league chips, size pills, kit checkboxes), breadcrumb + title + intro copy, result count and sort on right, product grid (4 columns on desktop, 2 on tablet, 1 on mobile)
- **Product cards:** large jersey SVG, badge in corner (New, Retro, Sold out), name, kit + league, price; on hover, show quick-add size buttons (sold-out sizes crossed out)
- **Product detail page:** large image with 4 thumbnails below, right panel with color swatches, size grid, quantity stepper, full-width Add to Cart button (disabled until size selected), expandable Details/Fit/Shipping sections
- **Touch targets:** 44px minimum; real buttons with labels

### Footer
- Four columns: Shop (Clubs, National Teams, Retro, Gift Cards), Help (Size Guide, Shipping, Returns, Contact), FootyLab (Our Story, Order History, Account), Email signup
- **Disclaimer:** "© 2026 FootyLab. Portfolio project. Not affiliated with any club or league. No real products sold."

---

## Phase 1: Project Setup & Database ✅

**Goal:** Spin up a monorepo with TypeScript, Vite frontend, Express backend, and PostgreSQL in Docker.

**What you'll learn:**
- Monorepo structure (client and server folders)
- Docker Compose for local PostgreSQL
- TypeScript configuration across frontend and backend
- Git basics and .gitignore setup

**Tasks:**
- [x] Initialize git repo (`git init`) and create `.gitignore` (node_modules, .env, dist, build, .DS_Store)
- [x] Create `/client` folder with Vite + React + TypeScript scaffold
- [x] Create `/server` folder with Express + TypeScript scaffold
- [x] Create `docker-compose.yml` to spin up PostgreSQL (port 5432, POSTGRES_PASSWORD=postgres, POSTGRES_DB=footylab)
- [x] Create `server/.env.example` (DATABASE_URL, NODE_ENV, PORT)
- [x] Create `server/tsconfig.json` with target ES2020
- [x] Create `client/tsconfig.json` with React JSX settings
- [x] Add npm scripts to root `package.json` for install, dev (runs both), build, start

**Files created or changed:**
- `.gitignore`
- `docker-compose.yml`
- `package.json` (root)
- `client/package.json`, `client/tsconfig.json`, `client/vite.config.ts`, `client/index.html`
- `server/package.json`, `server/tsconfig.json`, `server/src/index.ts` (empty Express app)
- `server/.env.example`

**Done when:** ✅
- ✅ `npm install` installs dependencies
- ✅ `npm run dev` starts both frontend (http://localhost:5173) and backend (http://localhost:3000)
- ✅ Vite page loads with default React template
- ✅ Express responds to `curl http://localhost:3000/` with JSON `{ok: true}`

**Resume skill:** Docker, Vite, TypeScript project setup

---

## Phase 2: Database Schema & Seed Script ✅

**Goal:** Create tables for users, products, cart, and orders; seed ~20 jerseys.

**What you'll learn:**
- PostgreSQL schema design and constraints
- Seeding with Node.js + SQL
- Environment variable management

**Tasks:**
- [x] Create `server/src/db/schema.sql` with CREATE TABLE statements for users, products, cart_items, orders, order_items
  - Add indices: users(email), cart_items(user_id), orders(user_id), order_items(order_id)
  - Add check constraints: price_cents > 0, quantity > 0
  - Add foreign keys with CASCADE/RESTRICT where appropriate
- [x] Create `server/src/db/pool.ts` (PostgreSQL connection pool using `pg` library)
- [x] Create `server/src/db/seed.ts` — hardcoded array of ~20 products (Arsenal, Man City, Liverpool, Real Madrid, Barca, Inter, AC Milan, Bayern, Argentina, Brazil, France, USA, Man United 1999, etc.)
- [x] Script should read `.env` DATABASE_URL and run schema + seed
  - Loaded via Node's built-in `--env-file=.env`, **not** the `dotenv` package
- [x] Add `npm run db:setup` to server package.json
- [x] Seed must be **idempotent** — `TRUNCATE ... RESTART IDENTITY CASCADE` inside a transaction before inserting, so IDs stay stable and re-running doesn't duplicate rows (the UI and E2E tests reference `/products/1`)
- [x] Fail with a readable message, not a raw stack trace, when Postgres isn't running

**Files created or changed:**
- `server/src/db/schema.sql` — 5 tables with CHECK constraints, UNIQUE constraints, and indices
- `server/src/db/pool.ts` — PostgreSQL connection pool with error handling
- `server/src/db/seed.ts` — 20 products across 5 leagues; idempotent (truncates before seeding)
- `server/src/db/index.ts` — export pool
- `server/package.json` (updated) — `@types/pg`, `tsx`
- `server/.env` / `.env.example` — `DATABASE_URL`, `NODE_ENV`, `PORT`, `SESSION_SECRET`

**Done when** — ✅ **all verified against a live database on 2026-11-09.**
Compiling was never the bar; these are the real criteria:

- [x] `docker compose up -d --wait` → Postgres container reports healthy
- [x] `npm run db:setup` exits 0 and prints "Seeded 20 products"
- [x] `SELECT count(*) FROM products` → exactly **20**, with ids 1–20 (so `/products/1` resolves)
- [x] **Ran `npm run db:setup` a second time → still 20, not 40** (guards the idempotency fix)
- [x] `curl localhost:3000/api/health` → `{"ok":true,"db":true}` with HTTP 200

Also spot-checked beyond the checklist:

- All 5 tables created; 10 CHECK constraints present
- Constraints actually reject bad data — `kit_type='Goalkeeper'` and `price_cents=-5` are both refused
- Seed spread: Premier League 7, International 5, La Liga 4, Serie A 2, Bundesliga 2

```bash
docker compose up -d
npm run db:setup
npm run db:setup   # must be idempotent
psql -h localhost -U postgres -d footylab -c "SELECT count(*) FROM products"
```

**Resume skill:** Database design, PostgreSQL, seed data

---

## Phase 3: API — Products Endpoint ✅

**Goal:** Build the products list and detail endpoints with filtering and sorting.

**What you'll learn:**
- Express routing and request/response handling
- SQL parameterization and query building
- Filtering and sorting logic
- TypeScript types for API responses

**Tasks:**
- [x] Create `server/src/types.ts` with types: `User`, `Product`, `CartItem`, `Order`, `OrderItem`
  - Plus `Size`/`KitType`/`ProductSort` unions and their runtime arrays, so query validation and the DB CHECK constraints can't drift apart
- [x] Create `server/src/routes/products.ts`
  - GET `/api/products` with query params: `team`, `league`, `kit`, `size`, `q` (search), `sort`
    - Dynamic WHERE built from a `placeholder()` helper, so parameter numbering stays correct for any combination of filters
    - Search by name, team, or league (case-insensitive `ILIKE`); LIKE wildcards in user input are escaped so `q=%` matches literally rather than everything
    - Sort by featured (default, order by id), price-asc, price-desc — **always with `id` as tiebreaker**, since many jerseys share a price and tied rows would otherwise come back in arbitrary order (a flaky-test source in B3)
    - Filter by size — excludes products with that size in `sold_out_sizes`, using the delimiter-padded predicate from the Data Model section
    - Flat `LIMIT 50`. No pagination — there are only 20 products
    - Unknown `kit`/`size`/`sort` values → 400 with the allowed list, rather than silently ignoring the filter
  - GET `/api/products/:id` — single product by ID; 404 if not found, 400 for a non-numeric id
- [x] Create middleware to parse JSON, handle errors
  - `HttpError` + `asyncHandler`, because Express 4 doesn't forward rejected promises — without the wrapper a failed query hangs the request instead of returning 500
- [x] `GET /api/health` → `{ok, db}`
- [x] Wire up routes to Express app

**Files created or changed:**
- `server/src/types.ts`
- `server/src/routes/products.ts`
- `server/src/middleware/errorHandler.ts`
- `server/src/app.ts` (**new** — builds the app without listening)
- `server/src/index.ts` (listens only)

> **Why `app.ts` is split from `index.ts`:** Phase B2 mounts the app with
> supertest, which needs an app that hasn't bound a port. Doing the split now
> avoids refactoring every route import later.

**Done when:** ✅ all verified against the live database on 2026-11-09
- [x] `curl 'http://localhost:3000/api/products'` → JSON array of 20 products
- [x] `?league=Premier%20League` → 7 products (Arsenal, Liverpool, Man City, Man United)
- [x] `?q=Arsenal` → 2 products (Arsenal Home, Arsenal Away)
- [x] `/api/products/1` → single product, all fields
- [x] `/api/products/999` → 404
- [x] All prices are integers (cents), colors are hex codes

Also verified beyond the checklist:

- [x] `sort=price-asc` / `price-desc` return correctly ordered prices
- [x] `size=S` returns 18, excluding the two products with S sold out
- [x] **`L` vs `XL` collision:** a product with `sold_out_sizes='XL'` is still returned by `size=L` and correctly excluded by `size=XL` — this is the case the padded predicate exists for, and no seed row exercises it
- [x] `kit=Goalkeeper`, `sort=bogus`, `size=XXL`, `/products/abc` → 400 with a useful message
- [x] Unmatched `/api/*` → 404 JSON, not an HTML error page
- [x] `q=%` and `q=_` → 0 results (wildcards escaped, not matching everything)
- [x] Filters are case-insensitive and combine (`?league=premier%20league&kit=home` → 3)
- [x] `?team=Arsenal'; DROP TABLE products;--` → `[]`, and `products` still has 20 rows

**Resume skill:** Express API design, SQL filtering, TypeScript types

---

## Phase 4a: Frontend — App Shell ✅

**Goal:** Routing, layout chrome, and the API client — everything the shop page sits inside. Split out from the shop page itself because the two together were ten files across five concerns.

**What you'll learn:**
- React Router setup and layout composition
- Typed fetch wrappers
- CSS custom properties and a design-token baseline

**Tasks:**
- [x] Replace the Vite starter in `client/src/App.tsx` and `main.tsx`; delete `App.css`, `index.css` and the starter assets
- [x] Create `client/src/types.ts` (mirror server types)
  - Timestamps are typed `string`, not `Date` — JSON has no Date type, so `Date` would compile and then fail at runtime on any date method
  - Includes `soldOutSizes()`, `isSoldOut()` and `formatPrice()` helpers so the CSV parsing and cents→dollars conversion live in one place
- [x] Create `client/src/api.ts` — fetch functions: `getProducts(filters)`, `getProduct(id)`, `getHealth()`
  - Requests go to **relative `/api/...` paths**, which the Vite dev proxy forwards to :3000. Do not read `VITE_API_URL` in dev.
  - Every call passes `credentials: 'include'` so session cookies work from Phase 6 onward
  - Error handling is centralized: a typed `ApiError` carrying the HTTP status, so pages can branch on 404 vs. anything else without re-implementing parsing
- [x] Wire up React Router with the route table from the Frontend Routes section above
- [x] Create `client/src/components/Header.tsx` — logo, nav links (as `/jerseys?...` presets), search icon, account icon, cart icon with count (0 until Phase 8)
- [x] Create `client/src/components/Footer.tsx` — four columns + the portfolio disclaimer
- [x] Create `client/src/components/AnnouncementBar.tsx` — thin black banner
- [x] Set up `client/src/styles/global.css`: colors as CSS custom properties, fonts (Google Fonts), reset, breakpoints
- [x] Skip link, visible focus rings, and `prefers-reduced-motion` — cheaper now than retrofitting in Phase B4

**Files created or changed:**
- `client/src/types.ts`, `client/src/api.ts`
- `client/src/components/Header.tsx`, `Footer.tsx`, `AnnouncementBar.tsx`, `Layout.tsx`
- `client/src/pages/ShopPage.tsx`, `ProductPage.tsx`, `PlaceholderPage.tsx`, `NotFoundPage.tsx`
- `client/src/styles/global.css`
- `client/src/App.tsx`, `client/src/main.tsx`, `client/index.html`
- Deleted: `App.css`, `index.css`, `src/assets/*`, `public/icons.svg`

> **Two gotchas worth knowing before Phase 4b:**
>
> 1. The client tsconfig sets **`erasableSyntaxOnly`**, which rejects TypeScript
>    constructor parameter properties (`constructor(readonly x: T)`). Declare
>    and assign fields explicitly. The server tsconfig does not set this, so
>    the same pattern compiles there — easy to trip over when moving code.
> 2. **`NavLink` compares pathname only.** Since every nav link is a preset on
>    `/jerseys`, all four highlighted at once. The header compares the
>    normalized query string instead; reuse `normalizeUrl()` rather than
>    reintroducing `NavLink` for the filter chips in 4b.

**Done when:** ✅ verified in Chrome against the running stack
- [x] App loads with header, announcement bar, and footer on every route
- [x] `/`, `/jerseys`, `/products/18` render without router errors
- [x] No Vite starter content remains (files deleted, no dangling imports)
- [x] Disclaimer footer is visible
- [x] The shop page lists all 20 seeded products through the dev proxy

Also verified beyond the checklist:

- [x] `/products/999` → friendly "That jersey does not exist", driven by `ApiError.status === 404`
- [x] An unknown route → the real not-found page, not a "coming soon" placeholder
- [x] Query presets already work end to end: `?kit=Retro` → 1 jersey, `?league=International` → 5
- [x] Exactly one nav link shows as active per URL
- [x] Below 900px the desktop nav collapses into a scrollable category row
- [x] No console errors or warnings; oxlint clean

**Resume skill:** React Router, component composition, design tokens

---

## Phase 4b: Frontend — Shop Page ✅

**Goal:** Build the product grid page with filters, search, and sorting (no cart or checkout yet).

**What you'll learn:**
- React hooks (useState, useEffect)
- Fetching and deriving filtered data
- CSS grid and responsive layout

**Tasks:**
- [x] Create `client/src/pages/ShopPage.tsx`
  - Breadcrumb (Home / Jerseys)
  - Left sidebar: search box, league chips, size pills, kit checkboxes, "Clear all filters"
  - Main area: title, intro copy, result count, sort dropdown
  - Product grid: 4 columns on desktop, 2 on tablet, 1 on mobile
  - Loading skeletons and a no-results empty state
- [x] Create `client/src/components/ProductCard.tsx`
  - SVG jersey image with primary/trim colors
  - Badge priority **Sold out → Retro → New**: a shopper needs unavailability before anything else, and "Retro" describes the product better than "New" describes its listing date
  - Name, kit, league, price
  - Quick-add size buttons on hover, sold-out sizes struck through
  - Quick-add navigates to `/products/:id?size=X` — the cart doesn't exist until Phase 8, and carrying the size lets Phase 5 preselect it
- [x] Create `client/src/components/JerseyImage.tsx`
- [x] Add data-testid to filter controls, product cards, sort dropdown

**Files created or changed:**
- `client/src/pages/ShopPage.tsx`
- `client/src/components/ProductCard.tsx`, `JerseyImage.tsx`
- `client/src/styles/global.css` (shop, filter, card and empty-state styles)
- `server/src/db/seed.ts` (backdated `created_at` — see below)

> **Three decisions made while building this:**
>
> 1. **The URL is the only source of truth for filter state.** The plan put
>    URL syncing in Phase 10, but 4a already *reads* params, so a second
>    `useState` copy would desync the moment someone arrived via a header
>    preset or hit the back button. Controls write to `setSearchParams`
>    directly. **This completes Phase 10's first task early** — see the note
>    in that phase.
> 2. **The seed now backdates `created_at`.** Every product was seeded at
>    `CURRENT_TIMESTAMP`, so a 7-day "New" rule marked 19 of 20 cards — a
>    badge on everything is a badge on nothing. Each product carries a
>    `days_ago` value; five are inside the window.
> 3. **The card uses a stretched link, not a wrapping anchor.** Quick-add
>    buttons are interactive, and nesting them inside the card's `<a>` would
>    be invalid HTML and unusable by keyboard. `.product-card__link::after`
>    covers the card instead; the size chips sit above it on `z-index: 1`.
>
> Also: `.product-card__sizes` is hover-revealed only inside
> `@media (hover: hover)`, so touch devices — which have no hover — always
> show the sizes rather than never showing them.

**Done when:** ✅ verified in Chrome against the running stack
- [x] Shop page displays all 20 products in a grid
- [x] Clicking a league chip filters (Premier League → 7)
- [x] Search box filters by team (`arsenal` → 2)
- [x] Sort changes order (Price: Low to High puts the $85 kits first)
- [x] Breadcrumb visible; header and footer still render
- [x] Grid is responsive: 1 column base, 2 at ≥600px, 4 at ≥1100px
- [x] Sold-out sizes struck through on card hover (Man United 1999 → S and L)

Also verified beyond the checklist:

- [x] Filters compose: `?league=Premier+League&size=S` → 5, correctly dropping the two PL kits with S sold out
- [x] Chips toggle off when re-clicked, and "Clear all filters" only appears when something is set
- [x] Empty state renders for a zero-result combination (`?league=Bundesliga&kit=Retro`)
- [x] Badges are meaningful after the seed change: 5 New, 1 Retro
- [x] White kits stay visible against the warm-gray card — the jersey body carries a faint outline stroke
- [x] No app console errors (only Chrome-extension noise); oxlint clean

> ⚠️ **Not verified in-browser:** the tablet/mobile column counts were
> confirmed by reading the live CSSOM rules (1fr → 2 → 4), not by visually
> resizing — the Chrome window was maximized and `resize_window` stopped
> taking effect. Re-check visually during Phase 13's mobile pass.
>
> ⚠️ **Also unverified:** the sort `<select>`'s *write* path. Reading it from
> the URL is confirmed, but macOS renders the dropdown as a native popup that
> doesn't accept synthetic key events, so the `onChange` handler was never
> fired by a real gesture. Worth an explicit Playwright assertion in B3.

**Resume skill:** React components, API integration, CSS Grid, responsive design

---

## Phase 5: Frontend — Product Detail Page ✅

**Goal:** Build the product detail page with color swatches, size picker, quantity stepper, and cart button.

**What you'll learn:**
- Component state management (size, quantity)
- Controlled inputs
- Conditional button disabling
- Expandable sections

**Tasks:**
- [x] Create `client/src/pages/ProductPage.tsx`
  - Fetch product by ID from URL param; 404 handled
  - Left: large jersey image with **four real views** below — Front, Back, Collar, Cuff
  - Right panel (sticky on desktop): league + kit eyebrow, name, price, kit colours, size grid, quantity stepper, Add to cart, three expandable sections
- [x] Create `client/src/components/SizeGrid.tsx`
- [x] Create `client/src/components/QuantityStepper.tsx`
- [x] Create `client/src/components/ExpandableSection.tsx`
- [x] Create `client/src/hooks/useCart.ts` (placeholder; signature designed to survive Phase 8)
- [x] Add data-testid to size buttons, quantity inputs, add-to-cart button, views and swatches

**Files created or changed:**
- `client/src/pages/ProductPage.tsx`
- `client/src/components/SizeGrid.tsx`, `QuantityStepper.tsx`, `ExpandableSection.tsx`
- `client/src/components/JerseyImage.tsx` (added the `view` prop)
- `client/src/hooks/useCart.ts`
- `client/src/styles/global.css`

> **Two places this deviates from the spec above, deliberately:**
>
> 1. **Thumbnails are four real views, not "just smaller versions."** Four
>    identical images are filler, not a gallery. Because the product image is
>    vector, "collar" and "cuff" are simply tighter `viewBox` crops of the
>    same paths, and "back" swaps the V-neck for closed shoulder taping — four
>    genuinely different images for zero extra assets, and the trim becomes
>    inspectable. This is the page's signature element.
> 2. **Kit colours are informational, not a "select" control.** The spec asked
>    for three swatches with clicking that only *looks* selectable. The schema
>    stores one colourway per product, so a third swatch would be invented data
>    and a selectable-looking dead control is worse than no control. The two
>    real colours are shown as labelled chips with their hex values.
>
> Also: the disabled Add to cart button reads **"Select a size"** rather than
> being a dead grey box, and becomes `Add to cart — $360` with the live line
> total once valid. A disabled control should say what to do next.

**Done when:** ✅ verified in Chrome against the running stack
- [x] `/products/1` renders; name, price, league and kit all appear
- [x] Kit colour swatches visible with hex labels
- [x] Size grid shows S/M/L/XL; selecting fills the button
- [x] Quantity starts at 1; minus/plus work, bounded 1–20
- [x] Add to cart disabled until a size is picked, then enabled
- [x] Expandable sections toggle open/closed smoothly

Also verified beyond the checklist:

- [x] Four views switch the main image; the active thumb is marked
- [x] `?size=M` from a shop quick-add preselects M and arms the button
- [x] **`?size=S` on a product where S is sold out does *not* preselect** — the button stays "Select a size", so a stale link can't arm a sold-out purchase
- [x] Typing `25` into quantity clamps to 20 and disables the increase button; at 1 the decrease button disables
- [x] Collapsed sections are `inert` — confirmed `[false, true, true]` with only the open one interactive
- [x] Sold-out sizes disabled and struck through (Man United 1999 → S, L)
- [x] White kits stay legible on the warm-gray stage
- [x] No console errors; oxlint clean

> ⚠️ **Not verified:** the mobile/tablet layout of this page. The Chrome window
> is maximized and `resize_window` has stopped taking effect for this session
> (same limitation noted in 4b). The grid collapses to one column below 900px
> by the same mechanism as the shop page, but it has not been seen. Check in
> Phase 13's mobile pass.

**Resume skill:** Form state, controlled inputs, component composition

---

## Phase 6: Authentication — Signup & Login

**Goal:** Build user signup/login with bcrypt-hashed passwords and express-session cookies.

**What you'll learn:**
- Password hashing with bcrypt
- Session management with express-session
- Server-side authentication validation
- Protected routes and middleware

**Tasks:**
- [ ] Install dependencies: `bcrypt`, `express-session`, `connect-pg-simple` (session store)
- [ ] Create `server/src/middleware/auth.ts`
  - `requireAuth` middleware — checks if user is logged in; returns 401 if not
  - Express session configuration using PostgreSQL store
- [ ] Create `server/src/routes/auth.ts`
  - POST `/api/auth/signup` — body: `{email, password}`
    - Validate email format (simple regex)
    - Validate password (min 8 chars)
    - Check if email already exists
    - Hash password with bcrypt (10 salt rounds)
    - Insert user into database
    - Set session cookie
    - Return user object (id, email)
  - POST `/api/auth/login` — body: `{email, password}`
    - Look up user by email
    - Compare password with hash
    - Set session cookie
    - Return user object
  - POST `/api/auth/logout` — clears session
  - GET `/api/auth/me` — returns logged-in user or 401
- [ ] Update database schema: add the session table for express-session
  - **Use `connect-pg-simple`'s own `table.sql` verbatim** (ships in the package) rather than hand-writing the DDL — it expects an exact `sid`/`sess`/`expire` shape and an index on `expire`
  - Note the seed's `TRUNCATE` list deliberately excludes it
- [ ] Read `SESSION_SECRET` from env (already in `.env.example`); fail fast at boot if it's missing in production
- [ ] Cookie config: `httpOnly: true`, `sameSite: 'lax'`, `secure` in production only
- [ ] Hardening (cheap, and reviewers look for it): add `helmet`, and rate-limit `POST /api/auth/login` + `/signup`
- [ ] Wire up routes to Express app

**Files created or changed:**
- `server/src/middleware/auth.ts`
- `server/src/routes/auth.ts`
- `server/src/db/schema.sql` (add session table)
- `server/src/index.ts` (add session middleware, helmet, wire up auth routes)

**Done when:**
- `curl -X POST http://localhost:3000/api/auth/signup -H 'Content-Type: application/json' -d '{"email":"test@example.com","password":"password123"}'` creates a user and returns `{id, email}`
- Running again with same email returns error (409 or 400)
- `curl -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"test@example.com","password":"password123"}'` returns `{id, email}` and sets a session cookie
- `curl http://localhost:3000/api/auth/me` (with cookie) returns the user
- `curl http://localhost:3000/api/auth/me` (without cookie) returns 401
- `curl -X POST http://localhost:3000/api/auth/logout` (with cookie) clears the session

**Resume skill:** Authentication, bcrypt, session management, validation

---

## Phase 7: Frontend — Auth Pages & Context

**Goal:** Build signup/login pages and set up a user context for the app.

**What you'll learn:**
- React Context for global state (logged-in user)
- Form handling and validation
- Navigation after auth
- Protecting routes

**Tasks:**
- [ ] Create `client/src/contexts/UserContext.tsx` — Context + Provider for current user
  - `useUser()` hook to access user state and login/logout functions
  - Fetch `/api/auth/me` on app load to restore session
- [ ] Create `client/src/pages/LoginPage.tsx`
  - Email and password inputs
  - Submit button
  - Link to signup page
  - On submit: call login API, set user context, redirect to `/`
  - Show error message if login fails
- [ ] Create `client/src/pages/SignupPage.tsx`
  - Email and password inputs, password confirmation
  - Validate before submit (email format, password length, passwords match)
  - On submit: call signup API, set user context, redirect to `/`
  - Show error message if signup fails
- [ ] Create `client/src/components/ProtectedRoute.tsx` — redirects to login if not logged in
- [ ] Update Header component to show account icon + dropdown (Login, Signup, or Logout + Account link if logged in)
- [ ] Apply `ProtectedRoute` to **`/checkout`, `/orders`, and `/orders/:id` only.** The shop and product pages stay public — browsing must not require an account. See the Frontend Routes table.
- [ ] Add data-testid to form inputs, submit buttons, error messages

**Files created or changed:**
- `client/src/contexts/UserContext.tsx`
- `client/src/pages/LoginPage.tsx`
- `client/src/pages/SignupPage.tsx`
- `client/src/components/ProtectedRoute.tsx`
- `client/src/components/Header.tsx` (update with user menu)
- `client/src/App.tsx` (add UserProvider, route to login/signup)

**Done when:**
- Visit `/signup` and create an account with email + password
- Redirected to home page; header shows "Logout" and account icon
- Refresh page → user is still logged in (session persisted)
- Click "Logout" → header shows "Login / Signup" again
- Try signing up with same email → error message appears
- Try logging in with wrong password → error message
- Create a second account and log in → header shows different email

**Resume skill:** React Context, session persistence, form validation

---

## Phase 8: Frontend & Backend — Cart

**Goal:** Build the cart endpoint and UI — add/update/remove items, slide-out drawer, free shipping progress bar.

**What you'll learn:**
- Cart state management (Context or localStorage + server sync)
- Optimistic updates
- Cart persistence across sessions

**Tasks:**
- [ ] Update `server/src/routes/products.ts` to add `/api/cart` endpoints (or create `server/src/routes/cart.ts`)
  - GET `/api/cart` — requires auth; returns cart items with full product details (id, name, team, league, kit_type, price_cents, primary_color, trim_color, sold_out_sizes) + quantity and size for each item
  - POST `/api/cart` — requires auth; body: `{productId, size, quantity}`; adds item or updates quantity if same product + size already in cart
  - PATCH `/api/cart/:itemId` — requires auth; body: `{quantity}`; updates quantity or removes if quantity = 0
  - DELETE `/api/cart/:itemId` — requires auth; removes item
  - All endpoints calculate cart subtotal (sum of price * quantity)

> **Shipping rule, stated once — the single source of truth for the whole project:**
> free shipping at a subtotal **of $150 or more**, otherwise a **flat $10**. No tax.
> The **server** computes `shipping_cents`; the client only displays it. Never let
> the browser send a shipping or total amount.
- [ ] Create `client/src/contexts/CartContext.tsx` — manages cart state
  - `useCart()` hook: `{items, addItem, updateItem, removeItem, total, itemCount}`
  - Fetch `/api/cart` on app load (if logged in)
- [ ] Create `client/src/components/CartDrawer.tsx` — slide-out drawer
  - Shows list of cart items (product name, size, quantity, price per item, subtotal)
  - Quantity stepper for each item (minus/plus, or input)
  - Remove button for each item
  - Subtotal, shipping cost, total (no tax)
  - **Free shipping progress bar:** shows progress toward $150; changes color when threshold reached
  - Checkout button (only clickable if items exist)
  - "Your cart is empty" message if no items
- [ ] Update Header to show cart icon with item count badge; clicking opens/closes drawer
- [ ] Update ProductCard and ProductPage to call `addItem()` when adding to cart; show confirmation toast
- [ ] Add data-testid to cart items, quantity steppers, remove buttons, checkout button, cart count badge

**Files created or changed:**
- `server/src/routes/cart.ts` (or extend products.ts)
- `server/src/middleware/auth.ts` (export `requireAuth`)
- `client/src/contexts/CartContext.tsx`
- `client/src/components/CartDrawer.tsx`
- `client/src/components/ShippingProgressBar.tsx`
- `client/src/hooks/useCart.ts` (replace placeholder)
- `client/src/components/Header.tsx` (add cart icon + drawer toggle)
- `client/src/App.tsx` (add CartProvider)

**Done when:**
- Logged in; visit `/products/1`; click a size and "Add to Cart" → cart count badge appears (shows 1)
- Click header cart icon → drawer slides out; shows 1 item (Arsenal, size S, qty 1, $90)
- Adjust quantity to 2 → subtotal updates to $180
- Free shipping progress bar shows as complete (green) because $180 > $150
- Add another product to cart → cart count shows 2, drawer shows 2 items
- Click remove on one item → cart updates
- Cart persists across refresh (session check)
- Logout and login again → cart is still there (server-side persistence)

**Resume skill:** Cart state management, API calls, UI state syncing

---

## Phase 9: Frontend & Backend — Checkout & Orders

**Goal:** Build the checkout flow, order creation, and order history.

**What you'll learn:**
- Form handling for addresses
- Server-side order validation
- Database transactions (atomicity of order creation + cart clearing)
- Redirect flows

**Tasks:**
- [ ] Create `client/src/pages/CheckoutPage.tsx`
  - Requires logged-in user; redirects to login if not
  - Left side: cart items summary (product name, size, qty, price per item)
  - Subtotal, shipping (free at $150+, else $10), total — no tax
  - Right side: two-column form
    - **Shipping info:** name, email, address, city, state, zip
    - **Card info:** card number (fake validation: 16 digits), exp (MM/YY), CVV (3 digits), cardholder name
    - Validate all fields before enabling submit
  - "Place Order" button
  - On submit: POST to `/api/orders` with **shipping fields only**
  - Redirect to `/orders/:id` (order confirmation page) on success
  - Show error message if checkout fails
- [ ] Create `client/src/pages/OrderConfirmationPage.tsx`
  - Displays order number, order date, items, shipping address, total
  - "Continue Shopping" button → back to `/`
- [ ] Create `client/src/pages/OrderHistoryPage.tsx` (requires auth)
  - Fetch `/api/orders` (list of user's orders)
  - Display as a table: order ID, date, total, number of items
  - Click a row → go to `/orders/:id`
- [ ] Create `client/src/pages/OrderDetailPage.tsx`
  - Fetch `/api/orders/:id`
  - Display full order with items, shipping address, total
  - Link back to order history
- [ ] Update `server/src/routes/orders.ts`
  - POST `/api/orders` — requires auth
    - Body: shipping form only (name, email, address, city, state, zip)
    - Fetch current cart items and product prices (server always recalculates prices)
    - Validate: cart not empty, all sizes in stock (check sold_out_sizes)
    - Compute `subtotal_cents` from cart, `shipping_cents` from the $150/$10 rule, `total_cents` as their sum
    - Create order in database (begin transaction)
    - Copy cart items to order_items (locking prices at order time)
    - Clear cart (delete all cart_items for user)
    - Commit transaction
    - Return order object
  - GET `/api/orders` — requires auth; returns list of user's orders (id, created_at, total_cents, item count)
  - GET `/api/orders/:id` — requires auth; returns full order with order_items. **Scope the query by `user_id`** so another user's order naturally returns 404

> **Card data never leaves the browser.** Card fields are validated client-side
> for format only and are **not** included in the request body — there is no
> payment processing in this project, so there is no reason for card numbers to
> reach the server, and none to log them. Earlier drafts said the server would
> accept them "for display/logging"; that was removed deliberately. Don't add
> card columns to the `orders` table.
- [ ] Update Header to add "Order History" link in account dropdown
- [ ] Add data-testid to shipping form inputs, card inputs, place-order button, order items, etc.

**Files created or changed:**
- `client/src/pages/CheckoutPage.tsx`
- `client/src/pages/OrderConfirmationPage.tsx`
- `client/src/pages/OrderHistoryPage.tsx`
- `client/src/pages/OrderDetailPage.tsx`
- `server/src/routes/orders.ts`
- `client/src/App.tsx` (add checkout routes)
- `client/src/contexts/CartContext.tsx` (add clear cart function)

**Done when:**
- Logged in with items in cart; click checkout button from cart drawer
- Checkout page shows cart summary and form
- Fill out shipping and card info; click "Place Order"
- Redirected to order confirmation page; shows order number and items
- Visit `/orders` (order history) → see the order listed
- Click order → see full details (shipping address, items, total)
- Cart is now empty (cart count badge = 0)
- Logout and login → visit `/orders` → order is still there

**Resume skill:** Form validation, database transactions, order processing

---

## Phase 10: Frontend — Additional Features

**Goal:** Add search, filters, sort on the shop page; polish UI.

**What you'll learn:**
- URL query parameters for filter state
- Maintaining filter state across navigation
- UX polish (loading states, empty states, no-results page)

**Tasks:**
- [x] ~~Update ShopPage to persist filter state in URL query params~~ — **done in Phase 4b.**
  Keeping filter state in both the URL and component state would have desynced
  immediately, so 4b made the URL authoritative rather than adding a second copy
  to remove later. `/jerseys?league=Premier+League&sort=price-asc` already works,
  including back/forward.
- [ ] Add search box to Header (global search)
  - On submit, navigate to `/jerseys?q=<query>` and clear other filters (or keep league?)
- [x] ~~Add loading state to ShopPage~~ — done in 4b (skeleton cards, not a spinner: they hold the grid's shape so the layout doesn't jump)
- [x] ~~Add "no results" message if filters return 0 products~~ — done in 4b
- [ ] Polish ProductCard: add hover shadow, smooth color transitions
- [ ] Add smooth scroll behavior
- [ ] Verify all touch targets are 44px minimum on mobile
- [ ] Test responsive layout across breakpoints (mobile, tablet, desktop)

**Files created or changed:**
- `client/src/pages/ShopPage.tsx` (update to use URL params)
- `client/src/components/Header.tsx` (add search to header)
- `client/src/components/ProductCard.tsx` (polish hover states)
- `client/src/hooks/useQueryParams.ts` (helper for URL param syncing)

**Done when:**
- Load `/jerseys` → all 20 products shown
- Type "Arsenal" in search, press Enter → URL changes to `?q=Arsenal`, page shows only Arsenal products
- Click "Premier League" league chip → URL shows `?league=Premier%20League`, page filters accordingly
- Combine filters: select "Premier League" AND "S" size → URL shows both query params, results filtered
- Click "Clear all filters" → URL reverts to `/jerseys`, all products shown
- Click a product card → goes to product detail page
- "Back" button in browser returns to shop page with same filters active
- On mobile, layout is single-column; product grid is responsive

**Resume skill:** URL state management, React Router, UX polish

---

## Phase 11: OpenAPI / Swagger Spec

**Goal:** Document the API in OpenAPI 3.0 format.

**What you'll learn:**
- API specification standards
- Request/response schema documentation
- Tools like Swagger UI

**Tasks:**
- [ ] Create `server/openapi.yaml` (or `.json`)
  - Define all endpoints (auth, products, cart, orders)
  - Include request bodies and response schemas
  - Document error responses (400, 401, 404, 500)
  - Add example requests and responses
- [ ] Install `swagger-ui-express` package
- [ ] Serve Swagger UI at `/api-docs` (GET `/api-docs` → Swagger page)
- [ ] Ensure spec is accurate and examples match real API behavior

**Files created or changed:**
- `server/openapi.yaml`
- `server/src/index.ts` (add swagger-ui middleware)
- `server/package.json` (add swagger-ui-express)

**Done when:**
- Visit `http://localhost:3000/api-docs` → Swagger UI loads
- All endpoints listed with correct paths, methods, parameters
- Request/response examples are visible and accurate
- Clicking "Try it out" on an endpoint and executing a request works

**Resume skill:** API documentation, OpenAPI specification

---

## Phase 12: README & Documentation

**Goal:** Write a comprehensive README for the project.

**What you'll learn:**
- Project documentation best practices
- Setup instructions clarity

**Tasks:**
- [ ] Create `README.md` at project root
  - Project overview (what it is, why it exists)
  - Tech stack list
  - Prerequisites: **Docker** and Node (version pinned in `.nvmrc`)
  - Setup instructions in this exact order: clone → `npm install` → `cp server/.env.example server/.env` → `docker compose up -d` → `npm run db:setup` → `npm run dev`
    - `db:setup` before the containers are up is the most likely first-run failure; call it out
  - API documentation (link to `/api-docs` or brief endpoint list)
  - Project structure (monorepo layout, what's in `/client` and `/server`)
  - Design system (colors, fonts, spacing)
  - Testing instructions (once Phase B is done)
  - Deployment instructions (once live)
  - License (MIT or personal use)
- [ ] Add comments to key files explaining complex logic
- [ ] Create `ARCHITECTURE.md` (optional) explaining data flow, auth flow, cart flow

**Files created or changed:**
- `README.md`
- `ARCHITECTURE.md` (optional)

**Done when:**
- README includes step-by-step setup instructions
- Someone new to the project can follow the README and get running locally
- API endpoints are documented
- Design colors and fonts are specified
- Project goals (portfolio project showcasing skills) are clear

**Resume skill:** Technical documentation, communication

---

## Phase 13: Bug Fixes & Polish

**Goal:** Manual testing, edge cases, and final polish.

**What you'll learn:**
- Real-world QA (manual testing, edge cases)
- Bug diagnosis and fixing

**Tasks:**
- [ ] Manual test flow: signup → browse → add to cart → checkout → order confirmation → order history
- [ ] Test edge cases:
  - Add item to cart, then logout and login → cart persists
  - Try to add a sold-out size → verify it's disabled on product page and quick-add
  - Try to checkout with an empty cart → error
  - Try to access `/orders` without login → redirect to login
  - Try to view another user's order → **404** (the query is scoped by `user_id`, so it must not reveal that the order exists)
  - Add item to cart, then delete product (or mark as sold out) → verify cart still works or shows warning
- [ ] Mobile test: shop page, product page, cart drawer, checkout — all responsive
- [ ] Accessibility: tab through forms, use keyboard nav, test screen reader compatibility (basic check)
- [ ] Performance: check page load time, bundle size, unused CSS/JS
- [ ] Document any bugs found and fix them

**Done when:**
- No obvious bugs in core flows
- Mobile experience is smooth
- All forms are keyboard-navigable
- Cart and orders are robust

**Resume skill:** Quality assurance, edge case testing

---

# Part B: Testing & CI/CD (YOU write tests; I coach)

The following phases are for when you want to add test coverage and CI/CD. **I will not write these tests for you** — this is where you demonstrate QA/SDET skills. I'll review and give feedback.

---

## Phase B1: Unit Tests (Frontend)

**Goal:** Test React components and utility functions with Vitest.

**What you'll learn:**
- Vitest setup and configuration
- Component testing with React Testing Library
- Mocking API calls
- Testing hooks

**Tasks:**
- [ ] Install Vitest, React Testing Library, and dependencies
- [ ] Write unit tests for:
  - ProductCard (renders with props, click handlers)
  - SizeGrid (size selection, disabled state)
  - QuantityStepper (increment, decrement, min/max bounds)
  - ExpandableSection (toggle open/closed)
  - ShippingProgressBar (correct threshold colors and labels)
  - useCart hook (add, update, remove, total calculation)
  - useQueryParams hook (read/write URL params)
- [ ] Aim for >80% coverage on components and hooks

**Done when:**
- `npm run test` runs all tests and passes
- Test output shows coverage report (>80% on key files)
- Tests are fast (<1 second total)

**Resume skill:** Vitest, React Testing Library, unit testing

---

## Phase B2: API Tests (Backend)

**Goal:** Test Express endpoints with **Vitest + supertest**.

**What you'll learn:**
- API testing (request/response validation)
- Database assertions
- Testing auth flows
- Edge case validation

**Tasks:**
- [ ] Set up **Vitest + supertest** in the server workspace, exposed as `npm run test --workspace server`
  - Decided over pytest: one toolchain across the monorepo, tests share the server's TypeScript types, and CI needs a single job with no Python runtime
  - Export the Express `app` separately from `app.listen()` in `server/src/index.ts` so supertest can mount it without binding a port
  - Point tests at a separate `footylab_test` database and reset it between runs with the same truncate the seed uses
- [ ] Write tests for:
  - **Auth:** signup (happy path, duplicate email), login (correct/wrong password), logout, GET /me (with/without session)
  - **Products:** GET list with filters, GET single, 404 handling
  - **Cart:** add item (happy path, duplicate size, out of stock), update quantity, remove, list with auth check, price recalculation
  - **Orders:** create order (happy path, empty cart, out-of-stock item), list orders (only user's), GET order detail (auth check), verify order clears cart
- [ ] Test error cases: missing fields, invalid data types, unauthorized access
- [ ] Add SQL assertions (e.g., after checkout, verify order_items row count matches cart items)

**Done when:**
- `npm run test --workspace server` runs all API tests
- Tests cover happy paths and error cases
- >80% coverage on route handlers

**Resume skill:** API testing, test assertions, edge case validation

---

## Phase B3: E2E Tests (Playwright)

**Goal:** Full-stack integration tests using Playwright with Page Object Model.

**What you'll learn:**
- Playwright setup and best practices
- Page Object Model pattern
- Test data setup/teardown
- Cross-browser testing

**Tasks:**
- [ ] Install Playwright + TypeScript
- [ ] Create Page Object Model:
  - `pages/LoginPage.ts` (fillEmail, fillPassword, clickLogin, etc.)
  - `pages/ShopPage.ts` (applyFilter, selectSize, clickAddToCart, etc.)
  - `pages/ProductPage.ts` (selectSize, setQuantity, clickAddToCart)
  - `pages/CartPage.ts` (getItems, updateQuantity, remove, clickCheckout)
  - `pages/CheckoutPage.ts` (fillShipping, fillCard, clickPlaceOrder)
  - `pages/OrderPage.ts` (verifyOrderNumber, verifyItems)
- [ ] Write E2E tests:
  - **Signup → Browse → Cart → Checkout → Order Confirmation → Order History** (full happy path)
  - **Login, add item, logout, login again, cart persists**
  - **Apply filters, search, sort on shop page**
  - **Quantity validation, sold-out size disabled, free shipping threshold**
- [ ] Configure test data setup: create test user in DB before tests, delete after
- [ ] Run tests in headless mode; generate HTML report

**Done when:**
- `npm run test:e2e` runs all E2E tests
- Tests pass consistently (no flaky tests)
- Coverage: happy path, filters, auth, cart, checkout
- HTML report generated and readable

**Resume skill:** Playwright, Page Object Model, E2E testing, test automation

---

## Phase B4: Accessibility & Performance

**Goal:** Test accessibility with axe and performance with Lighthouse/k6.

**What you'll learn:**
- Accessibility testing (WCAG 2.1)
- Performance profiling
- Load testing

**Tasks:**
- [ ] Install axe-playwright (or similar)
- [ ] Write accessibility tests: shop page, product page, forms for WCAG compliance
- [ ] Install Lighthouse CI (or run manually)
- [ ] Create k6 load test script: simulate 100 users browsing shop page over 30 seconds
- [ ] Document baseline performance metrics (page load, Lighthouse score, 95th percentile response time)

**Done when:**
- Accessibility tests pass (no critical/serious issues)
- Lighthouse score >80 on all pages
- k6 test completes without errors; response times acceptable

**Resume skill:** Accessibility testing, performance testing, load testing

---

## Phase B5: CI/CD Pipeline (GitHub Actions)

**Goal:** Automate testing and deployment with GitHub Actions.

**What you'll learn:**
- GitHub Actions workflows
- Dockerizing the app
- Automated testing in CI
- Deployment strategies

**Tasks:**
- [ ] Create `.github/workflows/test.yml`:
  - Lint (`oxlint`)
  - Unit tests (Vitest frontend)
  - API tests (Vitest + supertest, backend)
  - E2E tests (Playwright with Postgres in Docker)
  - HTML report artifact
- [ ] Ensure all tests pass before merging (branch protection rule)
- [ ] Create `.github/workflows/deploy.yml` (optional):
  - Build Docker image
  - Push to registry
  - Deploy to Render/Railway/Vercel
- [ ] Document deployment process in README

**Done when:**
- Push to GitHub → Actions workflow runs automatically
- All tests pass before allowing merge to main
- Deployment to staging on every push, production on merge to main

**Resume skill:** CI/CD, GitHub Actions, Docker, deployment

---

## Phase B6: Bug Hunt

**Goal:** I plant 5-10 bugs; you find and fix them with tests.

**What you'll learn:**
- Debugging real issues
- Writing tests to prevent regressions
- QA best practices

**Tasks:**
- [ ] I'll add bugs like: wrong price calculation, missing auth check, cart not persisting, form validation skipped, etc.
- [ ] You'll find them by:
  - Manual testing (reproducing the issue)
  - Writing a failing test
  - Fixing the bug
  - Verifying the test now passes
- [ ] Document the bug, root cause, and fix in a short report

**Done when:**
- All 5-10 bugs found and fixed
- Tests confirm fixes

**Resume skill:** Debugging, test-driven development, root-cause analysis

---

# Recommended Commit Messages by Phase

Once you complete each phase and I review, here are commit messages to use:

1. **Phase 1:** `feat: init monorepo with Vite, Express, TypeScript, and Docker`
2. **Phase 2:** `feat: database schema and seed script`
3. **Phase 3:** `feat: products API with filtering and sorting`
4. **Phase 4a:** `feat: app shell with routing, header, footer, and design tokens`
4. **Phase 4b:** `feat: shop page with product grid, filters, and responsive design`
5. **Phase 5:** `feat: product detail page with size, quantity, and add-to-cart`
6. **Phase 6:** `feat: user authentication with signup, login, and sessions`
7. **Phase 7:** `feat: auth pages (login, signup) and user context`
8. **Phase 8:** `feat: shopping cart with drawer and free shipping threshold`
9. **Phase 9:** `feat: checkout, order creation, and order history`
10. **Phase 10:** `feat: search, filters, URL-based state management, and UI polish`
11. **Phase 11:** `feat: OpenAPI/Swagger documentation`
12. **Phase 12:** `docs: README and architecture documentation`
13. **Phase 13:** `chore: manual testing, bug fixes, and final polish`

---

# Tech Stack Reference

> Exact installed versions live in the **Current State** section at the top of
> this file. Update that table, not this one, when a dependency changes.

| Component | Technology |
|-----------|-----------|
| Frontend Framework | React 19 + TypeScript |
| Frontend Build | Vite 8 |
| Frontend Routing | React Router v6 |
| Frontend Styling | Plain CSS (no Tailwind, no styled-components) |
| Backend Framework | Express + TypeScript |
| TS execution (dev) | `tsx` (not ts-node) |
| Env loading | Node `--env-file` (no `dotenv` package) |
| Database | PostgreSQL 16 |
| Database Driver | pg (no ORM) |
| Docker | Docker Compose |
| Auth | bcrypt + express-session + connect-pg-simple |
| Linting | oxlint |
| Fonts | Google Fonts (Space Grotesk, Inter) |
| Colors | Warm gray (#F3F1EC), near-black (#212121), green (#1E5A3C) |
| Testing (Part B) | Vitest, supertest, Playwright, axe, k6 |
| CI/CD (Part B) | GitHub Actions |

---

# Conventions

Decisions made once so they aren't re-litigated each phase:

- **Money** is always integer cents, named `*_cents`. Format for display only at the edge.
- **Shipping** is free at a $150+ subtotal, else a flat $10. No tax. Server computes it.
- **Prices** are always recalculated server-side from the `products` table; never trust a client-supplied amount.
- **Card data** never leaves the browser.
- **Ownership checks** scope the SQL query by `user_id` and return 404, not 403.
- **Env vars** load via Node's `--env-file=.env`; no `dotenv` dependency.
- **`sold_out_sizes`** is a CSV string; filter with the delimiter-padded `LIKE` predicate.
- **The seed is idempotent** — re-running `db:setup` must leave exactly 20 products with stable IDs.
- **Dev requests** use relative `/api/...` paths through the Vite proxy, with `credentials: 'include'`.
- **Every interactive element** gets a `data-testid`, because Part B depends on it.

---

**Next up: Phase 6 — Authentication.** The whole browse flow is built and
verified; everything past this point (cart, checkout, orders) needs a logged-in
user, so sessions are the gate.
