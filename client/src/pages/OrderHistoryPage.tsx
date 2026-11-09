import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../api';
import { formatOrderDate, formatPrice, type OrderSummary } from '../types';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getOrders()
      .then((result) => {
        if (active) setOrders(result);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : 'Could not load your orders.'
        );
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container page">
      <h1>Order history</h1>

      {error && (
        <p className="status-message status-message--error" role="alert">
          {error}
        </p>
      )}

      {!error && orders === null && (
        <p className="status-message">Loading your orders…</p>
      )}

      {orders?.length === 0 && (
        <div className="empty-state" data-testid="orders-empty">
          <h2>No orders yet</h2>
          <p>Once you place an order it will show up here.</p>
          <Link to="/jerseys" className="btn">
            Browse jerseys
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        // A real table: this is tabular data, and a grid of divs would
        // lose the row/column relationships for screen readers.
        <div className="table-scroll">
          <table className="orders-table" data-testid="orders-table">
            <caption className="visually-hidden">
              Your orders, most recent first
            </caption>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Date</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} data-testid="order-row">
                  <td>#{order.id}</td>
                  <td>{formatOrderDate(order.created_at)}</td>
                  <td>
                    {order.item_count}{' '}
                    {order.item_count === 1 ? 'item' : 'items'}
                  </td>
                  <td>{formatPrice(order.total_cents)}</td>
                  <td>
                    {/* A link per row rather than a click handler on the
                        row: keyboard-reachable and openable in a new tab. */}
                    <Link
                      to={`/orders/${order.id}`}
                      className="orders-table__link"
                      data-testid="order-link"
                    >
                      View
                      <span className="visually-hidden"> order {order.id}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
