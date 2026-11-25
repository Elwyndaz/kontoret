---
reviewedAt: 2026-11-24
currentGoal: "Patrik plays it with sound, reads the 15 answers aloud, runs the LinkedIn Post Inspector, then posts it."
nextAction: "Patrik plays through once on desktop and once on phone with sound on, rewrites any dilemma text he dislikes in src/data/story.ts, and checks https://www.linkedin.com/post-inspector/ against the live URL."
status: active
schemaVersion: 1
blockers: []
---

**2026-11-24, buggjakt 2 (gren `hunt2/2026-11-24`, klar).** Det batch 6 inte gick: långsam tableau (4 s, knappen väntar med LADDAR KONTORET… och blir STÄMPLA IN), saknat porträtt (spelet når resultatet ändå), omstart och en andra genomspelning, tillbaka från kurslänken, Tab-ordning på resultatet, toast följd av guidering, sex vägar till resultat vid 390×844 utan konsolfel och utan decimalpunkt i texten. Länkar: spelet, kurssidan, og-bilden, tableaun, ljud och porträtt ger 200 live. Två buggar, båda rättade (BACKLOG): DELA RESULTAT var tyst när urklippet nekades, och `/kontoret/<fel>` gav GitHubs engelska 404. `npm run build` och `npm test` 12 av 12 gröna (lokal konfiguration `qa/pw6213.config.ts`, port 6213). Driftsatt via Pages-workflowet (körning 45520670823 grön); live ger `/kontoret/finns-inte` 404 med titeln "Sidan finns inte · Kontoret", och ett nekat urklipp ger prompten med delningstexten. Skriptet ligger utanför repot i `C:\Users\patri\AppData\Local\Temp\aifabriken-lanes\hunt2-kontoret\hunt.mjs`. Inte rättat: efter en driftsättning kan en besökare med index.html i cachen (max-age 600) men utan den gamla JS-filen fastna på LADDAR KONTORET… eftersom bara tableaun har ett felläge; inte reproducerat, bara läst ur koden.

**2026-11-24, buggjakt (gren `hunt/2026-11-24`, klar).** Spelade som en LinkedIn-besökare vid 1440×900, 390×844, 844×390, 375×553, 320×568 och 667×320: mus, pek (tap och drag), bara tangentbord (Tab, Enter, 1 till 3, Escape), dubbeltryck på start, kollegor som inte är på tur, "Titta på" under guidering, misslyckad tableau-hämtning (FÖRSÖK IGEN visas), resultatets knappar nåbara i alla storlekar, inga hotspots klickbara bakom resultatet. En bugg: vridning av telefonen mitt i spelet tappade den guidade kollegan (BACKLOG). Rättad i `OfficeScene.ts`, nytt enhetstest. `npm run build` och `npm test` 11 av 11 gröna (lokal konfiguration i `qa/`, port 5818). Driftsatt via Pages-workflowet (körning 45492799823 grön), rättelsen verifierad live på orgutveckling.se/kontoret med samma Playwright-skript (före: Göran utanför vyn, efter: i vyn). Skrivmaskinstexten går inte att hoppa över med tryck (längsta repliken 155 tecken, cirka 3 s); det är ett designval och lämnat orört.

**2026-11-24, djupgenomgång (gren `deep/2026-11-24`, klar).** Nya `scripts/scene.test.ts` (node:test, 22 tester mot en minimal fejk-DOM) körs av `test:unit` i `npm run build`. Stryker med command runner (konfiguration i det ignorerade `qa/stryker.scene.json`, `--experimental-transform-types` eftersom OfficeScene har parameteregenskaper): `OfficeScene.ts` 99,59 %, 240 av 241 mutanter dödade; den kvarvarande (rad 89, `moved = true` till `false`) är likvärdig eftersom rad 91 sätter flaggan igen. Ingen bugg, ingen produktionskod ändrad. `main.ts` inte mätt: modulen är sidoeffekter mot DOM, ljud och timers och kräver ett DOM-bibliotek eller en stor fejk-DOM; Playwright täcker flödet. picomatch-advisoryn drogs tillbaka 2026-11-18, `npm audit` 0. UX-granskning mot `vite preview`: skriptet 6 av 6, skärmdumpar 390×844 och 1440×900 av intro, scen, toast, dialog, svar och resultat utan konsolfel; enda fyndet (inget framsteg över de fem samtalen) är ett designval och ligger i BACKLOG.

**2026-11-17, uppdateringsrunda.** vite 8.3.4 till 8.3.8 (fortfarande exakt pinnad), @playwright/test 1.65.1. `npm run build` och `npm test` 11 av 11 gröna. Kvar 4 high i dev-kedjan (picomatch, ingen fix finns), se BACKLOG. Pushad till main, som deployar.

**2026-11-04, backlog (branch `claude/backlog-2026-11-04` ovanpå förbättringsgrenen, draft-PR).** Sista öppna sidofyndet: alla `:hover`-regler ligger nu under `(hover: hover)`, så en knapp blir inte tänd av fingrets sista position på pekskärm. Nytt test fäller en oskyddad `:hover`-regel; det föll med fyra regler före ändringen. `npm run build` grön, `npm test` 11 av 11 (lokal konfiguration i `qa/`, port 47614).

**2026-11-04, förbättringsrunda (branch `claude/forbattringar-2026-11-04`, draft-PR #1, inte mergad).** Bara buggar, tillgänglighet och prestanda; story, ton och konst orörda. Ljudslingan (2,2 MB) hämtas inte längre när ljudet är av, porträtten värms i cachen efter tableaun i stället för med `<link rel="preload">` (två konsolvarningar borta). Mellanslag väljer ett fokuserat svar (fönstrets keydown svalde det), resultatrubriken tar emot fokus i stället för `<body>`, kameran återvänder till den guidade kollegan efter "Titta på" i porträtt, svarsknapparna är 44 px även vid 844×390, och axe-fynden `aria-tooltip-name` och `landmark-unique` är borta. `npm test` 10 av 10 (tre nya test, ett skärpt). axe 4.10.3 lokalt: 0 fel i intro, scen, dialog och resultat vid 1440×900, 390×844 och 844×390. Port 4173 var upptagen, så testerna kördes med en lokal konfiguration i `qa/` (port 47613, förinstallerad Chromium).
**2026-11-04, mutationstest (gren `claude/mutation-2026-11-04`, PR #2, inte mergad).** Stryker 9 med command runner på funktionerna i `src/data/story.ts` (rad 245 till 269): 37,21 % med bara `scripts/balance.ts`, 97,67 % efter (43 mutanter). Nya `scripts/story.test.ts` (node:test, 8 tester) körs av `npm run build` via `test:unit`. Den enda kvarvarande mutanten är likvärdig (alla arketyper har `summaryIf`). Ingen bugg, ingen produktionskod ändrad. TypeScript 7 saknar API:t Stryker skriver om tsconfig med: `tsconfigFile` pekar på en fil som inte finns. Kör: `npm i --no-save @stryker-mutator/core@9 && npx stryker run`.

**2026-10-11, noindex.** `<meta name="robots" content="noindex, follow">` in `index.html` on Patrik's request, same tag as video. `npm run build` green, CI deployed, tag verified live on orgutveckling.se/kontoret. Note for the LinkedIn launch: link previews still work, but search engines will not list the page.

**2026-09-24, audits från aifabriken (`tools/audit-run.mjs`).** Actions: `persist-credentials: false` på checkout i deploy-pages.yml. Nya auditrader Secrets och Actions, båda pass.

# Handoff

The prototype is now the actual game loop: intro → five dilemmas in fixed order → result archetype. Story, scoring model, consequences and archetypes are documented in `STORY.md`; all text lives in `src/data/story.ts` and can be edited without touching code.

Scene: one tableau image (`public/assets/office-tableau.webp`, 412 KB, converted from the 3,8 MB PNG with Pillow at quality 90) edited from the accepted concept with Codex, rendered as plain DOM (`src/game/OfficeScene.ts`: `.world` div, CSS-transform camera, pointer drag-pan). Phaser is gone since 2026-09-01. The player is first person; there is no avatar or name any more (removed 2026-08-27 on Patrik's request). A pulsing teal ring and a hint (`08:12 · Prata med Liv.`) guide the player to the current colleague. Other colleagues answer with a one-line aside. Clock, coffee machine and posters are look-at hotspots.

Portraits: four head-and-shoulders images (`portrait-liv/nadja/goran/mira.png`). Liv is cropped from the concept; the other three were generated by Codex with the Liv crop as style reference. Any new speaker needs one made the same way.

Audio: CC0 ambience (Freesound 327497) and Kenney cues. Muted by default. Nobody has listened to the ambience in the build yet.

Verification: `npm run build` runs `tsc`, `scripts/balance.ts` (all 243 paths, every archetype reachable, Mötesbokaren 10 to 40 %) and Vite; `npm test` runs three Playwright scenarios against `vite preview` (mouse loop plus clipboard, phone drag-pan, keyboard loop) and the Pages workflow runs both before deploying. JS bundle 21 kB. After the Phaser removal, real-mouse Playwright runs covered tooltip, look-at zoom and return, all five dialogues to a result, drag-pan that does not open a dialogue, and taps at 1440×900, 390×844 and 844×390. Playwright playthroughs (2026-09-01, via the Playwright MCP against `vite preview`, driving the keyboard hotspot buttons with focus + Enter because the canvas intercepts mouse clicks on them) completed all five dilemmas and reached the result on desktop 1440×900 (picks 1,2,3,1,2 → Dirigenten) and portrait 390×844 (picks 3,3,3,3,3 → Mötesbokaren) with no page errors. Headless throttles `setInterval`, so playthrough tests emulate `prefers-reduced-motion`; that path had a real bug (camera framing never applied) which is fixed.

Research lines and one reading pointer per archetype verified 2026-09-01 (source table in `STORY.md`). Result screen has a share button (clipboard on desktop, share sheet on touch) and the page carries OG tags with `public/assets/og-card.png` for LinkedIn previews. Stateless by decision. The `Next` backlog is empty apart from Patrik's own Post Inspector check.

Run with `npm install` then `npm run dev`. Vite base is `/kontoret/`. Pages deploy on push via `.github/workflows/deploy-pages.yml` to `https://orgutveckling.se/kontoret/`.

Repository: `https://github.com/Elwyndaz/kontoret`

## Granskning 2026-09-16

Cross-project audit run from elwyn-dash (session 5 in the daily note). Results written to `## Audits` in CONTEXT.md, findings appended to BACKLOG.md under `## Granskning 2026-09-16`. Headers on buildapp.se and the TLS grade are zone-level and are fixed once in Cloudflare, not here.

## Automated audit batch, 2026-10-06

Cross-project run from elwyn-dash with aifabriken `tools/audit-suite.ts` (headers, npm audit, secrets, Actions, markup, axe at one mobile viewport; TLS and Lighthouse not run). Results are the `(automated)` lines under `## Audits` in CONTEXT.md, findings under `## Granskning 2026-10-06` in BACKLOG.md. Markup pass; axe 0 violations with 9 contrast nodes for manual review; npm audit fail (one dev-chain high); headers fail because the orgutveckling.se CSP allows `script-src 'unsafe-inline'` (item in elwyndaz.github.io). No application code or deployment changed. `reviewedAt` was left alone: the goal and next action above were not reviewed.

## Nattbatch 2026-10-06 (branch `batch/2026-10-06`, mergad till `main` och driftsatt 2026-10-07)

De tre öppna P3-fynden är åtgärdade på branchen. Mergad till `main` och driftsatt 2026-10-07 på Patriks order (Pages driftsätter vid push).

- Konsolfel: zonens CSP (`font-src 'self'`) blockerade två typsnittsdelar som Vite bäddade in som `data:`. `build.assetsInlineLimit: 0` i `vite.config.ts` ger filer i stället. `vite preview` skickar nu en kopia av zonens CSP, och ett fjärde Playwright-test fäller konsolfel vid laddning. Ändras CSP:n i Cloudflare ska kopian i `vite.config.ts` följa med. De två preload-varningarna för porträtten finns kvar (varningar, inte fel).
- Ljudknappen: `aria-label` är "Ljud av, slå på" / "Ljud på, stäng av", så den synliga texten ingår i namnet. Lighthouse är inte omkört efter driftsättningen 2026-10-07.
- npm audit: source-map-js 1.2.2, 0 fynd.
- Kontrast: mätt mot renderade pixlar, 206 av 206 textelement klarar AA efter två CSS-ändringar (platta bakom toppetiketten, tätare toning på resultatet i porträtt). Mätskriptet låg i det ignorerade `qa/` och är inte incheckat.

Kvar för Patrik: de tre punkterna under `Now`/`Next` (spela, lyssna, Post Inspector) och sidofynden i BACKLOG. Viktigast: `[P1]` resultatskärmen går inte att rulla, så knapparna hamnar utanför vyn på korta skärmar.

Port 4173 var upptagen av en annan process under batchen, testerna kördes mot samma bygge på port 4319 med en lokal Playwright-konfiguration i `qa/`.

## Beroendeuppdatering 2026-10-17

- vite 8.3.4 (fortfarande exakt pinnad), @playwright/test 1.64.1. `npm run build` och de fyra Playwright-testen gröna före och efter, `npm audit` 0. Inte pushat: en push till `main` deployar.
- Port 4173 var upptagen av en annan process, testerna kördes med `npx playwright test -c qa/pw.config.ts` (port 4319).
