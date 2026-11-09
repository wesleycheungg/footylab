import { useState } from 'react';
import type { Size } from '../types';

export interface CartLine {
  productId: number;
  size: Size;
  quantity: number;
}

/**
 * Placeholder until Phase 8.
 *
 * Nothing is persisted: there is no cart API and no CartContext yet, so
 * `addItem` only reports success so the product page can confirm the
 * interaction. Phase 8 replaces the body with a real POST /api/cart and
 * moves the state into CartContext — the signature is meant to survive
 * that change so callers don't need rewriting.
 */
export function useCart() {
  const [itemCount, setItemCount] = useState(0);

  async function addItem(line: CartLine): Promise<void> {
    setItemCount((previous) => previous + line.quantity);
  }

  return { addItem, itemCount };
}
