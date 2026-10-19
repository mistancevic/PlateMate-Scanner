// JOURNEY INVARIANT (Milan, 19 October 2026, 07:25 to 18:39, story R20 on canvas board RS19): How did it carry you? is asked
// on the meal's own card, 30 minutes after, its three answers the card's full width; the answer stays on the card, with
// Change. Each answer keeps its moment (the meal, a training or rest day, before or after training). The meal's page shows
// every answer with its moment and the meals not answered yet. Two answers that agree, and more than the other way, make
// Chef Mealan's read (Light for you, Heavy for you); Fine is neither; the last 5 count; answers from before the foods changed
// are shown, marked, and stop counting. Pick a meal shows the read; Chef Mealan's ideas get the lists. Never rewrite these
// lines to fit a change.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, from) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: F(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-12T10:00:00Z", ...(from ? { from } : {}) }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4);
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8);
const one = (m) => { const w = m.items.reduce((s, i) => s + i.grams, 0), r = m.portion / w; return { ...m, items: m.items.map((i) => ({ ...i, grams: Math.round(i.grams * r) })) }; };
let n = 0;
const card = (m, at, carry) => ({ id: `f${++n}`, meal: one(m), status: "eaten", recipeId: m.id, taste: "", notes: "", createdAt: at, ...(carry ? { carry: { at, ...carry } } : {}) });
seed.items = []; seed.meals = [crepes, sarma];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
seed.feedback = [
  card(sarma, "2026-10-19T10:30:00.000Z"),
  card(crepes, "2026-10-19T05:40:00.000Z", { how: "light", moment: { meal: "Breakfast", day: "training", training: "before" } }),
  card(crepes, "2026-10-18T05:45:00.000Z", { how: "light" }),
  card(sarma, "2026-10-17T17:40:00.000Z", { how: "heavy", moment: { meal: "Dinner", day: "rest" } }),
  card(sarma, "2026-10-15T17:30:00.000Z", { how: "heavy", moment: { meal: "Dinner", day: "training", training: "after" } }),
  card(sarma, "2026-10-13T11:00:00.000Z", { how: "light", moment: { meal: "Lunch", day: "rest" }, sig: "old" }),
  card(sarma, "2026-10-12T11:00:00.000Z", { how: "light", moment: { meal: "Lunch", day: "rest" }, sig: "old" }),
];
const U = "http://127.0.0.1:3237";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT: "3237", GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [], asked = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-10-19T11:15:00Z"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Italian"], plan: Array(7).fill({ work: true, kind: "strength", intensity: "hard", when: "evening", at: "17:30", minutes: 60 }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-unlogged", JSON.stringify({}));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/members", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ recipes: [] }) }));
    await page.route("**/api/crave", (r) => { asked.push(JSON.parse(r.request().postData() || "{}")); return r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ error: "no-idea", message: "Chef Mealan has no idea for that right now. Try other words." }) }); });
    await page.goto(U + "/"); await page.waitForTimeout(1500);
    await page.locator("nav button").filter({ hasText: "Today" }).click(); await page.waitForTimeout(700);

    // ---- Today: the question on the meal's own card, full width; the answer stays on it ----
    const sarmaCard = page.locator(".log-card").filter({ has: page.locator(".card-top", { hasText: "Sarma" }) }).first();
    const crepesCard = page.locator(".log-card").filter({ has: page.locator(".card-top", { hasText: "crêpes" }) }).first();
    ok(await page.locator(".carry-card").count() === 0, "no second card for the question");
    const q = sarmaCard.locator(".carry-in");
    ok(/How did it carry you\?/.test(await q.textContent()) && await q.getByRole("button").count() === 3, "Sarma's card asks How did it carry you?, with three answers");
    const cb = await sarmaCard.boundingBox(), qb = await q.boundingBox(), pb = await sarmaCard.locator(".log-photo, .meal-thumb, img, .recipe-tile-blank").first().boundingBox();
    const rowTops = await q.getByRole("button").evaluateAll((bs) => bs.map((x) => Math.round(x.getBoundingClientRect().top)));
    ok(pb && qb.x <= pb.x + 1 && qb.width > cb.width - 60 && new Set(rowTops).size === 1, "the answers take the card's full width, under the photo, in one row");
    ok(/Carried you: Light and awake/.test(await crepesCard.textContent()), "breakfast's card keeps its answer: Carried you: Light and awake");
    await q.getByRole("button", { name: "Heavy, tired" }).click(); await page.waitForTimeout(500);
    ok(/Carried you: Heavy, tired/.test(await sarmaCard.textContent()) && await sarmaCard.locator(".carry-acts").count() === 0, "the answer replaces the question on the card");
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).feedback.find((f) => f.meal.title === "Sarma" && f.createdAt.startsWith("2026-10-19")).carry);
    ok(saved?.how === "heavy" && saved.moment?.meal === "Lunch" && saved.moment?.day === "training" && saved.moment?.training === "before" && typeof saved.sig === "string", "the answer keeps its moment: lunch, a training day, before training; and the recipe's foods as they were");
    await sarmaCard.getByRole("button", { name: "Change" }).click(); await page.waitForTimeout(300);
    ok(await sarmaCard.locator(".carry-acts button").count() === 3, "Change brings the three answers back");
    await sarmaCard.locator(".carry-acts").getByRole("button", { name: "Fine" }).click(); await page.waitForTimeout(400);
    ok(/Carried you: Fine/.test(await sarmaCard.textContent()), "a wrong tap is fixed: Carried you: Fine");

    // ---- the meal's page: every answer with its moment; the read; before the change ----
    await sarmaCard.locator(".card-top").click(); await page.waitForTimeout(900);
    const block = page.locator(".rq-carry");
    const bt = (await block.textContent()) ?? "";
    ok(/How it carries you/.test(bt) && /eaten 5 times/.test(bt), "the meal's page: How it carries you, eaten 5 times");
    ok(/Fine: Today's lunch, before training/.test(bt) && /Heavy, tired: Saturday's dinner, rest day/.test(bt) && /Heavy, tired: Thursday's dinner, after training/.test(bt), "each answer with its moment");
    ok((bt.match(/before you changed the foods/g) ?? []).length === 2, "the two answers from before the foods changed are marked");
    ok(/Heavy for you/.test(bt) && /leaves you heavy, tired/.test(bt), "two heavy that count, more than light: Heavy for you, and Chef Mealan's read");

    // ---- Pick a meal: the read on the row ----
    await page.locator("nav button").filter({ hasText: "Plan" }).click(); await page.waitForTimeout(800);
    await page.locator(".plan-slot").filter({ hasText: /Dinner/ }).first().click(); await page.waitForTimeout(600);
    const rowOf = (re) => page.locator(".pick-row").filter({ hasText: re }).first();
    ok(/Heavy for you/.test(await rowOf(/Sarma/).textContent()) && /Light for you/.test(await rowOf(/crêpes/).textContent()), "Pick a meal: Sarma says Heavy for you, the crêpes Light for you");
    ok(!/for you/.test(await rowOf(/Skyr bowl|Oats, skyr|Omelette/).textContent()), "a meal without answers says nothing");
    await page.getByRole("dialog").getByRole("button", { name: "Close" }).click(); await page.waitForTimeout(400);

    // ---- Chef Mealan's ideas get the two lists ----
    await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(800);
    await page.getByLabel("What are you craving?").fill("tiramisu"); await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Ask Chef Mealan for one" }).click(); await page.waitForTimeout(800);
    ok(asked.length === 1 && JSON.stringify(asked[0].carried) === JSON.stringify({ light: ["DaaM good protein crêpes"], heavy: ["Sarma"] }), "the craving's idea is asked with the lists: light, the crêpes; heavy, Sarma");
    ok(errs.length === 0, `no page errors${errs.length ? ": " + errs.join(" | ") : ""}`);
  } catch (e) { ok(false, "ran to the end: " + e.message.split("\n")[0]); }
  finally { await b.close(); server.kill(); }
  console.log(fails.length ? `${fails.length} failed` : "all passed");
  process.exit(fails.length ? 1 : 0);
})();
