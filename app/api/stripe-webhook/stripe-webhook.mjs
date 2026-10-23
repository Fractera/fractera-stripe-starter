// The work of the door POST /api/stripe-webhook (node step 573-3): receive signed Stripe events and record finished payments.
// Stripe calls it from the internet (the element's public address, stripe.<zone>), so it has no node key: the signature decides. The check
// takes the RAW body, the Stripe-Signature header and the endpoint secret STRIPE_WEBHOOK_SECRET (docs.stripe.com/webhooks: any change of the
// raw body fails the check). Recorded kinds: a finished, failed or expired Checkout and a refund — one journal line per event id, a repeat
// is answered 200 and not written again. Stripe retries a failed delivery for up to three days in live mode and three times over a few
// hours in a sandbox (same page, «automatic retries»), so a computer that was off catches up when it is on again within that time.
import { recordEvent } from '../../../lib/stripe/journal.mjs'
import { signatureStripe } from '../../../lib/stripe/stripe.mjs'

const KINDS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'charge.refunded',
])

function rowOf(event) {
  const o = event.data?.object ?? {}
  const at = new Date((event.created ?? 0) * 1000).toISOString()
  if (event.type === 'charge.refunded') {
    return { event: event.id, type: event.type, at, charge: o.id ?? null, amount: o.amount_refunded ?? null, currency: o.currency ?? null,
      element: o.metadata?.element ?? null, reference: o.metadata?.reference ?? null, status: 'refunded' }
  }
  const status = event.type.endsWith('.expired') ? 'expired' : event.type.endsWith('_failed') ? 'failed' : o.payment_status === 'paid' ? 'paid' : (o.payment_status ?? 'unknown')
  return { event: event.id, type: event.type, at, session: o.id ?? null, amount: o.amount_total ?? null, currency: o.currency ?? null,
    element: o.metadata?.element ?? null, reference: o.metadata?.reference ?? o.client_reference_id ?? null, status }
}

export async function receive(raw, signature, deps = {}) {
  const secret = deps.secret ?? process.env.STRIPE_WEBHOOK_SECRET ?? ''
  if (!secret) return { status: 503, body: { error: 'no_webhook_secret', reason: 'STRIPE_WEBHOOK_SECRET is not set: the person enters it on the node screen Settings → Payments → Web2' } }
  if (!signature) return { status: 400, body: { error: 'no_signature', reason: 'the Stripe-Signature header is missing' } }
  let event
  try {
    event = (deps.stripe ?? signatureStripe()).webhooks.constructEvent(raw, signature, secret)
  } catch (e) {
    return { status: 400, body: { error: 'bad_signature', reason: e?.message ?? String(e) } }
  }
  if (!KINDS.has(event.type)) return { status: 200, body: { received: true, recorded: false, reason: `${event.type} is not recorded` } }
  const recorded = recordEvent(rowOf(event))
  return { status: 200, body: { received: true, recorded, duplicate: !recorded } }
}
