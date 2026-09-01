# Backlog

## Now

- Patrik plays the full loop on desktop and phone with sound on; rewrites dilemma text he dislikes in `src/data/story.ts`.
- Comedy pass and psychology pass on all 15 answers (checklist in `STORY.md`).
- Listen to the ambience loop and cue levels; replace or re-level if they read as cheap.

## Next

- Run the LinkedIn Post Inspector on `https://orgutveckling.se/kontoret/` once and confirm the `og-card.png` preview renders (Patrik, needs a LinkedIn login).

## Production polish

- Automated playthrough in CI using the scratchpad `play.mjs` approach.

## Resolved 2026-09-01

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
