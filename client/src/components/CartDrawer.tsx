import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/cartContext';
import { useUser } from '../contexts/userContext';
import { formatPrice } from '../types';
import JerseyImage from './JerseyImage';
import QuantityStepper from './QuantityStepper';
import ShippingProgressBar from './ShippingProgressBar';

export default function CartDrawer() {
  const { status } = useUser();
  const {
    cart,
    loading,
    error,
    isOpen,
    closeDrawer,
    updateItem,
    removeItem,
    dismissError,
  } = useCart();

  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  // Close on Escape, move focus into the panel on open, and give it back on
  // close — otherwise a keyboard user is dropped at the top of the document.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement;
    panelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeDrawer();
    }

    document.addEventListener('keydown', handleKeyDown);

    // Stop the page behind scrolling while the drawer is over it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      (previouslyFocused.current as HTMLElement | null)?.focus?.();
    };
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;

  const canCheckout =
    cart.items.length > 0 && !cart.has_unavailable && status === 'authenticated';

  return (
    <div className="drawer" data-testid="cart-drawer">
      {/* Backdrop is a button so a click or Enter both dismiss it. */}
      <button
        type="button"
        className="drawer__backdrop"
        aria-label="Close cart"
        onClick={closeDrawer}
        data-testid="cart-backdrop"
      />

      <div
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        tabIndex={-1}
        ref={panelRef}
      >
        <header className="drawer__header">
          <h2 className="drawer__title">
            Your cart
            {cart.item_count > 0 && (
              <span className="drawer__count">({cart.item_count})</span>
            )}
          </h2>
          <button
            type="button"
            className="icon-button"
            onClick={closeDrawer}
            aria-label="Close cart"
            data-testid="cart-close"
          >
            ✕
          </button>
        </header>

        {error && (
          <p className="drawer__error" role="alert" data-testid="cart-error">
            {error}
            <button
              type="button"
              className="link-button"
              onClick={dismissError}
              data-testid="cart-dismiss-error"
            >
              Dismiss
            </button>
          </p>
        )}

        {loading && cart.items.length === 0 ? (
          <p className="status-message">Loading your cart…</p>
        ) : cart.items.length === 0 ? (
          <div className="drawer__empty" data-testid="cart-empty">
            <p>Your cart is empty.</p>
            <Link
              to="/jerseys"
              className="btn"
              onClick={closeDrawer}
              data-testid="cart-browse-jerseys"
            >
              Browse jerseys
            </Link>
          </div>
        ) : (
          <>
            <ul className="drawer__items">
              {cart.items.map((line) => (
                <li
                  key={line.id}
                  className={`cart-line ${line.unavailable ? 'cart-line--unavailable' : ''}`}
                  data-testid="cart-item"
                >
                  <Link
                    to={`/products/${line.product_id}`}
                    className="cart-line__media"
                    onClick={closeDrawer}
                    data-testid="cart-line-image"
                  >
                    <JerseyImage
                      name={line.name}
                      primaryColor={line.primary_color}
                      trimColor={line.trim_color}
                      className="cart-line__image"
                    />
                  </Link>

                  <div className="cart-line__body">
                    <Link
                      to={`/products/${line.product_id}`}
                      className="cart-line__name"
                      onClick={closeDrawer}
                      data-testid="cart-line-name"
                    >
                      {line.name}
                    </Link>
                    <p className="cart-line__meta">
                      {line.league} · Size {line.size}
                    </p>

                    {line.unavailable ? (
                      <p className="cart-line__warning">
                        Size {line.size} sold out — remove it to check out.
                      </p>
                    ) : (
                      <QuantityStepper
                        id={`cart-quantity-${line.id}`}
                        label={`${line.name}, size ${line.size}`}
                        value={line.quantity}
                        onChange={(quantity) => updateItem(line.id, quantity)}
                      />
                    )}

                    <button
                      type="button"
                      className="link-button cart-line__remove"
                      onClick={() => removeItem(line.id)}
                      data-testid="cart-remove"
                    >
                      Remove
                    </button>
                  </div>

                  <p className="cart-line__price" data-testid="cart-line-price">
                    {formatPrice(line.price_cents * line.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="drawer__footer">
              <ShippingProgressBar subtotalCents={cart.subtotal_cents} />

              <dl className="totals">
                <div className="totals__row">
                  <dt>Subtotal</dt>
                  <dd data-testid="cart-subtotal">
                    {formatPrice(cart.subtotal_cents)}
                  </dd>
                </div>
                <div className="totals__row">
                  <dt>Shipping</dt>
                  <dd data-testid="cart-shipping">
                    {cart.shipping_cents === 0
                      ? 'Free'
                      : formatPrice(cart.shipping_cents)}
                  </dd>
                </div>
                <div className="totals__row totals__row--total">
                  <dt>Total</dt>
                  <dd data-testid="cart-total">
                    {formatPrice(cart.total_cents)}
                  </dd>
                </div>
              </dl>

              {cart.has_unavailable && (
                <p className="drawer__warning" role="alert">
                  Remove the sold-out item to continue.
                </p>
              )}

              {/* A link, not a button, so it behaves like navigation —
                  but rendered inert when checkout isn't possible. */}
              {canCheckout ? (
                <Link
                  to="/checkout"
                  className="btn btn--primary drawer__checkout"
                  onClick={closeDrawer}
                  data-testid="checkout-button"
                >
                  Checkout · {formatPrice(cart.total_cents)}
                </Link>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary drawer__checkout"
                  disabled
                  data-testid="checkout-button"
                >
                  Checkout
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
