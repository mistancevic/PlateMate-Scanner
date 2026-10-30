// A changed dish, where you land, a slow read (0.2.23, canvas board Parts02, IM23 to IM23d; Milan 17 October 2026, 15:17 to
// 15:38). Sally's no-bake cheesecake from a link, Change the dish (light cream cheese, whey), then How to make it: the steps
// are drafted for the changed foods and marked "your change". Save keeps the changed dish as a whole recipe that makes 10,
// adapted from the original, with its steps and the original steps; you land on it with one line for today. The original
// stays as it was. A read that takes longer than 20 seconds says so. AI answers faked (no key here).
// Changed by story R16 (Milan 21:56 to 22:11, board RS15): the slices left are not kept as a card for later; the landing line
// says they go on Plan, not on Today.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 70, fats: 93, carbs: 300 };
const it = (name, written, grams, role, calories, protein, fats, carbs, part) => ({ name, written, grams, how: "recipe", role, calories, protein, fats, carbs, optional: false, part });
const ORIG = ["Make the crust: stir the crust ingredients together and pack into a springform pan. Freeze 10 to 20 minutes.", "Whip the cold heavy cream into stiff peaks.", "Beat the cream cheese and sugar until smooth.", "Fold in the whipped cream, spread into the crust and refrigerate 6 to 8 hours."];
const URL_ = "https://sallysbakingaddiction.com/no-bake-cheesecake/";
const read = { url: URL_, recipe: { title: "No-bake cheesecake", source: "Sally's Baking Addiction", servings: 10, servingsUnit: "slices", servingsHow: "recipe", stated: null, steps: ORIG, items: [
  it("Graham cracker crumbs", "2 cups (240g)", 240, "base", 430, 7, 10, 77, "Crust"), it("Butter", "1/2 cup (113g)", 113, "fat", 717, 0.9, 81, 0.1, "Crust"),
  it("Heavy cream", "1 1/4 cups (300ml)", 300, "dairy", 340, 2.8, 36, 2.8, "Filling"), it("Cream cheese", "24 ounces (678g)", 678, "cheese", 342, 6, 34, 4, "Filling"), it("Granulated sugar", "1/2 cup (100g)", 100, "sweet", 387, 0, 0, 100, "Filling")] } };
const ch = (name, grams, calories, protein, fats, carbs, role, change, extra = {}) => ({ name, grams, calories, protein, fats, carbs, role, change, ...extra });
const changed = { title: "No-bake cheesecake, more protein", notes: ["Light cream cheese sets a little softer: chill it overnight."], items: [
  ch("Graham cracker crumbs", 240, 430, 7, 10, 77, "base", "same", { part: "Crust" }), ch("Butter", 113, 717, 0.9, 81, 0.1, "fat", "same", { part: "Crust" }), ch("Heavy cream", 300, 340, 2.8, 36, 2.8, "dairy", "same", { part: "Filling" }),
  ch("Light cream cheese", 678, 200, 9, 15, 6, "cheese", "swap", { was: "Cream cheese" }), ch("Granulated sugar", 100, 387, 0, 0, 100, "sweet", "same", { part: "Filling" }), ch("Vanilla whey protein powder", 60, 390, 78, 5, 8, "protein", "add", { part: "Filling" })] };
const U = "http://127.0.0.1:3215";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3215", GEMINI_API_KEY: "" }, stdio: "ignore" });
  process.on("exit", () => { try { server.kill(); } catch {} });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-17T15:40:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  const text = (sel) => page.locator(sel).first().textContent().then((t) => t.replace(/\s+/g, " "));
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const sent = [];
  // built screens for checking against the drawings (SHOTS=<folder>)
  const shot = async (name, sel) => { if (!process.env.SHOTS) return; await page.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav, .toast").forEach((x) => (x.style.display = "none"))); await page.locator(sel).first().screenshot({ path: path.join(process.env.SHOTS, `${name}.png`) }); await page.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav").forEach((x) => (x.style.display = ""))); };
  // IM23d: a read that takes longer than 20 seconds says so
  await page.route("**/api/recipe/read", async (r) => { await new Promise((x) => setTimeout(x, 21500)); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(read) }); });
  await page.route("**/api/recipe/fit", (r) => { sent.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(changed) }); });
  await page.route("**/api/steps", (r) => { const body = JSON.parse(r.request().postData() || "{}"); sent.push(body); r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
    steps: ["Mix {1} and {2}, melted; press into a tin and freeze 15 minutes.", "Whip {3} to stiff peaks.", "Beat {4} and {5} until smooth.", "Beat in {6} a spoon at a time.", "Fold in the cream, spread on the crust and chill overnight."],
    marks: [{ kind: "same", why: "" }, { kind: "same", why: "" }, { kind: "adapted", why: "your change, light cream cheese" }, { kind: "added", why: "your change, the whey" }, { kind: "adapted", why: "overnight, not 6 to 8 hours" }],
    parts: ["Crust", "Filling", "Filling", "Filling", "Filling"] }) }); });
  await page.goto(U + "/plate"); await page.waitForTimeout(1300);
  await page.locator(".plate-card").getByRole("button", { name: "Link" }).click(); await page.waitForTimeout(300);
  await page.getByLabel("Link to a recipe").fill(URL_);
  await page.getByRole("button", { name: "Read it" }).click(); await page.waitForTimeout(1500);
  ok(await page.locator(".in-slow").count() === 0, "IM23d: no slow line in the first 20 seconds");
  await page.waitForTimeout(19500);
  ok(/This page takes longer than most\. Chef Mealan keeps reading: up to two minutes\./.test(await text(".in-card")), "IM23d: after 20 seconds the card says it takes longer");
  await shot("im23d", ".in-card");
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1300);
  const orig = (await st()).meals.find((m) => m.title === "No-bake cheesecake");

  // IM23: Change the dish, then How to make it drafts the steps for the changed foods
  await page.getByRole("button", { name: "Change the recipe" }).click(); await page.waitForTimeout(1200);
  ok(sent[0].items.find((i) => i.name === "Cream cheese").part === "Filling", "IM23: the change is asked with the recipe's parts");
  await page.getByRole("button", { name: /^(Make it( as it is)?|Change it first)$/ }).click(); await page.waitForTimeout(800);
  ok(/No steps yet for your changed dish/.test(await text("main")), "IM23: How to make it is for the changed dish");
  await page.getByRole("button", { name: "Write the steps for my dish" }).first().click(); await page.waitForTimeout(900);
  const ask = sent.find((x) => Array.isArray(x.original));
  ok(ask && ask.items.some((i) => i.name === "Light cream cheese" && i.grams === 678 && i.part === "Filling") && ask.items.some((i) => i.name === "Vanilla whey protein powder" && i.grams === 60) && !ask.items.some((i) => i.name === "Cream cheese"), "IM23: the draft is asked for the changed foods, at the whole recipe's grams, with their parts");
  ok(ask && ask.changed.includes("Light cream cheese: new") && ask.changed.includes("Cream cheese: not in it any more") && ask.original.length === 4, "IM23: the draft knows what changed, and follows the original method");
  let t = await text("main");
  ok(/Chef Mealan's steps for your changed dish, from the original/.test(t) && /678 g light cream cheese/.test(t) && /60 g vanilla whey protein powder/.test(t) && /Added: your change, the whey/.test(t), "IM23: the steps show the changed foods at all 10 slices, marked your change");
  await shot("im23", "main");
  ok(/No-bake cheesecake, more protein: the steps go with it when you save/.test(t), "IM23: the steps go with the changed dish when you save");
  ok(!(await st()).meals.find((m) => m.id === orig.id).steps?.length, "IM23: the original recipe is not touched by the draft");

  // IM23b: Save keeps the changed dish as a whole recipe
  await page.getByRole("button", { name: /^(I'm making it|Lock the recipe)$/ }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: /On to How was it\?|Rate it/ }).click(); await page.waitForTimeout(500);
  t = await text("main");
  ok(/Save your changed dish/.test(t) && /No-bake cheesecake, more protein: the whole recipe, 10 slices, with the steps for your change\. Adapted from No-bake cheesecake, Sally's Baking Addiction; its original steps come along, for you only\./.test(t), "IM23b: Save your changed dish says what is kept");
  await shot("im23b", '.save-recipe:has-text("Save your changed dish")');
  await page.getByRole("button", { name: "DaaM good" }).first().click();
  await page.getByRole("button", { name: "It worked" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(1200);
  const s = await st();
  const nw = s.meals.find((m) => m.title === "No-bake cheesecake, more protein");
  ok(s.meals.length === 2 && nw && nw.makes?.n === 10 && nw.items.find((i) => i.food.name === "Light cream cheese").grams === 678 && nw.items.find((i) => i.food.name === "Vanilla whey protein powder").part === "Filling", "IM23b: the changed dish is a whole recipe, 10 slices, 678 g light cream cheese, in its parts");
  ok(nw && nw.steps.length === 5 && nw.stepMarks?.[3]?.why === "your change, the whey" && nw.source?.steps?.length === 4 && nw.source.url === URL_ && nw.basedOn?.id === orig.id, "IM23b: with its steps, the original steps, the link, and the recipe it was adapted from");
  const o2 = s.meals.find((m) => m.id === orig.id);
  ok(o2.items.find((i) => i.food.name === "Cream cheese").grams === 678 && !o2.steps?.length && o2.tried?.[0]?.result === "yes", "IM23b: the original stays as it was, and remembers the change worked");
  const later = s.feedback.find((f) => f.status === "prepared");
  ok(!later, "R16: no card waits for the 9 slices left; they go on Plan");
  ok(s.feedback.find((f) => f.status === "eaten").recipeId === nw.id, "IM23b: the meal points at the changed recipe");

  // IM23c: you land on the changed recipe, with one line for today
  t = await text("main");
  ok(/Saved in Mine/.test(t) && /You ate your plate\. 9 slices left: to eat them on other days, put the recipe on Plan\. The original, No-bake cheesecake, stays as it was\./.test(t) && /No-bake cheesecake, more protein/.test(await text(".rq")), `IM23c: you land on the changed recipe with a line for today (${t.slice(0, 160)})`);
  await shot("im23c", ".rq");
  ok(/Beat 678 g light cream cheese and 100 g granulated sugar until smooth/.test(await text(".rq-steps")) && await page.locator(".rq-steps .st-amt.gone").count() === 0, "IM23c: the kept steps show the changed foods with their amounts");
  ok(/Adapted from No-bake cheesecake, Sally's Baking Addiction/.test(await text(".rq-source")), "IM23c: Where it came from says it is adapted from the original");
  await page.locator(".rq-source").getByRole("button", { name: "Open the original" }).click(); await page.waitForTimeout(600);
  ok(/No-bake cheesecake/.test(await text(".rq h1, .rq .rq-name, .rq")) && !(await page.locator(".rq-landed").count()), "IM23c: Open the original opens it");
  await page.locator(".rq-back").click(); await page.waitForTimeout(400);

  // a recipe you have made before ends on its page too (0.2.25, RP4, Milan 17:42)
  await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500);
  await page.getByText("No-bake cheesecake, more protein", { exact: true }).last().click(); await page.waitForTimeout(700);
  await page.getByRole("button", { name: /^(Make it( as it is)?|Change it first)$/ }).click(); await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /^(Make it( as it is)?|Change it first)$/ }).click(); await page.waitForTimeout(800);
  const mk = page.getByRole("button", { name: /Make it from the original|I'm making it|Lock the recipe/ }); if (await mk.count()) { await mk.first().click(); await page.waitForTimeout(500); }
  await page.getByRole("button", { name: /On to How was it\?|Rate it/ }).click(); await page.waitForTimeout(500);
  await page.getByRole("button", { name: "Good", exact: true }).first().click();
  await page.getByRole("button", { name: "Save", exact: true }).click(); await page.waitForTimeout(900);
  ok(/Made today/.test(await text(".rq-landed")) && /No-bake cheesecake, more protein/.test(await text(".rq")), "RP4: a recipe made before ends on its page too");
  await page.reload(); await page.waitForTimeout(1300);
  ok(!/could not be read/.test(await text("main")), "The stored data reads back");
  ok(errs.length === 0, `No page errors${errs.length ? `: ${errs.join(" | ")}` : ""}`);
  await b.close(); server.kill();
  if (fails.length) { console.log(`\n${fails.length} failed`); process.exit(1); }
  console.log("\nall passed");
})().catch((e) => { console.error(e); process.exit(1); });
