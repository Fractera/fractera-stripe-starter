# `widget-static-stripe-landing` — the home page of the Stripe element

The whole home page of this element (node step 573-7): what the Stripe element solves, how a payment goes, what its agent gets, how to
turn it on, how another element connects, what is under the hood. A static widget: drawn on the server, part of the prerendered page.

## Where its words come from

From the blocks of the home page, `../../../_data/en.json` and `ru.json` (`words.ts`). The page is `bare` (`_data/meta.json`): only this
widget is drawn, and the blocks are its words and the page's text copy for search and agents (`index.md`, `llms-full.txt`), so
`markdown.ts` returns nothing of its own. A corrected sentence shows up without a rebuild (ISR, or `npm run pages:refresh`).

| Blocks in the data | How the widget draws them |
|---|---|
| `block-hero-centered` | first screen: title, lead, two buttons (anchors), the badge |
| `block-section-head` id `route` + pairs `text-h4`/`text-p` + `text-small` | the payment route on the first screen; the small text is the way back (the webhook) |
| id `solves` + `text-table` | «without it / with it», two columns |
| id `agent` + `text-p`, `text-code`, `text-list` | the agent, its `.mcp.json`, its skills |
| id `turn-on` + `text-list` (`ordered`) + `text-small` | numbered steps |
| id `connect` + `text-p`, `text-code`, `text-p` | the call of `stripe-checkout` |
| id `hood` + `text-table` | the parts of the element |
| id `more` + `text-p` · id `credits` + `text-p` | what else to ask the agent · who built it and the license |
| any other `id` | the element's typography (`TEXT_SET`) |

A new section in the data appears without a code change; a section needs code only for its own look.

## Look

Design tokens of «Design», shadcn (`Badge`, `Table`, `buttonVariants` on links) and the element's typography; icons from `lucide-react`.
One motion: the payment route fades in on the first screen (`motion-safe`). No door: the widget only reads the page data.
