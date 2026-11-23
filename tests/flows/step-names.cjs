// B163 (0.3.189, board Stories290; Coach Milan, Go 23 November 2026, 20:57): a food's name in a step is cut only at a comma
// with a space after it, so Körniger Frischkäse Tworog 2,5% Fett stays whole; a pack's name (a barcode, or read from a
// label) stays as printed, with its capitals; a basic food is in small letters (2 eggs); the name comes from the food each
// time, so steps written before read right, on the recipe, in Edit recipe and in Start cooking.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats, fiber, extra = {}) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, ...extra });
const Q = food("q", "Körniger Frischkäse Tworog 2,5% Fett", 100, 12, 3, 4.5, 0, { barcode: "4056489000001" }), P = food("p", "Frischer Blätterteig", 400, 6, 36, 25, 1.5, { barcode: "4056489000002" }),
  S = food("s", "Alpen JodSalz", 0, 0, 0, 0, 0), E = food("e", "Eggs", 143, 12.6, 0.7, 9.5, 0, { source: "Reference table", refId: "egg" }), C = food("c", "Chicken breast, cooked", 165, 31, 0, 3.6, 0, { source: "Reference table", refId: "chicken" });
const it = (id, f, g) => ({ id, food: f, grams: g, locked: false });
const I = { q: it("a", Q, 250), p: it("b", P, 375), s: it("c", S, 3), e: it("d", E, 122), c: it("k", C, 150) };
const tok = (x, n) => `[[i:${x.id}|${n}]]`;
const recipe = { id: "m-burek", title: "Lazy Burek", items: Object.values(I), makes: { n: 4, unit: "portions" }, portion: 225, savedAt: "2026-11-23T16:00:00Z",
  steps: [`Mix ${tok(I.q, "körniger frischkäse tworog 2")}, ${tok(I.s, "alpen jodsalz")} and ${tok(I.e, "eggs")}.`, `Lay out ${tok(I.p, "frischer blätterteig")} and add ${tok(I.c, "chicken breast")}.`, "Bake at 200 °C for 25 minutes."] };
const PORT = "3614", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 1000 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-11-23T21:00:00+01:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, Q, P, S, E, C], meals: [recipe], feedback: [] });
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  try {
    await page.goto(U + "/my-recipes/m-burek"); await page.waitForTimeout(1500);
    const steps = await page.evaluate(() => [...document.querySelectorAll("section.card")].find((x) => (x.querySelector("b")?.textContent || "").trim() === "Steps").innerText);
    ok(/250 g Körniger Frischkäse Tworog 2,5% Fett/.test(steps), "B163 AC1: the decimal comma stays: " + (steps.match(/Mix [^\n]*/) || [""])[0]);
    ok(/3 g Alpen JodSalz/.test(steps) && /375 g Frischer Blätterteig/.test(steps), "B163 AC2: a pack's name as printed");
    ok(/2 eggs \(L\)/.test(steps) && /150 g chicken breast/.test(steps), "B163 AC3: basic foods in small letters, cut at a comma with a space");
    await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(500);
    const field = await page.getByRole("textbox", { name: "Step 1" }).innerText();
    ok(/Körniger Frischkäse Tworog 2,5% Fett/.test(field), "B163 AC4: steps written before, in Edit recipe: " + field.replace(/\s+/g, " "));
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
