import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/600.css";
import Phaser from "phaser";
import "./style.css";
import { applyChoice, createState, dilemmas, evaluate, openerFor, speakers, type Axis, type Choice, type SpeakerId } from "./data/story";
import { OfficeScene, type HotspotId } from "./game/OfficeScene";

type Cue = "click" | "open" | "close" | "confirm" | "look";

const required = <T extends Element>(selector: string): T => {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Saknat gränssnittselement: ${selector}`);
  return element;
};

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#111522",
  antialias: false,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [OfficeScene],
});

const intro = required<HTMLElement>("#intro");
const startButton = required<HTMLButtonElement>("#start-button");
const dialogue = required<HTMLElement>("#dialogue");
const speakerName = required<HTMLElement>("#speaker-name");
const speakerLine = required<HTMLElement>("#speaker-line");
const speakerAnnouncement = required<HTMLElement>("#speaker-announcement");
const speakerPortrait = required<HTMLElement>("#speaker-portrait");
const choices = required<HTMLElement>("#dialogue-choices");
const dialogueClose = required<HTMLButtonElement>("#dialogue-close");
const hint = required<HTMLElement>("#hint");
const tooltip = required<HTMLElement>("#tooltip");
const soundToggle = required<HTMLButtonElement>("#sound-toggle");
const soundIcon = required<HTMLElement>(".sound-icon");
const playerLabel = required<HTMLElement>("#player-label");
const loadStatus = required<HTMLElement>("#load-status");
const sceneSummary = required<HTMLElement>("#scene-summary");
const hotspotNav = required<HTMLElement>("#hotspot-controls");
const hotspotControls = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-hotspot]"));
const result = required<HTMLElement>("#result");

const state = createState();
let step = 0;
let soundEnabled = false;
let typingTimer: number | null = null;
let toastTimer: number | null = null;
let inputLocked = false;
let sceneReady = false;
let loadFailed = false;
let activeDialogueInvoker: HTMLElement | null = null;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const BASE = import.meta.env.BASE_URL;

// Colleagues who are not the current dilemma still answer, briefly.
const asides: Record<SpeakerId, string> = {
  liv: "Liv · 'Jag är mitt i en fil. Kom tillbaka när det är dags.'",
  nadja: "Nadja · 'Älskar energin! Jag har ett möte, men vi hörs!'",
  goran: "Göran · Hörlurarna är på. Han nickar. Det är ett helt samtal.",
  mira: "Mira · 'Jag svarar på mejl. Om dig. Vi tar det sen.'",
};

startButton.addEventListener("click", () => {
  if (loadFailed) {
    window.location.reload();
    return;
  }
  if (!sceneReady) return;
  playerLabel.hidden = false;
  intro.classList.add("is-leaving");
  window.setTimeout(() => {
    intro.hidden = true;
    hotspotNav.hidden = false;
    sceneSummary.hidden = false;
    game.events.emit("prototype:start");
    sceneSummary.focus({ preventScroll: true });
    guideToCurrent();
  }, reducedMotion ? 0 : 320);
  playCue("confirm");
});

required<HTMLButtonElement>("#restart-button").addEventListener("click", () => window.location.reload());

let shareText = "";
const shareButton = required<HTMLButtonElement>("#share-button");
shareButton.addEventListener("click", async () => {
  // Native share sheet where it exists (phones), clipboard everywhere else.
  try {
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) await navigator.share({ text: shareText });
    else {
      await navigator.clipboard.writeText(shareText);
      shareButton.textContent = "KOPIERAT";
      window.setTimeout(() => { shareButton.innerHTML = 'DELA RESULTAT <span aria-hidden="true">⇪</span>'; }, 2000);
    }
    playCue("confirm");
  } catch {
    // User dismissed the sheet or denied clipboard; nothing to recover.
  }
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.setAttribute("aria-label", soundEnabled ? "Stäng av ljud" : "Slå på ljud");
  soundIcon.textContent = soundEnabled ? "LJUD PÅ" : "LJUD AV";
  setAmbience(soundEnabled);
  playCue("click");
});

game.events.on("colleague:click", (id: SpeakerId) => {
  if (dilemmas[step]?.speaker === id) openDilemma();
  else showToast(asides[id]);
});
game.events.once("prototype:ready", () => {
  sceneReady = true;
  startButton.disabled = false;
  startButton.innerHTML = 'STÄMPLA IN <span aria-hidden="true">→</span>';
  loadStatus.textContent = "En liten prototyp från ORG / UTVECKLING";
});
game.events.once("prototype:error", () => {
  loadFailed = true;
  startButton.disabled = false;
  startButton.textContent = "FÖRSÖK IGEN";
  loadStatus.textContent = "Kontoret gick inte att låsa upp. Försök igen.";
});
game.events.on("tooltip:show", (label: string, x: number, y: number) => showTooltip(label, x, y));
game.events.on("tooltip:move", (x: number, y: number) => positionTooltip(x, y));
game.events.on("tooltip:hide", hideTooltip);
game.events.on("toast:show", showToast);
game.events.on("hint:show", showHint);
game.events.on("hint:dismiss", dismissHint);

hotspotControls.forEach((button) => {
  button.addEventListener("click", () => game.events.emit("hotspot:activate", button.dataset.hotspot as HotspotId));
  button.addEventListener("focus", () => showHint(button.textContent ?? "Interagera"));
});

dialogueClose.addEventListener("click", closeDialogue);

window.addEventListener("keydown", (event) => {
  if (dialogue.hidden) return;
  if (["1", "2", "3"].includes(event.key)) {
    const button = choices.querySelectorAll<HTMLButtonElement>("button")[Number(event.key) - 1];
    button?.click();
  }
  if (event.key === "Escape" || event.key === " ") {
    event.preventDefault();
    if (!dialogueClose.hidden) closeDialogue();
  }
});

function guideToCurrent(): void {
  const dilemma = dilemmas[step];
  game.events.emit("guide:hotspot", dilemma.speaker);
  showHint(`${dilemma.stamp} · Prata med ${capitalize(speakers[dilemma.speaker])}.`);
}

function openDilemma(): void {
  const dilemma = dilemmas[step];
  activeDialogueInvoker = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : hotspotControls.find((button) => button.dataset.hotspot === dilemma.speaker) ?? null;
  game.events.emit("dialogue:start", dilemma.speaker);
  speakerName.textContent = speakers[dilemma.speaker];
  speakerPortrait.style.setProperty("--portrait", `url(${BASE}assets/portrait-${dilemma.speaker}.png)`);
  dialogue.hidden = false;
  dialogueClose.hidden = true;
  soundToggle.disabled = true;
  hotspotControls.forEach((button) => { button.disabled = true; });
  choices.replaceChildren();
  inputLocked = true;
  playCue("open");

  typeText(openerFor(dilemma, state), () => {
    dilemma.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dialogue-choice";
      button.innerHTML = `<span aria-hidden="true">▶</span><b>${index + 1}</b>${choice.prompt}`;
      button.addEventListener("click", () => selectChoice(choice));
      choices.append(button);
    });
    window.setTimeout(() => {
      inputLocked = false;
      choices.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    }, 220);
  });
}

function selectChoice(choice: Choice): void {
  if (inputLocked) return;
  inputLocked = true;
  applyChoice(state, choice);
  choices.querySelectorAll("button").forEach((button) => button.setAttribute("disabled", ""));
  playCue("confirm");

  window.setTimeout(() => {
    choices.replaceChildren();
    typeText(choice.response, () => {
      dialogueClose.hidden = false;
      dialogueClose.focus({ preventScroll: true });
      inputLocked = false;
    });
  }, reducedMotion ? 0 : 320);
}

function closeDialogue(): void {
  if (inputLocked || dialogue.hidden) return;
  clearTyping();
  dialogue.hidden = true;
  choices.replaceChildren();
  speakerLine.textContent = "";
  speakerAnnouncement.textContent = "";
  soundToggle.disabled = false;
  hotspotControls.forEach((button) => { button.disabled = false; });
  game.events.emit("dialogue:closed");
  playCue("close");
  activeDialogueInvoker?.focus({ preventScroll: true });
  activeDialogueInvoker = null;
  step += 1;
  if (step < dilemmas.length) guideToCurrent();
  else window.setTimeout(showResult, reducedMotion ? 0 : 700);
}

function showResult(): void {
  const { archetype, delaktighet } = evaluate(state);
  required<HTMLElement>("#result-name").textContent = archetype.name;
  required<HTMLElement>("#result-title").textContent = `${archetype.title}. ${delaktighet}`;
  required<HTMLElement>("#result-summary").textContent = archetype.summary;
  required<HTMLElement>("#result-cost").textContent = archetype.cost;
  required<HTMLElement>("#result-research").textContent = archetype.research;
  required<HTMLElement>("#result-reading").textContent = archetype.reading;
  shareText = `Jag blev ${capitalize(archetype.name)} på Kontoret, ett litet spel om första dagen som chef. ${archetype.title}. Vem blir du? ${window.location.origin}${BASE}`;
  const scores = required<HTMLElement>("#result-scores");
  scores.replaceChildren();
  (["tydlighet", "trygghet", "delaktighet"] as Axis[]).forEach((axis) => {
    const li = document.createElement("li");
    const bar = document.createElement("i");
    // Scores run roughly -3..+5 over five dilemmas; map to a 0..100 % fill.
    bar.style.setProperty("--fill", `${Math.round(((state.scores[axis] + 3) / 8) * 100)}%`);
    li.append(axis, bar);
    scores.append(li);
  });
  hotspotNav.hidden = true;
  dismissHint();
  result.hidden = false;
  required<HTMLElement>("#result-name").focus({ preventScroll: true });
  playCue("open");
}

function typeText(text: string, done: () => void): void {
  clearTyping();
  speakerLine.textContent = "";
  speakerAnnouncement.textContent = "";
  if (reducedMotion) {
    speakerLine.textContent = text;
    speakerAnnouncement.textContent = text;
    done();
    return;
  }
  let index = 0;
  typingTimer = window.setInterval(() => {
    speakerLine.textContent = text.slice(0, index + 1);
    index += 1;
    if (index >= text.length) {
      clearTyping();
      speakerAnnouncement.textContent = text;
      done();
    }
  }, 19);
}

dialogue.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const focusable = Array.from(dialogue.querySelectorAll<HTMLButtonElement>("button:not([hidden]):not([disabled])"));
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

function clearTyping(): void {
  if (typingTimer !== null) window.clearInterval(typingTimer);
  typingTimer = null;
}

function capitalize(name: string): string {
  return name.charAt(0) + name.slice(1).toLocaleLowerCase("sv-SE");
}

function showHint(text: string): void {
  hint.textContent = text;
  hint.classList.add("is-visible");
}

function dismissHint(): void {
  hint.classList.remove("is-visible");
}

function showToast(text: string): void {
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  hint.textContent = text;
  hint.classList.add("is-visible", "is-object");
  playCue("look");
  toastTimer = window.setTimeout(() => {
    hint.classList.remove("is-visible", "is-object");
    if (!dialogue.hidden || step >= dilemmas.length) return;
    guideToCurrent();
  }, 3400);
}

function showTooltip(label: string, x: number, y: number): void {
  tooltip.textContent = label;
  tooltip.classList.add("is-visible");
  positionTooltip(x, y);
}

function positionTooltip(x: number, y: number): void {
  tooltip.style.setProperty("--tooltip-x", `${x}px`);
  tooltip.style.setProperty("--tooltip-y", `${y}px`);
}

function hideTooltip(): void {
  tooltip.classList.remove("is-visible");
}

const ambience = new Audio(`${BASE}assets/audio/office-ambience.mp3`);
ambience.loop = true;
ambience.volume = 0.45;
ambience.preload = "auto";

function playCue(name: Cue): void {
  if (!soundEnabled) return;
  const cue = new Audio(`${BASE}assets/audio/${name}.ogg`);
  cue.volume = 0.6;
  void cue.play().catch(() => undefined);
}

function setAmbience(on: boolean): void {
  if (on) void ambience.play().catch(() => undefined);
  else ambience.pause();
}
