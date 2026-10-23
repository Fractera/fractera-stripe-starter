// THE STRIPE CLIENT OF THIS ELEMENT (node step 573-3). This element is the only place that holds the owner's Stripe keys: the node's
// screen Settings → Payments → Web2 writes STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY and STRIPE_WEBHOOK_SECRET into its .env.local
// (core door /api/node/stripe, the secret key is checked against Stripe before it is written). Other elements never get a key: they call
// the doors of this element over i2i with the node key.
import Stripe from 'stripe'

/** The client for API calls, or null while the person has not entered the keys. */
export function stripeOrNull() {
  const key = process.env.STRIPE_SECRET_KEY || ''
  return key ? new Stripe(key) : null
}

/** A client only to check webhook signatures: the check needs the endpoint secret, not an API key. */
export function signatureStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_signature_check_only')
}

export const NO_KEYS = {
  error: 'no_stripe_keys',
  reason: 'the Stripe keys are not set: the person enters them on the node screen Settings → Payments → Web2',
}
