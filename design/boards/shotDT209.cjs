// Board DT209 (Coach Milan 1 November 22:33 to 22:44): a coach in My clients taps Recipes and gets his own recipes, not a page
// that sends him back to Clients; Where I shop and cook leads to Your summary; My coach is its own row under Your summary, and
// a coach account has none. Drawn into 0.3.49; nothing in the repo changes.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3387";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8")); seed.items = [];
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const fresh = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" });
    const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-region", "munich");
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    return p;
  };
  const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } for (const t of document.querySelectorAll(".toast")) t.style.display = "none"; window.scrollTo(0, 0); });
  const shot = async (p, name, h) => { await p.waitForTimeout(300); await flat(p); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: !h, ...(h ? { clip: { x: 0, y: 0, width: 390, height: h } } : {}) }); console.log("shot", name); };
  const note = (p, sel, t, where = "before") => p.evaluate(({ sel, t, NOTE, where }) => { const el = document.querySelector(sel); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; el[where](d); }, { sel, t, NOTE, where });
  // a. now: My clients, Recipes, no client picked
  let p = await fresh(); await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1300);
  await p.locator(".coach-switch, [role=radiogroup]").getByRole("radio", { name: "My clients" }).first().click(); await p.waitForTimeout(800);
  const barMine = await p.evaluate(() => document.querySelector(".bottom-nav").innerHTML);
  await p.locator(".bottom-nav button").filter({ hasText: "Recipes" }).click(); await p.waitForTimeout(800);
  await note(p, "main > *:first-child", "Now: on Clients, then Recipes in the bar, with no client picked: a page that sends you back to Clients. Today and Plan say the same.");
  await shot(p, "r209a", 844); await p.context().close();
  // b. new: your own recipes, in both views
  p = await fresh(); await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1300);
  await p.locator(".bottom-nav button").filter({ hasText: "Recipes" }).click(); await p.waitForTimeout(1200);
  await p.evaluate(({ html, mark }) => { const n = document.querySelector(".bottom-nav"); const bs = [...n.querySelectorAll("button")]; const act = bs.find((x) => /Recipes/.test(x.textContent)).className, idle = bs.find((x) => /Today/.test(x.textContent)).className;
    n.innerHTML = html; for (const btn of n.querySelectorAll("button")) { const on = /Recipes/.test(btn.textContent); btn.className = on ? act : idle; if (on) btn.style.cssText += ";" + mark; } }, { html: barMine, mark });
  await note(p, "main > *:first-child", "New: Recipes is always your own, in My day and in My clients: the recipes you write and share with clients. Today and Plan still follow the client you pick on Clients; a client's own recipes are on that client's page in Clients.");
  await shot(p, "r209b", 844); await p.context().close();
  // c, d. Where I shop and cook: its Next
  for (const v of ["now", "new"]) {
    p = await fresh(); await p.goto(U + "/me/shop"); await p.waitForTimeout(1400);
    await p.evaluate(({ v, mark }) => { const n = [...document.querySelectorAll(".next-step")].pop(); if (!n) return; n.style.cssText += ";" + mark; if (v === "new") { const btn = n.querySelector(".pill"); btn.innerHTML = btn.innerHTML.replace("Coach", "Your summary"); n.querySelector("small").textContent = "Everything you told Chef Mealan, and what it does"; } }, { v, mark });
    await note(p, ".next-step", v === "now" ? "Now: the last setup step leads to My coach, a step most people skip." : "New: Where I shop and cook leads to Your summary, where the setup ends.");
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(300); await flat(p); await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); 
    const y = await p.evaluate(() => { const d = [...document.querySelectorAll("div")].find((x) => x.style.background && x.style.background.includes("255, 248, 214")); return d ? d.getBoundingClientRect().top + scrollY - 120 : 0; });
    await p.screenshot({ path: `${R}/r209${v === "now" ? "c" : "d"}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, y), width: 390, height: 330 } }); console.log("shot shop", v);
    await p.context().close();
  }
  // e, f, g. Me's rows: now; new for a person; new for a coach
  for (const v of ["now", "new", "coach"]) {
    p = await fresh(); await p.goto(U + "/me"); await p.waitForTimeout(1400);
    await p.evaluate(({ v, mark }) => {
      const list = document.querySelector(".me-rows"); list.style.cssText += ";" + mark;
      const rows = [...list.querySelectorAll(".menu-row")], by = (n) => rows.find((r) => r.querySelector("b")?.textContent.trim() === n);
      const coach = by("My coach"), sum = by("Your summary");
      if (v === "new" && coach && sum) { sum.after(coach); const gap = document.createElement("div"); gap.style.cssText = "height:14px"; sum.after(gap); }
      if (v === "coach" && coach) coach.remove();
    }, { v, mark });
    await note(p, ".me-rows", v === "now" ? "Now: My coach sits among the setup steps, between Where I shop and cook and Your summary." : v === "new" ? "New, for a person: the setup steps end on Your summary; My coach is its own row under it: your coach and what they see, or join with a code." : "New, for a coach account: no My coach. Your clients are one tap away: the switch at the top of Today and Clients in the bar.");
    await p.evaluate(() => { const l = document.querySelector(".me-rows"); window.scrollTo(0, l.getBoundingClientRect().top + scrollY - 200); });
    await p.waitForTimeout(200); await flat(p);
    const y = await p.evaluate(() => { const l = document.querySelector(".me-rows"); return l.getBoundingClientRect().top + scrollY - 150; });
    await p.screenshot({ path: `${R}/r209${v === "now" ? "e" : v === "new" ? "f" : "g"}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, y), width: 390, height: 900 } }); console.log("shot me", v);
    await p.context().close();
  }
  await b.close();
})();
