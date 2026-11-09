import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import {
  asyncHandler,
  badRequest,
  notFound,
} from '../middleware/errorHandler.js';
import { totalsFor } from '../money.js';
import type { Order, OrderDetail, OrderLine, OrderSummary } from '../types.js';
import { EMAIL_PATTERN, requiredString } from '../validation.js';

const router = Router();

router.use(requireAuth);

interface ShippingDetails {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * Card fields are deliberately absent. They are validated in the browser
 * for format only and never sent — there is no payment processing here, so
 * there is no reason for a card number to reach the server and none to log
 * one. See the note in PLAN.md Phase 9.
 */
function parseShipping(body: unknown): ShippingDetails {
  const input = (body ?? {}) as Record<string, unknown>;

  const email = requiredString(input.email, 'Email');
  if (!EMAIL_PATTERN.test(email)) {
    throw badRequest('Enter a valid email address');
  }

  return {
    name: requiredString(input.name, 'Name'),
    email,
    address: requiredString(input.address, 'Address', 300),
    city: requiredString(input.city, 'City'),
    state: requiredString(input.state, 'State', 100),
    zip: requiredString(input.zip, 'ZIP code', 20),
  };
}

// POST /api/orders
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const shipping = parseShipping(req.body);
    const userId = req.session.userId!;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // FOR UPDATE OF ci locks this user's cart rows for the transaction,
      // so two simultaneous checkouts can't both read the same cart and
      // produce two orders from one set of items.
      const { rows: lines } = await client.query<{
        product_id: number;
        size: string;
        quantity: number;
        price_cents: number;
        name: string;
        unavailable: boolean;
      }>(
        `SELECT ci.product_id,
                ci.size,
                ci.quantity,
                p.price_cents,
                p.name,
                (',' || p.sold_out_sizes || ',' LIKE '%,' || ci.size || ',%')
                  AS unavailable
           FROM cart_items ci
           JOIN products p ON p.id = ci.product_id
          WHERE ci.user_id = $1
          ORDER BY ci.created_at, ci.id
            FOR UPDATE OF ci`,
        [userId]
      );

      if (lines.length === 0) {
        throw badRequest('Your cart is empty');
      }

      // Re-checked at the moment of ordering: a size can sell out between
      // adding it and checking out, and the drawer's warning is only a
      // courtesy — this is the check that actually prevents it.
      const unavailable = lines.filter((line) => line.unavailable);
      if (unavailable.length > 0) {
        throw badRequest(
          `No longer available: ${unavailable
            .map((line) => `${line.name} (${line.size})`)
            .join(', ')}`
        );
      }

      // Prices come from the products table inside the transaction, never
      // from the client. Totals use the same money rule the cart uses.
      const subtotal = lines.reduce(
        (sum, line) => sum + line.price_cents * line.quantity,
        0
      );
      const totals = totalsFor(subtotal);

      const { rows: orderRows } = await client.query<Order>(
        `INSERT INTO orders (
           user_id, subtotal_cents, shipping_cents, total_cents,
           shipping_name, shipping_email, shipping_address,
           shipping_city, shipping_state, shipping_zip
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          userId,
          totals.subtotal_cents,
          totals.shipping_cents,
          totals.total_cents,
          shipping.name,
          shipping.email,
          shipping.address,
          shipping.city,
          shipping.state,
          shipping.zip,
        ]
      );

      const order = orderRows[0];

      // price_cents is copied, not referenced: an order must still show
      // what was actually paid after the product's price changes.
      await client.query(
        `INSERT INTO order_items (order_id, product_id, size, quantity, price_cents)
         SELECT $1, ci.product_id, ci.size, ci.quantity, p.price_cents
           FROM cart_items ci
           JOIN products p ON p.id = ci.product_id
          WHERE ci.user_id = $2`,
        [order.id, userId]
      );

      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      await client.query('COMMIT');

      res.status(201).json(order);
    } catch (error) {
      // Without this the order row could survive while the cart stays
      // full, or vice versa.
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  })
);

// GET /api/orders
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query<OrderSummary>(
      `SELECT o.id,
              o.created_at,
              o.subtotal_cents,
              o.shipping_cents,
              o.total_cents,
              COALESCE(SUM(oi.quantity), 0)::int AS item_count
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC, o.id DESC`,
      [req.session.userId]
    );

    res.json(rows);
  })
);

// GET /api/orders/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      throw badRequest(`Invalid order id "${id}"`);
    }

    // Scoped by user_id, so someone else's order is simply not found.
    // A 403 would confirm that the order exists.
    const { rows: orders } = await pool.query<Order>(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [Number(id), req.session.userId]
    );

    if (orders.length === 0) {
      throw notFound(`Order ${id} not found`);
    }

    const { rows: items } = await pool.query<OrderLine>(
      `SELECT oi.id,
              oi.product_id,
              oi.size,
              oi.quantity,
              oi.price_cents,
              p.name,
              p.team,
              p.league,
              p.kit_type,
              p.primary_color,
              p.trim_color
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = $1
        ORDER BY oi.id`,
      [orders[0].id]
    );

    const detail: OrderDetail = { ...orders[0], items };
    res.json(detail);
  })
);

export default router;
