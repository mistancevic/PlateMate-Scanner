// Counted foods (0.2.24, canvas board CT, CT1 to CT5; Milan 17 October 2026, 16:20 to 16:34). Eggs are counted by size, not
// grams: the read card says 2 eggs, L · 122 g; your slice says ¼ egg; the recipe page counts them. On your own plate eggs
// move one at a time with − and +, and the size changes the grams. A banana is counted by size too, or weighed.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const it = (name, written, grams, how, role, calories, protein) => ({ name, written, grams, how, role, calories, protein, fats: 5, carbs: 5, optional: false });
const read = { recipe: { title: "Protein cheesecake", source: "@highproteinbakes on Instagram", servings: 8, servingsUnit: "slices", servingsHow: "recipe", stated: null, steps: [], items: [
  it("Digestive biscuits", "120g", 120, "recipe", "base", 480, 7), it("Low-fat quark", "500g", 500, "recipe", "dairy", 67, 12), it("Eggs", "2 large", 120, "converted", "protein", 143, 12.6), it("Vanilla whey protein powder", "30g", 30, "recipe", "protein", 390, 78)] } };
const F = (id, name, calories, protein, icon) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, fats: 5, carbs: 5, fiber: 0, photo: undefined, photos: undefined, icon, serving: undefined });
const U = "http://127.0.0.1:3216";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3216", GEMINI_API_KEY: "" }, stdio: "ignore" });
  process.on("exit", () => { try { server.kill(); } catch {} });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const open = async (state) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-17T18:30:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, state);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    return page;
  };
  const text = (page, sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const row = (page, name) => page.locator(".plate-card .row").filter({ hasText: name }).first();
  const st = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const shot = async (page, name, loc) => { if (!process.env.SHOTS) return; await page.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav, .toast").forEach((x) => (x.style.display = "none"))); await loc.screenshot({ path: path.join(process.env.SHOTS, `${name}.png`) }); await page.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav").forEach((x) => (x.style.display = ""))); };

  // CT1 to CT3: the cheesecake with 2 large eggs
  const page = await open(seed);
  await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }));
  await page.goto(U + "/plate"); await page.waitForTimeout(1300);
  await page.locator(".plate-card label").filter({ hasText: "Screenshot" }).locator("input").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: PNG }]);
  await page.waitForTimeout(500); await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(900);
  const eggRead = page.locator(".in-card .row").filter({ hasText: "Eggs" });
  let t = (await eggRead.textContent()).replace(/\s+/g, " ");
  ok(/2 large on the recipe · counted, size L/.test(t) && /2 eggs/.test(t) && /L · 122 g/.test(t), `CT1: the read card counts the eggs: 2 eggs, L · 122 g (${t})`);
  await shot(page, "ct1", page.locator(".in-card .rows"));
  await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1300);
  const one = page.getByRole("button", { name: /One slice, as the recipe makes it/ }); if (await one.count()) { await one.click(); await page.waitForTimeout(500); }
  t = (await row(page, "Eggs").textContent()).replace(/\s+/g, " ");
  ok(/¼ egg/.test(t) && /L · 15 g/.test(t), `CT3: one slice is ¼ egg, L · 15 g (${t})`);
  await shot(page, "ct3", page.locator(".plate-card .rows"));
  const s1 = await st(page);
  ok(s1.meals[0].items.find((i) => i.food.name === "Eggs").count?.size === "L" && s1.meals[0].items.find((i) => i.food.name === "Eggs").grams === 122, "CT1: the recipe keeps 122 g and the size L");
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(700);
  await page.getByText("Protein cheesecake", { exact: true }).last().click(); await page.waitForTimeout(900);
  t = (await page.locator(".rq-foods .rq-food").filter({ hasText: "Eggs" }).textContent()).replace(/\s+/g, " ");
  ok(/2 eggs/.test(t) && /L · 122 g/.test(t), `CT2: the recipe page counts the eggs (${t})`);
  // Changed by story DT77 (Milan 23 October 09:52, board DT77): the whole recipe in whole eggs, and one note says a slice holds its share
  const note = ((await page.locator(".rq-count-note").count()) ? await page.locator(".rq-count-note").textContent() : "").replace(/\s+/g, " ");
  ok(/Eggs and other foods counted by the piece are whole here, for the whole recipe\. One slice holds its share, ¼ egg: that is for the numbers, not for cooking\./.test(note), "DT77: the recipe page says a slice holds its share: " + note);
  await shot(page, "ct2", page.locator(".rq-foods"));
  await page.close();

  // CT4: your own omelette: − and +, the size
  const eggs = F("egg", "Eggs", 143, 12.6, "🥚"), sp = F("sp", "Spinach", 23, 2.9, "🥬"), ba = F("ba", "Banana", 89, 1.1, "🍌"), sk = F("sk", "Skyr", 63, 11, "🥣");
  const p2 = await open({ ...seed, foods: [...seed.foods, eggs, sp], items: [{ id: "a", food: eggs, grams: 156, locked: false }, { id: "b", food: sp, grams: 80, locked: false }], title: "Spinach omelette" });
  await p2.goto(U + "/plate"); await p2.waitForTimeout(1300);
  t = (await row(p2, "Eggs").textContent()).replace(/\s+/g, " ");
  ok(/3 eggs/.test(t) && /M · 156 g/.test(t), `CT4: 156 g of eggs are 3 eggs, M (${t})`);
  await row(p2, "Eggs").getByRole("button", { name: "One egg more" }).click(); await p2.waitForTimeout(300);
  ok((await st(p2)).items.find((i) => i.id === "a").grams === 208, "CT4: + adds one egg: 4 eggs, 208 g");
  await row(p2, "Eggs").getByRole("button", { name: /^Size of Eggs/ }).click(); await p2.waitForTimeout(300);
  await p2.getByRole("group", { name: "Size of Eggs" }).getByRole("button", { name: /^L/ }).click(); await p2.waitForTimeout(300);
  const e2 = (await st(p2)).items.find((i) => i.id === "a");
  ok(e2.grams === 244 && e2.count.size === "L" && /4 eggs/.test(await row(p2, "Eggs").textContent()), "CT4: size L keeps 4 eggs: 244 g");
  await shot(p2, "ct4", p2.locator(".plate-card .rows"));
  await row(p2, "Eggs").getByRole("button", { name: "One egg less" }).click(); await p2.waitForTimeout(300);
  ok((await st(p2)).items.find((i) => i.id === "a").grams === 183, "CT4: − takes one egg off: 3 L eggs, 183 g");
  await p2.close();

  // CT5: a banana, by size or weighed
  const p3 = await open({ ...seed, foods: [...seed.foods, ba, sk], items: [{ id: "a", food: sk, grams: 250, locked: false }, { id: "b", food: ba, grams: 118, locked: false }], title: "Skyr with banana" });
  await p3.goto(U + "/plate"); await p3.waitForTimeout(1300);
  t = (await row(p3, "Banana").textContent()).replace(/\s+/g, " ");
  ok(/1 banana/.test(t) && /M · 118 g peeled/.test(t), `CT5: 118 g is 1 banana, M, peeled (${t})`);
  await row(p3, "Banana").getByRole("button", { name: /^Size of Banana/ }).click(); await p3.waitForTimeout(300);
  await p3.getByLabel("Grams of banana, weighed").fill("134"); await p3.getByLabel("Grams of banana, weighed").press("Enter"); await p3.waitForTimeout(300);
  t = (await row(p3, "Banana").textContent()).replace(/\s+/g, " ");
  ok(/1 banana/.test(t) && /L · 134 g peeled, weighed/.test(t) && (await st(p3)).items.find((i) => i.id === "b").grams === 134, `CT5: weighed grams win, the size follows: L (${t})`);
  await shot(p3, "ct5", p3.locator(".plate-card .rows"));
  await p3.reload(); await p3.waitForTimeout(1300);
  ok(!/could not be read/.test(await text(p3, "main")) && /134 g peeled, weighed/.test(await row(p3, "Banana").textContent()), "The stored data reads back, with the count");
  ok(errs.length === 0, `No page errors${errs.length ? `: ${errs.join(" | ")}` : ""}`);
  await b.close(); server.kill();
  if (fails.length) { console.log(`\n${fails.length} failed`); process.exit(1); }
  console.log("\nall passed");
})().catch((e) => { console.error(e); process.exit(1); });
