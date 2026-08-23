# Kontoret prototype

Throwaway vertical slice answering one question: can walking, staging, hotspots,
and short conversations feel like a premium pixel-art adventure game about work?

## Run

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:4173/kontoret/`.

## Technology decision

Phaser 4.2.1 handles the 2D scene, sprites, pointer input, animation, camera,
scaling, loading, and audio. PixiJS 8.20 is an excellent renderer but would make
this project build its own game layer. Three.js 0.185 adds a 3D scene graph and
WebGL complexity that this illustrated 2D room does not use. Vite and TypeScript
provide a small local toolchain; the production build is static and configured
for `orgutveckling.se/kontoret/`.

Dialogue, character selection, mute, and keyboard interaction remain semantic
HTML over the canvas. This keeps Swedish text crisp and accessibility practical.

## Prototype boundary

Included: avatar choice and name, one room, click-to-walk, four working
colleagues, two conversations with three options each, environmental hotspots,
responsive framing, mute, keyboard controls, and reduced motion.

Excluded: the five-dilemma story, psychology scoring, consequences, results,
sharing, persistence, and production deployment.

The accepted visual concept is in `art/concepts/office-dialogue-concept.png`.
