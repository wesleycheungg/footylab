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
