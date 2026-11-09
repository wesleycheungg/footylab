import { Router } from 'express';
import pool from '../db/pool.js';
import {
  asyncHandler,
  badRequest,
  notFound,
} from '../middleware/errorHandler.js';
import {
  KIT_TYPES,
  PRODUCT_SORTS,
  SIZES,
  type KitType,
  type Product,
  type ProductSort,
  type Size,
} from '../types.js';

const router = Router();

/** No pagination — there are only 20 products. */
const RESULT_LIMIT = 50;

const SORT_SQL: Record<ProductSort, string> = {
  // `id` is the tiebreaker in every case: many jerseys share a price, and
  // without it Postgres may return tied rows in any order, which makes
  // sort assertions in the E2E suite flaky.
  featured: 'id ASC',
  'price-asc': 'price_cents ASC, id ASC',
  'price-desc': 'price_cents DESC, id ASC',
};

/** Reads a query param that may arrive as a repeated key (?q=a&q=b). */
function singleParam(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * Escapes LIKE wildcards so a search for "50%" or "a_b" is treated as
 * literal text rather than a pattern.
 */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function parseOneOf<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  paramName: string
): T | undefined {
  if (value === undefined) return undefined;
  const match = allowed.find(
    (option) => option.toLowerCase() === value.toLowerCase()
  );
  if (!match) {
    throw badRequest(
      `Invalid ${paramName} "${value}". Expected one of: ${allowed.join(', ')}`
    );
  }
  return match;
}

// GET /api/products
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const team = singleParam(req.query.team);
    const league = singleParam(req.query.league);
    const kit = parseOneOf<KitType>(
      singleParam(req.query.kit),
      KIT_TYPES,
      'kit'
    );
    const size = parseOneOf<Size>(singleParam(req.query.size), SIZES, 'size');
    const q = singleParam(req.query.q);
    const sort =
      parseOneOf<ProductSort>(
        singleParam(req.query.sort),
        PRODUCT_SORTS,
        'sort'
      ) ?? 'featured';

    const conditions: string[] = [];
    const values: unknown[] = [];

    // Each filter pushes its own placeholder, so the parameter numbering
    // stays correct no matter which combination of filters is present.
    const placeholder = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (team) {
      conditions.push(`LOWER(team) = LOWER(${placeholder(team)})`);
    }

    if (league) {
      conditions.push(`LOWER(league) = LOWER(${placeholder(league)})`);
    }

    if (kit) {
      conditions.push(`kit_type = ${placeholder(kit)}`);
    }

    if (size) {
      // Exclude products where this size is sold out. Both sides are padded
      // with the delimiter so a search for 'S' cannot match 'XS' — see the
      // Data Model section of PLAN.md.
      conditions.push(
        `',' || sold_out_sizes || ',' NOT LIKE '%,' || ${placeholder(size)} || ',%'`
      );
    }

    if (q) {
      const pattern = `%${escapeLike(q)}%`;
      const p = placeholder(pattern);
      // ILIKE is the case-insensitive match; one placeholder reused across
      // all three columns.
      conditions.push(`(name ILIKE ${p} OR team ILIKE ${p} OR league ILIKE ${p})`);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query<Product>(
      `SELECT id, name, team, league, kit_type, price_cents,
              primary_color, trim_color, sold_out_sizes, created_at
         FROM products
         ${where}
        ORDER BY ${SORT_SQL[sort]}
        LIMIT ${RESULT_LIMIT}`,
      values
    );

    res.json(rows);
  })
);

// GET /api/products/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Reject non-numeric ids before hitting the database, so /products/abc
    // is a clear 400 rather than a Postgres cast error surfacing as a 500.
    if (!/^\d+$/.test(id)) {
      throw badRequest(`Invalid product id "${id}"`);
    }

    const { rows } = await pool.query<Product>(
      `SELECT id, name, team, league, kit_type, price_cents,
              primary_color, trim_color, sold_out_sizes, created_at
         FROM products
        WHERE id = $1`,
      [Number(id)]
    );

    if (rows.length === 0) {
      throw notFound(`Product ${id} not found`);
    }

    res.json(rows[0]);
  })
);

export default router;
