import { expect, test, type Page } from "@playwright/test";

// Hotspot order mirrors the specs in src/game/OfficeScene.ts.
const HOTSPOTS = ["liv", "nadja", "goran", "mira", "clock", "coffee", "posters"];
const ORDER = ["liv", "nadja", "goran", "mira", "liv"];

const hotspot = (page: Page, id: string) => page.locator(".hotspot").nth(HOTSPOTS.indexOf(id));

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
