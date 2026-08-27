# Backlog

## Now

- Patrik plays the full loop on desktop and phone with sound on; rewrites dilemma text he dislikes in `src/data/story.ts`.
- Verify the four research sentences against primary sources (list in `STORY.md`).
- Comedy pass and psychology pass on all 15 answers (checklist in `STORY.md`).
- Listen to the ambience loop and cue levels; replace or re-level if they read as cheap.

## Next

- Shareable result card (image or copy-text) for LinkedIn.
- Reading/listening suggestions per archetype, carefully sourced.
- Decide whether the result should be remembered between visits (localStorage) or stay stateless.

## Production polish

- Compress `office-tableau.png` (2,5 MB) to WebP/AVIF.
- Drop or lazy-load Phaser: the scene is one image, seven zones and a camera, which CSS transforms can do without 1,4 MB of JavaScript.
- Automated playthrough in CI using the scratchpad `play.mjs` approach.

## Resolved 2026-08-27

- Rejected walking-sprite slice replaced by a first-person tableau; every P0 visual defect removed at the source.
- Avatar picker and name field removed.
- Dedicated dialogue portraits for all four colleagues.
- Five dilemmas, three-axis scoring, tag-based consequences, four archetypes, result screen.
