// The work of the door POST /api/stripe-checkout (node step 573-3): create a Stripe Checkout payment link for an element of the node.
// Input (JSON): element (the id of the element that sells), reference (its own order id), successUrl and cancelUrl (absolute http(s)),
// and either priceId (a Stripe price) or amount (an integer in the smallest currency unit, cents) + currency (ISO, three letters) +
// description (what the buyer pays for). Returns { id, url }: the buyer goes to url, the payment page on Stripe's side.
// The element and the reference ride in the session's metadata and in the payment's metadata, so the webhook and a refund name them.
import { NO_KEYS, stripeOrNull } from '../../../lib/stripe/stripe.mjs'

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/
const CURRENCY = /^[a-z]{3}$/
const PRICE = /^price_[A-Za-z0-9]+$/
const httpUrl = (u) => {
  try { const x = new URL(String(u)); return x.protocol === 'https:' || x.protocol === 'http:' } catch { return false }
}
const bad = (error, reason) => ({ status: 400, body: { error, reason } })

export async function handle(input, deps = {}) {
  const i = input && typeof input === 'object' ? input : {}
  const element = String(i.element ?? '').trim()
  const reference = String(i.reference ?? '').trim().slice(0, 200)
  if (!ID.test(element)) return bad('bad_element', 'element: the id of the element that sells')
  if (!reference) return bad('bad_reference', 'reference: your own id of this order')
  if (!httpUrl(i.successUrl) || !httpUrl(i.cancelUrl)) return bad('bad_urls', 'successUrl and cancelUrl: absolute http(s) addresses of your pages')
  let line
  if (typeof i.priceId === 'string' && i.priceId) {
    if (!PRICE.test(i.priceId)) return bad('bad_price', 'priceId: a Stripe price id (price_…)')
    line = { price: i.priceId, quantity: 1 }
  } else {
    const amount = Number(i.amount)
    const currency = String(i.currency ?? '').trim().toLowerCase()
    const description = String(i.description ?? '').trim().slice(0, 250)
    if (!Number.isInteger(amount) || amount <= 0) return bad('bad_amount', 'amount: a positive integer in the smallest currency unit (cents)')
    if (!CURRENCY.test(currency)) return bad('bad_currency', 'currency: a three-letter ISO code, for example usd')
    if (!description) return bad('bad_description', 'description: what the buyer pays for')
    line = { price_data: { currency, product_data: { name: description }, unit_amount: amount }, quantity: 1 }
  }
  const stripe = deps.stripe ?? stripeOrNull()
  if (!stripe) return { status: 503, body: NO_KEYS }
  try {
    const metadata = { element, reference }
    const s = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [line],
      success_url: String(i.successUrl),
      cancel_url: String(i.cancelUrl),
      client_reference_id: reference,
      metadata,
      payment_intent_data: { metadata },
    })
    return { status: 200, body: { id: s.id, url: s.url } }
  } catch (e) {
    return { status: 502, body: { error: 'stripe_refused', reason: e?.message ?? String(e) } }
  }
}
