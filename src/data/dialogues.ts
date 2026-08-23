export type DialogueId = "liv" | "nadja";

export interface DialogueChoice {
  prompt: string;
  response: string;
  reaction: "blink" | "shuffle" | "coffee" | "lights" | "gesture";
}

export interface Dialogue {
  id: DialogueId;
  speaker: string;
  portraitClass: string;
  opener: string;
  choices: DialogueChoice[];
}

export const dialogues: Record<DialogueId, Dialogue> = {
  liv: {
    id: "liv",
    speaker: "LIV",
    portraitClass: "dialogue__portrait--liv",
    opener: "Jag försöker fastställa vilken fil som är verkligheten.",
    choices: [
      {
        prompt: "Vad behöver du för att komma vidare?",
        response: "En beställare. Vi har tre, och samtliga tror att de är den diskreta.",
        reaction: "blink",
      },
      {
        prompt: "Vilken version är senast?",
        response: "SLUTLIG_8_ny_NY2. Men KORR-versionen har starkare intern legitimitet.",
        reaction: "shuffle",
      },
      {
        prompt: "Ska vi boka ett möte och reda ut det?",
        response: "Jag vill att du tänker igenom vad du just gjorde.",
        reaction: "blink",
      },
    ],
  },
  nadja: {
    id: "nadja",
    speaker: "NADJA",
    portraitClass: "dialogue__portrait--nadja",
    opener: "Välkommen! Kaffemaskinen har gått in i en mer distribuerad leveransmodell.",
    choices: [
      {
        prompt: "Betyder det att den är trasig?",
        response: "Tekniskt, ja. Kulturellt är den på en resa.",
        reaction: "coffee",
      },
      {
        prompt: "Vad jobbar du med?",
        response: "Jag översätter problem till möjligheter tills ingen längre kan hitta dem.",
        reaction: "gesture",
      },
      {
        prompt: "Finns det något som faktiskt fungerar?",
        response: "Nödbelysningen. Den får mycket praktisk erfarenhet.",
        reaction: "lights",
      },
    ],
  },
};
