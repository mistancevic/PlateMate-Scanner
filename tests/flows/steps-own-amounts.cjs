// JOURNEY INVARIANT (Milan, 18 October 2026, 15:50 to 15:59, story R14 on canvas board RS11): a recipe can hold one food twice,
// like flour in the dough and flour for dusting. Each step names its own one, with its own amount: on How to make it for the
// whole recipe and for just your plate, the dusting step says what the plate lists for dusting, never the dough's flour.
// Never rewrite these lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
const it = (name, written, grams, role, calories, protein, part) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: null, carbs: null, optional: false, part });
const fritters = { url: "https://sallysbakingaddiction.com/homemade-apple-fritters/", recipe: { title: "Homemade apple fritters", source: "Sally's Baking Addiction", servings: 12, servingsUnit: "fritters", servingsHow: "recipe", stated: null,
  steps: ["Make the dough and let it rise.", "Heat the oil to 350°F (177°C).", "Fry 2 to 3 fritters at a time for 2 minutes a side.", "Dip each fritter in the glaze."], items: [
  it("Whole milk", "1 cup (240g)", 240, "dairy", 61, 3.2, "Dough"), it("Unsalted butter", "6 Tablespoons (85g)", 85, "fat", 717, 0.9, "Dough"), it("All-purpose flour", "4 1/2 cups (563g)", 563, "base", 364, 10, "Dough"),
  it("Apples, peeled and diced", "3 cups (360g)", 360, "fruit", 52, 0.3, "Filling"), it("Brown sugar", "1/2 cup (100g)", 100, "sweet", 380, 0, "Filling"),
  it("All-purpose flour", "1/4 cup (31g)", 31, "base", 364, 10, "For shaping and frying"), it("Vegetable oil", "1 to 2 quarts (1 to 1.9 L)", 1380, "fat", 884, 0, "For shaping and frying"),
  it("Confectioners' sugar", "3 cups (360g)", 360, "sweet", 389, 0, "Glaze"), it("Milk", "6 Tablespoons (90g)", 90, "dairy", 61, 3.2, "Glaze")] } };
const STEPS = { steps: ["Mix {1}, {2} and {3} into a soft dough and let it rise.", "Cook {4} with {5} and let it cool.", "Dust with {6}; shape, fill and cut 12 fritters.", "Heat {7} in a deep pot to 177 °C and fry 2 to 3 fritters at a time.", "Whisk {8} with {9} and dip each fritter in the glaze."],
  marks: Array(5).fill({ kind: "same", why: "" }), parts: ["Dough", "Filling", "For shaping and frying", "For shaping and frying", "Glaze"] };
const POT = "1 to 2 quarts (1 to 1.9 L) vegetable oil";
const U = "http://127.0.0.1:3228";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3228", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1400 } });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-18T12:30:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fritters) }));
  await page.route("**/api/steps", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STEPS) }));
  const flourIn = async (re) => (await page.locator(".rp-steps li").filter({ hasText: re }).locator("b.st-amt").filter({ hasText: /flour/ }).first().textContent()).trim();
  try {
    await page.goto(U + "/"); await page.waitForTimeout(900);
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(500);
    await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300);
    await page.getByLabel("Link to a recipe").fill(fritters.url); await page.getByRole("button", { name: /^Read/ }).first().click(); await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1200);
    // R15 (Milan 15:55 to 16:16, board RS12): the plate now starts with the whole recipe; this journey picks the portion it had.
    await page.locator(".in-portion").getByRole("button", { name: "Sized for your lunch" }).click(); await page.waitForTimeout(500);
    const onPlate = await page.locator(".plate-card .row").filter({ hasText: "All-purpose flour" }).locator("input[type=number]").evaluateAll((xs) => xs.map((x) => Number(x.value)));
    ok(onPlate.length === 2 && onPlate[0] > onPlate[1], "the plate lists both flours, the dough's and the dusting's: " + JSON.stringify(onPlate));
    await page.getByRole("button", { name: /^Make it( as it is)?$/ }).first().click(); await page.waitForTimeout(900);
    await page.getByRole("button", { name: "Chef Mealan's way" }).click(); await page.waitForTimeout(1200);
    await page.locator(".mk-card").getByRole("button", { name: "The whole recipe" }).click(); await page.waitForTimeout(300);
    ok(await flourIn(/Mix /) === "563 g all-purpose flour" && await flourIn(/Dust with/) === "31 g all-purpose flour", "the whole recipe: 563 g in the dough, 31 g for dusting");
    await page.locator(".mk-card").getByRole("button", { name: "Just your plate" }).click(); await page.waitForTimeout(300);
    ok(await flourIn(/Mix /) === `${onPlate[0]} g all-purpose flour` && await flourIn(/Dust with/) === `${onPlate[1]} g all-purpose flour`, `just your plate: each flour as the plate lists it (${await flourIn(/Mix /)}; ${await flourIn(/Dust with/)})`);
  } catch (e) { ok(false, "walkthrough error: " + e.message.split("\n").slice(0, 3).join(" / ")); }
  ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok"); process.exit(fails.length ? 1 : 0);
})();
