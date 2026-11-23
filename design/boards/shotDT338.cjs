// Board DT338 (Coach Milan 22 November 2026, 17:57 to 18:01; Draw 23 November 09:00): what the PD colours mean, one scale on the
// Goal page and behind the PD number on the Plate. Main on top (0.3.178), new below. One scratch build of main
// (/home/claude/work/dt338, not committed); the flag board-new turns the scale on.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/dt338";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs338", PORT = "3702", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.meals = []; seed.feedback = [];
const eggs = seed.foods.find((f) => f.name === "Eggs");
seed.items = [{ id: "e", food: eggs, grams: 52, locked: false }];
seed.goals = { ...seed.goals, calories: 2000, protein: 106, fats: 67, carbs: 250 };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-23T08:00:00+01:00"));
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "" }) }));
    await p.addInitScript(([s, isNew]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1995, heightCm: 168, weightKg: 62, kitchens: ["German", "Balkan", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [seed, isNew]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) { const e = document.querySelector(m); if (e) e.style.cssText += ";" + MARK; }
    const t = document.querySelector(sel); const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; (t ?? document.body).insertAdjacentElement(t ? where : "afterbegin", n); }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
  const top = (p, sel, off = 80) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); if (!e) return; e.scrollIntoView({ block: "start" }); window.scrollBy(0, -off); }, [sel, off]);
  const shot = async (p, name) => { await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
  try {
    for (const flow of ["1", "2"]) {
      const N = flow === "2"; let p = await open(N);
      // the Goal page
      await p.goto(U + "/me/goal"); await p.waitForTimeout(1300);
      await top(p, ".goal-head", 90);
      if (N) await note(p, ".pd-scale", "<b>New:</b> under the PD target, one scale: the five colours, each with its name and its range in my own numbers.", [".goal-head .pd-scale"]);
      else await note(p, ".goal-head .plan-row", "The Goal page: my PD target, 5.3. Nothing says what the colours of PD mean.", [".goal-head .plan-row"]);
      await shot(p, `${flow}a`); await clean(p);
      // the Plate: one egg, PD 8.4, in the High colour
      await p.goto(U + "/plate"); await p.waitForTimeout(1300);
      await require(path.join(ROOT, "tests/flows/set-meal.cjs"))(p, "Breakfast"); await p.waitForTimeout(400);
      await top(p, ".readout", 70);
      await note(p, ".readout", N ? "<b>New:</b> one egg for breakfast, PD 8.4, in the High colour, and the words say so: High, above your plan. I tap the PD number." : "One egg for breakfast, PD 8.4, in the High colour, and the words say fits your plan. A tap on the PD number does nothing; nothing says what the colour means.", N ? [".readout-mid b", ".readout-mid span"] : [".readout-mid b"]);
      await shot(p, `${flow}b`); await clean(p);
      if (N) {
        await p.locator(".readout-mid b").first().click(); await p.waitForTimeout(400);
        await top(p, ".readout", 70);
        await note(p, ".readout", "<b>New:</b> the same scale opens, with a mark where this plate sits: High, 8.0 to 13.3. A second tap closes it.", [".readout .pd-scale"]);
        await shot(p, "2c"); await clean(p);
      }
      await p.context().close();
    }
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
