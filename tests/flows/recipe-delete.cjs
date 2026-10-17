// Deleting a recipe (0.2.22, canvas board Parts02, IM22 to IM22c; Milan 17 October 2026, 14:28 and 14:34). Delete recipe says
// what goes, what others still see, and what stays, before anything goes. Ticked: the Members share is taken back and the
// live page goes down with its content. Unticked: the page stays live. The foods stay: a food holds nothing personal.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const it = (name, written, grams, role, calories, protein, part) => ({ name, written, grams, how: "recipe", role, calories, protein, fats: 5, carbs: 5, optional: false, part });
const cake = { recipe: { title: "Protein cheesecake", source: "@highproteinbakes on Instagram", servings: 8, servingsUnit: "slices", servingsHow: "recipe", stated: null, steps: ["Crush the biscuits and mix with the melted butter.", "Beat the filling and bake for 45 minutes."], items: [
  it("Digestive biscuits", "120g", 120, "base", 480, 7, "Base"), it("Butter", "40g", 40, "fat", 740, 0.7, "Base"), it("Low-fat quark", "500g", 500, "dairy", 67, 12, "Filling"), it("Vanilla whey protein powder", "30g", 30, "protein", 390, 78, "Filling")] } };
const cookie = { recipe: { title: "Choc chip cookie", source: "@christopherkaiyu on Instagram", servings: 2, servingsUnit: "cookies", servingsHow: "recipe", stated: null, steps: [], items: [
  it("Light butter", "35g", 35, "fat", 360, 1, ""), it("Egg", "50g", 50, "protein", 143, 12.6, ""), it("Casein protein powder", "25g", 25, "protein", 360, 80, "")] } };
const U = "http://127.0.0.1:3214";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3214", GEMINI_API_KEY: "" }, stdio: "ignore" });
  process.on("exit", () => { try { server.kill(); } catch {} });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-17T14:50:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
    localStorage.setItem("chefmealan-coach", "1");
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const text = (sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const stateOf = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const readIn = async (rd) => {
    await page.route("**/api/recipe/read", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(rd) }));
    await page.goto(U + "/plate"); await page.waitForTimeout(1300);
    await page.locator(".plate-card label").filter({ hasText: "Screenshot" }).locator("input").setInputFiles([{ name: "a.png", mimeType: "image/png", buffer: PNG }]);
    await page.waitForTimeout(500); await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(800);
    await require("./put.cjs")(page); await page.waitForTimeout(1300);
    await page.unroute("**/api/recipe/read");
  };
  const openRecipe = async (title) => { await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(800); await page.getByText(title, { exact: true }).last().click(); await page.waitForTimeout(900); };
  const publish = async () => {
    await page.locator(".rq-pub").getByRole("button", { name: "Publish", exact: true }).click(); await page.waitForTimeout(600);
    await page.locator(".publish-sheet").getByRole("button", { name: "Publish", exact: true }).click(); await page.waitForTimeout(1200);
    await page.locator(".publish-sheet").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(600);
  };
  const shot = async (name) => { if (!process.env.SHOTS) return; await page.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav, .toast").forEach((x) => (x.style.display = "none"))); await page.locator(name === "im22c" ? ".dl-done" : ".dl-card").screenshot({ path: path.join(process.env.SHOTS, `${name}.png`) }); await page.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav").forEach((x) => (x.style.display = ""))); };

  // IM22: the cheesecake, shared with members and live on chefmealan.com
  await readIn(cake);
  await openRecipe("Protein cheesecake");
  await page.getByRole("button", { name: "Share with members" }).click(); await page.waitForTimeout(900);
  ok(/Shared/.test(await text(".mb-share")), "The cheesecake is shared with members");
  await publish();
  const slug = (await page.evaluate(() => fetch("/api/my-recipes").then((r) => r.json()))).recipes.find((r) => r.title === "Protein cheesecake")?.slug;
  ok(Boolean(slug) && (await page.evaluate((s) => fetch(`/api/recipes/${s}`).then((r) => r.status), slug)) === 200, `The page is live at /r/${slug}`);
  const before = await stateOf();
  const meal = before.meals.find((m) => m.title === "Protein cheesecake");
  const used = before.foods.filter((f) => meal.items.some((i) => i.food.id === f.id)).length;
  await page.getByRole("button", { name: "Delete recipe" }).click(); await page.waitForTimeout(300);
  const card = await text(".dl-card");
  ok(/Delete Protein cheesecake\?/.test(card) && /GOES WITH IT/.test(card) && /SEEN BY OTHERS/.test(card) && /STAYS/.test(card), "IM22: the card says what goes, what others see, and what stays");
  ok(/The recipe: its foods and grams, parts and the original steps\./.test(card), `IM22: what the recipe takes with it (${card.slice(0, 160)})`);
  ok(/Your screenshot, from this phone and from your account\./.test(card), "IM22: exact count: one screenshot");
  ok(new RegExp(`The ${used} foods it uses, in your Foods\\. A food holds nothing personal\\.`).test(card), `IM22: exact count: ${used} foods stay`);
  ok(await page.getByRole("checkbox", { name: /Take it back from Members/ }).isChecked() && await page.getByRole("checkbox", { name: /Take the live page down/ }).isChecked(), "IM22: both ticks are on by default");
  ok(new RegExp(`chefmealan.com/r/${slug} stops showing it`).test(card), "IM22: the tick names the page");
  await shot("im22");
  await page.locator(".dl-card").getByRole("button", { name: "Cancel" }).click(); await page.waitForTimeout(300);
  ok(await page.locator(".dl-card").count() === 0 && (await stateOf()).meals.some((m) => m.title === "Protein cheesecake"), "Cancel: nothing goes");
  await page.getByRole("button", { name: "Delete recipe" }).click(); await page.waitForTimeout(300);
  await page.locator(".dl-card .dl-go").click(); await page.waitForTimeout(1200);
  const done = await text(".dl-done");
  ok(/Protein cheesecake is deleted\./.test(done) && /Taken back from Members and down on chefmealan\.com\. Its screenshot leaves your account with the next save\./.test(done), `IM22c: the line on Recipes says what was done (${done})`);
  await shot("im22c");
  const after = await stateOf();
  ok(!after.meals.some((m) => m.title === "Protein cheesecake"), "The recipe is gone");
  ok(after.foods.length === before.foods.length && meal.items.every((i) => after.foods.some((f) => f.id === i.food.id)), "The foods stay");
  const members = await page.evaluate(() => fetch("/api/members").then((r) => r.json()));
  ok(!members.recipes.some((r) => r.title === "Protein cheesecake"), "Members: taken back");
  const gone = await page.evaluate((s) => fetch(`/api/recipes/${s}`).then(async (r) => ({ status: r.status, body: await r.json() })), slug);
  ok(gone.status === 410 && gone.body.title === "Protein cheesecake", "chefmealan.com: the link says it was taken down");
  const mine = await page.evaluate(() => fetch("/api/my-recipes").then((r) => r.json()));
  const rec = mine.recipes.find((r) => r.slug === slug);
  ok(rec && !rec.items && !rec.steps && !rec.mealId, "chefmealan.com: the page's content is gone, only the address and the name stay");
  const html = await page.evaluate((s) => fetch(`/r/${s}`).then((r) => r.status), slug);
  ok(html === 410, "The page itself says taken down");

  // IM22b: the cookie, only yours: no ticks. Then live, with the page kept: the page stays live
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); localStorage.setItem("platemate-pilot-v1", JSON.stringify({ ...s, items: [], title: "", portion: null, fromRecipe: undefined, optional: undefined, leftOut: undefined })); });
  await readIn(cookie);
  await openRecipe("Choc chip cookie");
  await page.getByRole("button", { name: "Delete recipe" }).click(); await page.waitForTimeout(300);
  const c2 = await text(".dl-card");
  ok(!/SEEN BY OTHERS/.test(c2) && (await page.locator(".dl-card input[type=checkbox]").count()) === 0 && /The 3 foods it uses/.test(c2), "IM22b: only yours: the same card, no ticks");
  await shot("im22b");
  await page.locator(".dl-card").getByRole("button", { name: "Cancel" }).click(); await page.waitForTimeout(300);
  await publish();
  const slug2 = (await page.evaluate(() => fetch("/api/my-recipes").then((r) => r.json()))).recipes.find((r) => r.title === "Choc chip cookie")?.slug;
  await page.getByRole("button", { name: "Delete recipe" }).click(); await page.waitForTimeout(300);
  ok(!(await page.getByRole("checkbox", { name: /Take it back from Members/ }).count()) && await page.getByRole("checkbox", { name: /Take the live page down/ }).isChecked(), "Live, not shared: one tick");
  await page.getByRole("checkbox", { name: /Take the live page down/ }).uncheck();
  await page.locator(".dl-card .dl-go").click(); await page.waitForTimeout(1200);
  const d2 = await text(".dl-done");
  ok(/Choc chip cookie is deleted\./.test(d2) && !/chefmealan\.com/.test(d2), `Unticked: the line does not say it was taken down (${d2})`);
  ok((await page.evaluate((s) => fetch(`/api/recipes/${s}`).then((r) => r.status), slug2)) === 200, "Unticked: the page stays live");
  await page.reload(); await page.waitForTimeout(1300);
  ok(!/could not be read/.test(await text("main")), "The stored data reads back after deleting");
  ok(errs.length === 0, `No page errors${errs.length ? `: ${errs.join(" | ")}` : ""}`);
  await b.close(); server.kill();
  if (fails.length) { console.log(`\n${fails.length} failed`); process.exit(1); }
  console.log("\nall passed");
})().catch((e) => { console.error(e); process.exit(1); });
