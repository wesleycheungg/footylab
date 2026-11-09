// Row shapes as they come back from Postgres. Column names are snake_case
// because queries select them directly — there is no ORM mapping layer.
//
// Money is always integer cents (see the Conventions section of PLAN.md).

export type KitType = 'Home' | 'Away' | 'Third' | 'Retro';

export type Size = 'S' | 'M' | 'L' | 'XL';

export const SIZES: readonly Size[] = ['S', 'M', 'L', 'XL'];

export const KIT_TYPES: readonly KitType[] = ['Home', 'Away', 'Third', 'Retro'];

export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
}

/** A User with the password hash stripped — what API responses return. */
export type PublicUser = Pick<User, 'id' | 'email'>;

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
  created_at: Date;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  size: Size;
  quantity: number;
  created_at: Date;
}

export interface Order {
  id: number;
  user_id: number;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  shipping_name: string;
  shipping_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  created_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  size: Size;
  quantity: number;
  /** Price locked at order time, not the current product price. */
  price_cents: number;
}

export type ProductSort = 'featured' | 'price-asc' | 'price-desc';

export const PRODUCT_SORTS: readonly ProductSort[] = [
  'featured',
  'price-asc',
  'price-desc',
];

export interface ProductFilters {
  team?: string;
  league?: string;
  kit?: KitType;
  size?: Size;
  q?: string;
  sort?: ProductSort;
}
