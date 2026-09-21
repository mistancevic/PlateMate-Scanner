const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const root = require("node:path").resolve(__dirname, "..");
const fs = require("node:fs");
fs.mkdirSync(root + "/tests/screenshots", { recursive: true });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: "3117",
      GEMINI_API_KEY: "",
      AIRTABLE_API_KEY: "",
      PILOT_ACCESS_KEY: "test-pilot-key",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let b;
  try {
    await new Promise((resolve, reject) => {
      server.stdout.on("data", (d) => {
        if (String(d).includes("ready")) resolve();
      });
      server.stderr.on("data", (d) => console.log("SERVER", String(d)));
      server.on("exit", (c) => reject(Error("server exited " + c)));
      setTimeout(() => reject(Error("server timeout")), 12000).unref();
    });
    const base = "http://127.0.0.1:3117";
    assert.equal(
      (
        await fetch(base + "/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await fetch(base + "/api/product/not-a-number", {
          headers: { Authorization: "Bearer test-pilot-key" },
        })
      ).status,
      400,
    );
    b = await chromium.launch({
      headless: true,
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--single-process",
        "--no-zygote",
      ],
    });
    const p = await b.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base);
    await p.screenshot({
      path: root + "/tests/screenshots/mobile-home.png",
      fullPage: true,
    });
    await p.getByRole("button", { name: "Try the worked example" }).click();
    await p.getByRole("button", { name: "Find a mix at PD" }).click();
    await p.getByRole("button", { name: "Use this mix" }).first().click();
    await p.screenshot({
      path: root + "/tests/screenshots/worked-example.png",
      fullPage: true,
    });
    const text = await p.locator(".mealan-card").innerText();
    assert.match(text, /412 g/);
    assert.match(text, /487 kcal/);
    assert.match(text, /19.5%/);
    assert.match(text, /Fi \?/);
    console.log("MEALAN", text);
    await p.getByLabel("Whole recipe (412 g)", { exact: false }).uncheck();
    await p.getByLabel("Selected portion (g)", { exact: true }).fill("400");
    assert.match(await p.locator(".mealan-card").innerText(), /473 kcal/);
    await p.getByRole("button", { name: "Save recipe", exact: true }).click();
    await p
      .getByRole("button", { name: "Recipes & taste", exact: true })
      .click();
    await p
      .getByRole("button", { name: "Record feedback", exact: true })
      .click();
    await p
      .getByLabel("Taste", { exact: true })
      .fill("Too sour; prefer a milder base");
    await p.getByLabel("What happened?").selectOption("eaten");
    await p.getByRole("button", { name: "Save feedback", exact: true }).click();
    await p.reload();
    await p
      .getByRole("button", { name: "Recipes & taste", exact: true })
      .click();
    assert.match(await p.locator(".feedback").innerText(), /Too sour/);
    await p.getByRole("button", { name: "My meal", exact: false }).click();
    await p.getByLabel("Whole recipe max (g)", { exact: true }).fill("300");
    await p.getByRole("button", { name: "Find a mix at PD" }).click();
    // Reload intentionally clears the selected solver control; choose explicitly again.
    await p
      .getByLabel("Supporting ingredient", { exact: true })
      .selectOption({ label: "Illustrative yogurt — NOT a real product" });
    await p.getByRole("button", { name: "Find a mix at PD" }).click();
    assert.match(
      await p.getByRole("alert").innerText(),
      /above your 300 g limit/,
    );
    await p.getByRole("button", { name: "Saved foods", exact: true }).click();
    await p.getByRole("button", { name: "Add manually", exact: true }).click();
    await p
      .getByLabel("Product name", { exact: true })
      .fill("Real-label test food");
    await p.getByLabel("Energy (kcal)", { exact: true }).fill("125");
    await p.getByLabel("Protein (g)", { exact: true }).fill("7,2");
    await p.getByLabel("Fat (g)", { exact: true }).fill("2");
    await p.getByLabel("Carbohydrate (g)", { exact: true }).fill("18");
    await p.getByLabel("Ready to eat and suitable for cold mixing").check();
    await p
      .getByLabel(
        "I checked the values, per-100-g basis and carbohydrate/fibre convention.",
      )
      .check();
    await p.getByRole("button", { name: "Confirm & save food" }).click();
    assert.match(await p.locator(".food").innerText(), /5.76/);
    await p.getByRole("button", { name: "Add to meal" }).click();
    assert.match(await p.locator(".mealan-card").innerText(), /Fi \?/);
    await p.screenshot({
      path: root + "/tests/screenshots/mobile-meal.png",
      fullPage: true,
    });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      "mobile overflow",
    );
    await p.setViewportSize({ width: 1365, height: 1000 });
    await p.screenshot({
      path: root + "/tests/screenshots/desktop.png",
      fullPage: true,
    });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      "desktop overflow",
    );
    await p.getByRole("button", { name: "Saved foods", exact: true }).click();
    await p.route("**/api/product/5901234123457", (route) =>
      route.fulfill({
        json: {
          product_name: "Synthetic barcode fixture",
          brand: "Test only",
          barcode: "5901234123457",
          calories: 125,
          protein: 7,
          fats: 2,
          carbs: 18,
          fiber: null,
          source: "Synthetic UI test",
        },
      }),
    );
    await p.getByRole("button", { name: "Scan barcode", exact: true }).click();
    await p
      .locator(".camera-modal input[type=file]")
      .setInputFiles(root + "/tests/fixtures/ean13-synthetic.png");
    await p.getByRole("dialog", { name: "Review food data" }).waitFor();
    assert.equal(
      await p.getByLabel("Product name", { exact: true }).inputValue(),
      "Synthetic barcode fixture",
    );
    assert.equal(
      await p.getByLabel("Fibre (g)", { exact: true }).inputValue(),
      "",
    );
    await p.getByRole("button", { name: "Close dialog" }).click();
    console.log(
      "PASS: uploaded EAN-13 image decoded through ZXing and unknown-fibre review shown (lookup mocked).",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: API auth/validation, worked meal, selected portion, saved recipe, persistent feedback, infeasible mix, manual decimal input, unknown fibre, mobile/desktop overflow, no browser errors.",
    );
  } finally {
    if (b) await b.close();
    server.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
