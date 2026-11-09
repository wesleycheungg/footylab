import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import JerseyImage from '../components/JerseyImage';
import { ApiError, getOrder } from '../api';
import { formatOrderDate, formatPrice, type OrderDetail } from '../types';

/**
 * Serves both `/orders/:id` and the post-checkout confirmation.
 *
 * The plan listed these as two pages, but they differ only in the heading
 * and one button — two files would have been the same component twice,
 * drifting apart the moment either changed. Checkout navigates here with
 * `state.justPlaced` to get the confirmation framing.
 */
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const justPlaced = Boolean(
    (location.state as { justPlaced?: boolean } | null)?.justPlaced
  );

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    getOrder(id)
      .then((result) => {
        if (active) setOrder(result);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? // Scoped by user_id server-side, so someone else's order is
              // indistinguishable from one that doesn't exist. Deliberate.
              'We could not find that order.'
            : err instanceof Error
              ? err.message
              : 'Could not load that order.'
        );
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <div className="container page">
        <h1>Order not found</h1>
        <p className="status-message status-message--error" role="alert">
          {error}
        </p>
        <Link to="/orders" className="btn">
          Back to order history
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container page">
        <p className="status-message">Loading order…</p>
      </div>
    );
  }

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/orders">Order history</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Order #{order.id}</span>
      </nav>

      {justPlaced && (
        <p className="order__confirmation" data-testid="order-confirmation">
          Thanks — your order is confirmed.
        </p>
      )}

      <h1 data-testid="order-number">Order #{order.id}</h1>
      <p className="page__intro">Placed {formatOrderDate(order.created_at)}</p>

      <div className="order">
        <div>
          <h2 className="checkout__legend">Items</h2>
          <ul className="checkout__items">
            {order.items.map((line) => (
              <li
                key={line.id}
                className="checkout__item"
                data-testid="order-item"
              >
                <div className="checkout__thumb">
                  <JerseyImage
                    name={line.name}
                    primaryColor={line.primary_color}
                    trimColor={line.trim_color}
                    className="cart-line__image"
                  />
                </div>
                <div>
                  <Link
                    to={`/products/${line.product_id}`}
                    className="cart-line__name"
                  >
                    {line.name}
                  </Link>
                  <p className="cart-line__meta">
                    {line.league} · Size {line.size} · Qty {line.quantity}
                  </p>
                </div>
                {/* The price paid at the time, not today's price. */}
                <p className="cart-line__price">
                  {formatPrice(line.price_cents * line.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <aside className="order__aside">
          <h2 className="checkout__legend">Shipping to</h2>
          <address className="order__address" data-testid="order-address">
            {order.shipping_name}
            <br />
            {order.shipping_address}
            <br />
            {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
            <br />
            {order.shipping_email}
          </address>

          <dl className="totals">
            <div className="totals__row">
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.subtotal_cents)}</dd>
            </div>
            <div className="totals__row">
              <dt>Shipping</dt>
              <dd>
                {order.shipping_cents === 0
                  ? 'Free'
                  : formatPrice(order.shipping_cents)}
              </dd>
            </div>
            <div className="totals__row totals__row--total">
              <dt>Total</dt>
              <dd data-testid="order-total">
                {formatPrice(order.total_cents)}
              </dd>
            </div>
          </dl>

          <Link
            to={justPlaced ? '/jerseys' : '/orders'}
            className="btn order__action"
            data-testid="order-action"
          >
            {justPlaced ? 'Continue shopping' : 'Back to order history'}
          </Link>
        </aside>
      </div>
    </div>
  );
}
