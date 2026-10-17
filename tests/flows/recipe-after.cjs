// The recipe after it came in, and units (0.2.18, canvas boards IM, IM8 to IM11, and UN; Milan 17 October 2026, 09:10 to 09:42).
// Milan's cookie from Instagram, read by Chef Mealan (faked here: no AI key): the optional foods stay with the recipe in their
// own list (IM8); the original steps are kept for him only (IM9b); Chef Mealan's steps say how each relates to the original
// (IM9); what he cooks with, and a plain "can't" when there is no sensible way (IM10, IM10b); one picture try when kept,
// then Draw a picture with the day's count, no retries overnight (IM11, IM11b). Then °F, lb and ft and in on Profile (UN).
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const DRAWN = "data:image/png;base64," + PNG.toString("base64");
const it = (name, written, grams, role, calories, protein, extra = {}) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: null, carbs: null, ...extra });
const read = { recipe: { title: "Low Calorie, High Protein Choc Chip Cookie", source: "@christopherkaiyu on Instagram", servings: 2, servingsUnit: "servings", servingsHow: "recipe", stated: { kcal: 234, protein: 15.5, fats: 6.75, carbs: 29.5 },
  steps: ["Preheat oven to 350 degrees Fahrenheit.", "Grab a mixing bowl. Add wet ingredients. Mix.", "Grab another mixing bowl. Add dry ingredients.", "Combine wet ingredients and dry ingredients (gently fold them). Add mix-ins.", "Bake for around 10-13 minutes (take out slightly underdone). Then enjoy!"],
  items: [it("Light butter", "35g", 35, "fat", 360, 1), it("Egg", "50g", 50, "protein", 143, 13), it("All-purpose flour", "45g", 45, "base", 364, 10), it("Casein protein powder", "25g", 25, "protein", 360, 80), it("Chocolate chips", "15g", 15, "sweet", 500, 6),
    it("Vanilla extract", "5 ml", 5, "herb or spice", 288, 0, { optional: true }), it("Extra chocolate chips", "15g", 15, "sweet", 500, 6, { optional: true, note: "for max gooeyness" }), it("Chocolate chunks", "to taste", 10, "sweet", 530, 7, { optional: true, how: "guessed", note: "on top, to taste" })] } };
const U = "http://127.0.0.1:3210";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3210", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await b.newPage({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message));
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  await page.clock.setFixedTime(new Date("2026-10-17T09:40:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], weighIns: [{ date: "2026-10-16", kg: 95 }], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  // the pictures: the first try (when the recipe is kept) doesn't draw; the day's count is 3 of 10; Draw a picture draws
  let coverCalls = 0, drawNow = false, used = 3;
  await page.route("**/api/cover/today", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ used, limit: 10 }) }));
  await page.route("**/api/cover", (r) => { coverCalls++; if (!drawNow) return r.fulfill({ status: 503, contentType: "application/json", body: "{}" }); used++; r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ image: DRAWN, used, limit: 10 }) }); });
  await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }));
  const steps = []; let stepsAnswer = null;
  await page.route("**/api/steps", (r) => { steps.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stepsAnswer) }); });
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const text = (sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const openRecipe = async () => { await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(600); await page.getByText("Low Calorie, High Protein Choc Chip Cookie", { exact: true }).last().click(); await page.waitForTimeout(800); };

  // the cookie comes in, two of three optional foods left out on the read card
  await page.goto(U + "/plate"); await page.waitForTimeout(1300);
  await page.locator(".plate-card label").filter({ hasText: "Screenshot" }).locator("input").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: PNG }]);
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1200);
  let s = await st();
  const m = s.meals[0];
  ok(m.optional?.length === 3 && m.optional.map((o) => o.name).join(",") === "Vanilla extract,Extra chocolate chips,Chocolate chunks" && m.items.length === 5, "IM8: the three optional foods stay with the recipe, out of its foods");
  ok(m.source.steps?.length === 5 && /350 degrees Fahrenheit/.test(m.source.steps[0]), "IM9b: the original steps are kept with where it came from");
  ok(coverCalls === 1 && m.cover?.state === "failed", "IM11: one picture try when the recipe is kept");

  // IM8, IM9b, IM11 on the recipe page
  await openRecipe();
  let t = await text(".rq-optional");
  ok(/Optional, not in the numbers/.test(t) && /Vanilla extract5 ml on the recipe5 g/.test(t) && /for max gooeyness/.test(t) && /on top, to taste/.test(t) && (await page.locator(".rq-optional").getByRole("button", { name: "Add when cooking" }).count()) === 0, "IM8, IM14: Optional, not in the numbers: each with its words and grams; the plate adds them, not this page");
  ok(/leave them out, and so do ours\. Make it, and add any of them on the plate\./.test(t), "IM14: the recipe's numbers leave them out; Make it, and add them on the plate");
  t = await text(".rq-source");
  ok(/Original steps, from your screenshot/.test(t) && /For you only, like the screenshot\. Members and public pages get Chef Mealan's steps\./.test(t), "IM9b: Original steps, from your screenshot, for you only");
  await page.locator(".rq-orig summary").click(); await page.waitForTimeout(200);
  ok(/Preheat oven to 175 °C\./.test(await text(".rq-orig ul")), "UN: the original's 350 degrees Fahrenheit shows as 175 °C (the account starts metric)");
  t = await text(".rq-nopic");
  ok(/No picture yet\./.test(t) && /Chef Mealan's pictures today: 3 of 10\. Your own photo is always better\./.test(t), "IM11: No picture yet, with the day's count: 3 of 10");
  ok(coverCalls === 1, "IM11: nothing tried again on its own");
  drawNow = true;
  await page.getByRole("button", { name: "Draw a picture" }).click(); await page.waitForTimeout(1200);
  s = await st();
  ok(coverCalls === 2 && s.meals[0].cover?.state === "drawn" && await page.locator(".rq-nopic").count() === 0 && await page.locator(".rq-hero img").count() === 1, "IM11: Draw a picture is one tap; the picture is the cover");

  // IM9: Chef Mealan's steps, marked against the original; °F in the original converted by code
  stepsAnswer = { steps: ["Heat the oven to 175 °C and line a tray with baking paper.", "Mix {1} and {2} in a bowl until smooth, about 1 minute.", "In a second bowl, mix {3} and {4}.", "Fold the wet into the dry, then fold in {5}. Shape 2 cookies about 1 cm thick.", "Bake 10 to 13 minutes and take them out slightly underdone."],
    marks: [{ kind: "adapted", why: "350 °F in the original" }, { kind: "added", why: "the original says only Mix" }, { kind: "same", why: "" }, { kind: "added", why: "the original doesn't say how to shape them" }, { kind: "same", why: "" }] };
  await page.getByRole("button", { name: "Draft the steps with Chef Mealan" }).click(); await page.waitForTimeout(800);
  ok(steps[0] && steps[0].original?.length === 5 && JSON.stringify(steps[0].equipment) === JSON.stringify(["oven", "stovetop", "microwave"]) && steps[0].makes?.n === 2, "IM9, IM10: the original steps, oven, stovetop and microwave, and how many it makes go to Chef Mealan");
  t = await text(".rq-steps");
  ok(/from the original, for your amounts and your kitchen\. Each says how it relates to the original\./.test(t), "IM9: the steps say they come from the original");
  ok(/Adapted: 350 °F in the original/.test(t) && /Added: the original says only Mix/.test(t) && (t.match(/As the original/g) ?? []).length === 2, "IM9: each step marked: Adapted, Added, As the original");
  await page.getByRole("button", { name: "Keep these steps" }).click(); await page.waitForTimeout(400);
  s = await st();
  ok(s.meals[0].steps.length === 5 && s.meals[0].stepMarks?.length === 5, "IM9: the marks are kept with the steps");

  // IM10: what you cook with: no oven, an air fryer; IM10b: no sensible way, said plainly
  await page.goto(U + "/me/shop"); await page.waitForTimeout(900);
  const cw = page.getByRole("group", { name: "What you cook with" });
  ok(await cw.count() === 1 && (await cw.locator(".choice.on").allTextContents()).join(",") === "Oven,Stovetop,Microwave", "IM10: What you cook with: oven, stovetop and microwave on at the start");
  await cw.getByRole("button", { name: "Oven" }).click(); await cw.getByRole("button", { name: "Air fryer" }).click(); await page.waitForTimeout(300);
  ok(JSON.stringify((await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")))).equipment) === JSON.stringify(["stovetop", "microwave", "airfryer"]), "IM10: kept as picked");
  // Edit recipe and Save changes with the steps as they are: the marks stay
  await page.goto(U + "/plate"); await page.waitForTimeout(900); await openRecipe();
  await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(400);
  s = await st();
  ok(s.meals[0].stepMarks?.length === 5 && s.meals[0].portion === Math.round(s.meals[0].items.reduce((n, i) => n + i.grams, 0) / 2), "IM9: saving the recipe with the same steps keeps the marks, and its 2 servings");
  // the same recipe without steps, to draft again for a kitchen with no oven
  await page.evaluate(() => { const x = JSON.parse(localStorage.getItem("platemate-pilot-v1")); x.meals[0].steps = []; delete x.meals[0].stepMarks; localStorage.setItem("platemate-pilot-v1", JSON.stringify(x)); });
  await page.goto(U + "/plate"); await page.waitForTimeout(900); await openRecipe();
  stepsAnswer = { cannot: "This needs an oven; the air fryer would burn the top before the middle is done." };
  const before = steps.length;
  await page.getByRole("button", { name: "Draft the steps with Chef Mealan" }).click(); await page.waitForTimeout(800);
  ok(JSON.stringify(steps[steps.length - 1].equipment) === JSON.stringify(["stovetop", "microwave", "airfryer"]), "IM10b: Chef Mealan gets what you cook with");
  ok(steps.length === before + 1 && /This needs an oven; the air fryer would burn the top before the middle is done\./.test(await text(".rq-steps")) && !/didn't pass the checks/.test(await text(".rq-steps")), "IM10b: no sensible way: said plainly, asked once");

  // IM13, IM12, IM12b: Make it opens the plate of the first time, with the optional foods; + Add puts one on, Leave it out sends it back
  await page.getByRole("button", { name: "Make it", exact: true }).click(); await page.waitForTimeout(1200);
  ok(await page.locator(".plate-card .in-portion").count() === 1 && await page.locator(".plate-card .dish-row").count() === 0 && await page.locator('.plate-card .rows input[aria-label^="Grams of"]').count() === 5, "IM13: Make it from Recipes: the foods one by one, with the two portions, not one locked block");
  ok(/Optional, not on the plate/.test(await text(".pt-optlist")) && await page.locator(".pt-optlist .pt-opt").count() === 3, "IM12: the three optional foods under the foods, out of the numbers");
  const kcal0 = await text(".plate-card .readout");
  await page.getByRole("button", { name: "Add Extra chocolate chips" }).click(); await page.waitForTimeout(500);
  ok(/Extra chocolate chips/.test(await text(".plate-card .rows")) && /optional, added · Leave it out/.test(await text(".plate-card .rows")) && await page.locator(".pt-optlist .pt-opt").count() === 2 && (await text(".plate-card .readout")) !== kcal0, "IM12b: + Add puts it on the plate as a food like the others; the numbers move");
  ok(await page.locator(".plate-card .in-portion").count() === 1, "IM12b: still the recipe's plate, with its two portions");
  await page.locator(".plate-card .rows").getByRole("button", { name: "Leave it out" }).click(); await page.waitForTimeout(400);
  ok(await page.locator(".pt-optlist .pt-opt").count() === 3 && (await text(".plate-card .readout")) === kcal0, "IM12b: Leave it out sends it back; the numbers as before");

  // UN: °F, lb and ft and in on Profile; the account keeps kg, cm and °C
  await page.goto(U + "/me/profile"); await page.waitForTimeout(900);
  const units = page.getByRole("group", { name: "Units" });
  ok(await units.count() === 1 && (await units.locator(".choice.on").allTextContents()).join(",") === "°C,kg,cm", "UN1: Units on Profile, metric at the start");
  ok(/Oven heat in the steps: 175 °C\. A recipe in °F is converted for you: 350 °F is 175 °C\./.test(await units.textContent()), "UN1: what °C means, in a line");
  await units.getByRole("button", { name: "°F" }).click(); await units.getByRole("button", { name: "lb" }).click(); await units.getByRole("button", { name: "ft and in" }).click(); await page.waitForTimeout(300);
  t = (await units.textContent()).replace(/\s+/g, " ");
  ok(/95 kg is 209\.4 lb, on weigh-ins and your goal\./.test(t) && /182 cm is 6 ft 0 in\./.test(t) && /Food amounts stay in grams/.test(t), "UN2: 95 kg is 209.4 lb; 182 cm is 6 ft 0 in; food stays in grams");
  ok(await page.getByLabel("Height, ft and in").inputValue() === "6 ft 0 in" && await page.getByLabel("Weight, lb").inputValue() === "209.4", "UN2: the profile asks in ft and in, and lb");
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(400);
  const pers = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")));
  ok(pers.weightKg === 95 && pers.heightCm === 182 && pers.units?.temp === "f" && pers.units?.weight === "lb", "UN2: the account still keeps 95 kg and 182 cm");
  await page.goto(U + "/me"); await page.waitForTimeout(900);
  ok(/last: 209\.4 lb/.test(await text(".weigh-line")), "UN2: the weigh-in line in lb");
  await page.locator(".weigh-line").click(); await page.locator('input[aria-label="Your weight, lb"]').fill("208.0"); await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(400);
  const w = (await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")))).weighIns.pop();
  ok(Math.abs(w.kg - 94.35) < 0.01 && /last: 208\.0 lb/.test(await text(".weigh-line")), `UN2: 208.0 lb typed is kept as ${w.kg} kg, and shows as 208.0 lb`);
  await page.goto(U + "/plate"); await page.waitForTimeout(900); await openRecipe();
  await page.locator(".rq-orig summary").click(); await page.waitForTimeout(200);
  ok(/Preheat oven to 350 °F\./.test(await text(".rq-orig ul")), "UN2: with °F chosen, the original's oven heat is 350 °F");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
