# fractera-stripe — the payment element of a Fractera node

A native element of the node, built on the Fractera native element template (v0.1.20). It is meant to take card payments through the
owner's own Stripe account for the other elements of the node, so an element that sells something needs no payment code and no Stripe
keys of its own.

**How it is meant to work.** This element is the only place that holds the owner's Stripe keys and talks to Stripe. An element that sells
asks it, inside the node, for a payment link (Stripe Checkout: the payment page on Stripe's side, so no card number reaches the node) and
later for the payment status. The keys are entered by the person on the node's screen, Settings → Payments → Web2; they live in this
element's `.env.local` and never in git.

## Today: a body, turned off

Step 573-1 of the node (owner 2026-10-22: «платёжный шлюз в страйп сделать нативного элементом доступным по умолчанию … По умолчанию как мы
и говорили он остается выключен») built only the body:

- the element folder, its passport and node contract;
- the passport says `power: { default: "off", reason }` — the node installs the element and never starts it until the person turns it on
  (`npm run element:power -- stripe status` in the core prints the reason);
- no messenger between people, no work for outside agents, no schedule: a native element serves its own node only.

**What it does not do yet:** no checkout, no payment status, no Stripe webhook, no list of payments. Turning it on today starts the
template site and nothing else.

## When it is built further

The next steps of the node build the payment doors (Checkout, status, a signed webhook, the list of payments), the tools of this
element's agent (the Stripe MCP server with an agent key, Stripe's skills as vendored copies) and the skill other elements use to take a
payment through this one. A push to a selling element when a payment arrives is a behaviour of the system and is built only by the
owner's word.

## In the Fractera project

The code is open under the MIT license and the copy on your node is yours. The node installs this element from this repository
(`Fractera/fractera-stripe-starter`) by the tag written in the core registry; the core does not let you delete a built-in element or
move its address.
