import { createContext, useContext } from 'react';
import type { Cart, Size } from '../types';

export interface PendingCartAdd {
  productId: number;
  size: Size;
  quantity: number;
}

export interface CartContextValue {
  cart: Cart;
  /** True during the first load, so the drawer can avoid flashing "empty". */
  loading: boolean;
  /** Last mutation failure, already rolled back. */
  error: string | null;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Signed out, this stashes the intent and redirects to login instead. */
  addItem: (productId: number, size: Size, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  dismissError: () => void;
}

// Kept out of the provider's module so that file exports only a component;
// mixing hooks and components in one file breaks fast refresh.
export const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return context;
}

/**
 * Where an add-to-cart intent waits while the shopper signs in.
 *
 * sessionStorage rather than React state because the login redirect is a
 * route change the provider survives, but a full page reload (or arriving
 * at /login directly) would wipe in-memory state. It clears itself as soon
 * as the add is replayed.
 */
const PENDING_KEY = 'footylab.pendingCartAdd';

export function stashPendingAdd(pending: PendingCartAdd): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // Private browsing can refuse storage; losing the intent is survivable.
  }
}

export function takePendingAdd(): PendingCartAdd | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw) as PendingCartAdd;
  } catch {
    return null;
  }
}
