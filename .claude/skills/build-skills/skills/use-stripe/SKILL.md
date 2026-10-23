---
name: use-stripe
description: Builder skill. Load it before any Stripe work in this element — a new payment door, a change of Checkout, a webhook event, products and prices, a refund question, the Stripe MCP tools or Stripe's own skill stripe-best-practices. It says which tool to take (this element's doors, the SDK inside them, the MCP server stripe-agent, the vendored skill), that a sandbox comes first, that refunds and transfers wait for a human, and which node laws are stronger than Stripe's advice.
---

# use-stripe — when and how this element works with Stripe

**Process: build**

> A hint, not a law: know a better way for the case in front of you — do it your way and say so.

## Which tool

| You need | Take | Why |
|---|---|---|
| another element must take a payment | this element's doors: `stripe-checkout`, `stripe-status`, `stripe-payments` (README, «Doors») | other elements never hold a key and never install Stripe |
| a new payment capability (subscription, refund from the node, a new event) | the SDK `stripe` (exact version in `package.json`) inside a new door — `npm run door:add` | the code lives in git, is tested by samples and works without a model |
| to look at or set up the owner's Stripe account (products, prices, webhook endpoints, a payment's history) | the MCP server `stripe-agent` — only when `npm run mcp:stripe` printed `===MCP_STRIPE_ON===` | it acts with the owner's agent key and Stripe's approval rules |
| an integration decision (Checkout or PaymentIntents, keys, webhooks) | the vendored skill `stripe-best-practices` | Stripe's own advice, a copy of 2026-10-23 |

## Rules — ours are stronger than Stripe's

- **A sandbox first.** Test keys (`sk_test_`, `rk_test_`) before any live key. A live key is the owner's word, never your choice.
- **Refunds, transfers, account changes wait for a human.** The agent key's approval rules and the MCP confirmation link (docs.stripe.com/mcp)
  are the guard: never look for another way around a rule that asked for approval.
- **Keys by name only.** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_AGENT_API_KEY` live in `.env.local`
  (written by the node screen Settings → Payments → Web2). Never print, log, commit or send a value; never ask the person to paste one into the
  chat — send them to that screen.
- **No programs installed.** Not the Stripe CLI, not `stripe sandbox create`, not `stripe agent setup`, not the Stripe plugin: that is the
  owner's decision. Read the docs as `https://docs.stripe.com/<path>.md`.
- **Fulfil from the webhook journal, not from a success page.** A buyer may never come back (stripe-best-practices, «Webhooks and fulfillment»):
  the paid record is the journal line from `checkout.session.completed` / `async_payment_succeeded` with status `paid`.
- **No behaviour nobody ordered.** No timer, no polling, no push to a selling element when a payment arrives — that is the owner's decision
  (node law of 2026-09-25).
- **No buyer data in git** and none in the journal beyond amounts, statuses and the seller's own reference.
- **Never `payment_method_types`** in a Checkout or PaymentIntent call (Stripe's rule: dynamic payment methods).

## After a change

`npm run test:<door>` for each door you touched, `npm run check:passport`, then the usual build-process checks (`.claude/modes/build.md`).
