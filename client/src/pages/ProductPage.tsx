import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, getProduct } from '../api';
import { formatPrice, soldOutSizes, type Product } from '../types';

/**
 * Phase 4a stub — proves the route param and getProduct() work, including
 * the 404 path. Phase 5 builds the real detail page (swatches, size grid,
 * quantity stepper, expandable sections).
 */
interface LoadedProduct {
  /** Which id this result belongs to, so a stale one is easy to spot. */
  id: string;
  product?: Product;
  error?: string;
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [loaded, setLoaded] = useState<LoadedProduct | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    getProduct(id)
      .then((product) => {
        if (active) setLoaded({ id, product });
      })
      .catch((err: unknown) => {
        if (!active) return;
        const error =
          err instanceof ApiError && err.status === 404
            ? 'That jersey does not exist.'
            : err instanceof Error
              ? err.message
              : 'Failed to load';
        setLoaded({ id, error });
      });

    // Guards against a slow response for the previous id resolving after
    // navigation, and against setting state post-unmount.
    return () => {
      active = false;
    };
  }, [id]);

  // Derived during render rather than reset in the effect: a synchronous
  // setState on id change would trigger a second render pass for nothing.
  const isStale = !loaded || loaded.id !== id;
  const product = isStale ? null : loaded.product;
  const error = isStale ? null : loaded.error;

  if (error) {
    return (
      <div className="container page">
        <h1>Not found</h1>
        <p className="status-message status-message--error" role="alert">
          {error}
        </p>
        <Link to="/jerseys" className="btn">
          Back to all jerseys
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container page">
        <p className="status-message">Loading…</p>
      </div>
    );
  }

  const unavailable = soldOutSizes(product);

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/jerseys">Jerseys</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        {product.league} · {product.kit_type} kit
      </p>
      <h1>{product.name}</h1>
      <p style={{ marginTop: 'var(--space-2)', fontSize: '1.25rem' }}>
        {formatPrice(product.price_cents)}
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
        <span
          aria-label={`Primary color ${product.primary_color}`}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: product.primary_color,
            border: '1px solid var(--color-border)',
          }}
        />
        <span
          aria-label={`Trim color ${product.trim_color}`}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: product.trim_color,
            border: '1px solid var(--color-border)',
          }}
        />
      </div>

      {unavailable.length > 0 && (
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
          Sold out: {unavailable.join(', ')}
        </p>
      )}

      <div className="placeholder">
        Size grid, quantity stepper and Add to Cart arrive in{' '}
        <strong>Phase 5</strong>.
      </div>
    </div>
  );
}
