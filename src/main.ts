import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/600.css";
import Phaser from "phaser";
import "./style.css";
import { dialogues, type DialogueChoice, type DialogueId } from "./data/dialogues";
import { OfficeScene } from "./game/OfficeScene";

type AvatarId = "avatar-a" | "avatar-b";
type HotspotId = DialogueId | "printer" | "coffee" | "posters";

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
const playerName = required<HTMLInputElement>("#player-name");
const avatarButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-avatar]"));
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

let selectedAvatar: AvatarId = "avatar-a";
let activeDialogue: DialogueId | null = null;
let soundEnabled = false;
let typingTimer: number | null = null;
let toastTimer: number | null = null;
let inputLocked = false;
let sceneReady = false;
let loadFailed = false;
let activeDialogueInvoker: HTMLElement | null = null;
const selectedChoices: Record<DialogueId, Set<number>> = { liv: new Set(), nadja: new Set() };
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

avatarButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedAvatar = button.dataset.avatar as AvatarId;
    avatarButtons.forEach((candidate) => {
      const selected = candidate === button;
      candidate.classList.toggle("is-selected", selected);
      candidate.setAttribute("aria-pressed", String(selected));
    });
    playTone(240, 0.035);
  });
});

startButton.addEventListener("click", () => {
  if (loadFailed) {
    window.location.reload();
    return;
  }
  if (!sceneReady) return;
  const name = playerName.value.trim() || "Alex";
  playerName.value = name;
  playerLabel.textContent = `${name.toLocaleUpperCase("sv-SE")} / NY CHEF`;
  playerLabel.hidden = false;
  intro.classList.add("is-leaving");
  window.setTimeout(() => {
    intro.hidden = true;
    hotspotNav.hidden = false;
    sceneSummary.hidden = false;
    game.events.emit("prototype:start", selectedAvatar, name);
    sceneSummary.focus({ preventScroll: true });
  }, reducedMotion ? 0 : 320);
  playTone(390, 0.075);
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.setAttribute("aria-label", soundEnabled ? "Stäng av ljud" : "Slå på ljud");
  soundIcon.textContent = soundEnabled ? "LJUD PÅ" : "LJUD AV";
  if (soundEnabled) playTone(520, 0.08);
});

game.events.on("dialogue:open", (id: DialogueId) => openDialogue(id));
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
  if (document.activeElement instanceof HTMLInputElement) return;
  if (dialogue.hidden || !activeDialogue) return;

  if (["1", "2", "3"].includes(event.key)) {
    const button = choices.querySelectorAll<HTMLButtonElement>("button")[Number(event.key) - 1];
    button?.click();
  }
  if (event.key === "Escape" || event.key === " ") {
    event.preventDefault();
    if (!dialogueClose.hidden) closeDialogue();
  }
});

function openDialogue(id: DialogueId): void {
  activeDialogue = id;
  activeDialogueInvoker = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : hotspotControls.find((button) => button.dataset.hotspot === id) ?? null;
  const data = dialogues[id];
  speakerName.textContent = data.speaker;
  speakerPortrait.className = `dialogue__portrait ${data.portraitClass}`;
  dialogue.hidden = false;
  dialogueClose.hidden = true;
  soundToggle.disabled = true;
  hotspotControls.forEach((button) => { button.disabled = true; });
  choices.replaceChildren();
  inputLocked = true;
  playTone(id === "liv" ? 310 : 440, 0.045);

  typeText(data.opener, () => {
    data.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dialogue-choice";
      button.classList.toggle("was-chosen", selectedChoices[id].has(index));
      button.innerHTML = `<span aria-hidden="true">▶</span><b>${index + 1}</b>${choice.prompt}`;
      button.addEventListener("click", () => selectChoice(id, choice, index));
      choices.append(button);
    });
    window.setTimeout(() => {
      inputLocked = false;
      choices.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    }, 220);
  });
}

function selectChoice(id: DialogueId, choice: DialogueChoice, index: number): void {
  if (inputLocked) return;
  inputLocked = true;
  selectedChoices[id].add(index);
  choices.querySelectorAll("button").forEach((button) => button.setAttribute("disabled", ""));
  game.events.emit("dialogue:reaction", choice);
  playTone(370 + index * 45, 0.035);

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
  activeDialogue = null;
  choices.replaceChildren();
  speakerLine.textContent = "";
  speakerAnnouncement.textContent = "";
  soundToggle.disabled = false;
  hotspotControls.forEach((button) => { button.disabled = false; });
  game.events.emit("dialogue:closed");
  playTone(260, 0.03);
  activeDialogueInvoker?.focus({ preventScroll: true });
  activeDialogueInvoker = null;
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
  playTone(190, 0.055);
  toastTimer = window.setTimeout(() => {
    hint.classList.remove("is-visible", "is-object");
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

function playTone(frequency: number, duration: number): void {
  if (!soundEnabled) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.025, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
  oscillator.addEventListener("ended", () => void context.close());
}
