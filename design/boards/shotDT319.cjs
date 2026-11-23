// Board DT319 (Coach Milan 18 November 2026, 20:04; meaning 23 November 13:13: a copy for a new meal): a meal I ate, opened
// from Plan, Put it on the Plate again. Main on top (0.3.181), new below. One scratch build of main (/home/claude/work/dt319,
// not committed); board-new turns the new card on. The clock is Monday 23 November 2026, 13:15; the meal was Saturday's lunch.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/dt319";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs319", PORT = "3706", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const food = (id, name, calories, protein, carbs, fats) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber: 0, photo: undefined, photos: undefined, icon: "🍽️" });
const it = (g, f) => ({ id: f.id + "i", grams: g, locked: false, food: f });
const meal = [it(180, food("ch", "Chicken breast, cooked", 165, 31, 0, 3.6)), it(200, food("sp", "Sweet potato fries", 160, 2, 24, 6)), it(80, food("sl", "Green salad", 15, 1.2, 2, 0.2))];
seed.meals = [];
seed.feedback = [{ id: "f1", meal: { id: "m-out", title: "Chicken and sweet potato fries", items: meal, portion: 460, savedAt: "2026-11-21T12:40:00.000Z" }, status: "eaten", taste: "", notes: "", createdAt: "2026-11-21T12:40:00.000Z", slot: { date: "2026-11-21", slotId: "lunch" } }];
seed.items = [it(200, food("sk", "Skyr", 63, 11, 4, 0.2)), it(120, food("bn", "Banana", 89, 1.1, 23, 0.3))];
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-23T13:15:00+01:00"));
    await p.addInitScript(([s, isNew]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1985, heightCm: 168, weightKg: 62, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [seed, isNew]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.goto(U + "/"); await p.waitForTimeout(900); await p.locator("nav button").filter({ hasText: /^(Plan)$/ }).click(); await p.waitForTimeout(800);
    await p.locator(".week-arrow").first().click(); await p.waitForTimeout(600); await p.getByRole("tab").filter({ hasText: /21/ }).first().click(); await p.waitForTimeout(700);
    await p.locator(".past-plate.past-eaten").first().locator("b").first().click(); await p.waitForTimeout(600);
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) document.querySelectorAll(m).forEach((e) => (e.style.cssText += ";" + MARK));
    const t = document.querySelector(sel); if (!t) return; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement(where, n); }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); });
  const tall = async (p, name, from) => { await p.waitForTimeout(400); await p.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav").forEach((e) => (e.style.display = "none")));
    const r = await p.evaluate((from) => { const a = document.querySelector(from).getBoundingClientRect(), n = [...document.querySelectorAll(".board-note")].pop() ?? document.querySelector(from); const z = n.getBoundingClientRect(); return { y: a.top + scrollY - 10, h: z.bottom - a.top + 40 }; }, from);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name); };
  const plate = async (p, name, html) => { await p.waitForTimeout(900); await p.evaluate(() => { window.scrollTo(0, 0); document.querySelectorAll(".chat-fab, .bottom-nav").forEach((e) => (e.style.display = "")); document.querySelectorAll(".chat-fab").forEach((e) => (e.style.display = "none")); });
    await p.setViewportSize({ width: 390, height: 1100 }); await p.waitForTimeout(300);
    await note(p, ".meal-line", html, [".meal-line"], "afterend"); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
  try {
    let p = await open(false);
    await note(p, ".pm-actions", "Saturday's lunch, opened from Plan. My plate already holds Skyr and Banana. I tap Put it on the Plate again.", [".pm-again"]);
    await tall(p, "1a", ".past-meal"); await clean(p);
    await p.locator(".pm-again").click();
    await plate(p, "1b", "The three foods, no name: the title is made from the foods, grey. Meal and day not set. Skyr and Banana are gone, with no question. Nothing says whether this is Saturday's lunch or a new meal.");
    await p.context().close();
    p = await open(true);
    await note(p, ".pm-copy-line", "<b>New:</b> one line under the button says what it does: a copy, for a new meal; Saturday's lunch stays as it is. I tap Put it on the Plate again.", [".pm-again", ".pm-copy-line"]);
    await tall(p, "2a", ".past-meal"); await clean(p);
    await p.locator(".pm-again").click(); await p.waitForTimeout(400);
    await note(p, ".pm-replace", "<b>New:</b> my plate has foods, so the app asks first. I tap Replace them.", [".pm-replace"]);
    await tall(p, "2b", ".past-meal"); await clean(p);
    await p.locator(".pm-replace-yes").click();
    await plate(p, "2c", "<b>New:</b> the copy comes with its name, Chicken and sweet potato fries. Meal and day stay to be set: it is a new meal, for when I eat it. Saturday's lunch is not touched.");
    await p.context().close();
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
