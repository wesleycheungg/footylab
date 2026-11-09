import { FREE_SHIPPING_THRESHOLD_CENTS, formatPrice } from '../types';

/**
 * Progress toward free shipping. Turns green and changes its wording once
 * the threshold is met, so the state is never carried by colour alone —
 * a red/green-only signal is invisible to a lot of people.
 */
export default function ShippingProgressBar({
  subtotalCents,
}: {
  subtotalCents: number;
}) {
  const reached = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);
  const percent = Math.min(
    100,
    Math.round((subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100)
  );

  return (
    <div className="shipping-progress" data-testid="shipping-progress">
      <p className="shipping-progress__label">
        {reached ? (
          <strong>You&apos;ve earned free shipping.</strong>
        ) : (
          <>
            <strong>{formatPrice(remaining)}</strong> away from free shipping
          </>
        )}
      </p>

      <div
        className={`shipping-progress__track ${
          reached ? 'shipping-progress__track--complete' : ''
        }`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress toward free shipping"
      >
        <div
          className="shipping-progress__fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
