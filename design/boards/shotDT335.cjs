// Board DT335 (Coach Milan 22 November 2026, 15:48 to 16:19; limits 23 November 13:47): Gain healthy weight as a goal, goals
// greyed when they do not fit, and a target body weight. Main on top (0.3.182), new below. One scratch build of main
// (/home/claude/work/dt335, not committed); board-new turns the new goal step on.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/dt335";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs335", PORT = "3707", U = `http://127.0.0.1:${PORT}`;
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew, body) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-23T14:00:00+01:00"));
    await p.addInitScript((isNew) => { if (localStorage.getItem("seeded")) return; if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, isNew);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.goto(U + "/"); await p.waitForTimeout(900);
    await p.getByRole("button", { name: "Not now" }).click(); await p.waitForTimeout(400);
    await require(path.join(ROOT, "tests/flows/goal-open.cjs"))(p);
    await p.getByRole("button", { name: /^I agree$/ }).click(); await p.waitForTimeout(200); await require(path.join(ROOT, "tests/flows/door.cjs"))(p);
    await p.getByRole("button", { name: /^Female$/ }).click();
    const inputs = p.locator(".calc-way input");
    await inputs.nth(0).fill(String(body.year)); await inputs.nth(1).fill(String(body.cm)); await inputs.nth(2).fill(String(body.kg)); await inputs.nth(2).blur(); await p.waitForTimeout(300);
    if (body.fat) { const f = p.getByLabel(/Body fat %/).first(); if (await f.count()) { await f.fill(String(body.fat)); await f.blur(); await p.waitForTimeout(300); } }
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) document.querySelectorAll(m).forEach((e) => (e.style.cssText += ";" + MARK));
    const t = document.querySelector(sel); if (!t) return; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; t.insertAdjacentElement(where, n); }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
  const tall = async (p, name, from, to) => { await p.waitForTimeout(400); await p.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav").forEach((e) => (e.style.display = "none")));
    const r = await p.evaluate(([from, to]) => { const a = document.querySelector(from).getBoundingClientRect(), n = [...document.querySelectorAll(".board-note")].pop() ?? document.querySelector(to); const z = n.getBoundingClientRect(); return { y: a.top + scrollY - 10, h: z.bottom - a.top + 40 }; }, [from, to]);
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, r.y), width: 390, height: r.h } }); console.log(name); };
  const step = (p) => p.evaluate(() => { const t = [...document.querySelectorAll(".section-title")].find((x) => /goal/i.test(x.textContent)); t?.classList.add("goal-step-title"); });
  try {
    const light = { year: 1998, cm: 168, kg: 48 };
    let p = await open(false, light); await step(p);
    await note(p, ".goal-cards", "48 kg at 168 cm, 28. Every goal can be picked, Lose fat and Recomposition too, though both mean eating less. Nothing is meant for gaining healthy weight; there is no target weight.", [".goal-cards"]);
    await tall(p, "1a", ".goal-step-title", ".goal-cards"); await p.context().close();
    p = await open(true, light); await step(p);
    await note(p, ".goal-cards", "<b>New:</b> Gain healthy weight is a goal of its own. Recomposition and Lose fat are greyed: her weight is low for her height. The list stays whole. I tap Lose fat.", [".goal-pick.greyed", ".goal-pick-wrap:not(.greyed) .goal-pick:not(.greyed)"]);
    await p.evaluate(() => { const c = [...document.querySelectorAll(".goal-pick")].find((x) => /Gain healthy weight/.test(x.textContent)); if (c) c.style.cssText += ";outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px"; });
    await tall(p, "2a", ".goal-step-title", ".goal-cards"); await clean(p);
    await p.locator(".goal-pick.greyed").filter({ hasText: /^Lose fat/ }).click({ force: true }); await p.waitForTimeout(300);
    await note(p, ".goal-why", "<b>New:</b> the reason, in place, from her own numbers; no BMI number. Without a coach: where the numbers come from, and to ask a doctor or a nutrition professional. With a coach: talk to your coach. She cannot unlock it herself; her coach can set any goal.", [".goal-why"]);
    await p.evaluate(() => document.querySelector(".goal-why").scrollIntoView({ block: "center" }));
    await p.evaluate(() => document.querySelector(".goal-why").closest(".goal-pick-wrap").classList.add("why-card"));
    await tall(p, "2b", ".why-card", ".goal-why"); await clean(p);
    await p.locator(".goal-pick").filter({ hasText: /^Gain healthy weight/ }).click(); await p.waitForTimeout(300);
    await p.getByLabel("Your target weight, kg").fill("55"); await p.waitForTimeout(200); await p.getByLabel("Your target weight, kg").blur(); await p.waitForTimeout(300);
    await note(p, ".target-weight", "<b>New:</b> a target body weight, not a change: 55 kg, never plus 7. The pace and the time in words. Above the healthy weight for her height, up to 70 kg, a target is not taken.", [".target-weight"]);
    await tall(p, "2c", ".goal-pick-wrap.on", ".target-weight"); await clean(p);
    await p.evaluate(() => document.querySelectorAll(".chat-fab, .bottom-nav").forEach((e) => (e.style.display = "")));
    await p.getByRole("button", { name: /^Apply from today/ }).click(); await p.waitForTimeout(700); await require(path.join(ROOT, "tests/flows/shop-step.cjs"))(p);
    await require(path.join(ROOT, "tests/flows/me.cjs"))(p);
    await p.locator(".me-rows .menu-row").filter({ hasText: /^Goal/ }).first().click(); await p.waitForTimeout(600);
    await note(p, ".target-row", "<b>New:</b> Me, Goal: the goal sheet has the target, where she is now and how far she has come; it moves with each weigh-in. The sheet's other rows for Gain healthy weight (Food, Weight to expect, Progress means) get their own words with the goal page; empty on this scratch build.", [".target-row"]);
    await p.evaluate(() => document.querySelector(".target-row")?.scrollIntoView({ block: "center" }));
    await tall(p, "2d", ".goal-sheet", ".goal-sheet"); await p.context().close();
    // the heavy side: body fat given
    const heavy = { year: 1990, cm: 168, kg: 82, fat: 38 };
    p = await open(true, heavy); await step(p);
    await p.locator(".goal-pick.greyed").filter({ hasText: /^Gain healthy weight/ }).click({ force: true }); await p.waitForTimeout(300);
    await note(p, ".goal-cards", "<b>New:</b> 82 kg at 168 cm, 36, body fat 38 %: above the healthy range for a woman of her age (33 %). Gain healthy weight and Build muscle are greyed; the reason opens in place. Without body fat given, nothing on this side is greyed.", [".goal-pick.greyed", ".goal-why"]);
    await tall(p, "3a", ".goal-step-title", ".goal-cards"); await clean(p);
    await p.locator(".goal-pick").filter({ hasText: /^Lose fat/ }).click({ force: true }); await p.waitForTimeout(300);
    await p.getByLabel("Your target weight, kg").fill("72"); await p.waitForTimeout(200); await p.getByLabel("Your target weight, kg").blur(); await p.waitForTimeout(300);
    await note(p, ".target-weight", "<b>New:</b> Lose fat takes a target weight too: 72 kg, 10 kg less, at 0.5 to 1 % of her weight a week. Below the healthy weight for her height, under 53 kg, a target is not taken; there is no top limit.", [".target-weight"]);
    await tall(p, "3b", ".goal-pick-wrap.on", ".target-weight"); await p.context().close();
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
