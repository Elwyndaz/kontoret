export type SpeakerId = "liv" | "nadja" | "goran" | "mira";
export type Axis = "tydlighet" | "trygghet" | "delaktighet";
export type Scores = Record<Axis, number>;

export interface StoryState {
  scores: Scores;
  tags: Set<string>;
}

export interface Choice {
  prompt: string;
  response: string;
  effects: Partial<Scores>;
  tag: string;
}

export interface Dilemma {
  id: string;
  speaker: SpeakerId;
  speakerName: string;
  stamp: string;
  opener: string;
  // First matching tag from earlier choices replaces the opener.
  openerIf?: Array<[tag: string, line: string]>;
  choices: [Choice, Choice, Choice];
}

export const speakers: Record<SpeakerId, string> = { liv: "LIV", nadja: "NADJA", goran: "GÖRAN", mira: "MIRA" };

export const dilemmas: Dilemma[] = [
  {
    id: "beställare",
    speaker: "liv",
    speakerName: "LIV",
    stamp: "08:12",
    opener: "Välkommen. Projekt Samsyn har tre beställare, och samtliga tror att de är den diskreta. Jag försöker fastställa vilken fil som är verkligheten.",
    choices: [
      {
        prompt: "Vem borde äga det här? Jag pratar med alla tre idag.",
        response: "Ingen har frågat det på åtta månader. Jag skickar dig SLUTLIG_8_ny_NY2 så du har något att peka på.",
        effects: { tydlighet: 1 },
        tag: "owner",
      },
      {
        prompt: "Vad skulle du göra om det var ditt beslut?",
        response: "Jag skulle välja en. Vilken som helst. Men jag är inte chef, och det har alla tre påpekat.",
        effects: { trygghet: 1, delaktighet: 1 },
        tag: "ask",
      },
      {
        prompt: "Ska vi boka ett möte och reda ut det?",
        response: "Jag vill att du tänker igenom vad du just gjorde.",
        effects: { tydlighet: -1 },
        tag: "meeting",
      },
    ],
  },
  {
    id: "nyhetsbrev",
    speaker: "nadja",
    speakerName: "NADJA",
    stamp: "09:40",
    opener: "Hej hej! Jag har ett nyhetsbrev klart om Samsyn: 'Nystart 2.0, nu med gemensam riktning'. Går ut till hela organisationen klockan tolv. Vill du säga något?",
    openerIf: [
      ["meeting", "Hörde att du bokat ett möte om Samsyn. Jag har redan gjort en agenda. Med tema. Och ett nyhetsbrev: 'Nystart 2.0'. Går ut klockan tolv, okej?"],
    ],
    choices: [
      {
        prompt: "Vänta med utskicket tills vi vet vem som äger projektet.",
        response: "Vänta? Vi har inte väntat sedan 2023. Men okej. Jag sparar det som utkast. Bredvid de andra sex.",
        effects: { tydlighet: 1, delaktighet: -1 },
        tag: "hold",
      },
      {
        prompt: "Skicka, men skriv vad som faktiskt är oklart just nu.",
        response: "Skriva att det är oklart. I ett nyhetsbrev. Det är... faktiskt inte gjort förut. Jag testar.",
        effects: { trygghet: 1, delaktighet: 1 },
        tag: "honest",
      },
      {
        prompt: "Kör. Det är bra att visa fart första dagen.",
        response: "Älskar det. Jag lägger till ett citat från dig. Jag hittar på något, du kan godkänna i efterhand.",
        effects: { tydlighet: -1, trygghet: -1 },
        tag: "spin",
      },
    ],
  },
  {
    id: "grunden",
    speaker: "goran",
    speakerName: "GÖRAN",
    stamp: "11:05",
    opener: "Jag ska säga det en gång, lågt. Samsyn står på en teknisk grund som inte håller. Jag sa det för åtta månader sedan. Jag fick ett utvecklingssamtal.",
    openerIf: [
      ["spin", "Jag såg nyhetsbrevet. 'Nystart'. Det är fjärde. Jag ska säga en sak lågt: Samsyn står på en teknisk grund som inte håller. Jag sa det för åtta månader sedan. Jag fick ett utvecklingssamtal."],
    ],
    choices: [
      {
        prompt: "Berätta mer. Jag vill höra det före mötet, inte efter.",
        response: "Före mötet. Det är nytt. Ge mig tjugo minuter och en whiteboard som ingen fotograferar.",
        effects: { trygghet: 1, delaktighet: 1 },
        tag: "listen",
      },
      {
        prompt: "Skriv ner det i ett PM så tar jag det uppåt.",
        response: "Jag har ett PM. Det heter PM_grund_v3. Ingen har öppnat det. Men visst, jag skickar det igen.",
        effects: { tydlighet: 1, trygghet: -1 },
        tag: "pm",
      },
      {
        prompt: "Vi kör på beslutet. Det är inte läge att riva upp nu.",
        response: "Förstår. Jag sätter på hörlurarna igen.",
        effects: { tydlighet: 1, trygghet: -1, delaktighet: -1 },
        tag: "push",
      },
    ],
  },
  {
    id: "ryktet",
    speaker: "mira",
    speakerName: "MIRA",
    stamp: "13:20",
    opener: "Det går ett rykte om att den nya chefen ska slå ihop våra två team. Ryktet kom före dig. Vi har haft mejltråd om det sedan i tisdags. Om dig.",
    openerIf: [
      ["push", "Göran satte på hörlurarna igen. Det brukar betyda något. Och det går ett rykte om att du ska slå ihop våra två team. Mejltråden om det är äldre än din anställning."],
    ],
    choices: [
      {
        prompt: "Jag vet inte mer än ni. När jag vet säger jag det, även om det är obekvämt.",
        response: "Det är första gången någon sagt 'jag vet inte' på det här kontoret utan att blinka. Jag vidarebefordrar. Ordagrant.",
        effects: { trygghet: 1, tydlighet: 1 },
        tag: "open",
      },
      {
        prompt: "Det är inget beslutat. Ni behöver inte oroa er.",
        response: "'Inget beslutat' är exakt vad förra chefen sa. Tre veckor före omorganisationen. Jag lägger till det i tråden.",
        effects: { trygghet: -1, tydlighet: -1 },
        tag: "soothe",
      },
      {
        prompt: "Vad skulle behöva vara sant för att det skulle kännas okej?",
        response: "Att någon frågade oss innan. Så, det du gör nu. Fortsätt med det så ska jag försöka inte bli misstänksam.",
        effects: { delaktighet: 1, trygghet: 1, tydlighet: -1 },
        tag: "explore",
      },
    ],
  },
  {
    id: "beslutet",
    speaker: "liv",
    speakerName: "LIV",
    stamp: "15:50",
    opener: "Alla tre beställare har hört av sig. Alla tre vill träffa dig enskilt. Ingen vill träffa varandra. Vad gör vi med Samsyn?",
    openerIf: [
      ["owner", "Du pratade med alla tre. Alla tre tackade för förtroendet. Ingen av dem menade samma sak. Vad gör vi med Samsyn?"],
      ["meeting", "Mötet är bokat. Alla tre beställare har tackat nej, med olika anledningar. Vad gör vi med Samsyn?"],
    ],
    choices: [
      {
        prompt: "Jag utser en beställare i dag och tar smällen.",
        response: "En beställare. Jag har väntat på den meningen sedan mars. Jag byter filnamn till SLUTLIG.",
        effects: { tydlighet: 1, delaktighet: -1 },
        tag: "decide",
      },
      {
        prompt: "Vi tre och ni två sätter oss i morgon och landar det tillsammans.",
        response: "Tillsammans. Okej. Jag bokar rummet, du bokar personerna. Om det blir tre beställare även efter det så säger jag upp mig.",
        effects: { delaktighet: 1, trygghet: 1 },
        tag: "together",
      },
      {
        prompt: "Vi låter det ligga till strategidagen.",
        response: "Strategidagen är i november. Det är ett ja till alla tre. Jag skapar en mapp som heter SLUTLIG_9.",
        effects: { tydlighet: -1, trygghet: -1 },
        tag: "postpone",
      },
    ],
  },
];

export interface Archetype {
  name: string;
  title: string;
  summary: string;
  cost: string;
  research: string;
  // One verified pointer per archetype; sources in STORY.md.
  reading: string;
}

const archetypes: Record<"dirigenten" | "diplomaten" | "kaptenen" | "motesbokaren", Archetype> = {
  dirigenten: {
    name: "DIRIGENTEN",
    title: "Tydligt vad som gäller, tryggt att säga emot",
    summary: "Du säger vad som gäller och gör det säkert att säga emot. Folk vet vem som bestämmer och vågar berätta vad som inte fungerar. Göran tog av sig hörlurarna.",
    cost: "Kostnaden är tid. Att både bestämma och lyssna tar längre än att göra en av sakerna. Första dagen hann du med ett projekt.",
    research: "Edmondson kallar kombinationen höga krav och psykologisk trygghet för lärandezonen. Trygghet utan krav blir bekvämlighet, krav utan trygghet blir ångest. Team lär sig bara i rutan där båda finns.",
    reading: "Läs vidare: Amy C. Edmondson, The Fearless Organization: Psykologisk trygghet på jobbet (Sanoma Utbildning 2019).",
  },
  diplomaten: {
    name: "DIPLOMATEN",
    title: "Tryggt att säga emot, otydligt vad som gäller",
    summary: "Alla känner sig hörda. Alla tycker om dig. Samsyn har fortfarande tre beställare, men nu tre beställare som känner sig sedda.",
    cost: "Kostnaden är beslut som aldrig tas. Trygghet utan riktning blir efter ett tag sin egen sorts otrygghet: ingen vet vad som händer, men alla har fått prata om det.",
    research: "Rollotydlighet är en av de mest belagda källorna till arbetsrelaterad stress, från Kahn 1964 till dagens metaanalyser. Att bli lyssnad på kompenserar inte för att inte veta vad som gäller.",
    reading: "Läs vidare: Kim Scott, Radical Candor (St. Martin's Press 2017), särskilt kapitlet om ruinous empathy.",
  },
  kaptenen: {
    name: "KAPTENEN",
    title: "Tydligt vad som gäller, otryggt att säga emot",
    summary: "Beslut tas. Snabbt. Samsyn har en beställare och ett filnamn. Göran har hörlurarna på, och Mira vidarebefordrar inte längre.",
    cost: "Kostnaden är information. När det inte lönar sig att säga obekväma saker slutar folk göra det, och du får veta om problemen sist, i stället för först.",
    research: "När Edmondson studerade vårdavdelningar 1996 hade de med bäst ledarskap och relationer flest rapporterade medicineringsfel, inte färst. Inte för att de gjorde fler, utan för att de vågade säga det.",
    reading: "Läs vidare: Amy C. Edmondson, Strategies for Learning from Failure, Harvard Business Review, april 2011.",
  },
  motesbokaren: {
    name: "MÖTESBOKAREN",
    title: "Otydligt vad som gäller, otryggt att säga emot",
    summary: "Du har bokat ett möte. Nadja har gjort en agenda. Göran kommer inte. Samsyn har tre beställare och ett nyhetsbrev som säger att allt går bra.",
    cost: "Kostnaden är att organisationen fortsätter exakt som förut, fast med en ny person att vara besviken på. Det är den vanligaste första dagen som chef.",
    research: "Passivt ledarskap är inte noll ledarskap. I en norsk studie med 2 273 anställda hängde låt gå-ledarskap ihop med mer rollkonflikt, rollotydlighet och mobbning på jobbet.",
    reading: "Läs vidare: Skogstad m.fl., The Destructiveness of Laissez-Faire Leadership Behavior, Journal of Occupational Health Psychology 12(1), 2007.",
  },
};

export function evaluate(state: StoryState): { archetype: Archetype; delaktighet: string } {
  const { tydlighet, trygghet, delaktighet } = state.scores;
  const clear = tydlighet >= 2;
  const safe = trygghet >= 2;
  const archetype = clear && safe ? archetypes.dirigenten : safe ? archetypes.diplomaten : clear ? archetypes.kaptenen : archetypes.motesbokaren;
  const involvement = delaktighet >= 2
    ? "Du frågar innan du bestämmer."
    : delaktighet <= -1
      ? "Du bestämmer innan du frågar."
      : "Du frågar ibland. Ingen vet riktigt när.";
  return { archetype, delaktighet: involvement };
}

export function createState(): StoryState {
  return { scores: { tydlighet: 0, trygghet: 0, delaktighet: 0 }, tags: new Set() };
}

export function openerFor(dilemma: Dilemma, state: StoryState): string {
  return dilemma.openerIf?.find(([tag]) => state.tags.has(tag))?.[1] ?? dilemma.opener;
}

export function applyChoice(state: StoryState, choice: Choice): void {
  state.tags.add(choice.tag);
  for (const [axis, delta] of Object.entries(choice.effects) as [Axis, number][]) state.scores[axis] += delta;
}
