# Kontoret

A five-minute Swedish pixel-art game about your first day as a manager. Five
conversations, three answers each, one archetype at the end. Story, scoring
model and archetypes are described in `STORY.md`; all text lives in
`src/data/story.ts`.

## Run

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:4173/kontoret/`.

## How it is built

The room is a single tableau image derived from the accepted concept
(`art/concepts/office-dialogue-concept.png`) with the UI and the walking
character edited out. Phaser 4.2.1 provides camera framing, hotspot zones and
small light effects. Dialogue, character selection, mute, and keyboard
interaction are semantic HTML over the canvas so Swedish text stays crisp.

There is no walking character. The player is first person; clicking a colleague
or object frames it with the camera and opens the dialogue or a look line.

## Boundary

Included: one room, seven hotspots, five dilemmas with consequences, three-axis
scoring, four result archetypes, responsive framing, mute, keyboard controls,
reduced motion.

Excluded so far: shareable result card, reading suggestions, persistence.

## Asset credits

- Office ambience: Freesound 327497 "Office Ambience 01 OWI", CC0.
- Interface cues: Kenney Interface Sounds, CC0.
- Illustrations: generated for this project, no copied characters or locations.
