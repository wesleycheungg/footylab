import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ExpandableSection from '../components/ExpandableSection';
import JerseyImage, { type JerseyView } from '../components/JerseyImage';
import QuantityStepper from '../components/QuantityStepper';
import SizeGrid from '../components/SizeGrid';
import { ApiError, getProduct } from '../api';
import { useCart } from '../contexts/cartContext';
import { useUser } from '../contexts/userContext';
import {
  SIZES,
  formatPrice,
  isSoldOut,
  soldOutSizes,
  type Product,
  type Size,
} from '../types';

const VIEWS: { id: JerseyView; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'back', label: 'Back' },
  { id: 'collar', label: 'Collar' },
  { id: 'cuff', label: 'Cuff' },
];

function parseSize(value: string | null): Size | null {
  if (!value) return null;
  return (SIZES as readonly string[]).includes(value) ? (value as Size) : null;
}

/**
 * Keyed by product id so that navigating between products remounts the
 * detail view. Without the key, a size or quantity chosen on one jersey
 * would carry over to the next one.
 */
export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <ProductDetail key={id} id={id} />;
}

function ProductDetail({ id }: { id: string }) {
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();
  const { status } = useUser();

  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chosenSize, setChosenSize] = useState<Size | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [view, setView] = useState<JerseyView>('front');
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getProduct(id)
      .then((result) => {
        if (active) setProduct(result);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? 'That jersey does not exist.'
            : err instanceof Error
              ? err.message
              : 'Failed to load'
        );
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Auto-dismiss the confirmation so it doesn't linger over the page.
  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(() => setConfirmation(null), 4000);
    return () => clearTimeout(timer);
  }, [confirmation]);

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

  const unavailable = new Set(soldOutSizes(product));
  const allGone = isSoldOut(product);

  // The shop page's quick-add links carry ?size=M, so arriving from a card
  // preselects what the shopper already clicked. Derived rather than
  // synced into state with an effect; an explicit choice overrides it.
  const requested = parseSize(searchParams.get('size'));
  const size =
    chosenSize ?? (requested && !unavailable.has(requested) ? requested : null);

  async function handleAddToCart() {
    if (!product || !size) return;

    try {
      await addItem(product.id, size, quantity);
    } catch {
      // The drawer reports the failure; don't claim success here.
      return;
    }

    // Signed-out visitors get redirected to log in, so only confirm when
    // the item actually landed in a cart.
    if (status === 'authenticated') {
      setConfirmation(
        `${quantity} × ${product.name}, size ${size}, added to your cart.`
      );
    }
  }

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to="/jerseys">Jerseys</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="product">
        {/* Gallery ------------------------------------------------------ */}
        <div className="product__gallery">
          <div className="product__stage">
            <JerseyImage
              name={product.name}
              primaryColor={product.primary_color}
              trimColor={product.trim_color}
              view={view}
              className="product__image"
            />
          </div>

          <div
            className="product__thumbs"
            role="group"
            aria-label="Jersey views"
          >
            {VIEWS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`product__thumb ${
                  view === option.id ? 'product__thumb--active' : ''
                }`}
                aria-pressed={view === option.id}
                onClick={() => setView(option.id)}
                data-testid={`view-${option.id}`}
              >
                <JerseyImage
                  name={product.name}
                  primaryColor={product.primary_color}
                  trimColor={product.trim_color}
                  view={option.id}
                  className="product__thumb-image"
                />
                <span className="product__thumb-label">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Buy panel ---------------------------------------------------- */}
        <div className="product__panel">
          <p className="product__eyebrow">
            {product.league} · {product.kit_type} kit
          </p>
          <h1 className="product__name">{product.name}</h1>
          <p className="product__price" data-testid="product-price">
            {formatPrice(product.price_cents)}
          </p>

          <div className="product__field">
            <h2 className="product__label">Kit colours</h2>
            {/* Informational, not a variant picker: the schema stores one
                colourway per product, so a selectable swatch would imply
                choices that don't exist. */}
            <ul className="swatches" data-testid="swatches">
              <li className="swatch">
                <span
                  className="swatch__dot"
                  style={{ background: product.primary_color }}
                />
                <span className="swatch__label">
                  Primary <code>{product.primary_color}</code>
                </span>
              </li>
              <li className="swatch">
                <span
                  className="swatch__dot"
                  style={{ background: product.trim_color }}
                />
                <span className="swatch__label">
                  Trim <code>{product.trim_color}</code>
                </span>
              </li>
            </ul>
          </div>

          <div className="product__field">
            <div className="product__label-row">
              <h2 className="product__label">Size</h2>
              {unavailable.size > 0 && !allGone && (
                <span className="product__hint">
                  Sold out: {[...unavailable].join(', ')}
                </span>
              )}
            </div>
            <SizeGrid
              selected={size}
              soldOut={unavailable}
              onSelect={setChosenSize}
            />
          </div>

          <div className="product__field">
            <h2 className="product__label" id="quantity-label">
              Quantity
            </h2>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </div>

          <button
            type="button"
            className="btn btn--primary product__add"
            disabled={!size || allGone}
            onClick={handleAddToCart}
            data-testid="add-to-cart"
          >
            {allGone
              ? 'Sold out'
              : size
                ? `Add to cart — ${formatPrice(product.price_cents * quantity)}`
                : 'Select a size'}
          </button>

          {/* role="status" announces the confirmation without stealing
              focus from the button. */}
          <p className="product__confirmation" role="status">
            {confirmation}
          </p>

          <div className="product__details">
            <ExpandableSection title="Details" defaultOpen>
              <p>
                Match-weight {product.kit_type.toLowerCase()} shirt in{' '}
                {product.team}&apos;s colours, with a ribbed collar and
                contrast trim at the cuffs and hem. Recycled polyester with
                mesh ventilation panels.
              </p>
              <p>Printed club crest. Machine wash cold, hang to dry.</p>
            </ExpandableSection>

            <ExpandableSection title="Fit &amp; sizing">
              <p>
                Athletic cut, true to size. If you&apos;re between sizes or
                want room to layer, size up.
              </p>
              <p>
                Chest, to fit: S 36–38&quot;, M 39–41&quot;, L 42–44&quot;, XL
                45–47&quot;.
              </p>
            </ExpandableSection>

            <ExpandableSection title="Shipping &amp; returns">
              <p>
                Free standard shipping on orders over $150, otherwise a flat
                $10. Orders ship within two business days.
              </p>
              <p>
                Free returns for 30 days on unworn items with tags attached.
              </p>
            </ExpandableSection>
          </div>

          <p className="product__disclaimer">
            Portfolio project — no real products are sold and no payment is
            taken.
          </p>
        </div>
      </div>
    </div>
  );
}
