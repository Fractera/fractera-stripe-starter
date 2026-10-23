// Samples of the door stripe-payments (`npm run test:stripe-payments`): exit code 1 on any miss. The journal lives in a temporary folder.
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dir = mkdtempSync(join(tmpdir(), 'stripe-payments-'))
process.env.SERVICE_DATA_DIR = dir
const { recordEvent } = await import('../../../lib/stripe/journal.mjs')
const { handle } = await import('./stripe-payments.mjs')

let failures = 0
const check = (label, ok, got) => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `\n     got ${JSON.stringify(got)}`}`) }

try {
  let r = await handle({ element: 'shop' })
  check('empty journal → no payments', r.status === 200 && r.body.payments.length === 0, r)
  check('first event written', recordEvent({ event: 'evt_1', element: 'shop', reference: 'order-7', amount: 1500, currency: 'usd', status: 'paid' }) === true)
  check('the same event again is not written', recordEvent({ event: 'evt_1', element: 'shop', reference: 'order-7', amount: 1500, currency: 'usd', status: 'paid' }) === false)
  recordEvent({ event: 'evt_2', element: 'school', reference: 'r-1', amount: 900, currency: 'eur', status: 'paid' })
  r = await handle({ element: 'shop' })
  check('only the element\'s own payments, once', r.status === 200 && r.body.payments.length === 1 && r.body.payments[0].reference === 'order-7', r)
  r = await handle({ element: '../shop' })
  check('bad element → 400', r.status === 400 && r.body.error === 'bad_element', r)
} finally {
  rmSync(dir, { recursive: true, force: true })
}

if (failures) { console.error(`===TEST_STRIPE_PAYMENTS_FAILED=== ${failures}`); process.exit(1) }
console.log('===TEST_STRIPE_PAYMENTS_OK===')
