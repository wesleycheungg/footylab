import { Link } from 'react-router-dom';
import { useCart } from '../contexts/cartContext';
import {
  SIZES,
  formatPrice,
  isSoldOut,
  soldOutSizes,
  type Product,
} from '../types';
import JerseyImage from './JerseyImage';

const NEW_FOR_DAYS = 7;

function isNew(product: Product): boolean {
  const created = new Date(product.created_at).getTime();
  if (Number.isNaN(created)) return false;
  const ageDays = (Date.now() - created) / 86_400_000;
  return ageDays <= NEW_FOR_DAYS;
}

/**
 * Badge priority is deliberate: a shopper needs to know something is
 * unavailable before anything else, and "Retro" describes the product
 * better than "New" describes its listing date.
 */
function badgeFor(product: Product): string | null {
  if (isSoldOut(product)) return 'Sold out';
  if (product.kit_type === 'Retro') return 'Retro';
  if (isNew(product)) return 'New';
  return null;
}

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const badge = badgeFor(product);
  const unavailable = new Set(soldOutSizes(product));

  return (
    <article className="product-card" data-testid="product-card">
      <div className="product-card__media">
        <JerseyImage
          name={product.name}
          primaryColor={product.primary_color}
          trimColor={product.trim_color}
          className="product-card__image"
        />

        {badge && (
          <span className="product-card__badge" data-testid="product-badge">
            {badge}
          </span>
        )}

        {/* Revealed on hover/focus-within. These add one of that size
            straight to the cart; signed out, addItem() stashes the intent
            and routes to login, which replays it afterwards. */}
        <div className="product-card__sizes" data-testid="quick-add">
          {SIZES.map((size) => {
            const soldOut = unavailable.has(size);

            if (soldOut) {
              return (
                <span
                  key={size}
                  className="size-chip size-chip--unavailable"
                  aria-disabled="true"
                  aria-label={`Size ${size}, sold out`}
                  data-testid={`quick-add-${size}`}
                >
                  {size}
                </span>
              );
            }

            return (
              <button
                key={size}
                type="button"
                className="size-chip"
                aria-label={`Add ${product.name}, size ${size}, to cart`}
                onClick={() => {
                  // Swallowed deliberately: the drawer surfaces failures,
                  // and an unhandled rejection here would be noise.
                  void addItem(product.id, size).catch(() => {});
                }}
                data-testid={`quick-add-${size}`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="product-card__body">
        {/* Stretched link: the ::after overlay makes the whole card
            clickable without nesting the size buttons inside an anchor,
            which would be invalid HTML and unusable with a keyboard. */}
        <h3 className="product-card__name">
          <Link to={`/products/${product.id}`} className="product-card__link">
            {product.name}
          </Link>
        </h3>
        <p className="product-card__meta">
          {product.league} · {product.kit_type} kit
        </p>
        <p className="product-card__price">{formatPrice(product.price_cents)}</p>
      </div>
    </article>
  );
}
