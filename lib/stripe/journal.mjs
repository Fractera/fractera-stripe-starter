// THE JOURNAL OF PAYMENTS (node step 573-3): one line per Stripe event this element recorded, in its data folder outside git
// (`<SERVICE_DATA_DIR>/stripe/payments.jsonl`). A line holds the event id, its kind, the time, the Checkout session or the charge, the
// amount and currency, the element that sells and its own order reference, and the status — never the buyer's name, e-mail or card.
// Stripe may deliver one event twice (docs.stripe.com/webhooks, «duplicate events»): an event id already in the journal is not written again.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const folder = () => join(process.env.SERVICE_DATA_DIR || join(process.cwd(), 'data'), 'stripe')
export const journalFile = () => join(folder(), 'payments.jsonl')

export function readJournal() {
  const file = journalFile()
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((line) => {
    try { return [JSON.parse(line)] } catch { return [] }
  })
}

/** Writes the row unless its event is already there; true when written. */
export function recordEvent(row) {
  if (readJournal().some((r) => r.event === row.event)) return false
  mkdirSync(folder(), { recursive: true })
  appendFileSync(journalFile(), JSON.stringify(row) + '\n')
  return true
}
