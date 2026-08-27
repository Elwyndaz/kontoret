import Phaser from "phaser";
import type { SpeakerId } from "../data/story";

const WORLD_WIDTH = 1672;
const WORLD_HEIGHT = 941;

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

// Colleagues are baked into the tableau; hotspots and camera framing are the only staging left in code.
export class OfficeScene extends Phaser.Scene {
  private coffeeGlow?: Phaser.GameObjects.Rectangle;
  private focusRing?: Phaser.GameObjects.Rectangle;
  private guideRing?: Phaser.GameObjects.Rectangle;
  private guideTween?: Phaser.Tweens.Tween;
  private started = false;
  private dialogueOpen = false;
  private reducedMotion = false;
  private baseZoom = 1;
  private hotspots = new Map<HotspotId, Phaser.GameObjects.Zone>();

  constructor() {
    super("office");
  }

  preload(): void {
    this.load.once("loaderror", () => this.game.events.emit("prototype:error"));
    this.load.image("office", "assets/office-tableau.png");
  }

  create(): void {
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.cameras.main.setBackgroundColor("#111522");
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.add.image(0, 0, "office").setOrigin(0).setDepth(0);
    this.createAmbientOffice();
    this.createHotspots();

    this.scale.on("resize", this.configureCamera, this);
    this.configureCamera();

    const handlers: Array<[string, (...args: never[]) => void]> = [
      ["prototype:start", this.startOffice],
      ["dialogue:start", this.startDialogue],
      ["dialogue:closed", this.onDialogueClosed],
      ["guide:hotspot", this.guide],
      ["hotspot:activate", this.activateHotspot],
    ];
    handlers.forEach(([name, fn]) => this.game.events.on(name, fn, this));
    this.time.delayedCall(0, () => this.game.events.emit("prototype:ready"));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      handlers.forEach(([name, fn]) => this.game.events.off(name, fn, this));
    });
  }

  private createAmbientOffice(): void {
    const monitorGlow = this.add.rectangle(1165, 372, 110, 80, 0x79d5d0, 0.05).setDepth(2);
    const windowLight = this.add.rectangle(330, 190, 640, 340, 0x9ed8dc, 0.025).setDepth(1);
    this.coffeeGlow = this.add.rectangle(1552, 295, 12, 8, 0xe7a84a, 0.55).setDepth(3);
    this.focusRing = this.add.rectangle(0, 0, 10, 10).setStrokeStyle(3, 0xe7a84a, 0.9).setDepth(60).setVisible(false);
    this.guideRing = this.add.rectangle(0, 0, 10, 10).setStrokeStyle(3, 0x79d5d0, 0.8).setDepth(59).setVisible(false);

    if (!this.reducedMotion) {
      this.tweens.add({ targets: monitorGlow, alpha: { from: 0.025, to: 0.1 }, duration: 1250, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.tweens.add({ targets: windowLight, alpha: { from: 0.015, to: 0.045 }, duration: 4200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.time.addEvent({
        delay: 5800,
        loop: true,
        callback: () => {
          this.tweens.add({ targets: this.coffeeGlow, alpha: 0.1, duration: 90, yoyo: true, repeat: 2 });
        },
      });
    }
  }

  private createHotspots(): void {
    const colleague = (id: SpeakerId) => () => this.game.events.emit("colleague:click", id);
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
      const zone = this.add.zone(spec.x, spec.y, spec.width, spec.height).setDepth(70).setInteractive({ useHandCursor: true });
      zone.setData("spec", spec);
      zone.on("pointerover", (pointer: Phaser.Input.Pointer) => {
        this.showFocus(spec);
        this.game.events.emit("tooltip:show", spec.label, pointer.x, pointer.y);
      });
      zone.on("pointermove", (pointer: Phaser.Input.Pointer) => this.game.events.emit("tooltip:move", pointer.x, pointer.y));
      zone.on("pointerout", () => {
        this.focusRing?.setVisible(false);
        this.game.events.emit("tooltip:hide");
      });
      zone.on("pointerup", (pointer: Phaser.Input.Pointer) => {
        if (this.started && !this.dialogueOpen && pointer.getDistance() < 12) spec.action();
      });
      this.hotspots.set(spec.id, zone);
    });

    // Portrait crops the room, so a drag pans it. Taps stay taps via the distance check above.
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || !this.started || this.dialogueOpen) return;
      const camera = this.cameras.main;
      camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom;
      camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom;
    });
  }

  private spec(id: HotspotId): HotspotSpec {
    return this.hotspots.get(id)?.getData("spec") as HotspotSpec;
  }

  private showFocus(spec: HotspotSpec): void {
    if (!this.focusRing || this.dialogueOpen) return;
    this.focusRing.setPosition(spec.x, spec.y).setSize(spec.width + 12, spec.height + 12).setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.focusRing, alpha: 1, duration: this.reducedMotion ? 0 : 120 });
  }

  private guide(id: SpeakerId): void {
    const spec = this.spec(id);
    if (!this.guideRing) return;
    this.guideTween?.stop();
    this.guideRing.setPosition(spec.x, spec.y).setSize(spec.width + 24, spec.height + 24).setVisible(true).setAlpha(0.8);
    if (!this.reducedMotion) {
      this.guideTween = this.tweens.add({ targets: this.guideRing, alpha: { from: 0.25, to: 0.9 }, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    this.frameOn(spec.x, spec.y, 1);
  }

  private startOffice(): void {
    this.started = true;
  }

  private startDialogue(id: SpeakerId): void {
    const spec = this.spec(id);
    this.dialogueOpen = true;
    this.focusRing?.setVisible(false);
    this.guideRing?.setVisible(false);
    this.guideTween?.stop();
    this.game.events.emit("tooltip:hide");
    this.game.events.emit("hint:dismiss");
    this.frameOn(spec.x, spec.y + 80, 1.35);
  }

  private lookAt(id: HotspotId, text: string): void {
    const spec = this.spec(id);
    this.game.events.emit("tooltip:hide");
    this.game.events.emit("hint:dismiss");
    this.frameOn(spec.x, spec.y, 1.2);
    this.game.events.emit("toast:show", text);
    this.time.delayedCall(3400, () => {
      if (!this.dialogueOpen) this.frameOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 1);
    });
  }

  private frameOn(x: number, y: number, zoomFactor: number): void {
    const camera = this.cameras.main;
    if (this.reducedMotion) {
      // pan/zoomTo with duration 0 never apply, so set the camera directly.
      camera.setZoom(this.baseZoom * zoomFactor);
      camera.centerOn(x, y);
      return;
    }
    camera.pan(x, y, 520, "Sine.easeInOut", true);
    camera.zoomTo(this.baseZoom * zoomFactor, 520, "Sine.easeInOut", true);
  }

  private activateHotspot(id: HotspotId): void {
    if (this.started && !this.dialogueOpen) this.spec(id)?.action();
  }

  private onDialogueClosed(): void {
    this.dialogueOpen = false;
    this.frameOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 1);
  }

  private configureCamera(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const camera = this.cameras.main;
    const portrait = width / height < WORLD_WIDTH / WORLD_HEIGHT - 0.04;
    // Portrait: fill height and let pans reveal the sides. Landscape: fit the whole room.
    this.baseZoom = portrait ? height / WORLD_HEIGHT : Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    camera.setZoom(this.baseZoom);
    camera.centerOn(portrait ? 1000 : WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  }
}
