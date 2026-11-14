// Board DT302 (Coach Milan 14 November 17:29 to 17:54, Draw): the day marks on a Clients card. One bar shape in every phase:
// the first two weeks as two rows of seven from the client's first day, then one row Monday to Sunday; weekend days marked;
// green the day went as meant, amber worth a look, outline today, grey still to come; a dot under a bar is a weigh-in;
// a key line under the rows says what green and amber mean in that phase.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/platemate-scanner", PORT = "3517", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = []; seed.meals = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage(); p.on("pageerror", (e) => console.log("ERR", e.message));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1500);
    await p.locator(".bottom-nav button").filter({ hasText: "Clients" }).click(); await p.waitForTimeout(1200);
    await p.evaluate(() => { const f = document.querySelector(".chat-fab"); if (f) f.style.visibility = "hidden"; const rows = [...document.querySelectorAll(".cw-row")]; rows[0].id = "nina"; const n2 = rows.filter((r) => /Nina/.test(r.textContent))[1]; if (n2) n2.id = "nina2"; const l = rows.find((r) => /Lena/.test(r.textContent)); if (l) l.id = "lena"; });
    return p;
  };
  const note = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement("beforebegin", d); d.id = "nt"; }, { t, NOTE, sel });
  const shot = async (p, name, sel, off = 120) => { await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); }, { sel, off }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  // the new marks, drawn into a card: cells = [{ state: "good"|"look"|"today"|"none", weighed, weekend }]
  const draw = (p, sel, cells, key, foot) => p.evaluate(({ sel, cells, key, foot, mark }) => {
    const card = document.querySelector(sel);
    const old = card.querySelector(".cw-bars-row") || card.querySelector(".ft-squares")?.parentElement; if (!old) return;
    const cell = (c) => { const bg = c.state === "good" ? "var(--high)" : c.state === "look" ? "var(--mid)" : c.state === "today" ? "var(--surface)" : "var(--line)";
      const edge = c.state === "today" ? "box-shadow:0 0 0 2px var(--brand) inset;" : "";
      return `<span style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:5px 3px;border-radius:8px;${c.weekend ? "background:#e7edf8;" : ""}"><span style="display:block;width:100%;height:12px;border-radius:4px;background:${bg};${edge}"></span><i style="display:block;width:6px;height:6px;border-radius:50%;background:${c.weighed ? "var(--brand)" : "transparent"}"></i></span>`; };
    const rows = []; for (let i = 0; i < cells.length; i += 7) rows.push(`<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">${cells.slice(i, i + 7).map(cell).join("")}</div>`);
    const html = `<div id="newmarks" style="width:100%;display:flex;flex-direction:column;gap:4px;margin-top:6px;${mark}">${rows.join("")}<small style="display:block;color:var(--muted);font-size:var(--fs-small);line-height:1.4;margin-top:2px">${key}</small><small style="display:block;font-weight:900;color:var(--muted);font-size:var(--fs-small);text-align:right">${foot}</small></div>`;
    const foot0 = card.querySelector(".ft-rowfoot"); if (foot0) foot0.remove();
    old.outerHTML = html;
  }, { sel, cells, key, foot, mark });
  const today = new Date(); const ymd = (d) => d.toISOString().slice(0, 10);
  // Nina's week: Monday to Sunday; weigh-ins every other day back from today (as the demo has them)
  const ninaCells = async (p) => p.evaluate(() => [...document.querySelectorAll("#nina .cw-bar")].map((x) => x.className));
  const lenaCells = async (p) => p.evaluate(() => [...document.querySelectorAll("#lena .ft-sq")].map((x) => x.className));
  const newAll = async (p) => {
    const nb = await ninaCells(p); const dow = (today.getDay() + 6) % 7;
    const nc = nb.map((c, i) => ({ state: /lived/.test(c) ? "good" : /changed/.test(c) ? "look" : /open/.test(c) ? "today" : "none", weighed: i <= dow && (dow - i) % 2 === 0, weekend: i >= 5 }));
    const nKey = ["Green: lived by the plan", nc.some((c) => c.state === "look") ? "Amber: changed from the plan" : null, "Outline: today", "Dot: weigh-in", "Shaded: weekend"].filter(Boolean).join(" · ");
    const nFoot = (await p.evaluate(() => document.querySelector("#nina .cw-bars-row small")?.textContent || "")) || "3 days lived by the plan";
    const lb = await lenaCells(p); const ti = lb.findIndex((c) => /today/.test(c)); const start = new Date(today); start.setDate(today.getDate() - ti);
    const lc = lb.map((c, i) => { const d = new Date(start); d.setDate(start.getDate() + i); const wd = d.getDay(); return { state: /full/.test(c) ? "good" : /part/.test(c) ? "look" : /today/.test(c) ? "today" : "none", weighed: /weighed/.test(c), weekend: wd === 0 || wd === 6 }; });
    const lKey = [lc.some((c) => c.state === "good") ? "Green: full day" : null, lc.some((c) => c.state === "look") ? "Amber: not fully logged" : null, "Outline: today", lc.some((c) => c.weighed) ? "Dot: weigh-in" : null, "Shaded: weekend"].filter(Boolean).join(" · ");
    const lFoot = await p.evaluate(() => document.querySelector("#lena .ft-rowfoot")?.textContent || "");
    await draw(p, "#nina", nc, nKey, nFoot); await draw(p, "#nina2", nc, nKey, nFoot); await draw(p, "#lena", lc, lKey, lFoot);
  };
  try {
    // NOW 1: Clients, Nina's card in a normal week
    let p = await open(); await p.evaluate((m) => { document.querySelector("#nina .cw-bars-row").style.cssText += ";" + m; }, mark);
    await note(p, "1. Now: Clients. Nina, week 3: seven thin bars and no word on what they mean.", "#nina");
    await shot(p, "c302a", "#nt", 140);
    // NOW 2: Lena's card in her first two weeks
    p = await open(); await p.evaluate((m) => { document.querySelector("#lena .ft-squares").style.cssText += ";" + m; }, mark);
    await note(p, "2. Now: Lena, first two weeks: fourteen squares in one row, another shape, and no key. Amber here means not fully logged.", "#lena");
    await shot(p, "c302b", "#nt", 140);
    // NOW 3: her page
    p = await open(); await p.locator("#lena .client-open").click(); await p.waitForTimeout(1000);
    await p.evaluate(() => { const f = document.querySelector(".chat-fab"); if (f) f.style.visibility = "hidden"; });
    await note(p, "3. A tap on a card opens the client's page.", "main > *:first-child");
    await shot(p, "c302c", null);
    // NEW 1: Nina
    p = await open(); await newAll(p);
    await note(p, "1. New: one row, Monday to Sunday. The weekend shaded. A dot under a bar is a weigh-in. The key line says what the colours mean this week.", "#nina");
    await shot(p, "c302d", "#nt", 140);
    // NEW 2: Lena, two rows of seven from her first day
    p = await open(); await newAll(p);
    await note(p, "2. New: the first two weeks as two rows of seven, from her first day. The same bars, the same colours idea: amber here means not fully logged, and the key line says so.", "#lena");
    await shot(p, "c302e", "#nt", 140);
  } finally { await b.close(); server.kill(); }
})();
