# Backlog

## Now

- Patrik plays the full loop on desktop and phone with sound on; rewrites dilemma text he dislikes in `src/data/story.ts`. Reads the 15 answers aloud (two were trimmed 2026-09-01, the rest are his call).
- Listen to the ambience loop and cue levels; replace or re-level if they read as cheap.

## Next

- Run the LinkedIn Post Inspector on `https://orgutveckling.se/kontoret/` once and confirm the `og-card.png` preview renders (Patrik, needs a LinkedIn login).

## Production polish

- Nothing queued.

## Resolved 2026-09-01

- Playwright suite (`npm test`, `tests/playthrough.spec.ts`): mouse loop to a result plus clipboard, drag-pan on a phone viewport, keyboard loop. Runs in the Pages workflow before deploy.
- Scoring rebalanced so no answer is a pure loss; `scripts/balance.ts` enumerates all 243 paths in every build (Mötesbokaren 55 % to 40 % of random paths).
- Result shows one sentence per axis instead of bars, with "En spegel, inte ett test". Archetype summaries end with a line that matches what actually happened (`summaryIf`).
- Running text in a system sans; Pixelify Sans stays on headings, labels and buttons. Short landscape keeps the top third of the room visible.
- Choice buttons are disabled during the 220 ms input lock instead of dropping early taps silently.

- Phaser removed: DOM scene with CSS-transform camera, drag-pan, keyframe glows. JS 1,4 MB to 21 kB. Same hotspot rectangles and framing.
- Pixelify Sans drew "fi" as one glyph ("fil" read "Al"): `font-variant-ligatures: none`.
- Archetype titles reworded from person traits ("otrygg") to climate ("otryggt att säga emot"); FORSKNING label on the research line; link back to the leadership course page; hover styles only under `(hover: hover)`.

- Share button on the result: clipboard text on desktop, native share sheet on touch devices. OG tags plus `og-card.png` 1200×627 for link previews.
- One sourced reading pointer per archetype (`reading` in `story.ts`).
- Persistence decided: stateless, see `CONTEXT.md`.
- Stale intro line (2,4 MB) and a hint that lingered onto the result screen fixed.

- Four research sentences verified against abstracts; Dirigenten and Mötesbokaren rewritten to match real sources (table in `STORY.md`).
- Tableau converted PNG 3,8 MB to WebP q90 412 KB; visually identical at pixel level.

## Resolved 2026-08-27

- Rejected walking-sprite slice replaced by a first-person tableau; every P0 visual defect removed at the source.
- Avatar picker and name field removed.
- Dedicated dialogue portraits for all four colleagues.
- Five dilemmas, three-axis scoring, tag-based consequences, four archetypes, result screen.

## Granskning 2026-09-16

Fynd från cockpitens granskningskolumner (Lighthouse mobil, W3C, UX-skript, headers, TLS, OWASP). Mätvärdena står under `## Audits` i CONTEXT.md.

- [x] `[P3]` Lighthouse: konsolfel vid laddning och en knapp vars synliga text inte ingår i dess tillgängliga namn (best practices 92). Kontrollera att CSP:n från orgutveckling-zonen inte är källan till konsolfelen. Löst 2026-10-06: CSP:n var källan (`font-src 'self'` blockerade två typsnittsdelar som Vite bäddade in som `data:`), nu `assetsInlineLimit: 0`. Ljudknappens `aria-label` innehåller den synliga texten. `npm test` kör mot zonens CSP och fäller konsolfel. Ej driftsatt, Lighthouse ej omkört.

## Granskning 2026-10-06

Fynd från den automatiska sviten (aifabriken `tools/audit-suite.ts`: headers, npm audit, secrets, Actions, markup, axe). Mätvärdena står som `(automated)`-rader under `## Audits` i CONTEXT.md.

- [x] `[P3]` npm audit: 1 high i dev-kedjan (source-map-js), 0 i produktion. `npm audit fix`. Löst 2026-10-06: source-map-js 1.2.1 till 1.2.2, `npm audit` 0 fynd.
- [x] `[P3]` WCAG: axe hittar 0 fel men kan inte avgöra kontrasten på 9 element. Manuell kontrastkontroll återstår. Löst 2026-10-06: kontrasten mätt mot de pixlar som faktiskt ritas bakom texten (Playwright-skärmdump med texten dold, 5:e percentilen per element) i 390×844, 1440×900 och 844×390 över intro, scen, toast, dialog, svar och resultat. Två riktiga fel: toppetiketten KONTORET / NY CHEF låg direkt på bilden (ned till 1,4:1) och resultatets tidsstämpel i porträtt (2,4:1). Etiketten har nu samma mörka platta som ljudknappen, resultatets toning tunnas inte ut i porträtt. Efter: 206 av 206 textelement klarar AA, lägst 4,7:1.

Sidofynd från samma mätning, inte åtgärdade (utanför det godkända):

- [ ] `[P1]` Resultatskärmen går inte att rulla. Vid 844×390 hamnar STÄMPLA IN IGEN med nederkant på 756 px i en 390 px hög vy, vid 390×700 på 797 px av 700: dela- och omstartsknapparna samt länken till kurssidan nås inte med pekskärm. `.intro` saknar `overflow`, och `html`/`body`/`#app` har `overflow: hidden` (`src/style.css`). Passar bara exakt vid 390×844, alltså inte i en riktig mobilwebbläsare med adressfält.
- [ ] `[P3]` Tangentbord i porträtt: `.hotspot-controls` radbryts till fyra rader och täcker hinten/toasten helt (390×844), så texten från "Titta på klockan" syns aldrig.
- [ ] `[P3]` Tangentbordsknapparna heter "Titta på Göran" och "Titta på Mira" (`index.html`) medan scenens etiketter säger "Prata med" (`src/game/OfficeScene.ts`).
