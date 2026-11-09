# FootyLab: Full-Stack Soccer Jersey E-Commerce Site

**Portfolio project** to demonstrate full-stack development (TypeScript, React, Express, PostgreSQL) and QA/SDET skills (unit tests, API tests, E2E with Playwright, CI/CD).

---

## Project Overview

FootyLab is a clean, minimal jersey shop selling authentic club and national team kits. Users can sign up, browse products with filters and search, add to a cart, and checkout with a fake card form. No real payments; orders go into the database. The design is Allbirds-style: warm grays, pill buttons, warm green accents, and a focus on product cards and usability.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Vite + React 18 + TypeScript + React Router v6 + plain CSS |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL (via Docker Compose) |
| **SQL** | Plain SQL (no ORM); `pg` client library |
| **Dev tools** | Docker Compose, OpenAPI/Swagger |
| **Testing (Phase B)** | Vitest, pytest, Playwright, axe, k6 |
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
- `kit_type` (text) — Home, Away, Third, Retro
- `price_cents` (integer)
- `primary_color` (text) — e.g., "#DC0000"
- `trim_color` (text) — e.g., "#FFFFFF"
- `sold_out_sizes` (text) — e.g., "S,L" (comma-separated or empty)
- `created_at` (timestamp)

### cart_items
- `id` (integer, primary key)
- `user_id` (integer, foreign key)
- `product_id` (integer, foreign key)
- `size` (text) — S, M, L, XL
- `quantity` (integer)
- `created_at` (timestamp)
- **unique constraint:** `(user_id, product_id, size)`

### orders
- `id` (integer, primary key)
- `user_id` (integer, foreign key)
- `total_cents` (integer)
- `shipping_name` (text)
- `shipping_email` (text)
- `shipping_address` (text)
- `shipping_city` (text)
- `shipping_state` (text)
- `shipping_zip` (text)
- `created_at` (timestamp)

### order_items
- `id` (integer, primary key)
- `order_id` (integer, foreign key)
- `product_id` (integer, foreign key)
- `size` (text)
- `quantity` (integer)
- `price_cents` (integer) — locked price at time of order

---

## API Routes (Express)

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
- `POST /api/orders` — body: shipping form + items (from current cart) → creates order, clears cart, returns order ID
- `GET /api/orders` — returns user's orders (id, total, created_at)
- `GET /api/orders/:id` — returns order detail with order_items

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
- **Product cards:** large jersey SVG, badge in corner (New, Final few, Retro), name, kit + league, price; on hover, show quick-add size buttons (sold-out sizes crossed out)
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
- [x] Add `npm run db:setup` to server package.json

**Files created or changed:**
- `server/src/db/schema.sql` (64 lines) — 5 tables with CHECK constraints, UNIQUE constraints, and indices
- `server/src/db/pool.ts` (11 lines) — PostgreSQL connection pool with error handling
- `server/src/db/seed.ts` (74 lines) — 20 products across 6 leagues
- `server/src/db/index.ts` (3 lines) — export pool
- `server/package.json` (updated) — @types/pg added for TypeScript
- `server/.env` (already set up correctly)

**Done when:**
- ✅ `npm run db:setup` compiles without errors
- ✅ All 6 database files created and committed
- ✅ Pushed to GitHub (commit: e417501)

**Ready to test locally:** 
```bash
docker compose up -d
npm run db:setup
psql -h localhost -U postgres -d footylab -c "SELECT count(*) FROM products"  # Should show 20
```

**Resume skill:** Database design, PostgreSQL, seed data

---

## Phase 3: API — Products Endpoint

**Goal:** Build the products list and detail endpoints with filtering and sorting.

**What you'll learn:**
- Express routing and request/response handling
- SQL parameterization and query building
- Filtering and sorting logic
- TypeScript types for API responses

**Tasks:**
- [ ] Create `server/src/types.ts` with types: `User`, `Product`, `CartItem`, `Order`, `OrderItem`
- [ ] Create `server/src/routes/products.ts`
  - GET `/api/products` with query params: `team`, `league`, `kit`, `size`, `q` (search), `sort`
    - Build dynamic WHERE clauses for filters
    - Search by name, team, or league (case-insensitive)
    - Sort by featured (default, order by id), price-asc, price-desc
    - Filter by size (exclude products with that size in sold_out_sizes)
    - Return 50 results per page (no pagination yet, keep it simple)
  - GET `/api/products/:id` — single product by ID; return 404 if not found
- [ ] Create middleware to parse JSON, handle errors
- [ ] Wire up routes to Express app

**Files created or changed:**
- `server/src/types.ts`
- `server/src/routes/products.ts`
- `server/src/middleware/errorHandler.ts`
- `server/src/index.ts` (wire up routes)

**Done when:**
- `curl 'http://localhost:3000/api/products'` returns JSON array of ~20 products
- `curl 'http://localhost:3000/api/products?league=Premier%20League'` filters by league
- `curl 'http://localhost:3000/api/products?q=Arsenal'` searches by team name
- `curl 'http://localhost:3000/api/products/1'` returns single product with all fields
- `curl 'http://localhost:3000/api/products/999'` returns 404
- All prices are integers (cents), colors are hex codes

**Resume skill:** Express API design, SQL filtering, TypeScript types

---

## Phase 4: Frontend — Shop Page

**Goal:** Build the product grid page with filters, search, and sorting (no cart or checkout yet).

**What you'll learn:**
- React hooks (useState, useEffect, useContext)
- React Router for navigation
- Fetching data from API
- CSS grid and responsive layout

**Tasks:**
- [ ] Create `client/src/types.ts` (mirror server types)
- [ ] Create `client/src/api.ts` — fetch functions: `getProducts(filters)`, `getProduct(id)`
- [ ] Create `client/src/pages/ShopPage.tsx`
  - Header with nav links, search box, account + cart icons (cart count = 0 for now)
  - Breadcrumb (Home / Jerseys)
  - Left sidebar: league chips (All, Premier League, La Liga, Serie A, Bundesliga, International), size pills (S, M, L, XL), kit checkboxes (Home, Away, Third, Retro), "Clear all filters" link
  - Main area: title "All Jerseys", intro copy, result count ("9 jerseys"), sort dropdown (Featured, Price: Low to High, Price: High to Low)
  - Product grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- [ ] Create `client/src/components/ProductCard.tsx`
  - Display product image (SVG jersey with primary/trim colors), badge (New if created in last 7 days, or "Final few" if < 3 of any size in stock, or "Retro" if kit_type === Retro)
  - Show name, kit, league, price
  - On hover, show quick-add size buttons (sold-out sizes are grayed out with strikethrough)
  - Click a size button → add to cart (redirect to login if not logged in)
- [ ] Create `client/src/components/JerseyImage.tsx` — renders SVG jersey shape filled with primary color, trim as accent stripe
- [ ] Set up global CSS: colors, fonts (Google Fonts), reset, breakpoints
- [ ] Add data-testid to filter controls, product cards, sort dropdown

**Files created or changed:**
- `client/src/types.ts`
- `client/src/api.ts`
- `client/src/pages/ShopPage.tsx`
- `client/src/components/ProductCard.tsx`
- `client/src/components/JerseyImage.tsx`
- `client/src/components/Header.tsx`
- `client/src/components/Footer.tsx`
- `client/src/styles/global.css`
- `client/src/App.tsx` (wire up routes)
- `client/src/main.tsx` (entry point)

**Done when:**
- Shop page loads and displays all 20 products in a grid
- Clicking a league chip filters products (e.g., "Premier League" shows ~5 products)
- Search box filters by team name (type "Arsenal" → shows Arsenal home, away, etc.)
- Sort dropdown changes order (Price: Low to High puts lowest-priced items first)
- Breadcrumb, header, and footer are visible on every page
- Grid is responsive: 4 cols desktop, 2 tablet, 1 mobile (test by resizing)
- Disclaimer footer is visible

**Resume skill:** React components, API integration, CSS Grid, responsive design

---

## Phase 5: Frontend — Product Detail Page

**Goal:** Build the product detail page with color swatches, size picker, quantity stepper, and cart button.

**What you'll learn:**
- Component state management (size, quantity)
- Controlled inputs
- Conditional button disabling
- Expandable sections

**Tasks:**
- [ ] Create `client/src/pages/ProductPage.tsx`
  - Fetch product by ID from URL param
  - Left side: large image (JerseyImage component), 4 thumbnails below (just smaller versions)
  - Right side panel:
    - League + kit type as small text (e.g., "Premier League · Home kit")
    - Product name (large)
    - Price ($90)
    - **Kit color:** label + 3 color swatches (primary, trim, and a secondary if applicable) — allow clicking to "select" but for now just visual
    - **Size:** grid of 4 buttons (S, M, L, XL); grayed out if in sold_out_sizes; clicking a button sets selected size
    - **Quantity:** label + minus/plus stepper (start at 1, min 1, max 20)
    - **Add to Cart button:** full width, disabled until size is selected, green accent color; clicking adds item to cart and shows toast
    - **Details** (expandable section): generic copy about the jersey
    - **Fit & Sizing** (expandable): size guide copy
    - **Shipping & Returns** (expandable): shipping and returns copy
- [ ] Create `client/src/components/SizeGrid.tsx` — displays S, M, L, XL buttons
- [ ] Create `client/src/components/QuantityStepper.tsx` — minus/plus buttons and input
- [ ] Create `client/src/components/ExpandableSection.tsx` — click to toggle content
- [ ] Create `client/src/hooks/useCart.ts` (initially just a placeholder)
- [ ] Add data-testid to size buttons, quantity inputs, and add-to-cart button

**Files created or changed:**
- `client/src/pages/ProductPage.tsx`
- `client/src/components/SizeGrid.tsx`
- `client/src/components/QuantityStepper.tsx`
- `client/src/components/ExpandableSection.tsx`
- `client/src/hooks/useCart.ts`

**Done when:**
- Visit `/products/1` (assuming product ID 1 exists)
- Product name, price, league, and kit appear
- Color swatches are visible (3 colored circles)
- Size grid shows S, M, L, XL; click S → button becomes active (filled background)
- Quantity stepper starts at 1; minus/plus buttons work (min 1, max 20)
- Add to Cart button is disabled (grayed out) until a size is picked
- After picking a size, button becomes enabled and clickable
- Expandable sections toggle open/closed smoothly

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
- [ ] Update database schema: add a sessions table for express-session
- [ ] Wire up routes to Express app

**Files created or changed:**
- `server/src/middleware/auth.ts`
- `server/src/routes/auth.ts`
- `server/src/db/schema.sql` (add sessions table)
- `server/src/index.ts` (add session middleware, wire up auth routes)

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
- [ ] Update Shop and Product pages to use ProtectedRoute (no, actually keep them public; only cart is protected)
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
- [ ] Create `client/src/contexts/CartContext.tsx` — manages cart state
  - `useCart()` hook: `{items, addItem, updateItem, removeItem, total, itemCount}`
  - Fetch `/api/cart` on app load (if logged in)
- [ ] Create `client/src/components/CartDrawer.tsx` — slide-out drawer
  - Shows list of cart items (product name, size, quantity, price per item, subtotal)
  - Quantity stepper for each item (minus/plus, or input)
  - Remove button for each item
  - Subtotal, shipping cost (free over $150), tax (if applicable), total
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
  - Subtotal, shipping (free or $10), tax (if applicable), total
  - Right side: two-column form
    - **Shipping info:** name, email, address, city, state, zip
    - **Card info:** card number (fake validation: 16 digits), exp (MM/YY), CVV (3 digits), cardholder name
    - Validate all fields before enabling submit
  - "Place Order" button
  - On submit: POST to `/api/orders` with shipping + card (server ignores card, just validates format)
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
    - Body: shipping form (name, email, address, city, state, zip) + card form (for display/logging, not validation)
    - Fetch current cart items and product prices (server always recalculates prices)
    - Validate: cart not empty, all sizes in stock (check sold_out_sizes)
    - Create order in database (begin transaction)
    - Copy cart items to order_items (locking prices at order time)
    - Clear cart (delete all cart_items for user)
    - Commit transaction
    - Return order object
  - GET `/api/orders` — requires auth; returns list of user's orders (id, created_at, total_cents, item count)
  - GET `/api/orders/:id` — requires auth; returns full order with order_items
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
- [ ] Update ShopPage to persist filter state in URL query params
  - When filters change, update URL without full page reload (React Router)
  - On page load, read query params and set initial filters
  - Example: `/jerseys?league=Premier%20League&sort=price-asc`
- [ ] Add search box to Header (global search)
  - On submit, navigate to `/jerseys?q=<query>` and clear other filters (or keep league?)
- [ ] Add loading state to ShopPage (spinner while fetching)
- [ ] Add "no results" message if filters return 0 products
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
  - Setup instructions (clone, `npm install`, `docker-compose up`, `npm run db:setup`, `npm run dev`)
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
  - Try to view another user's order → 403 Forbidden
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

**Goal:** Test Express endpoints with pytest (Python) or Vitest (Node.js).

**What you'll learn:**
- API testing (request/response validation)
- Database assertions
- Testing auth flows
- Edge case validation

**Tasks:**
- [ ] Choose a tool (pytest + requests for Python, or Vitest + supertest for Node.js)
- [ ] Write tests for:
  - **Auth:** signup (happy path, duplicate email), login (correct/wrong password), logout, GET /me (with/without session)
  - **Products:** GET list with filters, GET single, 404 handling
  - **Cart:** add item (happy path, duplicate size, out of stock), update quantity, remove, list with auth check, price recalculation
  - **Orders:** create order (happy path, empty cart, out-of-stock item), list orders (only user's), GET order detail (auth check), verify order clears cart
- [ ] Test error cases: missing fields, invalid data types, unauthorized access
- [ ] Add SQL assertions (e.g., after checkout, verify order_items row count matches cart items)

**Done when:**
- `npm run test:api` (or pytest) runs all API tests
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
  - Lint (eslint, prettier)
  - Unit tests (Vitest frontend)
  - API tests (pytest/Vitest backend)
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
4. **Phase 4:** `feat: shop page with product grid, filters, and responsive design`
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

| Component | Technology |
|-----------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Frontend Build | Vite |
| Frontend Routing | React Router v6 |
| Frontend Styling | Plain CSS (no Tailwind, no styled-components) |
| Backend Framework | Express + TypeScript |
| Database | PostgreSQL |
| Database Driver | pg (no ORM) |
| Docker | Docker Compose |
| Auth | bcrypt + express-session |
| Fonts | Google Fonts (Space Grotesk, Inter) |
| Colors | Warm gray (#F3F1EC), near-black (#212121), green (#1E5A3C) |
| Testing (Part B) | Vitest, Playwright, pytest |
| CI/CD (Part B) | GitHub Actions |

---

**Ready for Phase 1? Let me know once you've reviewed the plan!**
