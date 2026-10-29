// DT153 (0.2.132, canvas Page 2, board Stories105; Coach Milan 29 October 10:22 to 10:55 "Go", Tester 3 Marko's screen): a done
// row in the chat is a plain green tick, not a pill: ✓ On the plate, ✓ Out, ✓ In the plan. Undo sits under the tick while the
// chat is open and puts things back as they were. Back to the plate becomes the main button after the first Add. The chat's
// head stays at the top and says where you came from: Back to the plate, Back to the plan, or Close. Swap and Move: chat-kinds.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, favorite: false, ...extra });
const BAR = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45, { serving: { grams: 50, name: "bar" } });
const YE = F("yeast", "Active dry yeast", 325, 40, 7, 41, { favorite: true }), SKYR = F("skyr", "Skyr, natural", 63, 11, 0.2, 4);
seed.foods = [BAR, YE, SKYR, ...seed.foods]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: BAR, grams: 50, locked: false }, { id: "b", food: YE, grams: 7, locked: false }];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3328", U = `http://127.0.0.1:${PORT}`;
const ANSWER = { reply: "Low-fat quark and an apple go well with your protein bar. You can skip the active dry yeast unless you are planning to bake.", recognised: [], picks: [], skip: ["Active dry yeast"], named: ["low-fat quark", "apple"] };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const fails = []; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails.push(m); };
  const errs = [];
  const page = await b.newPage({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(new Date("2026-10-29T12:30:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { week: 5 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require("./adult.cjs")(page);
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: false, why: "A bar and yeast do not make a lunch.", around: "Clean Protein Bar Peanut Love", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await page.route("**/api/out", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ANSWER) }));
  const text = async (loc) => ((await loc.textContent()) ?? "").replace(/\s+/g, " ").trim();
  const st = () => page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")));
  const askHere = async () => { await page.getByRole("button", { name: "Ask Chef Mealan for a dish around it" }).first().click(); await page.waitForTimeout(1500); };
  await page.goto(U + "/plate"); await page.waitForTimeout(1800);
  await askHere();
  const bubble = page.locator(".bubble.mealan").last();
  const row = (name) => bubble.locator(".chat-rows .tip-row", { hasText: name });
  const back = bubble.locator(".chat-rows").getByRole("button", { name: "Back to the plate" });
  ok(await back.evaluate((el) => !el.classList.contains("pill-primary")), "DT153: Back to the plate is quiet before an Add");
  // + Add: a plain tick, Undo under it
  await row("Quark").getByRole("button", { name: "+ Add" }).click(); await page.waitForTimeout(500);
  let s = await st();
  ok(s.items.length === 3 && /Quark/.test(s.items[2].food.name), "+ Add puts the quark on the plate");
  ok(await bubble.locator(".pill-done").count() === 0 && await text(row("Quark").locator(".done-tick")) === "✓ On the plateUndo", "DT153: ✓ On the plate, plain, with Undo under it: " + await text(row("Quark").locator(".done-tick")));
  const tick = await row("Quark").locator(".done-tick > b").boundingBox(), undo = await row("Quark").getByRole("button", { name: "Undo" }).boundingBox();
  ok(undo.y > tick.y + tick.height - 2, "DT153: Undo is under the tick, not beside it");
  ok(await back.evaluate((el) => el.classList.contains("pill-primary")), "DT153: after the first Add, Back to the plate is the main button");
  await row("Quark").getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(500);
  s = await st();
  ok(s.items.length === 2 && s.items.map((i) => i.food.name).join() === "Clean Protein Bar Peanut Love,Active dry yeast" && await row("Quark").getByRole("button", { name: "+ Add" }).count() === 1, "DT153: Undo takes the quark off, and + Add comes back");
  // Take it out, Undo: back at its place and amount
  await row("Active dry yeast").getByRole("button", { name: "Take it out" }).click(); await page.waitForTimeout(400);
  ok((await st()).items.length === 1 && await text(row("Active dry yeast").locator(".done-tick")) === "✓ OutUndo", "DT153: ✓ Out, with Undo");
  await row("Active dry yeast").getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(400);
  s = await st();
  ok(s.items.length === 2 && s.items[1].food.name === "Active dry yeast" && s.items[1].grams === 7, "DT153: Undo puts the yeast back, second, 7 g");
  // the head stays at the top and says Back to the plate
  await row("Apple").getByRole("button", { name: "+ Add" }).click(); await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(300);
  const head = page.locator(".talk-overlay .chat-head");
  const hb = await head.boundingBox();
  ok(await text(head) === "Chef MealanBack to the plate" && hb.y >= 0 && hb.y < 140, "DT153: the head stays at the top, Back to the plate: " + await text(head) + " at " + Math.round(hb.y));
  await head.getByRole("button", { name: "Back to the plate" }).click(); await page.waitForTimeout(500);
  ok(await page.locator(".talk-overlay").count() === 0, "DT153: Back to the plate closes the chat");
  // back in the chat later: the tick stays, Undo does not
  await askHere();
  const old = page.locator(".bubble.mealan").first();
  ok(await old.locator(".chat-rows .tip-row", { hasText: "Apple" }).locator(".done-tick").count() === 1 && await old.getByRole("button", { name: "Undo" }).count() === 0, "DT153: when you come back, only the tick, no Undo");
  await page.locator(".talk-overlay .chat-head").getByRole("button").click(); await page.waitForTimeout(400);
  // the Plan: Put them in the plan, ✓ In the plan, Undo, Back to the plan
  await page.goto(U + "/plan"); await page.waitForTimeout(1500);
  const planned0 = await page.evaluate(() => localStorage.getItem("chefmealan-planned"));
  await page.getByRole("button", { name: /Fill the open slots/ }).click(); await page.waitForTimeout(1200);
  ok(await text(page.locator(".talk-overlay .chat-head")) === "Chef MealanBack to the plan", "DT153: from the Plan the head says Back to the plan");
  const fb = page.locator(".bubble.mealan").last();
  await fb.getByRole("button", { name: "Put them in the plan" }).click(); await page.waitForTimeout(500);
  const filled = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned") || "{}"));
  const n = Object.values(filled).reduce((k, d) => k + Object.keys(d).length, 0);
  ok(n >= 2 && await text(fb.locator(".done-tick")) === "✓ In the planUndo" && await fb.getByRole("button", { name: "Back to the plan" }).evaluate((el) => el.classList.contains("pill-primary")), "DT153: ✓ In the plan with Undo, and Back to the plan as the main button: " + n + " slots");
  const ub = await fb.getByRole("button", { name: "Undo" }).boundingBox(), bb = await fb.getByRole("button", { name: "Back to the plan" }).boundingBox();
  ok(bb.x - (ub.x + ub.width) > 40, "DT153: Undo sits away from Back to the plan");
  await fb.getByRole("button", { name: "Undo" }).click(); await page.waitForTimeout(500);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-planned") || "{}"));
  const left = Object.values(after).reduce((k, d) => k + Object.values(d).filter(Boolean).length, 0);
  ok(left === Object.values(JSON.parse(planned0 || "{}")).reduce((k, d) => k + Object.values(d).filter(Boolean).length, 0) && await fb.getByRole("button", { name: "Put them in the plan" }).count() === 1, "DT153: Undo empties the slots it filled; Put them in the plan comes back: " + left + " slots set");
  await fb.getByRole("button", { name: "Put them in the plan" }).click(); await page.waitForTimeout(400);
  await fb.getByRole("button", { name: "Back to the plan" }).click(); await page.waitForTimeout(500);
  ok(await page.locator(".talk-overlay").count() === 0 && /\/plan/.test(page.url()), "DT153: Back to the plan closes the chat on the Plan");
  // from Today: Close
  await page.goto(U + "/today"); await page.waitForTimeout(1200);
  await page.locator(".chat-fab").click(); await page.waitForTimeout(500);
  ok(await text(page.locator(".talk-overlay .chat-head")) === "Chef MealanClose", "DT153: from Today the head says Close");
  ok(errs.length === 0, "no page errors " + errs.join(" | "));
  await b.close(); server.kill();
  console.log(fails.length ? `${fails.length} FAILED` : "all ok");
  process.exit(fails.length ? 1 : 0);
})();
