import { expect, test, type Page } from "@playwright/test";

// Hotspot order mirrors the specs in src/game/OfficeScene.ts.
const HOTSPOTS = ["liv", "nadja", "goran", "mira", "clock", "coffee", "posters"];
const ORDER = ["liv", "nadja", "goran", "mira", "liv"];

const hotspot = (page: Page, id: string) => page.locator(".hotspot").nth(HOTSPOTS.indexOf(id));

// The hint has pointer-events: none, so occlusion is checked geometrically against the opaque controls.
async function expectHintClearOfControls(page: Page): Promise<void> {
  const covered = await page.evaluate(() => {
    const hint = document.querySelector<HTMLElement>("#hint")!;
    const nav = document.querySelector<HTMLElement>("#hotspot-controls")!;
    const hb = hint.getBoundingClientRect();
    const nb = nav.getBoundingClientRect();
    const navShown = nav.matches(":focus-within");
    const overlaps = navShown && hb.top < nb.bottom && hb.bottom > nb.top && hb.left < nb.right && hb.right > nb.left;
    const inViewport = hb.top >= 0 && hb.bottom <= window.innerHeight && hb.left >= 0 && hb.right <= window.innerWidth;
    return overlaps || !inViewport;
  });
  expect(covered).toBe(false);
}

async function play(page: Page, picks: number[]): Promise<string> {
  await page.goto("/kontoret/");
  await page.getByRole("button", { name: "STÄMPLA IN" }).click();
  await page.waitForTimeout(400);
  for (let i = 0; i < ORDER.length; i += 1) {
    await hotspot(page, ORDER[i]).click();
    const choices = page.locator("#dialogue-choices button");
    await expect(choices).toHaveCount(3);
    await expect(choices.first()).toBeEnabled();
    await choices.nth(picks[i]).click();
    const next = page.locator("#dialogue-close");
    await expect(next).toBeVisible();
    await next.click();
    await page.waitForTimeout(700);
  }
  await expect(page.locator("#result")).toBeVisible();
  return (await page.locator("#result-name").textContent()) ?? "";
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => { throw error; });
});

test("desktop: five dialogues reach a result and the share text lands on the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await play(page, [0, 0, 0, 0, 0])).toBe("DIRIGENTEN");
  await page.locator("#share-button").click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain("Dirigenten");
  expect(clip).toContain("/kontoret/");
});

test("phone portrait: a drag pans without opening a dialogue, then a tap still works", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/kontoret/");
  await page.getByRole("button", { name: "STÄMPLA IN" }).click();
  await page.waitForTimeout(400);
  const world = page.locator(".world");
  const before = await world.evaluate((el) => el.style.transform);
  const box = (await hotspot(page, "liv").boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 80, cy, { steps: 6 });
  await page.mouse.up();
  expect(await world.evaluate((el) => el.style.transform)).not.toBe(before);
  await expect(page.locator("#dialogue")).toBeHidden();
  await hotspot(page, "liv").click();
  await expect(page.locator("#dialogue-choices button")).toHaveCount(3);
});

test("phone portrait keyboard: hint and toast stay clear of the wrapped hotspot controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/kontoret/");
  await page.getByRole("button", { name: "STÄMPLA IN" }).click();
  await page.waitForTimeout(400);
  const nav = page.locator("#hotspot-controls");
  const hint = page.locator("#hint");
  // Pin the scenario: in portrait the controls wrap to several rows.
  expect((await nav.boundingBox())!.height).toBeGreaterThan(100);
  await page.locator('[data-hotspot="clock"]').focus();
  await expect(nav).toHaveCSS("opacity", "1");
  await expect(hint).toHaveText("Titta på klockan");
  await expect(hint).toHaveClass(/is-visible/);
  await expectHintClearOfControls(page);
  await page.keyboard.press("Enter");
  await expect(hint).toContainText("Klockan");
  await expectHintClearOfControls(page);
});

test("keyboard: hotspot controls drive the whole loop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/kontoret/");
  await page.getByRole("button", { name: "STÄMPLA IN" }).click();
  await page.waitForTimeout(400);
  for (const who of ORDER) {
    await page.locator(`[data-hotspot="${who}"]`).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#dialogue-choices button")).toHaveCount(3);
    await expect(page.locator("#dialogue-choices button").first()).toBeEnabled();
    await page.keyboard.press("3");
    await expect(page.locator("#dialogue-close")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700);
  }
  await expect(page.locator("#result-name")).toHaveText("MÖTESBOKAREN");
});

test("short viewports: the result screen scrolls so share, restart and the course link stay reachable", async ({ page }) => {
  for (const viewport of [{ width: 844, height: 390 }, { width: 390, height: 700 }]) {
    await page.setViewportSize(viewport);
    await play(page, [0, 0, 0, 0, 0]);
    const result = page.locator("#result");
    // The panel is taller than the overlay on these viewports, so the overlay itself has to scroll.
    expect(await result.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    expect(await result.evaluate((el) => getComputedStyle(el).overflowY)).toBe("auto");
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await page.mouse.wheel(0, 800);
    await expect.poll(() => result.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    // Scrolled to the bottom, the shade must still cover the whole viewport, or the panel renders over the unshaded game world.
    await result.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const shadeBox = (await page.locator("#result .intro__shade").boundingBox())!;
    expect(shadeBox.y).toBeLessThanOrEqual(0);
    expect(shadeBox.y + shadeBox.height).toBeGreaterThanOrEqual(viewport.height);
    for (const selector of ["#share-button", "#restart-button", "#result .intro__credit a"]) {
      const element = page.locator(selector);
      await element.scrollIntoViewIfNeeded();
      const box = (await element.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    }
  }
});

test("load: no console errors under the production CSP, and the sound button's name contains its visible text", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text().slice(0, 160)); });
  await page.goto("/kontoret/");
  await expect(page.getByRole("button", { name: "STÄMPLA IN" })).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
  expect(errors).toEqual([]);
  // The intro covers the top bar until the game starts.
  await page.getByRole("button", { name: "STÄMPLA IN" }).click();
  await expect(page.locator("#intro")).toBeHidden();
  const toggle = page.locator("#sound-toggle");
  for (let i = 0; i < 2; i += 1) {
    const visible = (await toggle.innerText()).toLowerCase();
    expect((await toggle.getAttribute("aria-label"))!.toLowerCase()).toContain(visible);
    await toggle.click();
  }
});

test("keyboard: colleague buttons are named like the scene hotspot labels", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/kontoret/");
  await page.getByRole("button", { name: "STÄMPLA IN" }).click();
  await page.waitForTimeout(400);
  const colleagues: Record<string, string> = { liv: "Liv", nadja: "Nadja", goran: "Göran", mira: "Mira" };
  for (const [id, name] of Object.entries(colleagues)) {
    await expect(page.locator(`[data-hotspot="${id}"]`)).toHaveText(`Prata med ${name}`);
  }
});
