// Samples of the door stripe-products (`npm run test:stripe-products`): exit code 1 on any miss. No network: a fake Stripe client.
import { handle } from './stripe-products.mjs'

let failures = 0
const check = (label, ok, got) => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `\n     got ${JSON.stringify(got)}`}`) }

delete process.env.STRIPE_SECRET_KEY
let r = await handle({ active: 'maybe' })
check('active not true/false/all → 422', r.status === 422 && r.body.error === 'bad_active', r)
r = await handle({ limit: '500' })
check('limit above 100 → 422', r.status === 422 && r.body.error === 'bad_limit', r)
r = await handle({})
check('no keys → 503', r.status === 503 && r.body.error === 'no_stripe_keys', r)

const calls = []
const fake = {
  products: {
    list: async (args) => {
      calls.push(['products', args])
      return { has_more: false, data: [
        { id: 'prod_1', name: 'Course', description: 'Ten lessons', active: true },
        { id: 'prod_2', name: 'Coffee', description: null, active: true },
      ] }
    },
  },
  prices: {
    list: async (args) => {
      calls.push(['prices', args])
      return { data: [
        { id: 'price_1', product: 'prod_1', active: true, unit_amount: 4900, currency: 'usd', recurring: null },
        { id: 'price_2', product: 'prod_1', active: true, unit_amount: 1500, currency: 'usd', recurring: { interval: 'month' } },
        { id: 'price_3', product: { id: 'prod_9' }, active: false, unit_amount: 100, currency: 'eur', recurring: null },
      ] }
    },
  },
}
r = await handle({}, { stripe: fake })
const first = r.body.products?.[0]
check('default → 200, active products only', r.status === 200 && calls[0][1].active === true && calls[0][1].limit === 20, calls[0])
check('prices grouped under their product', first?.id === 'prod_1' && first.prices.length === 2 && first.prices[1].recurring === 'month', r)
check('product without prices → empty list', r.body.products?.[1]?.prices.length === 0, r.body)
check('a price of another product is not shown', !r.body.products.some((p) => p.prices.some((x) => x.id === 'price_3')), r.body)
check('no buyer or key field in the answer', !JSON.stringify(r.body).match(/sk_|rk_|customer|email/), r.body)
calls.length = 0
r = await handle({ active: 'all', limit: '5' }, { stripe: fake })
check('active=all → no active filter, limit 5', r.status === 200 && !('active' in calls[0][1]) && calls[0][1].limit === 5, calls[0])
const broken = { products: { list: async () => { throw Object.assign(new Error('Invalid API Key provided'), { statusCode: 401 }) } }, prices: { list: async () => ({ data: [] }) } }
r = await handle({}, { stripe: broken })
check('Stripe refuses → 502 with its reason', r.status === 502 && r.body.error === 'stripe_refused', r)

if (failures) { console.error(`===TEST_STRIPE_PRODUCTS_FAILED=== ${failures}`); process.exit(1) }
console.log('===TEST_STRIPE_PRODUCTS_OK===')
