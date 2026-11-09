import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import {
  asyncHandler,
  badRequest,
  notFound,
} from '../middleware/errorHandler.js';
import { totalsFor } from '../money.js';
import { SIZES, type CartLine, type Cart, type Size } from '../types.js';

const router = Router();

/** Matches the product page's stepper. Enforced here too — the browser's
 *  limit is a convenience, not a control. */
const MAX_QUANTITY_PER_LINE = 20;

/**
 * Every endpoint responds with the whole cart, not just the row it touched.
 *
 * The totals depend on the entire cart (the shipping threshold especially),
 * so returning a partial result would force the client to recompute money —
 * exactly what the money rule forbids. One shape also means the client can
 * replace its state wholesale after any mutation.
 */
async function loadCart(userId: number): Promise<Cart> {
  const { rows } = await pool.query<CartLine>(
    `SELECT ci.id,
            ci.product_id,
            ci.size,
            ci.quantity,
            p.name,
            p.team,
            p.league,
            p.kit_type,
            p.price_cents,
            p.primary_color,
            p.trim_color,
            p.sold_out_sizes,
            -- Flagged rather than hidden: a line that silently disappears
            -- reads as a bug. The drawer shows it and blocks checkout.
            (',' || p.sold_out_sizes || ',' LIKE '%,' || ci.size || ',%')
              AS unavailable
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at, ci.id`,
    [userId]
  );

  // Unavailable lines are excluded from the money: charging for something
  // that can't ship would be wrong, and Phase 9 will refuse the order anyway.
  const subtotal = rows.reduce(
    (sum, line) =>
      line.unavailable ? sum : sum + line.price_cents * line.quantity,
    0
  );

  return {
    items: rows,
    item_count: rows.reduce((sum, line) => sum + line.quantity, 0),
    has_unavailable: rows.some((line) => line.unavailable),
    ...totalsFor(subtotal),
  };
}

function parseSize(value: unknown): Size {
  if (typeof value !== 'string' || !(SIZES as readonly string[]).includes(value)) {
    throw badRequest(`Size must be one of: ${SIZES.join(', ')}`);
  }
  return value as Size;
}

function parseQuantity(value: unknown, { allowZero = false } = {}): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw badRequest('Quantity must be a whole number');
  }
  const floor = allowZero ? 0 : 1;
  if (value < floor || value > MAX_QUANTITY_PER_LINE) {
    throw badRequest(
      `Quantity must be between ${floor} and ${MAX_QUANTITY_PER_LINE}`
    );
  }
  return value;
}

/** Route params are strings; reject non-numeric ids before querying. */
function parseId(value: string, label: string): number {
  if (!/^\d+$/.test(value)) throw badRequest(`Invalid ${label} "${value}"`);
  return Number(value);
}

// Every cart route needs a signed-in user.
router.use(requireAuth);

// GET /api/cart
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await loadCart(req.session.userId!));
  })
);

// POST /api/cart
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { productId, size, quantity } = (req.body ?? {}) as Record<
      string,
      unknown
    >;

    const id = typeof productId === 'number' ? productId : Number(productId);
    if (!Number.isInteger(id) || id <= 0) {
      throw badRequest('A valid productId is required');
    }

    const parsedSize = parseSize(size);
    const parsedQuantity = parseQuantity(quantity ?? 1);

    // Re-checked server-side: the product page disables sold-out sizes, but
    // a stale page or a direct request shouldn't be able to add one. Uses
    // the same delimiter-padded predicate as loadCart() and products.ts, so
    // there is exactly one way in this codebase to ask the question.
    const { rows } = await pool.query<{ sold_out: boolean }>(
      `SELECT (',' || sold_out_sizes || ',' LIKE '%,' || $2 || ',%') AS sold_out
         FROM products
        WHERE id = $1`,
      [id, parsedSize]
    );

    if (rows.length === 0) throw notFound(`Product ${id} not found`);
    if (rows[0].sold_out) throw badRequest(`Size ${parsedSize} is sold out`);

    // Adding the same product and size again increments rather than
    // replacing — the UNIQUE(user_id, product_id, size) constraint makes
    // this a single statement with no read-modify-write race. LEAST caps
    // the result so repeated adds can't exceed the per-line maximum.
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, size, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id, size)
       DO UPDATE SET quantity = LEAST(
         cart_items.quantity + EXCLUDED.quantity,
         $5
       )`,
      [req.session.userId, id, parsedSize, parsedQuantity, MAX_QUANTITY_PER_LINE]
    );

    res.status(201).json(await loadCart(req.session.userId!));
  })
);

// PATCH /api/cart/:itemId
router.patch(
  '/:itemId',
  asyncHandler(async (req, res) => {
    const itemId = parseId(req.params.itemId, 'cart item id');
    const { quantity } = (req.body ?? {}) as Record<string, unknown>;
    const parsedQuantity = parseQuantity(quantity, { allowZero: true });

    // Scoped by user_id, so another user's row is simply not found rather
    // than forbidden — same convention as orders, and it doesn't confirm
    // that the id exists.
    const result =
      parsedQuantity === 0
        ? await pool.query(
            'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
            [itemId, req.session.userId]
          )
        : await pool.query(
            'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3',
            [parsedQuantity, itemId, req.session.userId]
          );

    if (result.rowCount === 0) throw notFound('Cart item not found');

    res.json(await loadCart(req.session.userId!));
  })
);

// DELETE /api/cart/:itemId
router.delete(
  '/:itemId',
  asyncHandler(async (req, res) => {
    const itemId = parseId(req.params.itemId, 'cart item id');

    const result = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
      [itemId, req.session.userId]
    );

    if (result.rowCount === 0) throw notFound('Cart item not found');

    res.json(await loadCart(req.session.userId!));
  })
);

export default router;
