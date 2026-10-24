// The work of the door GET /api/stripe-products: list the products and their prices of the node's Stripe account (node step 577-5).
// Read only: no product or price is created, changed or deleted here. Input: active = true (default) · false · all; limit 1–100 (default 20).
// Returns { products: [{ id, name, description, active, prices: [{ id, active, unit_amount, currency, recurring }] }], has_more }.
// A price's unit_amount is in the smallest currency unit (cents), as Stripe gives it; recurring is the interval or null for a one-time price.
import { NO_KEYS, stripeOrNull } from '../../../lib/stripe/stripe.mjs'

const ACTIVE = { true: true, false: false, all: undefined }

export async function handle(input, deps = {}) {
  const active = input?.active ?? 'true'
  if (!(active in ACTIVE)) return { status: 422, body: { error: 'bad_active', reason: 'active: true, false or all' } }
  const limit = input?.limit === undefined ? 20 : Number(input.limit)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return { status: 422, body: { error: 'bad_limit', reason: 'limit: a whole number from 1 to 100' } }
  const stripe = deps.stripe ?? stripeOrNull()
  if (!stripe) return { status: 503, body: NO_KEYS }
  try {
    const filter = ACTIVE[active] === undefined ? {} : { active: ACTIVE[active] }
    const products = await stripe.products.list({ ...filter, limit })
    const prices = await stripe.prices.list({ limit: 100 })
    const byProduct = new Map()
    for (const p of prices.data) {
      const id = typeof p.product === 'string' ? p.product : p.product?.id
      if (!byProduct.has(id)) byProduct.set(id, [])
      byProduct.get(id).push({
        id: p.id,
        active: p.active,
        unit_amount: p.unit_amount ?? null,
        currency: p.currency ?? null,
        recurring: p.recurring?.interval ?? null,
      })
    }
    return {
      status: 200,
      body: {
        products: products.data.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? null,
          active: p.active,
          prices: byProduct.get(p.id) ?? [],
        })),
        has_more: Boolean(products.has_more),
      },
    }
  } catch (e) {
    return { status: 502, body: { error: 'stripe_refused', reason: e?.message ?? String(e) } }
  }
}
