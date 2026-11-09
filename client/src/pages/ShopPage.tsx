import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../api';
import {
  KIT_TYPES,
  SIZES,
  type Product,
  type ProductFilters,
  type ProductSort,
} from '../types';

const LEAGUES = [
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'International',
];

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The URL is the only source of truth for filter state. Keeping a
  // parallel useState copy would let the two drift the moment someone
  // arrives via a header preset or the back button.
  const query = searchParams.toString();
  const league = searchParams.get('league') ?? '';
  const kit = searchParams.get('kit') ?? '';
  const size = searchParams.get('size') ?? '';
  const q = searchParams.get('q') ?? '';
  const sort = (searchParams.get('sort') ?? 'featured') as ProductSort;
  const hasFilters = Boolean(league || kit || size || q);

  useEffect(() => {
    let active = true;
    const filters = Object.fromEntries(
      new URLSearchParams(query)
    ) as ProductFilters;

    getProducts(filters)
      .then((result) => {
        if (active) {
          setProducts(result);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setProducts([]);
        }
      });

    return () => {
      active = false;
    };
  }, [query]);

  /** Setting a param to its current value clears it, so chips toggle. */
  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || next.get(key) === value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: false });
  }

  function clearAll() {
    setSearchParams(new URLSearchParams(), { replace: false });
  }

  const count = products?.length ?? 0;

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Jerseys</span>
      </nav>

      <div className="shop">
        <aside className="shop__sidebar" aria-label="Filters">
          <div className="filter-group">
            <label className="filter-group__title" htmlFor="filter-search">
              Search
            </label>
            {/* Phase 10 adds the global search in the header; this one
                scopes to the shop page. Submitting rather than filtering
                per keystroke keeps one request per intent. */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const value = new FormData(event.currentTarget).get('q');
                setParam('q', typeof value === 'string' ? value.trim() : '');
              }}
            >
              <input
                id="filter-search"
                name="q"
                type="search"
                className="filter-search"
                placeholder="Team or kit…"
                defaultValue={q}
                key={q}
                data-testid="filter-search"
              />
            </form>
          </div>

          <div className="filter-group">
            <h2 className="filter-group__title">League</h2>
            <div className="chip-row">
              <button
                type="button"
                className={`chip ${league === '' ? 'chip--active' : ''}`}
                onClick={() => setParam('league', '')}
                data-testid="league-all"
              >
                All
              </button>
              {LEAGUES.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`chip ${league === name ? 'chip--active' : ''}`}
                  aria-pressed={league === name}
                  onClick={() => setParam('league', name)}
                  data-testid={`league-${name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h2 className="filter-group__title">Size</h2>
            <div className="chip-row">
              {SIZES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`chip chip--pill ${size === value ? 'chip--active' : ''}`}
                  aria-pressed={size === value}
                  onClick={() => setParam('size', value)}
                  data-testid={`size-${value}`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="filter-group__hint">
              Shows jerseys available in that size.
            </p>
          </div>

          <div className="filter-group">
            <h2 className="filter-group__title">Kit</h2>
            <div className="checkbox-list">
              {KIT_TYPES.map((value) => (
                <label key={value} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={kit === value}
                    onChange={() => setParam('kit', value)}
                    data-testid={`kit-${value.toLowerCase()}`}
                  />
                  <span>{value}</span>
                </label>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button
              type="button"
              className="link-button"
              onClick={clearAll}
              data-testid="clear-filters"
            >
              Clear all filters
            </button>
          )}
        </aside>

        <div className="shop__main">
          <div className="shop__header">
            <div>
              <h1>All Jerseys</h1>
              <p className="page__intro">
                Authentic club and national team kits. Clean designs, honest
                prices, and no real products sold — this is a portfolio project.
              </p>
            </div>
          </div>

          <div className="shop__toolbar">
            <p className="shop__count" data-testid="result-count">
              {products === null
                ? 'Loading…'
                : `${count} ${count === 1 ? 'jersey' : 'jerseys'}`}
            </p>

            <label className="shop__sort">
              <span className="visually-hidden">Sort by</span>
              <select
                value={sort}
                onChange={(event) => {
                  const next = new URLSearchParams(searchParams);
                  if (event.target.value === 'featured') {
                    next.delete('sort');
                  } else {
                    next.set('sort', event.target.value);
                  }
                  setSearchParams(next);
                }}
                data-testid="sort-select"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <p className="status-message status-message--error" role="alert">
              {error}
            </p>
          )}

          {!error && products === null && (
            <div className="product-grid" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="product-card product-card--skeleton" />
              ))}
            </div>
          )}

          {products && products.length === 0 && !error && (
            <div className="empty-state" data-testid="empty-state">
              <h2>No jerseys match those filters</h2>
              <p>Try removing a filter or searching for a different team.</p>
              <button type="button" className="btn" onClick={clearAll}>
                Clear all filters
              </button>
            </div>
          )}

          {products && products.length > 0 && (
            <div className="product-grid" data-testid="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
