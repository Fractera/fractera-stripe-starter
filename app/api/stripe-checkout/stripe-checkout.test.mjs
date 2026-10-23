// Samples of the door stripe-checkout (`npm run test:stripe-checkout`): exit code 1 on any miss. No network: a fake Stripe client.
import { handle } from './stripe-checkout.mjs'

let failures = 0
const check = (label, ok, got) => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `\n     got ${JSON.stringify(got)}`}`) }
const good = { element: 'shop', reference: 'order-7', amount: 1500, currency: 'usd', description: 'One lesson', successUrl: 'https://shop.example/paid', cancelUrl: 'https://shop.example/cart' }

delete process.env.STRIPE_SECRET_KEY
let r = await handle(good)
check('no keys → 503 no_stripe_keys', r.status === 503 && r.body.error === 'no_stripe_keys', r)
r = await handle({ ...good, element: 'Shop!' })
check('bad element → 400', r.status === 400 && r.body.error === 'bad_element', r)
r = await handle({ ...good, amount: 12.5 })
check('amount not an integer → 400', r.status === 400 && r.body.error === 'bad_amount', r)
r = await handle({ ...good, currency: 'dollars' })
check('bad currency → 400', r.status === 400 && r.body.error === 'bad_currency', r)
r = await handle({ ...good, successUrl: 'paid' })
check('relative success url → 400', r.status === 400 && r.body.error === 'bad_urls', r)
r = await handle({ ...good, priceId: 'gold' })
check('bad price id → 400', r.status === 400 && r.body.error === 'bad_price', r)

let seen = null
const fake = { checkout: { sessions: { create: async (p) => { seen = p; return { id: 'cs_test_abc', url: 'https://checkout.stripe.com/c/pay/cs_test_abc' } } } } }
r = await handle(good, { stripe: fake })
check('fake Stripe → 200 { id, url }', r.status === 200 && r.body.id === 'cs_test_abc' && r.body.url.startsWith('https://checkout.stripe.com/'), r)
check('metadata names the element and the reference, on the session and the payment',
  seen?.metadata?.element === 'shop' && seen?.metadata?.reference === 'order-7' && seen?.payment_intent_data?.metadata?.reference === 'order-7', seen)
check('one line item of 1500 usd «One lesson»', seen?.line_items?.[0]?.price_data?.unit_amount === 1500 && seen.line_items[0].price_data.currency === 'usd', seen)
r = await handle({ ...good, priceId: 'price_123' }, { stripe: fake })
check('a price id → the line item is that price', r.status === 200 && seen?.line_items?.[0]?.price === 'price_123', seen)
const refusing = { checkout: { sessions: { create: async () => { throw Object.assign(new Error('Invalid API Key provided'), { statusCode: 401 }) } } } }
r = await handle(good, { stripe: refusing })
check('Stripe refuses → 502 with its reason', r.status === 502 && r.body.error === 'stripe_refused' && /Invalid API Key/.test(r.body.reason), r)

if (failures) { console.error(`===TEST_STRIPE_CHECKOUT_FAILED=== ${failures}`); process.exit(1) }
console.log('===TEST_STRIPE_CHECKOUT_OK===')
