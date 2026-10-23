// The work of the door GET /api/stripe-payments?element=<id> (node step 573-3): list the recorded Stripe payments of one element.
// Reads the journal this element keeps from the signed webhook (lib/stripe/journal.mjs) — never Stripe itself, so it answers with no keys
// and costs nothing. Rows hold amounts, statuses and the element's own references, never a buyer's name, e-mail or card.
import { readJournal } from '../../../lib/stripe/journal.mjs'

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/

export async function handle(input) {
  const element = String(input?.element ?? '').trim()
  if (!ID.test(element)) return { status: 400, body: { error: 'bad_element', reason: 'element: the id of the element that sells' } }
  const payments = readJournal().filter((r) => r.element === element)
  return { status: 200, body: { element, payments } }
}
