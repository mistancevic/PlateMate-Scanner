// DT137, a recipe changed on the Plate (Milan 28 October 15:32 and 16:01; Tester 2's breakfast: egg whites out, cheese in)
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const F2 = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, table: undefined, icon: undefined, places: [] });
const SK = F2("skyr2", "Skyr, natural", 63, 11, 0.2, 4), OA = F2("oats2", "Oats", 372, 13, 7, 59), EW = F2("ew", "Egg whites", 52, 11, 0.2, 0.7), CH = F2("ch", "Gouda cheese", 356, 25, 27, 2.2);
const it = (id, food, grams) => ({ id, food, grams, locked: false });
const R0 = { id: "r1", title: "Skyr breakfast", items: [it("a", SK, 250), it("b", OA, 40), it("c", EW, 100)], portion: 390, savedAt: "2026-10-26T08:00:00Z" };
const R1 = { id: "r2", title: "Skyr breakfast", items: [it("d", SK, 250), it("e", OA, 40)], portion: 290, savedAt: "2026-10-27T20:10:00Z" };
seed.foods = [...seed.foods, SK, OA, EW, CH]; seed.feedback = [];
const PORT = "3305", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date("2026-10-28T08:15:00"));
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue;
    if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (name) => { await page.waitForTimeout(400); await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const noteAfter = (sel, text, nth = 0) => page.evaluate(({ sel, text, NOTE, nth }) => { const el = document.querySelectorAll(sel)[nth]; if (!el) return; const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = text; el.after(d); }, { sel, text, NOTE, nth });
  const seedWith = async (s) => { await page.evaluate((s) => { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === "platemate-pilot-v1") return; return o.call(this, k, v); }; }, s); };
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1985, heightCm: 168, weightKg: 64, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, { ...seed, meals: [R1, R0], items: [] });
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Skyr with oats and cheese.", around: "", better_as: "" }) }));
  await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  // DT137a, now: Recipes holds two Skyr breakfasts
  await page.goto(U + "/recipes"); await page.waitForTimeout(1400);
  await page.evaluate((mark) => { for (const t of document.querySelectorAll(".recipe-tile")) if (/Skyr breakfast/.test(t.textContent)) t.style.cssText += ";" + mark; }, mark);
  await noteAfter(".recipe-tile", "Now (0.2.121): a recipe changed on the Plate is saved as a new recipe with the same name (Put it in tomorrow's breakfast says: Saved to My recipes too). Darinka's breakfast: the first one with egg whites, a second without them. Plan points to the one it was planned from, so it kept PD 6.7 while the Plate showed 7.7.");
  await shot("r137a");
  // DT137b, new: the Plate asks when the plate is changed from its recipe
  await page.goto(U + "/plate"); await page.waitForTimeout(800);
  await seedWith({ ...seed, meals: [R0], items: [it("a", SK, 250), it("b", OA, 40), it("x", CH, 30)], title: "Skyr breakfast", fromRecipe: undefined });
  await page.reload(); await page.waitForTimeout(1600);
  await page.evaluate(({ mark }) => {
    const card = document.querySelector(".plate-card"); const d = document.createElement("section"); d.className = "card"; d.style.cssText = "margin:12px 0;padding:12px;" + mark;
    d.innerHTML = '<b>Changed from your recipe Skyr breakfast</b><small style="display:block;margin:4px 0 8px">Egg whites out, Gouda cheese 30 g in. PD 9.7, was 12.2.</small>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><button class="pill pill-primary pill-wide">Update my recipe</button><small>Skyr breakfast changes; today\'s breakfast and Friday\'s on Plan follow.</small>' +
      '<button class="pill pill-wide">Save as a new recipe</button><small>Skyr breakfast stays as it was. The new one needs its own name: <u>Skyr breakfast with cheese</u>.</small>' +
      '<button class="pill pill-wide">Only for tomorrow\'s breakfast</button><small>The recipe stays; this day has the change.</small></div>';
    card.after(d);
  }, { mark });
  await noteAfter(".plate-card", "New: a plate that came from a recipe and was changed asks once, at Put it in or at Save after you made it. Three ways, in plain words. A new recipe never takes the same name.");
  await shot("r137b");
  // DT137c, new: after Update my recipe, one recipe, and Plan follows
  await page.goto(U + "/recipes"); await page.waitForTimeout(800);
  await seedWith({ ...seed, meals: [{ ...R0, items: [it("a", SK, 250), it("b", OA, 40), it("x", CH, 30)], portion: 320 }], items: [] });
  await page.reload(); await page.waitForTimeout(1400);
  await page.evaluate(({ mark }) => { const t = [...document.querySelectorAll(".recipe-tile")].find((x) => /Skyr breakfast/.test(x.textContent)); if (!t) return; t.style.cssText += ";" + mark;
    const s = document.createElement("small"); s.style.cssText = "display:block;padding:4px 10px 8px;color:#123a7a;font-weight:700"; s.textContent = "Updated today: egg whites out, cheese in. Plan follows: today's and Friday's breakfast."; t.querySelector(".recipe-tile-body")?.appendChild(s); }, { mark });
  await noteAfter(".recipe-tile", "New, after Update my recipe: one Skyr breakfast. Plan's days that hold it as planned take the new version (0.2.121), so Plan and the Plate show the same PD. Past days keep what was eaten.");
  await shot("r137c");
  await b.close(); server.kill();
})();
