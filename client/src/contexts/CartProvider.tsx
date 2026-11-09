import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as api from '../api';
import { EMPTY_CART, recomputeCart, type Cart, type Size } from '../types';
import {
  CartContext,
  stashPendingAdd,
  takePendingAdd,
} from './cartContext';
import { useUser } from './userContext';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, status } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Tagged with the user it belongs to. The visible cart is derived from
   * this, so a previous account's items can never render for the next
   * person to sign in on the same tab — and nothing has to be cleared in
   * an effect to make that true.
   */
  const [entry, setEntry] = useState<{ userId: number; cart: Cart } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const cart =
    status === 'authenticated' && user && entry?.userId === user.id
      ? entry.cart
      : EMPTY_CART;

  /**
   * Guards against out-of-order responses. Clicking the stepper quickly
   * fires overlapping PATCHes, and without this an earlier, slower reply
   * could overwrite a later one — the quantity would visibly jump back.
   */
  const sequence = useRef(0);

  /**
   * Which user's cart we've already started loading. StrictMode invokes
   * effects twice in development; without this the second pass fires a
   * second request that can resolve before the first and overwrite it.
   */
  const loadStartedFor = useRef<number | null>(null);

  /**
   * The last cart the server actually confirmed. Rolling back to the
   * rendered cart instead would, for a second overlapping change on the
   * same line, restore the *first* change's unconfirmed guess.
   */
  const confirmed = useRef<Cart>(EMPTY_CART);

  /**
   * Outstanding mutations. The sequence guard stops a slow early reply
   * flickering over a newer one mid-burst, but on its own it also discards
   * late-arriving authoritative responses for unrelated lines — which can
   * lose an update for good. Reconciling once the burst drains closes that
   * hole without reintroducing the flicker.
   */
  const inFlight = useRef(0);

  const applyServerCart = useCallback(
    (next: Cart, token: number, userId: number) => {
      confirmed.current = next;
      if (token === sequence.current) setEntry({ userId, cart: next });
    },
    []
  );

  /** Called after every mutation settles, successfully or not. */
  const settle = useCallback(async (userId: number) => {
    inFlight.current -= 1;
    if (inFlight.current > 0) return;

    // Last one out re-reads the cart, so the client always converges on
    // the server's view no matter how the burst interleaved.
    try {
      const authoritative = await api.getCart();
      confirmed.current = authoritative;
      setEntry({ userId, cart: authoritative });
    } catch {
      // Leave the current view; the next interaction will try again.
    }
  }, []);

  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const dismissError = useCallback(() => setError(null), []);

  // Load the cart once a sign-in is confirmed. Signing out resets the
  // guard so the next session loads afresh; the visible cart is derived,
  // so nothing needs clearing here.
  useEffect(() => {
    if (status !== 'authenticated' || !user) {
      loadStartedFor.current = null;
      return;
    }

    if (loadStartedFor.current === user.id) return;
    loadStartedFor.current = user.id;

    const token = (sequence.current += 1);
    const userId = user.id;

    (async () => {
      setLoading(true);
      try {
        // Replay an add that was interrupted by the login redirect, then
        // show the drawer so the result is visible rather than silent.
        const pending = takePendingAdd();
        const next = pending
          ? await api.addToCart(pending.productId, pending.size, pending.quantity)
          : await api.getCart();

        applyServerCart(next, token, userId);
        if (pending) setIsOpen(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not load your cart');
      } finally {
        setLoading(false);
      }
    })();
  }, [status, user, applyServerCart]);

  const addItem = useCallback(
    async (productId: number, size: Size, quantity = 1) => {
      if (status !== 'authenticated' || !user) {
        // Keep the intent and come back for it. ProtectedRoute uses the
        // same `from` convention, so login already knows how to return.
        stashPendingAdd({ productId, size, quantity });
        navigate('/login', {
          state: { from: `${location.pathname}${location.search}` },
        });
        return;
      }

      const token = (sequence.current += 1);
      inFlight.current += 1;
      setError(null);

      try {
        const next = await api.addToCart(productId, size, quantity);
        applyServerCart(next, token, user.id);
      } catch (err: unknown) {
        // Nothing changed locally for an add, so there is no rollback —
        // only a message.
        setError(err instanceof Error ? err.message : 'Could not add that item');
        throw err;
      } finally {
        // Opened either way: the drawer is where the error banner lives, so
        // closing on failure would leave the shopper with no feedback at
        // all — the call sites stay silent precisely because this reports.
        setIsOpen(true);
        void settle(user.id);
      }
    },
    [status, user, navigate, location, applyServerCart, settle]
  );

  /**
   * Optimistic: the stepper responds immediately and the snapshot goes back
   * if the server disagrees. Totals are recomputed locally for that instant
   * only — the response overwrites them with the authoritative numbers.
   */
  const mutateOptimistically = useCallback(
    async (
      nextItems: Cart['items'],
      send: () => Promise<Cart>,
      failureMessage: string
    ) => {
      if (!user) return;

      // Roll back to what the server last confirmed, not to what is on
      // screen — the latter may itself be an unconfirmed optimistic guess.
      const snapshot = confirmed.current;
      const userId = user.id;
      const token = (sequence.current += 1);
      inFlight.current += 1;

      setError(null);
      setEntry({ userId, cart: recomputeCart(nextItems) });

      try {
        applyServerCart(await send(), token, userId);
      } catch (err: unknown) {
        // Only roll back if no newer mutation has already moved on.
        if (token === sequence.current) setEntry({ userId, cart: snapshot });
        setError(err instanceof Error ? err.message : failureMessage);
      } finally {
        void settle(userId);
      }
    },
    [user, applyServerCart, settle]
  );

  const updateItem = useCallback(
    async (itemId: number, quantity: number) => {
      const nextItems =
        quantity <= 0
          ? cart.items.filter((line) => line.id !== itemId)
          : cart.items.map((line) =>
              line.id === itemId ? { ...line, quantity } : line
            );

      await mutateOptimistically(
        nextItems,
        () => api.updateCartItem(itemId, quantity),
        'Could not update that item'
      );
    },
    [cart.items, mutateOptimistically]
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      await mutateOptimistically(
        cart.items.filter((line) => line.id !== itemId),
        () => api.removeCartItem(itemId),
        'Could not remove that item'
      );
    },
    [cart.items, mutateOptimistically]
  );

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      isOpen,
      openDrawer,
      closeDrawer,
      addItem,
      updateItem,
      removeItem,
      dismissError,
    }),
    [
      cart,
      loading,
      error,
      isOpen,
      openDrawer,
      closeDrawer,
      addItem,
      updateItem,
      removeItem,
      dismissError,
    ]
  );

  return <CartContext value={value}>{children}</CartContext>;
}
