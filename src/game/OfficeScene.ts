import type { SpeakerId } from "../data/story";

const WORLD_WIDTH = 1672;
const WORLD_HEIGHT = 941;
const PAN_MS = 520;

export type HotspotId = SpeakerId | "clock" | "coffee" | "posters";

interface HotspotSpec {
  id: HotspotId;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  action: () => void;
}

// ponytail: 12-line emitter instead of Phaser's EventEmitter; main.ts keeps the same on/once/emit calls.
type Handler = (...args: any[]) => void;
export class Bus {
  private handlers = new Map<string, Set<Handler>>();
  on(name: string, fn: Handler): void {
    if (!this.handlers.has(name)) this.handlers.set(name, new Set());
    this.handlers.get(name)!.add(fn);
  }
  once(name: string, fn: Handler): void {
    const wrapped: Handler = (...args) => { this.off(name, wrapped); fn(...args); };
    this.on(name, wrapped);
  }
  off(name: string, fn: Handler): void {
    this.handlers.get(name)?.delete(fn);
  }
  emit(name: string, ...args: unknown[]): void {
    this.handlers.get(name)?.forEach((fn) => fn(...args));
  }
}

// The scene is one image, seven hotspots and a camera. The camera is a CSS transform on #world;
// colleagues are baked into the tableau, so hotspots and framing are the only staging left in code.
export class OfficeScene {
  private world = document.createElement("div");
  private focusRing = document.createElement("i");
  private guideRing = document.createElement("i");
  private specs = new Map<HotspotId, HotspotSpec>();
  private started = false;
  private dialogueOpen = false;
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  private baseZoom = 1;
  private zoom = 1;
  private tx = 0;
  private ty = 0;
  private drag: { x: number; y: number; moved: boolean } | null = null;
  private lookTimer: number | null = null;

  constructor(private root: HTMLElement, private bus: Bus, base: string) {
    this.world.className = "world";
    const img = new Image();
    img.src = `${base}assets/office-tableau.webp`;
    img.alt = "";
    img.decoding = "async";
    img.addEventListener("error", () => bus.emit("prototype:error"));
    this.world.append(img);

    for (const cls of ["glow glow--window", "glow glow--monitor", "glow glow--coffee"]) {
      const glow = document.createElement("i");
      glow.className = cls;
      this.world.append(glow);
    }
    this.focusRing.className = "ring ring--focus";
    this.guideRing.className = "ring ring--guide";
    this.world.append(this.focusRing, this.guideRing);

    this.createHotspots();
    root.append(this.world);

    root.addEventListener("pointerdown", (event) => {
      if (!this.started || this.dialogueOpen) return;
      // No pointer capture: it would retarget pointerup away from the hotspot under the finger.
      this.drag = { x: event.clientX, y: event.clientY, moved: false };
    });
    // Portrait crops the room, so a drag pans it. Taps stay taps via the moved flag.
    root.addEventListener("pointermove", (event) => {
      if (!this.drag) return;
      const dx = event.clientX - this.drag.x;
      const dy = event.clientY - this.drag.y;
      if (!this.drag.moved && Math.hypot(dx, dy) < 12) return;
      this.drag.moved = true;
      this.world.classList.add("is-dragging");
      this.drag = { x: event.clientX, y: event.clientY, moved: true };
      this.applyCamera(this.tx + dx, this.ty + dy, this.zoom);
    });
    const endDrag = () => {
      this.drag = null;
      this.world.classList.remove("is-dragging");
    };
    root.addEventListener("pointerup", endDrag);
    root.addEventListener("pointercancel", endDrag);

    window.addEventListener("resize", () => this.configureCamera());
    this.configureCamera();

    bus.on("prototype:start", () => { this.started = true; });
    bus.on("dialogue:start", (id: SpeakerId) => this.startDialogue(id));
    bus.on("dialogue:closed", () => this.onDialogueClosed());
    bus.on("guide:hotspot", (id: SpeakerId) => this.guide(id));
    bus.on("hotspot:activate", (id: HotspotId) => this.activateHotspot(id));

    img.decode().then(() => bus.emit("prototype:ready"), () => bus.emit("prototype:error"));
  }

  private createHotspots(): void {
    const colleague = (id: SpeakerId) => () => this.bus.emit("colleague:click", id);
    const specs: HotspotSpec[] = [
      { id: "liv", label: "Prata med Liv", x: 1020, y: 455, width: 190, height: 320, action: colleague("liv") },
      { id: "nadja", label: "Prata med Nadja", x: 1425, y: 335, width: 210, height: 350, action: colleague("nadja") },
      { id: "goran", label: "Prata med Göran", x: 215, y: 445, width: 190, height: 320, action: colleague("goran") },
      { id: "mira", label: "Prata med Mira", x: 305, y: 275, width: 110, height: 150, action: colleague("mira") },
      { id: "clock", label: "Titta på klockan", x: 597, y: 97, width: 90, height: 90, action: () => this.lookAt("clock", "Klockan · Visar 08:03. Ingen minns när den senast gick.") },
      { id: "coffee", label: "Titta på kaffemaskinen", x: 1570, y: 300, width: 115, height: 235, action: () => this.lookAt("coffee", "Kaffemaskinen · Kontorets mest tillförlitliga stödfunktion. Fram till idag.") },
      { id: "posters", label: "Titta på affischerna", x: 1218, y: 140, width: 340, height: 250, action: () => this.lookAt("posters", "Affischerna · Sex riktningar. Ett kontor. Ingen karta.") },
    ];

    specs.forEach((spec) => {
      this.specs.set(spec.id, spec);
      const zone = document.createElement("i");
      zone.className = "hotspot";
      place(zone, spec, 0);
      zone.addEventListener("pointerenter", (event) => {
        if (!this.started) return;
        this.showFocus(spec);
        this.bus.emit("tooltip:show", spec.label, event.clientX, event.clientY);
      });
      zone.addEventListener("pointermove", (event) => this.bus.emit("tooltip:move", event.clientX, event.clientY));
      zone.addEventListener("pointerleave", () => {
        this.focusRing.classList.remove("is-visible");
        this.bus.emit("tooltip:hide");
      });
      zone.addEventListener("pointerup", () => {
        if (this.started && !this.dialogueOpen && !this.drag?.moved) spec.action();
      });
      this.world.append(zone);
    });
  }

  private showFocus(spec: HotspotSpec): void {
    if (this.dialogueOpen) return;
    place(this.focusRing, spec, 6);
    this.focusRing.classList.add("is-visible");
  }

  private guide(id: SpeakerId): void {
    const spec = this.specs.get(id)!;
    place(this.guideRing, spec, 12);
    this.guideRing.classList.add("is-visible");
    this.frameOn(spec.x, spec.y, 1);
  }

  private startDialogue(id: SpeakerId): void {
    const spec = this.specs.get(id)!;
    this.dialogueOpen = true;
    this.focusRing.classList.remove("is-visible");
    this.guideRing.classList.remove("is-visible");
    this.bus.emit("tooltip:hide");
    this.bus.emit("hint:dismiss");
    this.frameOn(spec.x, spec.y + 80, 1.35);
  }

  private lookAt(id: HotspotId, text: string): void {
    const spec = this.specs.get(id)!;
    this.bus.emit("tooltip:hide");
    this.bus.emit("hint:dismiss");
    this.frameOn(spec.x, spec.y, 1.2);
    this.bus.emit("toast:show", text);
    if (this.lookTimer !== null) window.clearTimeout(this.lookTimer);
    this.lookTimer = window.setTimeout(() => {
      if (!this.dialogueOpen) this.frameOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 1);
    }, 3400);
  }

  private activateHotspot(id: HotspotId): void {
    if (this.started && !this.dialogueOpen) this.specs.get(id)?.action();
  }

  private onDialogueClosed(): void {
    this.dialogueOpen = false;
    this.frameOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 1);
  }

  // Centre world point (x, y) in the viewport at baseZoom × zoomFactor, clamped to the room.
  private frameOn(x: number, y: number, zoomFactor: number): void {
    const zoom = this.baseZoom * zoomFactor;
    this.applyCamera(this.root.clientWidth / 2 - x * zoom, this.root.clientHeight / 2 - y * zoom, zoom);
  }

  private applyCamera(tx: number, ty: number, zoom: number): void {
    const clamp = (value: number, viewport: number, world: number) =>
      world <= viewport ? (viewport - world) / 2 : Math.min(0, Math.max(viewport - world, value));
    this.zoom = zoom;
    this.tx = clamp(tx, this.root.clientWidth, WORLD_WIDTH * zoom);
    this.ty = clamp(ty, this.root.clientHeight, WORLD_HEIGHT * zoom);
    this.world.style.transitionDuration = this.reducedMotion || this.drag?.moved ? "0ms" : `${PAN_MS}ms`;
    this.world.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.zoom})`;
  }

  private configureCamera(): void {
    const width = this.root.clientWidth;
    const height = this.root.clientHeight;
    const portrait = width / height < WORLD_WIDTH / WORLD_HEIGHT - 0.04;
    // Portrait: fill height and let pans reveal the sides. Landscape: fit the whole room.
    this.baseZoom = portrait ? height / WORLD_HEIGHT : Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    this.frameOn(portrait ? 1000 : WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 1);
  }
}

// Specs are centre-anchored (Phaser zone convention); the DOM wants top-left.
function place(el: HTMLElement, spec: HotspotSpec, pad: number): void {
  el.style.left = `${spec.x - spec.width / 2 - pad}px`;
  el.style.top = `${spec.y - spec.height / 2 - pad}px`;
  el.style.width = `${spec.width + pad * 2}px`;
  el.style.height = `${spec.height + pad * 2}px`;
}
