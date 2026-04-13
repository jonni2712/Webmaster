import Stripe from 'stripe';

/**
 * Lazy-initialized Stripe client.
 * Throws at runtime (not build time) if STRIPE_SECRET_KEY is missing.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

/** Convenience alias — same as getStripe() */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
