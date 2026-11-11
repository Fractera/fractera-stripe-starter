# Migration «block → section» — 2026-11-11

Node step 717-2: one word, «section», for a designed part of a page; a section is one folder `components/sections/<kind>/`; a page's
list is `body`. «Block» keeps one meaning — the address of a container (`data-block`, `#block=`, `npm run blocks:ids`).
Script `scripts/migrate-sections.mjs`, map `scripts/migrate-sections.map.json`.

## Done (2)

- rewritten `app/[lang]/(publicLayer)/_data/en.json`
- rewritten `app/[lang]/(publicLayer)/_data/ru.json`

## For your eye (4)

Each line: change the sense «section» to «section» (in Russian «секция»), keep the address; a line that is right as it is stays.

- `app/[lang]/(publicLayer)/_widgets/static/widget-static-stripe-landing/README.md:8` — «block» left — the sense «section» becomes «section»; the address (`data-block`) stays: «From the items of the home page, '../../../_data/en.json' and 'ru.json' ('words.ts'). The page is 'bare' ('_data/meta.json'): only this»
- `app/[lang]/(publicLayer)/_widgets/static/widget-static-stripe-landing/README.md:9` — «block» left — the sense «section» becomes «section»; the address (`data-block`) stays: «widget is drawn, and the items are its words and the page's text copy for search and agents ('index.md', 'llms-full.txt'), so»
- `app/[lang]/(publicLayer)/_widgets/static/widget-static-stripe-landing/README.md:12` — «block» left — the sense «section» becomes «section»; the address (`data-block`) stays: «| Items in the data | How the widget draws them |»
- `app/[lang]/(publicLayer)/_widgets/static/widget-static-stripe-landing/index.tsx:17` — «block» left — the sense «section» becomes «section»; the address (`data-block`) stays: «// Слова — части данных главной ('words.ts'): раздел — 'section-head' и части до следующего, вид раздела выбирается по его 'id';»

## Then

`npm run prebuild`, `npx tsc --noEmit`, the build, `npm run eyes` on a page with sections, one commit.
