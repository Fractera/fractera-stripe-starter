# SOURCE — vendored, do not edit by hand

- **What:** `stripe-best-practices`, Stripe's own agent skill (published by Stripe for agents, docs.stripe.com/skills).
- **From:** `https://docs.stripe.com/.well-known/skills/index.json` → `https://docs.stripe.com/.well-known/skills/stripe-best-practices/<file>`,
  taken 2026-10-23 (node step 573-4). sha256 (first 16): `SKILL.md` a240f40c84c43f8c · `references/payments.md` f7edac576b72da7b ·
  `references/security.md` 45d31cbb73b8eb08.
- **Taken:** `SKILL.md`, `references/payments.md`, `references/security.md` as copies.
- **NOT taken, on purpose:** `references/billing.md`, `connect.md`, `tax.md`, `treasury.md` — subscriptions, Connect, tax and Treasury are not
  part of this element's first version (node step 573, «not in the step»). When the owner orders one of them, read the online file
  (`…/stripe-best-practices/references/<file>`) or take it as a copy with a new line here. The skills `stripe-docs` (it needs the Stripe CLI,
  which the node does not install) and `upgrade-stripe` were not taken either.
- **What the skill says that our rules override:** `stripe sandbox create`, `npm i -g @stripe/cli`, `stripe agent setup` and the Stripe plugin
  are not run here — installing programs is the owner's decision; read the docs as `https://docs.stripe.com/<path>.md` instead. The gatekeeper
  `use-stripe` (group build-skills) says when this skill is used and which node laws are stronger.
- **Update:** fetch the index again, compare the files by sha256, copy the changed ones over, write the new sums and date here. Never edit the
  copy by hand.

Process: build — a vendored payment-integration skill, used only while building this element (node step 573-4).
