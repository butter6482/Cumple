// @ts-check
const { test, expect } = require("@playwright/test");

const LETTER = `¡Feliz cumpleaños, Amanda!

Felicidades a una persona muy especial. Espero que la pases súper en tu día, que disfrutes muchísimo y que este nuevo año te traiga muchas cosas bonitas, bendiciones.

Te deseo lo mejor siempre y espero que puedas cumplir todo lo que te propongas. Quise hacerte este detallito para que tu cumpleaños fuera más especial.

¡Disfruta mucho tu día, Amanda!`;

const scene = (page, name) => page.locator(`section[data-scene="${name}"]`);

async function expectScene(page, name) {
  await expect(scene(page, name)).toHaveClass(/active/);
  await expect(page.locator("body")).toHaveAttribute("data-scene", name);
}

/** Espera a que termine la transición y pulsa "Continuar" en la escena activa. */
async function next(page, from, to) {
  await expectScene(page, from);
  await page.waitForTimeout(1200);
  await scene(page, from).locator('[data-action="next"]').first().click({ force: true });
  await expectScene(page, to);
}

/** Recoge errores de consola, ignorando fuentes de Google y el mp3 ausente. */
function trackErrors(page) {
  const errors = [];
  const ignored = (text, url = "") =>
    /fonts\.(googleapis|gstatic)\.com/.test(text + url) || /audio\/.*\.mp3/.test(text + url);
  page.on("console", (msg) => {
    if (msg.type() === "error" && !ignored(msg.text(), msg.location().url)) errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));
  return errors;
}

/** Sin scroll horizontal y todos los botones visibles de la escena miden >= 44px de alto. */
async function checkLayout(page, name) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `overflow horizontal en ${name}`).toBeLessThanOrEqual(0);
  const small = await page.evaluate((n) => {
    const els = [
      ...document.querySelectorAll(`section[data-scene="${n}"] button, section[data-scene="${n}"] [role="button"]`),
      ...document.querySelectorAll(".audio-controls:not([hidden]) button")
    ];
    return els
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ el, r }) => r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden")
      .filter(({ r }) => r.height < 44)
      .map(({ el, r }) => `${el.id || el.className || el.tagName} (${Math.round(r.height)}px)`);
  }, name);
  expect(small, `botones < 44px en ${name}`).toEqual([]);
}

async function start(page) {
  await page.goto("/?preview=1");
  await expectScene(page, "intro");
  await page.waitForTimeout(1200);
  await page.locator('[data-action="start"]').click({ force: true });
  await expectScene(page, "garden");
}

async function goToLetter(page) {
  await start(page);
  await next(page, "garden", "birthday");
  await next(page, "birthday", "matcha");
  await next(page, "matcha", "lights");
  await next(page, "lights", "letter");
  await page.waitForTimeout(1200);
}

async function goToFinale(page) {
  await goToLetter(page);
  await page.locator("#envelope").click();
  await expect(page.locator("#letter-card")).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(400);
  await page.locator('#letter-card [data-action="next"]').click({ force: true });
  await expectScene(page, "finale");
  await page.waitForTimeout(1200);
}

test.describe("bloqueo por fecha", () => {
  test("antes del cumpleaños muestra la cuenta regresiva", async ({ page }) => {
    const errors = trackErrors(page);
    await page.clock.setFixedTime(new Date("2026-11-03T20:00:00"));
    await page.goto("/");
    await expectScene(page, "gate");
    await expect(page.locator("#countdown")).toBeVisible();
    await expect(page.locator("#countdown")).not.toHaveText("--:--:--");
    await checkLayout(page, "gate");
    expect(errors).toEqual([]);
  });

  test("el día del cumpleaños abre directamente la bienvenida", async ({ page }) => {
    const errors = trackErrors(page);
    await page.clock.setFixedTime(new Date("2026-11-04T10:00:00"));
    await page.goto("/");
    await expectScene(page, "intro");
    await expect(scene(page, "gate")).not.toHaveClass(/active/);
    expect(errors).toEqual([]);
  });

  test("?preview=1 salta el bloqueo", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-03T20:00:00"));
    await page.goto("/?preview=1");
    await expectScene(page, "intro");
  });
});

test.describe("experiencia", () => {
  test.use({ reducedMotion: "reduce" });

  test("recorrido completo por las 7 escenas", async ({ page }) => {
    const errors = trackErrors(page);

    await page.goto("/?preview=1");
    await expectScene(page, "intro");
    await checkLayout(page, "intro");
    await page.waitForTimeout(1200);
    await page.locator('[data-action="start"]').click({ force: true });

    await expectScene(page, "garden");
    await checkLayout(page, "garden");
    await next(page, "garden", "birthday");
    await checkLayout(page, "birthday");
    await next(page, "birthday", "matcha");

    // Matcha
    await page.waitForTimeout(1200);
    await page.locator("#matcha").click();
    await expect(page.locator("#matcha")).toHaveClass(/mixed/);
    await expect(scene(page, "matcha")).toHaveClass(/done/);
    await expect(page.locator("#matcha-msg")).toBeVisible();
    await expect(page.locator("#matcha-msg")).toHaveText("Obviamente, el matcha no podía faltar aquí.");
    const sip1 = (await page.locator("#matcha-sip").textContent()) || "";
    await page.locator("#matcha").click();
    await expect(page.locator("#matcha-sip")).not.toHaveText(sip1);
    const sip2 = (await page.locator("#matcha-sip").textContent()) || "";
    await page.locator("#matcha").click();
    await expect(page.locator("#matcha-sip")).not.toHaveText(sip2);
    await checkLayout(page, "matcha");

    // Luces
    await next(page, "matcha", "lights");
    await page.waitForTimeout(1200);
    await page.locator("#wish-btn").click({ force: true });
    await expect(page.locator("#wish-msg")).toHaveText("Tu deseo va en camino ✨");
    await checkLayout(page, "lights");

    // Carta
    await next(page, "lights", "letter");
    await checkLayout(page, "letter");
    await page.waitForTimeout(1200);
    await page.locator("#envelope").click();
    await expect(page.locator("#envelope")).toHaveClass(/open/);
    await expect(page.locator("#letter-card")).toBeVisible({ timeout: 5000 });
    const text = await page.locator("#letter-text").evaluate((el) => el.textContent);
    expect(text).toBe(LETTER);
    expect(await page.evaluate(() => window.BIRTHDAY_CONFIG.letter)).toBe(LETTER);
    expect(
      await page.evaluate(() => document.getElementById("letter-text").textContent === window.BIRTHDAY_CONFIG.letter)
    ).toBe(true);
    await checkLayout(page, "letter");
    await page.waitForTimeout(400);
    await page.locator('#letter-card [data-action="next"]').click({ force: true });

    // Final
    await expectScene(page, "finale");
    await page.waitForTimeout(1200);
    await checkLayout(page, "finale");
    await page.locator('[data-action="replay"]').click({ force: true });
    await expectScene(page, "garden");

    expect(errors).toEqual([]);
  });

  test("el sobre también se abre con Enter", async ({ page }) => {
    await goToLetter(page);
    await page.locator("#envelope").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#envelope")).toHaveClass(/open/);
    await expect(page.locator("#letter-card")).toBeVisible({ timeout: 5000 });
  });

  test("controles de audio", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/?preview=1");
    await expect(page.locator(".audio-controls")).toBeHidden();
    await page.waitForTimeout(1200);
    await page.locator('[data-action="start"]').click({ force: true });
    await expectScene(page, "garden");

    const controls = page.locator(".audio-controls");
    await expect(controls).not.toHaveAttribute("hidden");
    await expect(controls).toBeVisible();

    // Play/pausa: la clase "paused" y el aria-label cambian en cada toque.
    const play = page.locator("#btn-play");
    const wasPaused = /\bpaused\b/.test((await play.getAttribute("class")) || "");
    const label1 = (await play.getAttribute("aria-label")) || "";
    await play.click();
    if (wasPaused) await expect(play).not.toHaveClass(/\bpaused\b/);
    else await expect(play).toHaveClass(/\bpaused\b/);
    await expect(play).not.toHaveAttribute("aria-label", label1);
    await play.click();
    if (wasPaused) await expect(play).toHaveClass(/\bpaused\b/);
    else await expect(play).not.toHaveClass(/\bpaused\b/);
    await expect(play).toHaveAttribute("aria-label", label1);

    const mute = page.locator("#btn-mute");
    await expect(mute).toHaveAttribute("aria-pressed", "false");
    await mute.click();
    await expect(mute).toHaveAttribute("aria-pressed", "true");
    await mute.click();
    await expect(mute).toHaveAttribute("aria-pressed", "false");

    await checkLayout(page, "garden");
    expect(errors).toEqual([]);
  });

  test("guardar recuerdo descarga una postal PNG", async ({ page }) => {
    const errors = trackErrors(page);
    await goToFinale(page);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator('[data-action="postcard"]').click({ force: true })
    ]);
    expect(download.suggestedFilename()).toBe("amanda-cumpleanos.png");
    expect(errors).toEqual([]);
  });

  test("tocar el final planta un lirio", async ({ page }) => {
    const errors = trackErrors(page);
    await goToFinale(page);
    const vp = page.viewportSize() || { width: 390, height: 844 };
    await page.mouse.click(12, Math.round(vp.height * 0.45));
    await expect(page.locator("#planted .planted-lily").first()).toBeAttached();
    expect(errors).toEqual([]);
  });
});
