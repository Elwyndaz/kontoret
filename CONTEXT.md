# Context

## Product intent

`Kontoret` is a short Swedish point-and-click leadership game for a broad LinkedIn audience. The tone is workplace recognition, dry absurdity, and punch-up humour. The eventual game will use credible organisational psychology, but this first release intentionally validates only the interaction and visual language.

## Current game loop

- Intro with one button. No avatar, no name: the player is first person and never shown.
- One richly illustrated office as a living tableau. Drag to pan where the viewport crops it.
- Four colleagues baked into the image. Five dilemmas in fixed order (Liv, Nadja, Göran, Mira, Liv), each with three answers scored on tydlighet, trygghet and delaktighet. Earlier answers change later openers.
- Result screen with one of four archetypes (Dirigenten, Diplomaten, Kaptenen, Mötesbokaren), one plain sentence per axis (no bars: five choices are not a measurement, and the screen says so), a closing line that reflects what actually happened, one sourced research sentence and one reading pointer. See `STORY.md`.
- Result can be shared: native share sheet on phones, clipboard elsewhere. Link previews use `public/assets/og-card.png` (1200×627 PNG, LinkedIn does not render WebP).
- Muted-by-default CC0 sound, keyboard navigation, reduced motion, responsive framing.
- Stateless by decision (2026-09-01): nothing is stored between visits. A LinkedIn visitor plays once; remembering a result would only complicate the restart button.

## Technical decision

The scene is one image plus hotspots and a camera, all plain DOM since 2026-09-01: a `.world` div holding the tableau, absolutely positioned hotspot elements, a CSS `transform` with a transition as the camera, pointer events for drag-pan, and CSS keyframes for the three light sources. Phaser was dropped because it cost 1,4 MB of JavaScript for that job; the bundle is now 21 kB. Semantic HTML owns setup, dialogue, focus, and accessibility. Vite and TypeScript are local tooling only. `npm run build` produces static files under the `/kontoret/` base path.

Free walking was dropped on 2026-08-27. The product is the dialogue; a walking sprite required a separate character pipeline (walk cycle, matched scale, occlusion) that AI image generation cannot deliver consistently, and it produced every visual defect in the rejected slice. Assets are produced by editing the accepted concept image, never by compositing separately generated pieces.

## Visual direction

Pixelify Sans carries headings, labels and buttons. Running text (dialogue, choices, result paragraphs) is a system sans since 2026-09-01: the pixel face at 13 to 18 px was hard to read and drew "fi" as one glyph. Ligatures are off globally.

Premium contemporary pixel art with late-1990s adventure-game memory, Nordic winter light, teal and amber accents, strong silhouettes, cinematic widescreen composition, and no copied characters or locations. The accepted reference is `art/concepts/office-dialogue-concept.png`.

## Audits
Read by the cockpit Audits tab. One `- Label: YYYY-MM-DD, result` per check; conventions in elwyn-dash `docs/security.md`.
- Headers: 2026-09-16, pass, 6 of 6 on orgutveckling.se/kontoret via the zone Transform Rule and HSTS
- TLS: 2026-09-16, pass, SSL Labs A+ on orgutveckling.se after TLS 1.2 minimum was set today, HSTS present
- Lighthouse: 2026-09-16, warn, a11y 100, best practices 92 (console errors, label-content mismatch), SEO 100 (mobile, no perf)
- Markup: 2026-09-16, pass, W3C 0 errors, 19 warnings, 0 broken links
- npm audit: 2026-09-24, pass, 0 in production, 0 in the dev chain
- Secrets: 2026-09-24, pass, gitleaks 0 findings in 14 commits
- Actions: 2026-09-24, pass, zizmor 0 high, 0 medium, 0 low
- WCAG 2.2 AA: 2026-09-24, warn, axe 4.13.0 0 violations on orgutveckling.se/kontoret (mobile, one page); manual keyboard pass not done
