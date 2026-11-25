// Unit tests for src/game/OfficeScene.ts (Bus, camera, hotspots), written against surviving Stryker mutants.
// A minimal fake DOM stands in for the browser; Playwright covers the real rendering.
// Run: node --experimental-transform-types --test scripts/scene.test.ts  (OfficeScene uses parameter properties.)
import assert from "node:assert/strict";
import { beforeEach, mock, test } from "node:test";

type Listener = (event: Record<string, unknown>) => void;

class FakeEl {
  constructor(public tagName = "") {}
  className = "";
  style: Record<string, string> = {};
  children: FakeEl[] = [];
  clientWidth = 0;
  clientHeight = 0;
  src = "";
  alt = "";
  decoding = "";
  listeners = new Map<string, Listener[]>();
  classList = {
    add: (...names: string[]) => { this.className = [...new Set([...this.classes(), ...names])].join(" "); },
    remove: (...names: string[]) => { this.className = this.classes().filter((c) => !names.includes(c)).join(" "); },
    contains: (name: string) => this.classes().includes(name),
  };
  classes(): string[] { return this.className.split(" ").filter(Boolean); }
  append(...els: FakeEl[]): void { this.children.push(...els); }
  addEventListener(type: string, fn: Listener): void { this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]); }
  fire(type: string, event: Record<string, unknown> = {}): void { this.listeners.get(type)?.forEach((fn) => fn(event)); }
}

let decodeResult: Promise<void> = Promise.resolve();
class FakeImage extends FakeEl {
  constructor() { super("img"); }
  decode(): Promise<void> { return decodeResult; }
}

let reduced = false;
let resize: () => void = () => undefined;
class FakeResizeObserver {
  constructor(fn: () => void) { resize = fn; }
  observe(): void {}
}
Object.assign(globalThis, {
  document: { createElement: (tag: string) => new FakeEl(tag) },
  Image: FakeImage,
  ResizeObserver: FakeResizeObserver,
  window: {
    matchMedia: (query: string) => ({ matches: reduced && query === "(prefers-reduced-motion: reduce)" }),
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: number) => clearTimeout(id),
  },
});

const { Bus, OfficeScene } = await import("../src/game/OfficeScene.ts");

function setup(width: number, height: number) {
  const root = new FakeEl();
  root.clientWidth = width;
  root.clientHeight = height;
  const bus = new Bus();
  const events: unknown[][] = [];
  const realEmit = bus.emit.bind(bus);
  bus.emit = (name: string, ...args: unknown[]) => { events.push([name, ...args]); realEmit(name, ...args); };
  new OfficeScene(root as unknown as HTMLElement, bus, "/base/");
  const world = root.children[0];
  const hotspots = world.children.filter((el) => el.className === "hotspot");
  const ring = (kind: string) => world.children.find((el) => el.className.includes(`ring--${kind}`))!;
  const camera = () => {
    const m = /^translate\((-?[\d.e-]+)px, (-?[\d.e-]+)px\) scale\(([\d.e-]+)\)$/.exec(world.style.transform);
    assert.ok(m, `unexpected transform: ${world.style.transform}`);
    return { tx: Number(m[1]), ty: Number(m[2]), zoom: Number(m[3]) };
  };
  const names = () => events.map((e) => e[0]);
  return { root, bus, world, hotspots, ring, camera, events, names };
}

function near(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 0.01, `${actual} is not ${expected}`);
}

const box = (el: FakeEl) => [el.style.left, el.style.top, el.style.width, el.style.height];

beforeEach(() => {
  reduced = false;
  decodeResult = Promise.resolve();
});

test("Bus: on and emit pass every argument, once fires once, off removes, unknown names are a no-op", () => {
  const bus = new Bus();
  const got: unknown[][] = [];
  const fn = (...args: unknown[]) => got.push(["on", ...args]);
  bus.on("a", fn);
  bus.on("a", (...args: unknown[]) => got.push(["second", ...args]));
  bus.once("a", (...args: unknown[]) => got.push(["once", ...args]));
  bus.emit("a", 1, "x");
  bus.emit("a", 2);
  assert.deepEqual(got, [["on", 1, "x"], ["second", 1, "x"], ["once", 1, "x"], ["on", 2], ["second", 2]]);
  bus.off("a", fn);
  bus.emit("a", 3);
  assert.deepEqual(got.at(-1), ["second", 3]);
  assert.equal(got.length, 6);
  bus.off("missing", fn);
  bus.emit("missing");
});

test("builds the world: tableau image, three glows, two rings and seven centre-anchored hotspots", () => {
  const { root, world, hotspots, ring } = setup(1672, 941);
  assert.equal(root.children.length, 1);
  assert.equal(world.className, "world");
  assert.equal(world.tagName, "div");
  // Every other element is an <i>: glows, rings and hotspots.
  assert.ok(world.children.slice(1).every((el) => el.tagName === "i"));
  const img = world.children[0];
  assert.ok(img instanceof FakeImage);
  assert.equal(img.src, "/base/assets/office-tableau.webp");
  assert.equal(img.alt, "");
  assert.equal(img.decoding, "async");
  assert.deepEqual(world.children.slice(1, 4).map((el) => el.className), ["glow glow--window", "glow glow--monitor", "glow glow--coffee"]);
  assert.equal(ring("focus").className, "ring ring--focus");
  assert.equal(ring("guide").className, "ring ring--guide");
  assert.equal(hotspots.length, 7);
  // Liv: x 1020, y 455, 190 × 320, so the top-left corner sits half a size up and left.
  assert.deepEqual(box(hotspots[0]), ["925px", "295px", "190px", "320px"]);
  assert.deepEqual(box(hotspots[6]), ["1048px", "15px", "340px", "250px"]);
});

test("image load: decode emits ready, a failed decode or an image error emits error", async () => {
  const ok = setup(1672, 941);
  await Promise.resolve();
  assert.deepEqual(ok.names(), ["prototype:ready"]);
  decodeResult = Promise.reject(new Error("broken"));
  const bad = setup(1672, 941);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(bad.names(), ["prototype:error"]);
  bad.world.children[0].fire("error");
  assert.deepEqual(bad.names(), ["prototype:error", "prototype:error"]);
});

test("landscape fits the whole room and centres it; extra width is split evenly", () => {
  const { camera, world } = setup(2000, 941);
  assert.deepEqual(camera(), { tx: 164, ty: 0, zoom: 1 });
  assert.equal(world.style.transitionDuration, "520ms");
});

test("landscape zooms by the smaller of the two ratios, portrait by height", () => {
  // Wider than the room: height binds.
  assert.deepEqual(setup(3344, 941).camera(), { tx: 836, ty: 0, zoom: 1 });
  near(setup(3344, 900).camera().zoom, 900 / 941);
  // 1672 × 945 is still landscape (1,77 against the 1,74 threshold) and width binds at 1.
  near(setup(1672, 945).camera().zoom, 1);
  // Portrait: 1700 × 1882 fills the height at zoom 2 even though width alone would allow 1,02.
  near(setup(1700, 1882).camera().zoom, 2);
});

test("portrait fills the height, frames x 1000 and clamps inside the room", () => {
  const { camera } = setup(390, 844);
  const zoom = 844 / 941;
  const c = camera();
  near(c.zoom, zoom);
  near(c.tx, 195 - 1000 * zoom);
  near(c.ty, 0);
});

test("the portrait threshold sits 0,04 below the room's aspect ratio", () => {
  const ratio = 1672 / 941;
  // Just above the threshold: landscape, so the whole room fits (zoom by width, room centred).
  const above = setup(Math.round((ratio - 0.03) * 941), 941);
  near(above.camera().zoom, Math.min(above.root.clientWidth / 1672, 1));
  // Just below: portrait, zoom by height = 1 and the camera frames x 1000 instead of the centre.
  const below = setup(Math.round((ratio - 0.05) * 941), 941);
  near(below.camera().zoom, 1);
  near(below.camera().tx, below.root.clientWidth - 1672);
});

test("resize reconfigures the camera", () => {
  const { root, camera } = setup(2000, 941);
  root.clientWidth = 390;
  root.clientHeight = 844;
  resize();
  near(camera().zoom, 844 / 941);
});

test("resize keeps the guided colleague framed (phone rotated mid-game)", () => {
  const { root, bus, camera } = setup(844, 390);
  bus.emit("guide:hotspot", "goran");
  root.clientWidth = 390;
  root.clientHeight = 844;
  resize();
  const { tx, zoom } = camera();
  // Göran's centre (x 215) lands inside the 390 px wide viewport, not cropped out by the default x 1000 framing.
  const screenX = tx + 215 * zoom;
  assert.ok(screenX > 0 && screenX < 390, `Göran at ${screenX}px`);
});

test("resize before any framing keeps the orientation default", () => {
  const { root, camera } = setup(2000, 941);
  root.clientWidth = 390;
  root.clientHeight = 844;
  resize();
  near(camera().tx, 390 / 2 - 1000 * (844 / 941));
});

test("reduced motion moves the camera instantly", () => {
  reduced = true;
  const { world } = setup(2000, 941);
  assert.equal(world.style.transitionDuration, "0ms");
});

test("drag: ignored before start, pans past 12 px only, clamps to the room, and pointerup ends it", () => {
  const { root, bus, world, camera } = setup(390, 844);
  const start = camera();
  root.fire("pointerdown", { clientX: 100, clientY: 100 });
  root.fire("pointermove", { clientX: 200, clientY: 100 });
  assert.deepEqual(camera(), start);
  bus.emit("prototype:start");
  root.fire("pointerdown", { clientX: 100, clientY: 100 });
  root.fire("pointermove", { clientX: 111, clientY: 100 });
  assert.deepEqual(camera(), start);
  assert.equal(world.classList.contains("is-dragging"), false);
  root.fire("pointermove", { clientX: 112, clientY: 100 });
  near(camera().tx, start.tx + 12);
  assert.equal(world.classList.contains("is-dragging"), true);
  assert.equal(world.style.transitionDuration, "0ms");
  // Once moving, small steps count and are measured from the last position.
  root.fire("pointermove", { clientX: 115, clientY: 100 });
  near(camera().tx, start.tx + 15);
  // Far left edge: tx clamps at 0, ty stays put because the room fills the height exactly.
  root.fire("pointermove", { clientX: 5000, clientY: 400 });
  assert.equal(camera().tx, 0);
  assert.equal(camera().ty, 0);
  // Far right edge: tx clamps at viewport minus world width.
  root.fire("pointermove", { clientX: -5000, clientY: 100 });
  near(camera().tx, 390 - 1672 * (844 / 941));
  root.fire("pointerup");
  assert.equal(world.classList.contains("is-dragging"), false);
  root.fire("pointermove", { clientX: 0, clientY: 100 });
  near(camera().tx, 390 - 1672 * (844 / 941));
  root.fire("pointerdown", { clientX: 0, clientY: 0 });
  root.fire("pointermove", { clientX: 0, clientY: 20 });
  assert.equal(world.classList.contains("is-dragging"), true);
  root.fire("pointercancel");
  assert.equal(world.classList.contains("is-dragging"), false);
});

test("a diagonal drag counts its length, not one axis", () => {
  const { root, bus, world } = setup(390, 844);
  bus.emit("prototype:start");
  root.fire("pointerdown", { clientX: 0, clientY: 0 });
  root.fire("pointermove", { clientX: 9, clientY: 9 });
  assert.equal(world.classList.contains("is-dragging"), true);
});

test("hotspot tap: only after start, never during a dialogue or after a drag", () => {
  const { root, bus, hotspots, events, names } = setup(2000, 941);
  hotspots[0].fire("pointerup");
  assert.deepEqual(names(), []);
  bus.emit("prototype:start");
  hotspots[0].fire("pointerup");
  assert.deepEqual(events.at(-1), ["colleague:click", "liv"]);
  hotspots[3].fire("pointerup");
  assert.deepEqual(events.at(-1), ["colleague:click", "mira"]);
  const count = events.length;
  root.fire("pointerdown", { clientX: 0, clientY: 0 });
  root.fire("pointermove", { clientX: 0, clientY: 50 });
  hotspots[1].fire("pointerup");
  assert.equal(events.length, count);
  root.fire("pointerup");
  // A press without movement is still a tap.
  root.fire("pointerdown", { clientX: 0, clientY: 0 });
  hotspots[1].fire("pointerup");
  assert.deepEqual(events.at(-1), ["colleague:click", "nadja"]);
  bus.emit("dialogue:start", "goran");
  const during = events.length;
  hotspots[2].fire("pointerup");
  assert.equal(events.length, during);
});

test("hover shows the focus ring with 6 px padding and the label tooltip, leave hides both", () => {
  const { bus, hotspots, ring, events } = setup(2000, 941);
  hotspots[0].fire("pointerenter", { clientX: 5, clientY: 6 });
  assert.equal(ring("focus").classList.contains("is-visible"), false);
  assert.deepEqual(events, []);
  bus.emit("prototype:start");
  hotspots[0].fire("pointerenter", { clientX: 5, clientY: 6 });
  assert.equal(ring("focus").classList.contains("is-visible"), true);
  assert.deepEqual(box(ring("focus")), ["919px", "289px", "202px", "332px"]);
  assert.deepEqual(events.at(-1), ["tooltip:show", "Prata med Liv", 5, 6]);
  hotspots[0].fire("pointermove", { clientX: 7, clientY: 8 });
  assert.deepEqual(events.at(-1), ["tooltip:move", 7, 8]);
  hotspots[0].fire("pointerleave");
  assert.equal(ring("focus").classList.contains("is-visible"), false);
  assert.deepEqual(events.at(-1), ["tooltip:hide"]);
  bus.emit("dialogue:start", "liv");
  hotspots[0].fire("pointerenter", { clientX: 5, clientY: 6 });
  assert.equal(ring("focus").classList.contains("is-visible"), false);
});

test("hotspot labels, in spec order", () => {
  const { bus, hotspots, events } = setup(2000, 941);
  bus.emit("prototype:start");
  hotspots.forEach((h) => h.fire("pointerenter", { clientX: 0, clientY: 0 }));
  const labels = events.filter((e) => e[0] === "tooltip:show").map((e) => e[1]);
  assert.deepEqual(labels, ["Prata med Liv", "Prata med Nadja", "Prata med Göran", "Prata med Mira", "Titta på klockan", "Titta på kaffemaskinen", "Titta på affischerna"]);
});

test("guide rings the colleague with 12 px padding and frames them at zoom 1", () => {
  const { bus, ring, camera } = setup(390, 844);
  bus.emit("guide:hotspot", "goran");
  assert.equal(ring("guide").classList.contains("is-visible"), true);
  assert.deepEqual(box(ring("guide")), ["108px", "273px", "214px", "344px"]);
  const zoom = 844 / 941;
  // Göran stands at x 215, which would put tx above 0, so it clamps to the room's left edge.
  assert.equal(camera().tx, 0);
  near(camera().zoom, zoom);
});

test("dialogue start hides both rings, dismisses hint and tooltip, and zooms 1.35 on the speaker 80 px low", () => {
  const { bus, ring, camera, events } = setup(2000, 941);
  bus.emit("prototype:start");
  bus.emit("guide:hotspot", "liv");
  ring("focus").classList.add("is-visible");
  bus.emit("dialogue:start", "liv");
  assert.equal(ring("focus").classList.contains("is-visible"), false);
  assert.equal(ring("guide").classList.contains("is-visible"), false);
  assert.deepEqual(events.slice(-2), [["tooltip:hide"], ["hint:dismiss"]]);
  const c = camera();
  near(c.zoom, 1.35);
  // Liv stands right of centre, so the camera stops at the room's right edge.
  near(c.tx, 2000 - 1672 * 1.35);
  near(c.ty, 470.5 - 535 * 1.35);
  bus.emit("dialogue:closed");
  assert.deepEqual(camera(), { tx: 164, ty: 0, zoom: 1 });
});

test("look-at: toast, zoom 1.2, then back to the guided colleague after 3,4 s", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const { bus, camera, events } = setup(390, 844);
    const zoom = 844 / 941;
    bus.emit("hotspot:activate", "clock");
    assert.deepEqual(events.at(-1), ["hotspot:activate", "clock"]);
    bus.emit("prototype:start");
    bus.emit("guide:hotspot", "nadja");
    bus.emit("hotspot:activate", "clock");
    assert.deepEqual(events.slice(-4), [["hotspot:activate", "clock"], ["tooltip:hide"], ["hint:dismiss"], ["toast:show", "Klockan · Visar 08:03. Ingen minns när den senast gick."]]);
    near(camera().zoom, zoom * 1.2);
    near(camera().tx, 195 - 597 * zoom * 1.2);
    mock.timers.tick(3399);
    near(camera().zoom, zoom * 1.2);
    mock.timers.tick(1);
    near(camera().zoom, zoom);
    near(camera().tx, 195 - 1425 * zoom);
    bus.emit("hotspot:activate", "coffee");
    assert.deepEqual(events.at(-1), ["toast:show", "Kaffemaskinen · Kontorets mest tillförlitliga stödfunktion. Fram till i dag."]);
    bus.emit("hotspot:activate", "posters");
    assert.deepEqual(events.at(-1), ["toast:show", "Affischerna · Sex riktningar. Ett kontor. Ingen karta."]);
  } finally {
    mock.timers.reset();
  }
});

test("look-at timer: a second look restarts it, a dialogue cancels the return, no guide means the room centre", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const { bus, camera } = setup(390, 844);
    const zoom = 844 / 941;
    bus.emit("prototype:start");
    bus.emit("hotspot:activate", "clock");
    mock.timers.tick(3000);
    bus.emit("hotspot:activate", "coffee");
    mock.timers.tick(500);
    // The first timer would have fired by now; the restart keeps the coffee zoom.
    near(camera().zoom, zoom * 1.2);
    mock.timers.tick(2900);
    near(camera().zoom, zoom);
    near(camera().tx, 195 - 836 * zoom);
    bus.emit("hotspot:activate", "clock");
    bus.emit("guide:hotspot", "liv");
    bus.emit("dialogue:start", "liv");
    const inDialogue = camera();
    mock.timers.tick(3400);
    assert.deepEqual(camera(), inDialogue);
    // While a dialogue is open, activation does nothing.
    bus.emit("hotspot:activate", "posters");
    assert.deepEqual(camera(), inDialogue);
  } finally {
    mock.timers.reset();
  }
});

test("exactly at the portrait threshold the room still counts as landscape", () => {
  // 40859 / 23525 equals 1672 / 941 - 0,04 in floating point too: landscape zooms by width, portrait would take 25.
  near(setup(40859, 23525).camera().zoom, 40859 / 1672);
});

test("a vertical drag pans the zoomed room vertically, in the drag's direction", () => {
  const { root, bus, camera } = setup(390, 844);
  bus.emit("prototype:start");
  bus.emit("hotspot:activate", "clock");
  const before = camera();
  root.fire("pointerdown", { clientX: 0, clientY: 100 });
  root.fire("pointermove", { clientX: 0, clientY: 80 });
  near(camera().ty, before.ty - 20);
  root.fire("pointerup");
});

test("every colleague hotspot names its own speaker, by tap and by keyboard activation", () => {
  const { bus, hotspots, events } = setup(2000, 941);
  bus.emit("prototype:start");
  hotspots.slice(0, 4).forEach((h) => h.fire("pointerup"));
  const tapped = events.filter((e) => e[0] === "colleague:click").map((e) => e[1]);
  assert.deepEqual(tapped, ["liv", "nadja", "goran", "mira"]);
  for (const id of ["liv", "nadja", "goran", "mira"]) bus.emit("hotspot:activate", id);
  const activated = events.filter((e) => e[0] === "colleague:click").map((e) => e[1]).slice(4);
  assert.deepEqual(activated, ["liv", "nadja", "goran", "mira"]);
  // An unknown id is ignored, not a crash.
  assert.doesNotThrow(() => bus.emit("hotspot:activate", "nobody"));
});

test("closing a dialogue frees the hotspots again and, in portrait, centres the room", () => {
  const { bus, hotspots, events, camera } = setup(390, 844);
  bus.emit("prototype:start");
  bus.emit("dialogue:start", "liv");
  bus.emit("dialogue:closed");
  near(camera().tx, 195 - 836 * (844 / 941));
  hotspots[1].fire("pointerup");
  assert.deepEqual(events.at(-1), ["colleague:click", "nadja"]);
});
