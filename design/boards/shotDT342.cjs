// Board DT342 (Coach Milan 22 November 2026, 22:31 and 22:51): fibre, 0 where it is a fact, and the plate counts what is known
// and says so. Main on top (0.3.184), new below. One scratch build of main (/home/claude/work/dt342, not committed); board-new
// turns the new rule on. The clock is Monday 23 November 2026, 16:00.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/dt342";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs342", PORT = "3707", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const food = (id, name, brand, calories, protein, carbs, fats, fiber, icon, source = "label") => ({ ...seed.foods[0], id, name, brand, source, calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon });
const it = (g, f) => ({ id: f.id + "i", grams: g, locked: false, food: f });
const oil = food("ol", "Olive oil", "Bertolli", 828, 0, 0, 92, null, "🫒");
const bar = food("mb", "Muesli bar", "Corny", 400, 6, 62, 13, null, "🍫");
const base = [it(150, food("ch", "Chicken breast, cooked", "", 165, 31, 0, 3.6, 0, "🍗", "basic")), it(150, food("rc", "Rice, cooked", "", 130, 2.7, 28, 0.3, 0.4, "🍚", "basic")), it(200, food("br", "Broccoli, steamed", "", 35, 2.4, 4.4, 0.4, 2.6, "🥦", "basic")), it(10, oil)];
seed.foods = [...seed.foods, oil, bar];
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew, items) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-23T16:00:00+01:00"));
    await p.addInitScript(([s, isNew]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1985, heightCm: 168, weightKg: 62, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [{ ...seed, meals: [], items }, isNew]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.goto(U + "/"); await p.waitForTimeout(900); await p.locator("nav button").filter({ hasText: /^(Plate)$/ }).click(); await p.waitForTimeout(900);
    await p.evaluate(() => document.querySelectorAll(".chat-fab").forEach((e) => (e.style.display = "none")));
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) document.querySelectorAll(m).forEach((e) => (e.style.cssText += ";" + MARK));
    const t = document.querySelector(sel); if (!t) return; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement(where, n); }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); });
  // a part of the page as one tall picture, from one element to the last note
  const tall = async (p, name, from, to) => { await p.waitForTimeout(400); await p.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav").forEach((e) => (e.style.display = "none")));
    const r = await p.evaluate(([from, to]) => { const a = document.querySelector(from).getBoundingClientRect(); const z = ([...document.querySelectorAll(".board-note")].pop() ?? document.querySelector(to ?? from)).getBoundingClientRect(); const e = to ? (to.startsWith("LAST:") ? [...document.querySelectorAll(to.slice(5))].pop() : document.querySelector(to)).getBoundingClientRect() : z; return { y: a.top + scrollY - 10, h: Math.max(z.bottom, e.bottom) - a.top + 30 }; }, [from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name); };
  try {
    let p = await open(false, base);
    await note(p, ".readout-letters", "Chicken, rice, broccoli, and olive oil from a pack. The pack gives no fibre: oil has none. The whole plate reads <b>fi?</b>.", [".readout-letters"]);
    await tall(p, "1a", ".readout", "LAST:.swipe"); await clean(p);
    await p.locator(".letters-row").first().click(); await p.waitForTimeout(400);
    await note(p, ".nt-in.nt-total", "Fibre: <b>?</b>. The broccoli and the rice have about 6 g; one empty value hides it all.", [".nt"]);
    await tall(p, "1b", ".nt", ".board-note"); await p.context().close();
    p = await open(true, base);
    await note(p, ".readout-letters", "<b>New:</b> olive oil counts as 0 fibre: none by nature. The plate has a real fibre letter, <b>fi</b>: under the day's rate.", [".readout-letters"]);
    await tall(p, "2a", ".readout", "LAST:.swipe"); await clean(p);
    await p.locator(".letters-row").first().click(); await p.waitForTimeout(400);
    await note(p, ".nt-fibre", "<b>New:</b> fibre 6 g, and one line says olive oil counts as 0. The oil's own values stay as on its pack.", [".nt-fibre"]);
    await tall(p, "2b", ".nt", ".board-note"); await p.context().close();
    p = await open(true, [...base, it(45, bar)]);
    await p.locator(".letters-row").first().click(); await p.waitForTimeout(400);
    await note(p, ".nt-fibre", "<b>New:</b> a muesli bar whose pack gives no fibre. The plate counts what is known: <b>at least 6 g</b>, and says which food has no value. The letter stays <b>fi?</b>: the bar could lift it. With the known part already On plan, the letter is shown.", [".nt-fibre"]);
    await tall(p, "2c", ".readout", ".board-note"); await clean(p);
    await p.locator(".name-link").filter({ hasText: /Muesli bar/ }).click(); await p.waitForTimeout(600);
    await p.setViewportSize({ width: 390, height: 1000 }); await p.waitForTimeout(300);
    await note(p, ".fibre-line", "<b>New:</b> the muesli bar's card says there is no fibre value and where to add it from the pack. No guessed number.", [".fibre-line"]);
    await p.evaluate(() => document.querySelector(".board-note").scrollIntoView({ block: "end" })); await p.waitForTimeout(400);
    await p.screenshot({ path: `${R}/2d.png` }); console.log("2d"); await p.context().close();
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
