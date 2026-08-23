# Context

## Product intent

`Kontoret` is a short Swedish point-and-click leadership game for a broad LinkedIn audience. The tone is workplace recognition, dry absurdity, and punch-up humour. The eventual game will use credible organisational psychology, but this first release intentionally validates only the interaction and visual language.

## Current vertical slice

- Pick one of two visible manager avatars and name the character.
- Walk through one richly illustrated office by pointer, touch, arrows, or WASD.
- See four colleagues working in the room.
- Talk to Liv and Nadja, each with exactly three dialogue options.
- Inspect the printer, coffee machine, and management posters.
- Use muted-by-default sound, keyboard navigation, reduced motion, and responsive framing.

## Technical decision

Phaser 4.2.1 owns the 2D scene, camera, sprite staging, hotspots, movement, and small effects. Semantic HTML owns setup, dialogue, focus, and accessibility. Vite and TypeScript are local tooling only. `npm run build` produces static files under the `/kontoret/` base path.

PixiJS was rejected because this slice would need to build more game infrastructure around it. Three.js was rejected because the room does not benefit enough from a 3D scene graph, shaders, or dynamic lighting to justify the extra complexity.

## Visual direction

Premium contemporary pixel art with late-1990s adventure-game memory, Nordic winter light, teal and amber accents, strong silhouettes, cinematic widescreen composition, and no copied characters or locations. The accepted reference is `art/concepts/office-dialogue-concept.png`.
