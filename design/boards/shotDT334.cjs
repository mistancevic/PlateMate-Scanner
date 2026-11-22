// Board DT334 (Coach Milan 22 November 2026, 15:35 to 15:43; Draw 23 November 00:28): up to 3 kitchens you cook, and a chip for
// trying new kitchens. The flow before on top (main, 0.3.177), new below. One scratch build of main (/home/claude/work/dt334,
// not committed); the flag board-new turns the new behaviour on.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/dt334";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs334", PORT = "3701", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.foods = [];
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew, setup = true) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript(([s, isNew, setup]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1990, heightCm: 170, weightKg: 66, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 }, ...(setup ? {} : { kitchens: ["Balkan", "Italian", "Greek"], tasteChips: { like: [], not: [], how: ["Trying new kitchens"] } }) }));
      if (!setup) localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-28T16:00:00Z", consentBodyAt: "2026-10-28T16:00:00Z", declaredAt: "2026-10-28T16:00:00Z", aiConfirmedAt: "2026-10-28T16:00:00Z" }));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [seed, isNew, setup]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.goto(U + "/"); await p.waitForTimeout(1300);
    if (setup) { await p.getByRole("button", { name: /^Maintain/ }).first().click(); await p.waitForTimeout(300); await p.getByRole("button", { name: /^Apply from today/ }).click(); await p.waitForTimeout(800); }
    return p;
  };
  const note = (p, sel, html, marks = [], where = "afterend") => p.evaluate(([sel, html, marks, MARK, NOTE, where]) => { for (const m of marks) { const e = document.querySelector(m); if (e) e.style.cssText += ";" + MARK; }
    const t = document.querySelector(sel); const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; (t ?? document.body).insertAdjacentElement(t ? where : "afterbegin", n); }, [sel, html, marks, MARK, NOTE, where]);
  const clean = (p) => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
  const top = (p, sel, off = 80) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); if (!e) return; e.scrollIntoView({ block: "start" }); window.scrollBy(0, -off); }, [sel, off]);
  const shot = async (p, name) => { await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
  const group = (p) => p.locator(".shop-step").getByRole("group", { name: "The kitchens you cook" });
  try {
    // DT334.1, main: setup, the kitchens you cook, no limit
    let p = await open(false);
    await top(p, ".shop-step .kitchens", 120);
    await note(p, ".shop-step .kitchens", "Setup, 5. Where you shop and cook. The line says Pick one or more. I pick what I like to eat.", [".shop-step .kitchens"], "beforebegin");
    await shot(p, "1a"); await clean(p);
    const chips = group(p).getByRole("button"); const n = await chips.count();
    for (let i = 0; i < Math.min(10, n); i++) { await chips.nth(i).click(); await p.waitForTimeout(120); }
    console.log("PICKED", await p.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).kitchens.join(", ")));
    await p.setViewportSize({ width: 390, height: 2600 });
    await top(p, ".shop-step .kitchens", 120);
    await note(p, ".shop-step .kitchens", "Ten kitchens picked, nothing stops it, and each gets its block of dishes below. Chef Mealan gets only the first 8, the rest are dropped without a word.", [".shop-step .kitchens"], "beforebegin");
    await shot(p, "1b"); await clean(p); await p.context().close();
    // DT334.2, new: up to 3
    p = await open(true);
    await top(p, ".shop-step .kitchens", 120);
    await note(p, ".shop-step .kitchens", "<b>New:</b> the line says Pick up to 3: Chef Mealan cooks in these first.", [".shop-step .kitchens small"], "beforebegin");
    await shot(p, "2a"); await clean(p);
    for (const k of ["Balkan", "Italian", "Greek"]) { await group(p).getByRole("button", { name: k, exact: true }).click(); await p.waitForTimeout(150); }
    await group(p).getByRole("button", { name: "Indian", exact: true }).click(); await p.waitForTimeout(300);
    console.log("PICKED", await p.evaluate(() => JSON.parse(localStorage.getItem("chefmealan-personal")).kitchens.join(", ")));
    await p.setViewportSize({ width: 390, height: 1500 });
    await top(p, ".shop-step .kitchens", 120);
    await note(p, ".kitchens-full", "<b>New:</b> three are picked; a tap on a fourth, Indian, picks nothing and says Up to 3. Tap one off first.", [".kitchens-full"], "afterend");
    await shot(p, "2b"); await clean(p); await p.context().close();
    // DT334.3, new: the chip under How I eat
    p = await open(true, false);
    await p.goto(U + "/me/lifestyle"); await p.waitForTimeout(1200);
    await top(p, ".taste-card", 80);
    await p.evaluate(() => { const g = [...document.querySelectorAll(".taste-group")].find((x) => /How I eat/.test(x.textContent || "")); if (g) g.id = "how-i-eat"; });
    await note(p, "#how-i-eat", "<b>New:</b> a chip under How I eat: Trying new kitchens. On, one of Chef Mealan's three ideas may come from a kitchen outside the 3; the other two stay in them.", ["#how-i-eat"], "afterend");
    await top(p, "#how-i-eat", 260);
    await shot(p, "3a"); await clean(p); await p.context().close();
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
