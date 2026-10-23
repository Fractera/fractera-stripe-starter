// The work of the door GET /api/stripe-status?id=cs_… (node step 573-3): read the status of a Stripe Checkout payment by its id.
// Returns { id, status, amount, currency, element, reference }; status is paid · open · expired (or Stripe's own word otherwise).
// This is how a selling element learns about a payment when the buyer comes back to its success page: one call, no push from here.
import { NO_KEYS, stripeOrNull } from '../../../lib/stripe/stripe.mjs'

const SESSION = /^cs_(test|live)_[A-Za-z0-9]+$/

export async function handle(input, deps = {}) {
  const id = String(input?.id ?? '').trim()
  if (!SESSION.test(id)) return { status: 400, body: { error: 'bad_id', reason: 'id: the Checkout session id (cs_test_… or cs_live_…)' } }
  const stripe = deps.stripe ?? stripeOrNull()
  if (!stripe) return { status: 503, body: NO_KEYS }
  try {
    const s = await stripe.checkout.sessions.retrieve(id)
    const status = s.payment_status === 'paid' ? 'paid' : s.status === 'expired' ? 'expired' : s.status === 'open' ? 'open' : (s.status ?? 'unknown')
    return {
      status: 200,
      body: { id: s.id, status, amount: s.amount_total ?? null, currency: s.currency ?? null, element: s.metadata?.element ?? null, reference: s.metadata?.reference ?? s.client_reference_id ?? null },
    }
  } catch (e) {
    const missing = e?.statusCode === 404 || e?.code === 'resource_missing'
    return { status: missing ? 404 : 502, body: { error: missing ? 'not_found' : 'stripe_refused', reason: e?.message ?? String(e) } }
  }
}
