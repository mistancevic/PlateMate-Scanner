// DT153 c and d (Milan 10:32, Tester 3 Marko's screen: In the plan) (Coach Milan 29 October 10:22, from Tester 3 Marko's testing): the chat's failed answer, and On plate that looks like a button
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, favorite: false, ...extra });
const BAR = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45, { serving: { grams: 50, name: "bar" } });
const YE = F("yeast", "Active dry yeast", 325, 40, 7, 41, { favorite: true });
const SKYR = F("skyr", "Skyr, natural", 63, 11, 0.2, 4);
seed.foods = [BAR, YE, SKYR, ...seed.foods]; seed.feedback = [];
seed.items = [{ id: "a", food: BAR, grams: 50, locked: false }, { id: "b", food: YE, grams: 7, locked: false }];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const PORT = "3326", U = `http://127.0.0.1:${PORT}`;
const R = "/home/claude/boards/rs";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-29T10:15:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { week: 5 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: false, why: "A bar and yeast do not make a snack.", around: "Clean Protein Bar Peanut Love", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  let outFail = true;
  await page.route("**/api/out", (r) => outFail
    ? r.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Chef Mealan took too long and stopped. Try again in a moment." }) })
    : r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ reply: "Low-fat quark and an apple go well with your protein bar. You can skip the active dry yeast unless you are planning to bake. Dried cranberries would add a sweet note.", recognised: [], picks: [], skip: ["Active dry yeast"], named: ["low-fat quark", "apple", "dried cranberries"] }) }));
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:12px", NOTE = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px;background:#fff8d6;padding:8px 10px;margin:8px 0;font-size:13.5px;line-height:1.4;color:#172742";
  const shot = async (name) => { await page.waitForTimeout(500); await page.screenshot({ path: `${R}/${name}.png` }); console.log("shot " + name); };
  const note = (sel, text, where = "before") => page.evaluate(({ sel, text, NOTE, where }) => { const el = document.querySelector(sel); if (!el) return false; const d = document.createElement("div"); d.className = "board-note"; d.style.cssText = NOTE; d.textContent = text; el[where](d); return true; }, { sel, text, NOTE, where });
  const ask = async () => { await page.goto(U + "/plate"); await page.waitForTimeout(1800); await page.getByRole("button", { name: "Ask Chef Mealan for a dish around it" }).first().click(); await page.waitForTimeout(1500); };
  await page.goto(U + "/plan"); await page.waitForTimeout(1500);
  const fill = page.getByRole("button", { name: /Fill the open slots/ });
  console.log("fill button", await fill.count());
  await fill.first().click(); await page.waitForTimeout(1500);
  await page.getByRole("button", { name: "Put them in the plan" }).first().click(); await page.waitForTimeout(700);
  await page.evaluate((mark) => { const d = [...document.querySelectorAll(".pill-done")].find((x) => /In the plan/.test(x.textContent)); if (d) d.style.cssText += ";" + mark; document.querySelector(".toast")?.remove(); }, mark);
  await note(".fill-rows", "Now (0.2.131), Tester 3 Marko's screen: after Put them in the plan the row says In the plan in a pill shaped like a button. It is a message, not a button. Close is at the top, scrolled away.", "before");
  await page.evaluate(() => { document.querySelector(".chips-again")?.scrollIntoView({ block: "end" }); });
  await shot("r153c");
  await page.evaluate(({ mark }) => {
    document.querySelectorAll(".board-note").forEach((n) => n.remove());
    for (const d of document.querySelectorAll(".pill-done")) if (/In the plan/.test(d.textContent)) { const w = document.createElement("span"); w.style.cssText = "display:flex;flex-direction:column;align-items:flex-start;margin-right:auto"; const s = document.createElement("span"); s.textContent = "✓ In the plan"; s.style.cssText = "color:#13916a;font-weight:800;font-size:13.5px;white-space:nowrap;padding:2px 0"; const u = document.createElement("button"); u.className = "link"; u.textContent = "Undo"; u.style.cssText = "margin-top:4px;font-size:13.5px;text-decoration:underline;background:#fff3b0;padding:1px 4px;border-radius:4px"; w.append(s, u); const bk = document.createElement("button"); bk.className = "pill pill-small pill-primary"; bk.textContent = "Back to the plan"; bk.style.cssText = mark; const row = d.parentElement; row.style.display = "flex"; row.style.alignItems = "center"; d.replaceWith(w); w.after(bk); }
    const head = document.querySelector(".chat-screen .menu-head");
    if (head) { const h = head.cloneNode(true); const c = [...h.querySelectorAll("button")].find((x) => /Close/.test(x.textContent)); if (c) { c.textContent = "Back to the plan"; c.style.cssText += ";" + mark; }
      h.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:60;background:var(--base,#f3f6fc);padding:10px 16px;box-shadow:0 2px 10px rgba(23,39,66,.12);"; document.body.append(h); }
  }, { mark });
  await note(".fill-rows", "New: a plain green ✓ In the plan with Undo under it, which empties the slots it filled, and Back to the plan on the right as the main button, away from Undo. The head stays at the top and says where you came from: Back to the plan, Back to the plate, or Close.", "before");
  await page.evaluate(() => { document.querySelector(".chips-again")?.scrollIntoView({ block: "end" }); });
  await shot("r153d");
  await b.close(); server.kill();
})();
