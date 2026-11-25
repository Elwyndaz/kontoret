# Backlog

## Now

- Patrik plays the full loop on desktop and phone with sound on; rewrites dilemma text he dislikes in `src/data/story.ts`. Reads the 15 answers aloud (two were trimmed 2026-09-01, the rest are his call).
- Listen to the ambience loop and cue levels; replace or re-level if they read as cheap.

## Next

- [x] (löst 2026-11-24) [P3] npm audit 2026-11-17: picomatch <= 4.0.7 (GHSA-fc5q-39xc-vjpf, ReDoS) via vite i dev-kedjan, 4 high, 0 i produktion. Ingen patchad version finns; `npm audit fix --force` föreslår bara nedgradering av vite. Kör `npm audit fix` när picomatch släpper en fix. Löst 2026-11-24: GitHub drog tillbaka advisoryn 2026-11-18 (`withdrawn_at` i `gh api advisories/GHSA-fc5q-39xc-vjpf`), `npm audit` ger 0 fynd med samma picomatch 4.0.7.
- Run the LinkedIn Post Inspector on `https://orgutveckling.se/kontoret/` once and confirm the `og-card.png` preview renders (Patrik, needs a LinkedIn login).

- [P3] UX-granskning 2026-11-24 (Goal-Gradient): scenen visar inte hur många samtal som är kvar; bara klockslaget i hinten (08:12 och framåt) antyder att dagen går. En diskret "Samtal 2 av 5" i hinten eller toppetiketten vore enkelt, men det är ett ton- och designval (Patrik).
- [x] (rättad 2026-11-24, `hunt/2026-11-24`) `[P2]` Vridning mitt i spelet tappade kollegan: vid resize ramade kameran in rummets standardläge (x 1000 i porträtt), så Göran och Mira hamnade utanför bild medan hinten sa "Prata med Göran". Reproducerat i Playwright (844×390 till 390×844, guideringen utanför vyn) lokalt och live. Nu ramar resize in senaste mål (guidad kollega, talare eller "Titta på"). Nytt enhetstest i `scripts/scene.test.ts` faller utan rättelsen.

- [x] (rättad 2026-11-24, `hunt2/2026-11-24`) `[P2]` DELA RESULTAT gjorde ingenting när urklippet nekades eller saknades (vissa inbyggda webbläsare i appar): felet svaldes tyst. Reproducerat i Playwright med en `writeText` som avvisar. Nu öppnas en `prompt` med delningstexten att kopiera för hand; att stänga delningsarket (`AbortError`) ger ingen prompt. Nytt Playwright-test faller utan rättelsen.
- [x] (rättad 2026-11-24, `hunt2/2026-11-24`) `[P3]` En felstavad adress under `/kontoret/` gav GitHubs engelska "Page not found" utan väg tillbaka, medan orgutveckling.se i övrigt har en svensk 404. Ny `public/404.html` på svenska med länk till spelet.
- [P3] Länken till kurssidan på resultatet öppnas i samma flik. Den som går tillbaka får introt, resultatet är borta (spelet sparar inget, beslut 2026-09-01; sett i headless Chromium, där bfcache inte återställde sidan). Ny flik vore en rad, men det är ett produktval (Patrik).

- [x] (rättad 2026-11-25, `speed/2026-11-25`) `[P3]` Fart: startknappen väntade på tableaun (413 kB), som begärdes först när JS hade körts, och porträtten var PNG (361 kB). Förladdning i `index.html` och förlustfri WebP (235 kB). Live vid 390 px, 4x CPU och Slow 4G: redo 4,46 till 3,90 s, LCP 1,43 till 1,47 s, CLS 0 före och efter; en hel session 656 till 595 kB.
- [x] (rättad 2026-11-25, `speed/2026-11-25`) `[P3]` Metadata: ingen canonical och en tom fliksymbol (`data:,`). Nu canonical `https://orgutveckling.se/kontoret/` och orgutvecklings `/favicon.svg` på spelet och 404-sidan.
- [P3] Cache: hashade filer under `/kontoret/assets/` får `Cache-Control: max-age=14400` (mätt live 2026-11-25), så en återbesökare efter fyra timmar förhandlar om varje fil. `immutable` med ett år kräver en Cloudflare-cacheregel för sökvägen; det är en zoninställning (Patrik). Gäller bara de hashade filerna, inte tableaun och porträtten under `public/`, som saknar hash i namnet.

- [x] (rättad 2026-11-25, `scen/2026-11-25`) `[P2]` Efter en driftsättning fastnade en besökare med gammal index.html i cachen (max-age 600) på LADDAR KONTORET…, eftersom de hashade JS- och CSS-filerna inte längre fanns. Reproducerat i Playwright. Nu blir startknappen LADDA OM och laddar om sidan (`public/stale.js`). Två nya Playwright-test faller utan rättelsen.
- [x] (rättad 2026-11-25, `scen/2026-11-25`) `[P2]` CSP-kopian i `vite.config.ts` tillät inline-skript, men zonens CSP gör det inte längre (curl 2026-11-25). Ett inline-skript passerade därför `npm test` och gav ett konsolfel live. Kopian följer nu zonen.

- [x] (rättad 2026-11-25, `xb/2026-11-25`) `[P1]` I WebKit (Playwright, iPhone 13-profilen och 1440 px) visade orgutveckling.se/kontoret LADDA OM vid en vanlig laddning, och omladdningen gav LADDA OM igen, så spelet gick inte att starta. `public/stale.js` var uppskjutet och läste `link.sheet`, men WebKit kör uppskjutna skript innan stilmallen har laddats. Live 3 av 3 i första körningen, 1 av 3 i nästa; med stilmallen fördröjd 400 ms 3 av 3 i WebKit, 0 av 3 i Firefox och Chromium. Nu ett vanligt skript som lyssnar på `error` från början. Nytt WebKit-projekt i Playwright och CI; tre WebKit-test faller utan rättelsen.
- [x] (rättad 2026-11-25, `xb/2026-11-25`) `[P1]` I WebKit (Playwright) med stilmallen fördröjd 400 ms ritades rummet i en bråkdel av sin storlek efter STÄMPLA IN (zoom 0,019 i stället för 0,706 i iPhone 13-profilen och 0,414 vid 844×390), och den guidade kollegan gick inte att träffa. Sett live vid 844×390. WebKit kör `main.ts` innan stilmallen gäller, så kameran mätte en ostylad rot på cirka 18 px och mätte aldrig om. Firefox och Chromium opåverkade. Nu ramar en `ResizeObserver` på roten om kameran (ersätter fönstrets `resize`, täcker även vridning). Playwright-testet för långsam stilmall i WebKit faller utan rättelsen.
- [x] (rättad 2026-11-25, `prefs/2026-11-25`) `[P3]` 200 % text och zoom: vid 390 px med dubblad text sköt rubriken KONTORET introts panel till 705 px bredd i en 390 px vy (STÄMPLA IN utanför skärmen), LJUD AV bröts ut ur sin fasta ruta 88×46, SLUTLIG_8_ny_NY2 sköt dialogtexten utanför rutan, och DELA RESULTAT överlappade STÄMPLA IN IGEN med 34 px (fast höjd 50 px i porträtt). Tangentbordsraden behöver cirka 1 220 px på en rad; vid 1280 med 200 % sidzoom låg Prata med Liv på x −8 och Titta på affischerna slutade vid 648 av 640, och raden täckte hinten. Nu bryts panelen, rubriken och dialogtexten, knapparna har minsta i stället för fast storlek, raden radbryts och hinten flyttar under toppraden medan raden är öppen. Verifierat med `prefs.mjs` (lägen text1280, text390, text844, pagezoom1280, pagezoom844).
- [x] (rättad 2026-11-25, `prefs/2026-11-25`) `[P3]` Forced colors: STÄMPLA IN, DELA RESULTAT och STÄMPLA IN IGEN ritades bara med bakgrund och skugga (0 av 4 kanter), svarsalternativen med 2 av 4, och fokus på ett svar var en fyllning med `outline: 0`, så tangentbordsfokus syntes inte. Nu kant i `ButtonText` och fokusram i `Highlight` under `(forced-colors: active)`; ingen ändring utanför det läget.
- [P3] CI kör bara de `@webkit`-märkta testen i WebKit och inget i Firefox. Hela sviten i WebKit kräver att urklippstestet (`grantPermissions` för urklipp finns inte där) och dragtestet (mus mot pek) skrivs om.

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

- [x] `[P3]` Lighthouse: konsolfel vid laddning och en knapp vars synliga text inte ingår i dess tillgängliga namn (best practices 92). Kontrollera att CSP:n från orgutveckling-zonen inte är källan till konsolfelen. Löst 2026-10-06: CSP:n var källan (`font-src 'self'` blockerade två typsnittsdelar som Vite bäddade in som `data:`), nu `assetsInlineLimit: 0`. Ljudknappens `aria-label` innehåller den synliga texten. `npm test` kör mot zonens CSP och fäller konsolfel. Driftsatt 2026-10-07, Lighthouse ej omkört.

## Granskning 2026-10-06

Fynd från den automatiska sviten (aifabriken `tools/audit-suite.ts`: headers, npm audit, secrets, Actions, markup, axe). Mätvärdena står som `(automated)`-rader under `## Audits` i CONTEXT.md.

- [x] `[P3]` npm audit: 1 high i dev-kedjan (source-map-js), 0 i produktion. `npm audit fix`. Löst 2026-10-06: source-map-js 1.2.1 till 1.2.2, `npm audit` 0 fynd.
- [x] `[P3]` WCAG: axe hittar 0 fel men kan inte avgöra kontrasten på 9 element. Manuell kontrastkontroll återstår. Löst 2026-10-06: kontrasten mätt mot de pixlar som faktiskt ritas bakom texten (Playwright-skärmdump med texten dold, 5:e percentilen per element) i 390×844, 1440×900 och 844×390 över intro, scen, toast, dialog, svar och resultat. Två riktiga fel: toppetiketten KONTORET / NY CHEF låg direkt på bilden (ned till 1,4:1) och resultatets tidsstämpel i porträtt (2,4:1). Etiketten har nu samma mörka platta som ljudknappen, resultatets toning tunnas inte ut i porträtt. Efter: 206 av 206 textelement klarar AA, lägst 4,7:1.

Sidofynd från samma mätning, inte åtgärdade (utanför det godkända):

- [x] (rättad 2026-10-31) `[P1]` Resultatskärmen går inte att rulla. Vid 844×390 hamnar STÄMPLA IN IGEN med nederkant på 756 px i en 390 px hög vy, vid 390×700 på 797 px av 700: dela- och omstartsknapparna samt länken till kurssidan nås inte med pekskärm. `.intro` saknar `overflow`, och `html`/`body`/`#app` har `overflow: hidden` (`src/style.css`). Passar bara exakt vid 390×844, alltså inte i en riktig mobilwebbläsare med adressfält.
- [x] (rättad 2026-10-31) `[P3]` Tangentbord i porträtt: `.hotspot-controls` radbryts till fyra rader och täcker hinten/toasten helt (390×844), så texten från "Titta på klockan" syns aldrig.
- [x] (rättad 2026-10-31) `[P3]` Tangentbordsknapparna heter "Titta på Göran" och "Titta på Mira" (`index.html`) medan scenens etiketter säger "Prata med" (`src/game/OfficeScene.ts`).

## Förbättringar 2026-11-04

Branch `claude/forbattringar-2026-11-04`, draft-PR #1. Detaljer i HANDOFF.md.

- [x] `[P2]` Ljudslingan `office-ambience.mp3` (2,2 MB) laddades vid varje besök fast ljudet är av som standard. Nu `preload = "none"`.
- [x] `[P3]` Två konsolvarningar "preloaded but not used" för porträtten. Ersatta med en cache-uppvärmning när tableaun är klar.
- [x] `[P2]` Mellanslag på ett fokuserat svarsalternativ gjorde ingenting (WCAG 2.1.1).
- [x] `[P3]` Resultatets rubrik saknade `tabindex`, fokus föll till `<body>` efter sista samtalet.
- [x] `[P3]` Efter "Titta på" ramade kameran in rummets mitt, så guideringen hamnade utanför bild i porträtt.
- [x] `[P3]` Svarsknapparna var 40 px höga i kort liggande läge. axe: tom `role="tooltip"` och två landmärken med samma namn.
- [x] (rättad 2026-11-04, `claude/backlog-2026-11-04`) `[P3]` Sidofynd: `.primary-button:hover` och `--ghost:hover` ligger inte under `(hover: hover)`, så på pekskärm kan DELA RESULTAT visas i hovringsfärg om resultatet dyker upp under fingrets sista position (sågs i Playwright vid 390×844).
