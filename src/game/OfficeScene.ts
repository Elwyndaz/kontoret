import Phaser from "phaser";
import type { DialogueId, DialogueChoice } from "../data/dialogues";

const WORLD_WIDTH = 1672;
const WORLD_HEIGHT = 941;
const WALK_MIN_X = 430;
const WALK_MAX_X = 1510;
const WALK_MIN_Y = 630;
const WALK_MAX_Y = 815;

type AvatarId = "avatar-a" | "avatar-b";
type HotspotId = DialogueId | "printer" | "coffee" | "posters";

interface HotspotSpec {
  id: HotspotId;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  action: () => void;
}

export class OfficeScene extends Phaser.Scene {
  private manager?: Phaser.GameObjects.Image;
  private managerShadow?: Phaser.GameObjects.Ellipse;
  private liv?: Phaser.GameObjects.Image;
  private nadja?: Phaser.GameObjects.Image;
  private coffeeGlow?: Phaser.GameObjects.Rectangle;
  private lightsFlash?: Phaser.GameObjects.Rectangle;
  private movement?: Phaser.Tweens.Tween;
  private destinationMarker?: Phaser.GameObjects.Arc;
  private keyboard?: Record<string, Phaser.Input.Keyboard.Key>;
  private started = false;
  private dialogueOpen = false;
  private reducedMotion = false;
  private currentAvatar: AvatarId = "avatar-a";
  private hotspots = new Map<HotspotId, Phaser.GameObjects.Zone>();

  constructor() {
    super("office");
  }

  preload(): void {
    this.load.once("loaderror", () => this.game.events.emit("prototype:error"));
    this.load.image("office", "assets/office-background.png");
    this.load.image("characters", "assets/characters-atlas.png");
  }

  create(): void {
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.cameras.main.setBackgroundColor("#111522");
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.add.image(0, 0, "office").setOrigin(0).setDepth(0);
    this.installAtlasFrames();
    this.createAmbientOffice();
    this.createPeople();
    this.createForegroundOcclusion();
    this.createManager();
    this.createHotspots();
    this.createInput();

    this.scale.on("resize", this.configureCamera, this);
    this.configureCamera();

    this.game.events.on("prototype:start", this.startOffice, this);
    this.game.events.on("dialogue:closed", this.onDialogueClosed, this);
    this.game.events.on("dialogue:reaction", this.playReaction, this);
    this.game.events.on("hotspot:activate", this.activateHotspot, this);
    this.time.delayedCall(0, () => this.game.events.emit("prototype:ready"));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("prototype:start", this.startOffice, this);
      this.game.events.off("dialogue:closed", this.onDialogueClosed, this);
      this.game.events.off("dialogue:reaction", this.playReaction, this);
      this.game.events.off("hotspot:activate", this.activateHotspot, this);
    });
  }

  update(): void {
    if (!this.started || this.dialogueOpen || !this.manager || !this.keyboard) return;

    const typing = document.activeElement instanceof HTMLInputElement;
    if (typing) return;

    const speed = this.reducedMotion ? 2.6 : 3.4;
    let dx = 0;
    let dy = 0;
    if (this.keyboard.left.isDown || this.keyboard.a.isDown) dx -= speed;
    if (this.keyboard.right.isDown || this.keyboard.d.isDown) dx += speed;
    if (this.keyboard.up.isDown || this.keyboard.w.isDown) dy -= speed * 0.58;
    if (this.keyboard.down.isDown || this.keyboard.s.isDown) dy += speed * 0.58;
    if (dx === 0 && dy === 0) return;

    this.movement?.stop();
    const x = Phaser.Math.Clamp(this.manager.x + dx, WALK_MIN_X, WALK_MAX_X);
    const y = Phaser.Math.Clamp(this.manager.y + dy, WALK_MIN_Y, WALK_MAX_Y);
    this.manager.setPosition(x, y).setFlipX(dx < 0);
    this.managerShadow?.setPosition(x, y - 38);
    this.manager.setAngle(this.reducedMotion ? 0 : Math.sin(this.time.now / 75) * 0.8);
  }

  private installAtlasFrames(): void {
    const texture = this.textures.get("characters");
    const width = texture.getSourceImage().width;
    const height = texture.getSourceImage().height;
    const column = Math.floor(width / 6);
    const names = ["avatar-a", "avatar-b", "liv", "nadja", "goran", "mira"];
    names.forEach((name, index) => {
      const x = index * column;
      const frameWidth = index === names.length - 1 ? width - x : column;
      texture.add(name, 0, x, 0, frameWidth, height);
    });
  }

  private createAmbientOffice(): void {
    const monitorGlow = this.add.rectangle(1171, 368, 98, 66, 0x79d5d0, 0.05).setDepth(2);
    const windowLight = this.add.rectangle(468, 205, 780, 360, 0x9ed8dc, 0.025).setDepth(1);
    this.coffeeGlow = this.add.rectangle(1585, 320, 12, 8, 0xe7a84a, 0.55).setDepth(3);
    this.lightsFlash = this.add.rectangle(836, 470, WORLD_WIDTH, WORLD_HEIGHT, 0xf5efcf, 0).setDepth(80);

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

  private createPeople(): void {
    const goran = this.add.image(178, 601, "characters", "goran").setOrigin(0.5, 1).setScale(0.46).setDepth(8);
    const mira = this.add.image(365, 472, "characters", "mira").setOrigin(0.5, 1).setScale(0.35).setDepth(7);
    this.liv = this.add.image(1135, 617, "characters", "liv").setOrigin(0.5, 1).setScale(0.46).setDepth(8).setInteractive({ useHandCursor: true });
    this.add.ellipse(1457, 599, 76, 18, 0x10131d, 0.36).setDepth(10);
    this.nadja = this.add.image(1457, 640, "characters", "nadja").setOrigin(0.5, 1).setScale(0.44).setDepth(11).setInteractive({ useHandCursor: true });

    this.liv.on("pointerdown", () => {
      if (this.started && !this.dialogueOpen) this.approachDialogue("liv", 930, 700);
    });
    this.nadja.on("pointerdown", () => {
      if (this.started && !this.dialogueOpen) this.approachDialogue("nadja", 1320, 710);
    });

    if (!this.reducedMotion) {
      this.addTypingLoop(goran, 1180, 3.2);
      this.addTypingLoop(mira, 1460, 2.4);
      this.addTypingLoop(this.liv, 930, 2.2);
      this.tweens.add({ targets: this.nadja, angle: { from: -0.35, to: 0.5 }, duration: 1750, yoyo: true, repeat: -1, hold: 1200, ease: "Sine.easeInOut" });
    }
  }

  private addTypingLoop(target: Phaser.GameObjects.Image, duration: number, amount: number): void {
    this.tweens.add({
      targets: target,
      y: target.y - amount,
      duration,
      yoyo: true,
      repeat: -1,
      ease: "Stepped",
      easeParams: [2],
    });
  }

  private createForegroundOcclusion(): void {
    const texture = this.textures.get("office");
    texture.add("foreground-left", 0, 0, 430, 405, 225);
    texture.add("foreground-right", 0, 948, 435, 478, 245);
    this.add.image(0, 430, "office", "foreground-left").setOrigin(0).setDepth(16);
    this.add.image(948, 435, "office", "foreground-right").setOrigin(0).setDepth(16);
  }

  private createManager(): void {
    this.managerShadow = this.add.ellipse(510, 715, 70, 20, 0x10131d, 0.42).setDepth(25).setVisible(false);
    this.manager = this.add.image(510, 753, "characters", this.currentAvatar).setOrigin(0.5, 1).setScale(0.43).setDepth(26).setVisible(false);
  }

  private createHotspots(): void {
    const specs: HotspotSpec[] = [
      {
        id: "liv", label: "Prata med Liv", x: 1135, y: 426, width: 210, height: 360, anchorX: 930, anchorY: 700,
        action: () => this.approachDialogue("liv", 930, 700),
      },
      {
        id: "nadja", label: "Prata med Nadja", x: 1457, y: 420, width: 205, height: 410, anchorX: 1320, anchorY: 710,
        action: () => this.approachDialogue("nadja", 1320, 710),
      },
      {
        id: "printer", label: "Titta på skrivaren", x: 70, y: 365, width: 180, height: 230, anchorX: 470, anchorY: 690,
        action: () => this.approachToast(470, 690, "Skrivaren · Status: OFFLINE. Ingen minns en annan period."),
      },
      {
        id: "coffee", label: "Titta på kaffemaskinen", x: 1575, y: 340, width: 175, height: 270, anchorX: 1300, anchorY: 720,
        action: () => this.approachToast(1300, 720, "Kaffemaskinen · Kontorets mest tillförlitliga stödfunktion. Fram till idag."),
      },
      {
        id: "posters", label: "Titta på affischerna", x: 1160, y: 130, width: 365, height: 260, anchorX: 1180, anchorY: 690,
        action: () => this.approachToast(1180, 690, "Affischerna · Sex riktningar. Ett kontor. Ingen karta."),
      },
    ];

    specs.forEach((spec) => {
      const zone = this.add.zone(spec.x, spec.y, spec.width, spec.height).setDepth(70).setInteractive({ useHandCursor: true });
      zone.setData("spec", spec);
      zone.on("pointerover", (pointer: Phaser.Input.Pointer) => this.game.events.emit("tooltip:show", spec.label, pointer.x, pointer.y));
      zone.on("pointermove", (pointer: Phaser.Input.Pointer) => this.game.events.emit("tooltip:move", pointer.x, pointer.y));
      zone.on("pointerout", () => this.game.events.emit("tooltip:hide"));
      zone.on("pointerdown", () => {
        if (this.started && !this.dialogueOpen) spec.action();
      });
      this.hotspots.set(spec.id, zone);
    });
  }

  private createInput(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
      if (!this.started || this.dialogueOpen) return;
      if (currentlyOver.length === 0) {
        if (this.liv && this.pointerHitsVisibleSprite(pointer, this.liv)) {
          this.approachDialogue("liv", 930, 700);
          return;
        }
        if (this.nadja && this.pointerHitsVisibleSprite(pointer, this.nadja)) {
          this.approachDialogue("nadja", 1320, 710);
          return;
        }
      }
      if (currentlyOver.length > 0) return;
      const x = Phaser.Math.Clamp(pointer.worldX, WALK_MIN_X, WALK_MAX_X);
      const y = Phaser.Math.Clamp(pointer.worldY, WALK_MIN_Y, WALK_MAX_Y);
      this.moveManagerTo(x, y);
      this.game.events.emit("hint:dismiss");
      this.showDestinationMarker(x, y);
    });

    this.keyboard = this.input.keyboard?.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
    }) as Record<string, Phaser.Input.Keyboard.Key> | undefined;
  }

  private pointerHitsVisibleSprite(pointer: Phaser.Input.Pointer, sprite: Phaser.GameObjects.Image): boolean {
    const camera = this.cameras.main;
    const screenX = (sprite.x - camera.worldView.x) * camera.zoom;
    const screenBottom = (sprite.y - camera.worldView.y) * camera.zoom;
    const halfWidth = sprite.displayWidth * camera.zoom * 0.5;
    const screenTop = screenBottom - sprite.displayHeight * camera.zoom;
    return pointer.x >= screenX - halfWidth
      && pointer.x <= screenX + halfWidth
      && pointer.y >= screenTop
      && pointer.y <= screenBottom;
  }

  private startOffice(avatar: AvatarId): void {
    if (!this.manager || !this.managerShadow) return;
    const mobile = this.scale.width / this.scale.height < 0.9;
    const entryX = mobile ? 820 : 430;
    const destinationX = mobile ? 950 : 545;
    this.currentAvatar = avatar;
    this.manager.setFrame(avatar).setVisible(true).setAlpha(0).setPosition(entryX, 730);
    this.managerShadow.setVisible(true).setAlpha(0).setPosition(entryX, 692);
    this.started = true;
    this.tweens.add({ targets: [this.manager, this.managerShadow], alpha: 1, duration: this.reducedMotion ? 0 : 300 });
    this.moveManagerTo(destinationX, 735, () => this.game.events.emit("hint:show", "Klicka på golvet för att gå."));
  }

  private moveManagerTo(x: number, y: number, onComplete?: () => void): void {
    if (!this.manager || !this.managerShadow) return;
    this.movement?.stop();
    const distance = Phaser.Math.Distance.Between(this.manager.x, this.manager.y, x, y);
    const duration = this.reducedMotion ? Math.max(140, distance * 0.58) : Math.max(220, distance * 0.82);
    this.manager.setFlipX(x < this.manager.x);

    this.movement = this.tweens.add({
      targets: [this.manager, this.managerShadow],
      x,
      duration,
      ease: this.reducedMotion ? "Linear" : "Sine.easeInOut",
      onUpdate: (tween) => {
        if (!this.manager || !this.managerShadow) return;
        const progress = tween.progress;
        const baseY = Phaser.Math.Linear(this.managerShadow.y + 38, y, progress);
        this.manager.y = baseY + (this.reducedMotion ? 0 : Math.abs(Math.sin(progress * Math.PI * Math.max(2, distance / 34))) * -4);
        this.managerShadow.y = baseY - 38;
        this.manager.angle = this.reducedMotion ? 0 : Math.sin(progress * Math.PI * Math.max(2, distance / 30)) * 1.1;
      },
      onComplete: () => {
        if (!this.manager || !this.managerShadow) return;
        this.manager.setPosition(x, y).setAngle(0);
        this.managerShadow.setPosition(x, y - 38);
        onComplete?.();
      },
    });
  }

  private approachDialogue(id: DialogueId, x: number, y: number): void {
    this.game.events.emit("tooltip:hide");
    this.moveManagerTo(x, y, () => {
      if (!this.manager) return;
      this.dialogueOpen = true;
      this.manager.setFlipX(false);
      const target = id === "liv" ? this.liv : this.nadja;
      if (target && !this.reducedMotion) {
        this.tweens.add({ targets: target, scaleX: target.scaleX * 1.015, scaleY: target.scaleY * 1.015, duration: 110, yoyo: true });
      }
      this.game.events.emit("dialogue:open", id);
    });
  }

  private approachToast(x: number, y: number, text: string): void {
    this.game.events.emit("tooltip:hide");
    this.moveManagerTo(x, y, () => this.game.events.emit("toast:show", text));
  }

  private activateHotspot(id: HotspotId): void {
    const zone = this.hotspots.get(id);
    const spec = zone?.getData("spec") as HotspotSpec | undefined;
    if (spec && this.started && !this.dialogueOpen) spec.action();
  }

  private onDialogueClosed(): void {
    this.dialogueOpen = false;
  }

  private playReaction(choice: DialogueChoice): void {
    if (choice.reaction === "coffee" && this.coffeeGlow) {
      this.tweens.add({ targets: this.coffeeGlow, scaleX: 2.4, scaleY: 2.4, alpha: 0, duration: 360, yoyo: true });
    }
    if (choice.reaction === "lights" && this.lightsFlash) {
      this.tweens.add({ targets: this.lightsFlash, alpha: 0.18, duration: 70, yoyo: true, repeat: 2 });
    }
    const target = choice.reaction === "gesture" || choice.reaction === "coffee" || choice.reaction === "lights" ? this.nadja : this.liv;
    if (target && !this.reducedMotion) {
      this.tweens.add({
        targets: target,
        x: target.x + (choice.reaction === "shuffle" ? 10 : 0),
        angle: choice.reaction === "blink" ? -0.8 : 0.8,
        duration: 130,
        yoyo: true,
        hold: 190,
      });
    }
  }

  private showDestinationMarker(x: number, y: number): void {
    this.destinationMarker?.destroy();
    const marker = this.add.circle(x, y + 5, 7, 0xe7a84a, 0.8).setStrokeStyle(2, 0xf2e7c7, 0.9).setDepth(24);
    this.destinationMarker = marker;
    this.tweens.add({
      targets: marker,
      alpha: 0,
      scale: 1.8,
      duration: this.reducedMotion ? 120 : 360,
      onComplete: () => {
        if (this.destinationMarker === marker) this.destinationMarker = undefined;
        marker.destroy();
      },
    });
  }

  private configureCamera(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const aspect = width / height;
    const needsCrop = aspect < WORLD_WIDTH / WORLD_HEIGHT - 0.04;
    const camera = this.cameras.main;
    if (needsCrop) {
      const zoom = height / WORLD_HEIGHT;
      camera.setZoom(zoom);
      if (this.manager) camera.startFollow(this.manager, !this.reducedMotion, this.reducedMotion ? 1 : 0.09, this.reducedMotion ? 1 : 0.09, 0, 35);
    } else {
      camera.stopFollow();
      camera.setZoom(Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT));
      camera.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    }
  }
}
