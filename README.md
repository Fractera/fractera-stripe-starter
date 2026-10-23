# fractera-stripe — the payment element of a Fractera node

A native element of the node, built on the Fractera native element template (v0.1.20). It takes card payments through the owner's own
Stripe account for the other elements of the node, so an element that sells something needs no payment code and no Stripe keys of its own.

## What it gives the node

- **One place for the keys.** Only this element holds the owner's Stripe keys. The person enters them on the node's screen
  **Settings → Payments → Web2** (core door `/api/node/stripe`; the secret key is checked against Stripe before it is written). They live in
  this element's `.env.local`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`. Never in git, never in another element.
- **Payment links.** A selling element asks for a Stripe Checkout session and sends the buyer to its `url`: the payment page is on Stripe's
  side, so no card number reaches the node.
- **Payment status and a journal.** The seller asks for the status when the buyer comes back to its success page; Stripe also tells this
  element about finished payments and refunds through a signed webhook, and the element keeps a journal of them.

## Turning it on

It is installed turned off (`power.default: "off"` in the passport). Enter the keys first, then turn it on: the core's «Danger zone» card
«Turning the element on», or `npm run element:power -- stripe on` in the core.

## Doors

The three node doors are called by the other elements of this node on the machine's loopback with the node key (`X-Node-Key` =
`SETTINGS_SECRET`); the gate of `proxy.ts` lets the loopback through and the key decides inside. The port: ask the node
(`npm run a2a -- card stripe`), never remember it.

```js
// In a selling element (its own server code): one call for a payment link.
const res = await fetch(`http://127.0.0.1:${stripePort}/api/stripe-checkout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Node-Key': process.env.SETTINGS_SECRET },
  body: JSON.stringify({
    element: 'shop',                 // the id of the element that sells
    reference: 'order-7',            // its own order id; it comes back in the status, the journal and refunds
    amount: 1500, currency: 'usd',   // the smallest currency unit (cents); or priceId: 'price_…' instead of amount/currency/description
    description: 'One lesson',
    successUrl: 'https://shop.example.com/en/paid',
    cancelUrl: 'https://shop.example.com/en/cart',
  }),
})
const { id, url } = await res.json()   // 200: send the buyer to url · 503 no_stripe_keys · 400 bad_… · 401 bad_key · 502 stripe_refused

// On the success page: is it paid?
const s = await (await fetch(`http://127.0.0.1:${stripePort}/api/stripe-status?id=${id}`, { headers: { 'X-Node-Key': process.env.SETTINGS_SECRET } })).json()
// { id, status: 'paid' | 'open' | 'expired', amount, currency, element, reference }

// The payments recorded for an element (from the webhook journal; works without Stripe keys)
const list = await (await fetch(`http://127.0.0.1:${stripePort}/api/stripe-payments?element=shop`, { headers: { 'X-Node-Key': process.env.SETTINGS_SECRET } })).json()
// { element: 'shop', payments: [{ event, type, at, session, amount, currency, element, reference, status }] }
```

**The webhook** `POST /api/stripe-webhook` is called by Stripe from the internet, through the element's public address
(`https://stripe.<your zone>/api/stripe-webhook`). It needs no session: the signature decides — the raw body, the `Stripe-Signature`
header and `STRIPE_WEBHOOK_SECRET` (docs.stripe.com/webhooks). Recorded: `checkout.session.completed`,
`checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`. One journal
line per event id: Stripe can deliver an event twice, and a repeat is answered 200 and not written again. The journal is
`<SERVICE_DATA_DIR>/stripe/payments.jsonl`, outside git; a line holds amounts, statuses and the seller's reference, never a buyer's name,
e-mail or card.

**When the computer is off.** Stripe retries a failed delivery for up to three days in live mode and three times over a few hours in a
sandbox; an event can also be resent by hand from the Stripe Dashboard (up to 15 days) or the Stripe CLI (up to 30 days) — docs.stripe.com/webhooks,
«automatic retries», read 2026-10-23. The webhook endpoint itself is created by the person in their Stripe Dashboard with the address above.

## How to build it further

- New payment kinds (subscriptions, refunds from the interface, Stripe Connect, taxes, own card forms) — after this first version, by the
  owner's word.
- A push to the selling element when a payment arrives would be a behaviour of the system: it is built only by the owner's word.
- Each door is `app/api/<door>/route.ts` (key and JSON) plus `<door>.mjs` (the work) and `<door>.test.mjs` (`npm run test:<door>`).

## What it does not do

No subscriptions, no refunds started from the node, no Connect, no tax, no stored cards. Without the keys it answers `503 no_stripe_keys`.
With the element turned off nothing answers at all: turn it on after the keys are set.

## Proof

`npm run test:stripe-checkout`, `test:stripe-status`, `test:stripe-payments`, `test:stripe-webhook` — samples without network; the
webhook samples sign events with Stripe's own library and check that a changed body or another secret is refused. A live payment needs the
owner's sandbox keys.

## How to remove it

It is a built-in element: the core does not delete it. Turn it off and remove the keys from `.env.local` on the node's screen.

## In the Fractera project

The code is open under the MIT license and the copy on your node is yours. The node installs this element from this repository
(`Fractera/fractera-stripe-starter`) by the tag written in the core registry.
