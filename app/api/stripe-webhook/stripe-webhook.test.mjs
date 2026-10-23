// Samples of the door stripe-webhook (`npm run test:stripe-webhook`): exit code 1 on any miss. The signature is made by Stripe's own
// library (stripe.webhooks.generateTestHeaderString) with a test secret; the journal lives in a temporary folder. No network.
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Stripe from 'stripe'

const dir = mkdtempSync(join(tmpdir(), 'stripe-webhook-'))
process.env.SERVICE_DATA_DIR = dir
const { receive } = await import('./stripe-webhook.mjs')
const { readJournal } = await import('../../../lib/stripe/journal.mjs')

let failures = 0
const check = (label, ok, got) => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `\n     got ${JSON.stringify(got)}`}`) }
const secret = 'whsec_test_573_3'
const stripe = new Stripe('sk_test_signature_check_only')
const event = (id, type, object) => JSON.stringify({ id, object: 'event', type, created: 1792746000, data: { object } })
const sign = (payload, s = secret) => stripe.webhooks.generateTestHeaderString({ payload, secret: s })
const paid = event('evt_paid_1', 'checkout.session.completed', { id: 'cs_test_abc', object: 'checkout.session', payment_status: 'paid', amount_total: 1500, currency: 'usd', client_reference_id: 'order-7', metadata: { element: 'shop', reference: 'order-7' } })

try {
  let r = await receive(paid, sign(paid), { secret })
  check('signed completed Checkout → 200, recorded', r.status === 200 && r.body.recorded === true, r)
  const rows = readJournal()
  check('the journal line: paid 1500 usd for shop / order-7', rows.length === 1 && rows[0].status === 'paid' && rows[0].amount === 1500 && rows[0].element === 'shop' && rows[0].reference === 'order-7', rows)
  r = await receive(paid, sign(paid), { secret })
  check('the same event again → 200, not written twice', r.status === 200 && r.body.recorded === false && r.body.duplicate === true && readJournal().length === 1, r)
  const forged = paid.replace('"amount_total":1500', '"amount_total":1')
  r = await receive(forged, sign(paid), { secret })
  check('a changed body with the old signature → 400, journal unchanged', r.status === 400 && r.body.error === 'bad_signature' && readJournal().length === 1, r)
  r = await receive(paid, sign(paid, 'whsec_someone_else'), { secret })
  check('a signature with another secret → 400', r.status === 400 && r.body.error === 'bad_signature', r)
  r = await receive(paid, null, { secret })
  check('no Stripe-Signature header → 400', r.status === 400 && r.body.error === 'no_signature', r)
  r = await receive(paid, sign(paid), { secret: '' })
  check('no endpoint secret → 503', r.status === 503 && r.body.error === 'no_webhook_secret', r)
  const other = event('evt_other', 'customer.created', { id: 'cus_1' })
  r = await receive(other, sign(other), { secret })
  check('a kind it does not record → 200, not written', r.status === 200 && r.body.recorded === false && readJournal().length === 1, r)
  const refund = event('evt_refund_1', 'charge.refunded', { id: 'ch_1', object: 'charge', amount_refunded: 1500, currency: 'usd', metadata: { element: 'shop', reference: 'order-7' } })
  r = await receive(refund, sign(refund), { secret })
  check('a signed refund → recorded as refunded', r.status === 200 && r.body.recorded === true && readJournal().some((x) => x.status === 'refunded' && x.reference === 'order-7'), r)
} finally {
  rmSync(dir, { recursive: true, force: true })
}

if (failures) { console.error(`===TEST_STRIPE_WEBHOOK_FAILED=== ${failures}`); process.exit(1) }
console.log('===TEST_STRIPE_WEBHOOK_OK===')
