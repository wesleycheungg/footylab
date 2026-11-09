import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts } from '../api';
import { formatPrice, type Product, type ProductFilters } from '../types';

/**
 * Phase 4a stub. It fetches through the dev proxy and lists what came back,
 * which proves the API wiring end to end; Phase 4b replaces this with the
 * real sidebar filters, sort control and product grid.
 */
export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The header's nav links are query-param presets (/jerseys?kit=Retro), so
  // read them straight through to the API. Phase 4b adds the UI controls
  // that write these params; Phase 10 syncs them back on change.
  const query = searchParams.toString();

  useEffect(() => {
    let active = true;
    const filters = Object.fromEntries(
      new URLSearchParams(query)
    ) as ProductFilters;

    getProducts(filters)
      .then((result) => {
        if (active) setProducts(result);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load');
        }
      });

    // Guards against setting state after unmount, which StrictMode's
    // double-invoked effects would otherwise surface as a warning.
    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Jerseys</span>
      </nav>

      <h1>All Jerseys</h1>
      <p className="page__intro">
        Authentic club and national team kits. Clean designs, honest prices, and
        no real products sold — this is a portfolio project.
      </p>

      {error && (
        <p className="status-message status-message--error" role="alert">
          {error}
        </p>
      )}

      {!error && products === null && (
        <p className="status-message">Loading jerseys…</p>
      )}

      {products && (
        <>
          <p className="status-message" data-testid="result-count">
            {products.length} {products.length === 1 ? 'jersey' : 'jerseys'}
          </p>
          <ul
            style={{
              display: 'grid',
              gap: 'var(--space-3)',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            }}
          >
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  to={`/products/${product.id}`}
                  data-testid="product-card"
                  style={{
                    display: 'block',
                    padding: 'var(--space-4)',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <strong>{product.name}</strong>
                  <br />
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    {product.league} · {product.kit_type} kit
                  </span>
                  <br />
                  {formatPrice(product.price_cents)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="placeholder">
            Filters, sort and the real product grid arrive in{' '}
            <strong>Phase 4b</strong>.
          </div>
        </>
      )}
    </div>
  );
}
