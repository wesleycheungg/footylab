import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import JerseyImage from '../components/JerseyImage';
import { placeOrder } from '../api';
import { useCart } from '../contexts/cartContext';
import { useUser } from '../contexts/userContext';
import { formatPrice, type ShippingDetails } from '../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Fields = ShippingDetails & {
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardName: string;
};

const EMPTY_FIELDS: Fields = {
  name: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvv: '',
  cardName: '',
};

const digitsOnly = (value: string) => value.replace(/\D/g, '');

/**
 * Card checks are format-only and happen here alone — the card fields are
 * never put in the request body. There is no payment processing in this
 * project, so a card number reaching the server would be pure liability.
 */
function validate(fields: Fields): Partial<Record<keyof Fields, string>> {
  const errors: Partial<Record<keyof Fields, string>> = {};

  if (!fields.name.trim()) errors.name = 'Enter a name.';
  if (!EMAIL_PATTERN.test(fields.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!fields.address.trim()) errors.address = 'Enter a street address.';
  if (!fields.city.trim()) errors.city = 'Enter a city.';
  if (!fields.state.trim()) errors.state = 'Enter a state.';
  if (!/^\d{5}(-\d{4})?$/.test(fields.zip.trim())) {
    errors.zip = 'Enter a 5-digit ZIP code.';
  }

  if (digitsOnly(fields.cardNumber).length !== 16) {
    errors.cardNumber = 'Enter the 16 digits of a card number.';
  }

  const expiry = fields.cardExpiry.trim();
  const expiryMatch = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry);
  if (!expiryMatch) {
    errors.cardExpiry = 'Use MM/YY.';
  } else {
    const month = Number(expiryMatch[1]);
    const year = 2000 + Number(expiryMatch[2]);
    if (month < 1 || month > 12) {
      errors.cardExpiry = 'Month must be between 01 and 12.';
    } else {
      // Expires at the end of its month, so compare against the first of
      // the following one.
      const expiresAfter = new Date(year, month, 1);
      if (expiresAfter <= new Date()) errors.cardExpiry = 'That card has expired.';
    }
  }

  if (digitsOnly(fields.cardCvv).length !== 3) {
    errors.cardCvv = 'Enter the 3-digit security code.';
  }
  if (!fields.cardName.trim()) errors.cardName = 'Enter the name on the card.';

  return errors;
}

export default function CheckoutPage() {
  const { cart, refresh } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();

  const [fields, setFields] = useState<Fields>(() => ({
    ...EMPTY_FIELDS,
    // The account email is almost always the right default.
    email: user?.email ?? '',
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set = (field: keyof Fields) => (value: string) => {
    setFields((previous) => ({ ...previous, [field]: value }));

    // Drop this field's error as soon as it's edited. Leaving it until the
    // next submit means the form keeps complaining about something the
    // shopper has already fixed.
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setSubmitError('Check the highlighted fields.');
      return;
    }

    setPending(true);
    setSubmitError(null);

    try {
      // Shipping fields only — card data stays in this component.
      const order = await placeOrder({
        name: fields.name.trim(),
        email: fields.email.trim(),
        address: fields.address.trim(),
        city: fields.city.trim(),
        state: fields.state.trim(),
        zip: fields.zip.trim(),
      });

      // The order transaction empties the cart server-side; resync so the
      // badge doesn't keep showing the old count.
      await refresh();

      navigate(`/orders/${order.id}`, {
        replace: true,
        state: { justPlaced: true },
      });
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Could not place your order.'
      );
      setPending(false);
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="container page">
        <h1>Checkout</h1>
        <div className="empty-state" data-testid="checkout-empty">
          <h2>Your cart is empty</h2>
          <p>Add a jersey before checking out.</p>
          <Link to="/jerseys" className="btn">
            Browse jerseys
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/jerseys">Jerseys</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Checkout</span>
      </nav>

      <h1>Checkout</h1>

      <div className="checkout">
        {/* Summary ---------------------------------------------------- */}
        <aside className="checkout__summary" aria-label="Order summary">
          <h2 className="checkout__legend">Your order</h2>

          <ul className="checkout__items">
            {cart.items.map((line) => (
              <li
                key={line.id}
                className="checkout__item"
                data-testid="checkout-item"
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
                  <p className="cart-line__name">{line.name}</p>
                  <p className="cart-line__meta">
                    Size {line.size} · Qty {line.quantity} ·{' '}
                    {formatPrice(line.price_cents)} each
                  </p>
                </div>
                <p className="cart-line__price">
                  {formatPrice(line.price_cents * line.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="totals">
            <div className="totals__row">
              <dt>Subtotal</dt>
              <dd data-testid="checkout-subtotal">
                {formatPrice(cart.subtotal_cents)}
              </dd>
            </div>
            <div className="totals__row">
              <dt>Shipping</dt>
              <dd data-testid="checkout-shipping">
                {cart.shipping_cents === 0
                  ? 'Free'
                  : formatPrice(cart.shipping_cents)}
              </dd>
            </div>
            <div className="totals__row totals__row--total">
              <dt>Total</dt>
              <dd data-testid="checkout-total">
                {formatPrice(cart.total_cents)}
              </dd>
            </div>
          </dl>
        </aside>

        {/* Form ------------------------------------------------------- */}
        <form className="checkout__form" onSubmit={handleSubmit} noValidate>
          <fieldset className="checkout__fieldset">
            <legend className="checkout__legend">Shipping address</legend>

            <Field
              id="name"
              label="Full name"
              autoComplete="name"
              value={fields.name}
              error={errors.name}
              onChange={set('name')}
            />
            <Field
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={fields.email}
              error={errors.email}
              onChange={set('email')}
            />
            <Field
              id="address"
              label="Street address"
              autoComplete="street-address"
              value={fields.address}
              error={errors.address}
              onChange={set('address')}
            />

            <div className="checkout__row">
              <Field
                id="city"
                label="City"
                autoComplete="address-level2"
                value={fields.city}
                error={errors.city}
                onChange={set('city')}
              />
              <Field
                id="state"
                label="State"
                autoComplete="address-level1"
                value={fields.state}
                error={errors.state}
                onChange={set('state')}
              />
              <Field
                id="zip"
                label="ZIP"
                inputMode="numeric"
                autoComplete="postal-code"
                value={fields.zip}
                error={errors.zip}
                onChange={set('zip')}
              />
            </div>
          </fieldset>

          <fieldset className="checkout__fieldset">
            <legend className="checkout__legend">Payment</legend>
            <p className="checkout__note" data-testid="card-disclaimer">
              This is a portfolio project. No payment is taken, and these
              card details are never sent anywhere — they are checked for
              format in your browser and then discarded.
            </p>

            <Field
              id="cardNumber"
              label="Card number"
              inputMode="numeric"
              autoComplete="off"
              placeholder="4242 4242 4242 4242"
              value={fields.cardNumber}
              error={errors.cardNumber}
              onChange={set('cardNumber')}
            />

            <div className="checkout__row">
              <Field
                id="cardExpiry"
                label="Expiry"
                placeholder="MM/YY"
                autoComplete="off"
                value={fields.cardExpiry}
                error={errors.cardExpiry}
                onChange={set('cardExpiry')}
              />
              <Field
                id="cardCvv"
                label="Security code"
                inputMode="numeric"
                autoComplete="off"
                value={fields.cardCvv}
                error={errors.cardCvv}
                onChange={set('cardCvv')}
              />
            </div>

            <Field
              id="cardName"
              label="Name on card"
              autoComplete="off"
              value={fields.cardName}
              error={errors.cardName}
              onChange={set('cardName')}
            />
          </fieldset>

          {submitError && (
            <p className="auth__error" role="alert" data-testid="checkout-error">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            className="btn btn--primary checkout__submit"
            disabled={pending}
            data-testid="place-order"
          >
            {pending
              ? 'Placing order…'
              : `Place order · ${formatPrice(cart.total_cents)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

interface FieldProps {
  id: keyof Fields & string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'numeric' | 'text';
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
}: FieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="field__input"
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        // Ties the message to the input so screen readers announce it
        // rather than leaving the field merely "invalid".
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        data-testid={`field-${id}`}
      />
      {error && (
        <p className="field__error" id={errorId} data-testid={`error-${id}`}>
          {error}
        </p>
      )}
    </div>
  );
}
