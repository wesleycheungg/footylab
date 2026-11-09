// Mirrors server/src/types.ts, with one deliberate difference: timestamps
// arrive as ISO strings over JSON, not Date objects. Typing them as Date
// here would compile fine and then fail at runtime on any date method.

export type KitType = 'Home' | 'Away' | 'Third' | 'Retro';

export type Size = 'S' | 'M' | 'L' | 'XL';

export const SIZES: readonly Size[] = ['S', 'M', 'L', 'XL'];

export const KIT_TYPES: readonly KitType[] = ['Home', 'Away', 'Third', 'Retro'];

export type ProductSort = 'featured' | 'price-asc' | 'price-desc';

export interface Product {
  id: number;
  name: string;
  team: string;
  league: string;
  kit_type: KitType;
  price_cents: number;
  primary_color: string;
  trim_color: string;
  /** Comma-separated, e.g. 'S,L'. Empty string when nothing is sold out. */
  sold_out_sizes: string;
  created_at: string;
}

export interface PublicUser {
  id: number;
  email: string;
}

/** A cart row joined to its product — mirrors the server's CartLine. */
export interface CartLine {
  /** cart_items.id — what PATCH and DELETE address. */
  id: number;
  product_id: number;
  size: Size;
  quantity: number;
  name: string;
  team: string;
  league: string;
  kit_type: KitType;
  price_cents: number;
  primary_color: string;
  trim_color: string;
  sold_out_sizes: string;
  /** This size sold out after the item was added. */
  unavailable: boolean;
}

/** Every cart endpoint returns this whole shape, not just the changed row. */
export interface Cart {
  items: CartLine[];
  item_count: number;
  has_unavailable: boolean;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
}

export const EMPTY_CART: Cart = {
  items: [],
  item_count: 0,
  has_unavailable: false,
  subtotal_cents: 0,
  shipping_cents: 0,
  total_cents: 0,
};

/**
 * Mirrors server/src/money.ts. Used **only** to keep the drawer consistent
 * during an optimistic update — every response replaces these numbers with
 * the server's, which remain authoritative. Keep the two in step.
 */
export const FREE_SHIPPING_THRESHOLD_CENTS = 15_000;
const FLAT_SHIPPING_CENTS = 1_000;

export function recomputeCart(items: CartLine[]): Cart {
  const subtotal = items.reduce(
    (sum, line) =>
      line.unavailable ? sum : sum + line.price_cents * line.quantity,
    0
  );
  const shipping =
    subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : FLAT_SHIPPING_CENTS;

  return {
    items,
    item_count: items.reduce((sum, line) => sum + line.quantity, 0),
    has_unavailable: items.some((line) => line.unavailable),
    subtotal_cents: subtotal,
    shipping_cents: shipping,
    total_cents: subtotal + shipping,
  };
}

export interface ProductFilters {
  team?: string;
  league?: string;
  kit?: KitType;
  size?: Size;
  q?: string;
  sort?: ProductSort;
}

/** Parses the CSV column into a list the UI can test membership against. */
export function soldOutSizes(product: Product): Size[] {
  if (!product.sold_out_sizes) return [];
  return product.sold_out_sizes
    .split(',')
    .map((size) => size.trim())
    .filter((size): size is Size => (SIZES as readonly string[]).includes(size));
}

export function isSoldOut(product: Product): boolean {
  return soldOutSizes(product).length === SIZES.length;
}

/** 9000 -> "$90". Money is integer cents everywhere except display. */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
