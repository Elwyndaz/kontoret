# Context

## Product intent

`Kontoret` is a short Swedish point-and-click leadership game for a broad LinkedIn audience. The tone is workplace recognition, dry absurdity, and punch-up humour. The eventual game will use credible organisational psychology, but this first release intentionally validates only the interaction and visual language.

## Current game loop

- Intro with one button. No avatar, no name: the player is first person and never shown.
- One richly illustrated office as a living tableau. Drag to pan where the viewport crops it.
- Four colleagues baked into the image. Five dilemmas in fixed order (Liv, Nadja, Göran, Mira, Liv), each with three answers scored on tydlighet, trygghet and delaktighet. Earlier answers change later openers.
- Result screen with one of four archetypes (Dirigenten, Diplomaten, Kaptenen, Mötesbokaren), score bars and one research sentence. See `STORY.md`.
- Result can be shared: native share sheet on phones, clipboard elsewhere. Link previews use `public/assets/og-card.png` (1200×627 PNG, LinkedIn does not render WebP).
- Muted-by-default CC0 sound, keyboard navigation, reduced motion, responsive framing.
- Stateless by decision (2026-09-01): nothing is stored between visits. A LinkedIn visitor plays once; remembering a result would only complicate the restart button.

## Technical decision

The scene is one image plus hotspots and a camera, all plain DOM since 2026-09-01: a `.world` div holding the tableau, absolutely positioned hotspot elements, a CSS `transform` with a transition as the camera, pointer events for drag-pan, and CSS keyframes for the three light sources. Phaser was dropped because it cost 1,4 MB of JavaScript for that job; the bundle is now 21 kB. Semantic HTML owns setup, dialogue, focus, and accessibility. Vite and TypeScript are local tooling only. `npm run build` produces static files under the `/kontoret/` base path.

Free walking was dropped on 2026-08-27. The product is the dialogue; a walking sprite required a separate character pipeline (walk cycle, matched scale, occlusion) that AI image generation cannot deliver consistently, and it produced every visual defect in the rejected slice. Assets are produced by editing the accepted concept image, never by compositing separately generated pieces.

## Visual direction

Premium contemporary pixel art with late-1990s adventure-game memory, Nordic winter light, teal and amber accents, strong silhouettes, cinematic widescreen composition, and no copied characters or locations. The accepted reference is `art/concepts/office-dialogue-concept.png`.
