---
reviewedAt: 2026-08-27
currentGoal: Get the rebuilt tableau slice visually accepted by Patrik.
nextAction: Patrik reviews the running build (desktop, portrait, short landscape) with sound on. Fix what he rejects, nothing else.
status: active
---

# Handoff

The slice was rebuilt on 2026-08-27 as a living tableau instead of a walking-character scene. The colleagues are baked into one image (`public/assets/office-tableau.png`), produced by editing the accepted concept `art/concepts/office-dialogue-concept.png` with Codex image editing: the standing manager, the floor arrow, the cursor, the speaker icon and the dialogue UI were removed and the floor reconstructed. Staging, scale and lighting therefore match the concept by construction. The player is first person; the chosen avatar and name are kept from the intro for later use but never appear in the room.

Interaction: seven hotspots (Liv, Nadja, Göran, Mira, clock, coffee machine, posters). Each hotspot shows a hover ring and tooltip, pans and zooms the camera onto the target, and opens a dialogue (Liv, Nadja) or a one-line look toast. Drag pans the room where the viewport crops it (portrait). Keyboard users get the same via the hidden hotspot buttons and keys 1 to 3.

Audio: CC0 files only. `office-ambience.mp3` is Freesound 327497 "Office Ambience 01 OWI" (hq preview, ~2 min loop). Cues are Kenney Interface Sounds (`click`, `open`, `close`, `confirm`, `look`). Sound is muted by default; the toggle starts the ambience loop. Nobody has listened to the ambience in the build yet.

Verification done: `npm run build` passes. Screenshots of the built app were taken headless with Edge at 1440×900, 390×844 and 820×380 through intro, office, Liv dialogue, answer, and the coffee look (scratchpad script, not committed). Desktop matched the concept. Patrik has not yet reviewed.

Run with `npm install` then `npm run dev`. Vite base is `/kontoret/`. Pages deploy is `.github/workflows/deploy-pages.yml`; the currently deployed build at `https://orgutveckling.se/kontoret/` is still the rejected 2026-08-23 checkpoint until this is pushed.

The larger story, psychology model, consequences, results, sharing and persistence are deliberately not started.

Repository: `https://github.com/Elwyndaz/kontoret`
