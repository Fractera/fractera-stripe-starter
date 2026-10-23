// Samples of the door stripe-status (`npm run test:stripe-status`): exit code 1 on any miss. No network: a fake Stripe client.
import { handle } from './stripe-status.mjs'

let failures = 0
const check = (label, ok, got) => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `\n     got ${JSON.stringify(got)}`}`) }

delete process.env.STRIPE_SECRET_KEY
let r = await handle({ id: 'order-7' })
check('not a session id → 400', r.status === 400 && r.body.error === 'bad_id', r)
r = await handle({ id: 'cs_test_abc' })
check('no keys → 503', r.status === 503 && r.body.error === 'no_stripe_keys', r)
const session = (s) => ({ checkout: { sessions: { retrieve: async () => s } } })
r = await handle({ id: 'cs_test_abc' }, { stripe: session({ id: 'cs_test_abc', status: 'complete', payment_status: 'paid', amount_total: 1500, currency: 'usd', metadata: { element: 'shop', reference: 'order-7' } }) })
check('paid session → paid, amount, element, reference', r.status === 200 && r.body.status === 'paid' && r.body.amount === 1500 && r.body.element === 'shop' && r.body.reference === 'order-7', r)
r = await handle({ id: 'cs_test_abc' }, { stripe: session({ id: 'cs_test_abc', status: 'open', payment_status: 'unpaid', metadata: {} }) })
check('open session → open', r.status === 200 && r.body.status === 'open', r)
r = await handle({ id: 'cs_test_abc' }, { stripe: session({ id: 'cs_test_abc', status: 'expired', payment_status: 'unpaid', metadata: {} }) })
check('expired session → expired', r.status === 200 && r.body.status === 'expired', r)
const missing = { checkout: { sessions: { retrieve: async () => { throw Object.assign(new Error('No such checkout.session'), { statusCode: 404, code: 'resource_missing' }) } } } }
r = await handle({ id: 'cs_test_nope' }, { stripe: missing })
check('unknown session → 404', r.status === 404 && r.body.error === 'not_found', r)

if (failures) { console.error(`===TEST_STRIPE_STATUS_FAILED=== ${failures}`); process.exit(1) }
console.log('===TEST_STRIPE_STATUS_OK===')
