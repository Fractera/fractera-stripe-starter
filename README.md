# fractera-stripe — the payment element of a Fractera node

A native element of the node, built on the Fractera native element template (v0.1.20). It takes card payments through the owner's own
Stripe account for the other elements of the node, so an element that sells something needs no payment code and no Stripe keys of its own.

## What it gives the node

- **One place for the keys.** Only this element holds the owner's Stripe keys. The person enters them on this element's page in the
  core: **Settings → Payments → Web2** (`/<lang>/stripe/settings/payments/web2`, core door `/api/node/stripe`). They live in this element's
  `.env.local`: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` and `STRIPE_AGENT_API_KEY`. Never in git, never in
  another element.
- **Stripe tools for its own agent.** With an agent key the agent of this element gets Stripe's MCP server: it can look at and set up
  the owner's Stripe account (products, prices, webhook endpoints, a payment's history) — section «The agent's Stripe tools».
- **Payment links.** A selling element asks for a Stripe Checkout session and sends the buyer to its `url`: the payment page is on Stripe's
  side, so no card number reaches the node.
- **Payment status and a journal.** The seller asks for the status when the buyer comes back to its success page; Stripe also tells this
  element about finished payments and refunds through a signed webhook, and the element keeps a journal of them.

## Where it lives

The node installs it from this repository by the tag in the core registry into `WEB4-ITEMS/core/stripe`. Its port is given by the node
(`npm run a2a -- card stripe`), its journal is `<SERVICE_DATA_DIR>/stripe/payments.jsonl` (`data/services/stripe/` of the node), its
passport is `OWN-SERVICE-PROPS/`.

## Keys

| Variable | What | Checked before it is written |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` / `sk_live_…` (a restricted `rk_…` works too): the doors create Checkout sessions with it | a real call to Stripe (`GET /v1/balance`) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_…` / `pk_live_…`, the same mode as the secret key | its format |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…`: the signing secret of the event destination the person creates on dashboard.stripe.com/webhooks | its format |
| `STRIPE_AGENT_API_KEY` | `rk_test_…` / `rk_live_…`: a restricted key created with «Authorizing agent access to your account», the same mode as the secret key | a real call to Stripe |

The screen sends only the fields that were filled in; the values never come back to the page. A key written to `.env.local` survives the
node's reinstall. The doors read the keys when the element starts: a new key works after its next start. The agent key works in the
agent's next session.

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

## The agent's Stripe tools

Stripe runs a remote MCP server, `https://mcp.stripe.com` (docs.stripe.com/mcp). This element's agent connects to it with the agent key,
not with OAuth: the agent works alone, and from December 2026 Stripe's MCP accepts only agent keys or OAuth.

- **How it is wired.** When the person saves an agent key, the core runs this element's `npm run mcp:stripe`. The script reads
  `STRIPE_AGENT_API_KEY` from `.env.local` and writes the project file `.mcp.json` with the server `stripe-agent` and the header
  `Authorization: Bearer <key>`. Without a key it removes that server, so nothing tries to connect. The node starts the agent with the
  node's environment, not this element's, so `${STRIPE_AGENT_API_KEY}` inside `.mcp.json` would stay empty; that is why the value is
  written into the file. `.mcp.json` is in `.gitignore` and never leaves this computer. The script prints only the mode, never the key.
- **No question at start.** `.claude/settings.json` approves `stripe-agent` in advance (`enabledMcpjsonServers`). Once the folder is
  trusted (Claude Code asks that once, at the agent's first start), a session never stops on «New MCP server found in this project», whose
  default answer is «Continue without using this MCP server». Check it without a model: `claude mcp get stripe-agent` in this folder shows
  a health check; without the approval it shows «⏸ Pending approval» (measured 2026-10-23, node step 573-4).
- **What guards the account.** The agent session runs in Claude Code's auto permission mode. On Stripe's side the agent key carries
  approval rules: payouts, refunds and account changes wait for a reviewer in Stripe, and an MCP write such as a refund gives the person a
  confirmation link that expires in 24 hours (docs.stripe.com/keys, docs.stripe.com/mcp).
- **Skills.** `use-stripe` (group `build-skills`) is the gatekeeper: which tool for which task, a sandbox first, keys by name only.
  `stripe-best-practices` is Stripe's own skill, vendored as a copy of 2026-10-23 with its payments and security references
  (`.claude/skills/stripe-best-practices/SOURCE.md`).
- **Not installed, on purpose:** the Stripe plugin for Claude Code, the Stripe CLI and `stripe agent setup`. Installing programs on the
  person's computer is the owner's decision, and an enabled plugin with an MCP server is loaded by every session on the machine.

## How to build it further

- New payment kinds (subscriptions, refunds from the interface, Stripe Connect, taxes, own card forms) — after this first version, by the
  owner's word.
- A push to the selling element when a payment arrives would be a behaviour of the system: it is built only by the owner's word.
- Each door is `app/api/<door>/route.ts` (key and JSON) plus `<door>.mjs` (the work) and `<door>.test.mjs` (`npm run test:<door>`).

## What it does not do

No subscriptions, no refunds started from the node, no Connect, no tax, no stored cards. Without the keys it answers `503 no_stripe_keys`.
With the element turned off nothing answers at all: turn it on after the keys are set. The node's screen writes keys and never removes
them; a key is stopped in Stripe (section «How to remove it»).

## Proof

`npm run test:stripe-checkout`, `test:stripe-status`, `test:stripe-payments`, `test:stripe-webhook` — samples without network; the
webhook samples sign events with Stripe's own library and check that a changed body or another secret is refused. A live payment needs the
owner's sandbox keys.

`npm run test:mcp-stripe` — samples of `npm run mcp:stripe` in a temporary folder: no key — no server; an agent key — the server
`stripe-agent` with the bearer header and the key never printed; a secret key in its place — refused; the key removed — only `stripe-agent`
leaves. A connected Stripe MCP needs the owner's agent key.

## How to remove it

It is a built-in element: the core does not delete it. Turn it off: the «Danger zone» card «Turning the element on», or
`npm run element:power -- stripe off` in the core. To stop a key, choose «Expire key» for it on dashboard.stripe.com/apikeys: it stops
working at once (docs.stripe.com/keys). The node's screen only writes keys, so the old lines stay in `.env.local` until new keys replace
them.

## In the Fractera project

The code is open under the MIT license and the copy on your node is yours. The node installs this element from this repository
(`Fractera/fractera-stripe-starter`) by the tag written in the core registry.
