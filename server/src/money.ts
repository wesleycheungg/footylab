/**
 * The project's shipping rule, in one place.
 *
 * PLAN.md states it once as the single source of truth: free at a subtotal
 * of $150 or more, otherwise a flat $10, and no tax. Phase 9 computes the
 * same numbers when it writes an order, so the rule lives here rather than
 * being retyped in two routes that could then drift apart.
 *
 * The server is the only thing that may calculate these. A client-supplied
 * shipping or total amount is never trusted.
 */

export const FREE_SHIPPING_THRESHOLD_CENTS = 15_000;
export const FLAT_SHIPPING_CENTS = 1_000;

export function shippingFor(subtotalCents: number): number {
  // An empty cart ships nothing — charging $10 to deliver zero items would
  // be absurd, and the checkout button is disabled there anyway.
  if (subtotalCents <= 0) return 0;
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
    ? 0
    : FLAT_SHIPPING_CENTS;
}

export interface MoneyTotals {
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
}

export function totalsFor(subtotalCents: number): MoneyTotals {
  const shipping = shippingFor(subtotalCents);
  return {
    subtotal_cents: subtotalCents,
    shipping_cents: shipping,
    total_cents: subtotalCents + shipping,
  };
}
