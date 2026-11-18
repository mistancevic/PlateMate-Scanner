// Board B150 (Coach Milan, 18 November 2026, 19:21, with a screenshot of his Plan): a photo from another day, logged under
// a meal of today, shows on the photo's day as a second dinner while that day's planned dinner still waits.
// Drawn on the app as built in 0.3.159: Sunday 15 November 18:00, a photo from Saturday 15:57, dinners planned on both days.
// Run: ROOT=/home/claude/pm159 BOARDS_SHOTS=... CHROME=/usr/bin/google-chrome node shotB150.cjs
const ROOT = process.env.ROOT || "/home/claude/pm159";
const start = require(ROOT + "/tests/flows/plate157.cjs");
const fs = require("node:fs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs150"; fs.mkdirSync(R, { recursive: true });
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", RED = "outline:3px solid #d13a3a;outline-offset:2px;border-radius:12px", TAP = "outline:4px solid #f0a81c;outline-offset:2px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`, RNOTE = NOTE.replace(/#2a72d9/g, "#d13a3a");
const noNav = (p) => p.addStyleTag({ content: "nav, .chat-fab { display: none !important }" });
const shot = async (p, name, h, y = 0) => { if (!y) await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(350); const full = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y, width: 390, height: Math.min(h || full, full - y) } }); console.log("shot", name); };
const ev = (p, fn, extra = {}) => p.evaluate(fn, { MARK, RED, TAP, NOTE, RNOTE, ...extra });
const topOf = (p, sel, pad = 120) => p.evaluate(({ sel, pad }) => { const e = document.querySelector(sel); return Math.max(0, e.getBoundingClientRect().top + scrollY - pad); }, { sel, pad });
(async () => { const h = await start("3697"); try {
  const sd0 = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); const F = (n) => sd0.foods.find((f) => f.name.startsWith(n));
  const bowl = { title: "Chicken rice bowl", kcal: 574, protein: 64, source: "plate", items: [{ id: "a", food: F("Rice"), grams: 200, locked: false }, { id: "b", food: F("Chicken"), grams: 190, locked: false }], portion: 390 };
  const planned = { "2026-11-14": { dinner: bowl }, "2026-11-15": { dinner: bowl } };
  const toRead = async () => { const p = await h.open({ foods: [], planned }); await h.toPhoto(p, true); await h.readIt(p);
    // I said I ate it then: Ate it, a meal of today first, as Coach Milan did, then the X
    await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(500); await p.locator(".plate-end .pcal-day").filter({ hasText: "Sun 15" }).click(); await p.waitForTimeout(400); await h.row(p, "Lunch", ".plate-end").click(); await p.waitForTimeout(800);
    await p.locator(".plan-line-x").click(); await p.waitForTimeout(500); return p; };
  const satPlan = async (p) => { await h.tab(p, "Plan"); await p.waitForTimeout(500); await p.locator("main button").filter({ hasText: /^Sat 14/ }).first().click(); await p.waitForTimeout(700); await p.evaluate(() => { const t = document.querySelector("[role=status] button, .toast button"); if (t) t.click(); }); };
  // ---- now
  let p = await toRead();
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(500); await noNav(p);
  console.log("pencil opens on", await p.locator(".meal-line-open .pcal-day.on").innerText());
  await ev(p, ({ RED, RNOTE, TAP }) => { document.querySelector(".meal-line-open .pcal-day.on").style.cssText += ";" + RED; const r = [...document.querySelectorAll(".meal-line-open .pcal-row")].find((x) => /Dinner/.test(x.textContent)); r.style.boxShadow = "inset 0 0 0 4px #f0a81c";
    const n = document.createElement("div"); n.style.cssText = RNOTE; n.innerHTML = "<b>As it is in 0.3.159.</b> The photo is from Saturday 15:57, and I said I ate it then. The pencil opens on <b>today</b>. Dinner here is today's dinner, and nothing says so until I read the line after the tap."; document.querySelector(".meal-line-open .pcal-rows").insertAdjacentElement("afterend", n); });
  await shot(p, "n_0", 900);
  await p.context().close();
  // ---- proposed
  p = await toRead();
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(500); await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Sat 14" }).click(); await p.waitForTimeout(500); await p.addStyleTag({ content: ".chat-fab { display: none !important } nav { visibility: hidden }" });
  await ev(p, ({ MARK, NOTE }) => { const d = document.querySelector(".meal-line-open .pcal-day.on"); d.style.cssText += ";" + MARK; const rows = [...document.querySelectorAll(".meal-line-open .pcal-row")]; const r = rows.find((x) => /Lunch/.test(x.textContent)); if (r) { r.style.background = "#e3edff"; const b = r.querySelector("b") || r.firstElementChild; if (b && !/✓/.test(b.textContent)) b.textContent = "✓ " + b.textContent; }
    const c = document.querySelector(".meal-line-open .pcal"); const q = document.createElement("b"); q.className = "pcal-q"; q.textContent = "The photo was taken on Saturday, 15:57."; q.style.cssText = "display:block;margin:0 0 8px;" + MARK; c.insertAdjacentElement("afterbegin", q);
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> For a photo I ate on another day the pencil opens where Ate it already opens: on the photo's day, with the photo's time as a reference above and the nearest meal marked. Today is one tap away."; document.querySelector(".meal-line-open .pcal-rows").insertAdjacentElement("afterend", n); });
  await shot(p, "n_2", 980);
  await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(900);
  await p.locator(".rv-eat .pa-opt").first().click(); await p.waitForTimeout(300); await p.locator(".rv-done").click(); await p.waitForTimeout(1500);
  console.log("FB2:", JSON.stringify((await h.st(p)).feedback.map((f) => ({ slot: f.slot, createdAt: f.createdAt }))));
  await p.addStyleTag({ content: "nav { visibility: visible !important }" }); await satPlan(p); await noNav(p);
  await ev(p, ({ MARK, NOTE }) => { const e = document.querySelector(".past-eaten"); if (e) e.style.cssText += ";" + MARK; const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>After the fix.</b> One dinner on Saturday: the one I ate. It took the place of the planned Chicken rice bowl, so that one no longer asks. A record's day and its meal's day are always the same day."; (document.querySelector(".past-add") || e).insertAdjacentElement("afterend", n); });
  await shot(p, "n_3", 1100, await topOf(p, ".past-eaten", 330).catch(() => 0));
  // the record as it is on Coach Milan's phone: the photo's day and time, with the dinner of another day
  await p.evaluate(() => { const st = JSON.parse(localStorage.getItem("platemate-pilot-v1")); st.feedback[0].slot.date = "2026-11-15"; st.feedback[0].createdAt = "2026-11-14T14:57:00.000Z"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(st)); });
  await p.reload(); await p.waitForTimeout(1500);
  await satPlan(p); await noNav(p);
  await ev(p, ({ RED, RNOTE }) => { const e = document.querySelector(".past-eaten"), q = document.querySelector(".past-planned"); if (e) e.style.cssText += ";" + RED; if (q) q.style.cssText += ";" + RED;
    const n = document.createElement("div"); n.style.cssText = RNOTE; n.innerHTML = "<b>As it is in 0.3.159.</b> Saturday has two dinners: the one I ate, at the photo's time, and the planned one, still asking. The record holds Saturday's time and today's dinner, so Saturday's dinner never closes, and today's dinner counts as eaten."; (q || e || document.querySelector("main")).insertAdjacentElement("afterend", n); });
  await shot(p, "n_1", 1100, await topOf(p, ".past-eaten", 330).catch(() => 0));
  await p.context().close();
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 700)); process.exit(1); });
