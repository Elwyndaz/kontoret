# Kontoret prototype

Throwaway vertical slice answering one question: can one illustrated office,
hotspots, and short conversations feel like a premium pixel-art adventure game
about work?

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

## Prototype boundary

Included: avatar choice and name, one room, seven hotspots, two conversations
with three options each, responsive framing, mute, keyboard controls, and
reduced motion.

Excluded: the five-dilemma story, psychology scoring, consequences, results,
sharing, persistence.

## Asset credits

- Office ambience: Freesound 327497 "Office Ambience 01 OWI", CC0.
- Interface cues: Kenney Interface Sounds, CC0.
- Illustrations: generated for this project, no copied characters or locations.
