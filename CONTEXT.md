# Context

## Product intent

`Kontoret` is a short Swedish point-and-click leadership game for a broad LinkedIn audience. The tone is workplace recognition, dry absurdity, and punch-up humour. The eventual game will use credible organisational psychology, but this first release intentionally validates only the interaction and visual language.

## Current vertical slice

- Pick one of two manager avatars and name the character (kept for later, not shown in the room).
- Look at one richly illustrated office as a living tableau, first person. Drag to pan where the viewport crops it.
- See four colleagues working in the room, baked into the image so scale, staging and light are right by construction.
- Talk to Liv and Nadja, each with exactly three dialogue options. Look at Göran, Mira, the clock, the coffee machine and the posters.
- Use muted-by-default CC0 sound, keyboard navigation, reduced motion, and responsive framing.

## Technical decision

The scene is one image plus hotspots and a camera. Phaser 4.2.1 currently provides the camera pan/zoom, hotspot zones and small light effects; semantic HTML owns setup, dialogue, focus, and accessibility. Vite and TypeScript are local tooling only. `npm run build` produces static files under the `/kontoret/` base path.

Free walking was dropped on 2026-08-27. The product is the dialogue; a walking sprite required a separate character pipeline (walk cycle, matched scale, occlusion) that AI image generation cannot deliver consistently, and it produced every visual defect in the rejected slice. Assets are produced by editing the accepted concept image, never by compositing separately generated pieces.

## Visual direction

Premium contemporary pixel art with late-1990s adventure-game memory, Nordic winter light, teal and amber accents, strong silhouettes, cinematic widescreen composition, and no copied characters or locations. The accepted reference is `art/concepts/office-dialogue-concept.png`.
