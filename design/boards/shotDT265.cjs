// Board DT265 (Coach Milan 8 November 15:12 and 15:55): a demo account a coach can open before any pitch. "Now": 0.3.115,
// the home page's coach section. "New": drawn in by DOM over the local coach demo (?coachdemo), which is off on the live app.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3489", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = []; seed.meals = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = "font-family:Nunito,system-ui,sans-serif;color:#172742";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (path, adult = true) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, seed);
    if (adult) await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + path); await p.waitForTimeout(1600); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel) => { await p.evaluate((sel) => { const e = sel && document.querySelector(sel); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 90); else window.scrollTo(0, 0); }, sel); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const BANNER = (days, cls) => `<div class="${cls}" style="${mark};margin:12px;padding:12px 14px;background:#e6f0ff;display:flex;flex-direction:column;gap:6px;${F}"><b style="font-size:16px">Demo coach · ${days} days left</b><span style="font-size:14px;line-height:1.45">Nina and Lena are examples, made from Coach Milan's own cooked week. Everything you tap here is yours to try; nothing reaches a real person.</span></div>`;
  // 1. the coach section, now and new
  let p = await open("/?home", false);
  await note(p, "Now (0.3.115): a coach reads about Chef Mealan and asks for a code. Nothing to open, nothing to tap, before Coach Milan answers.", ".l-coach-act");
  await p.evaluate((mark) => { document.querySelector(".l-coach-act").style.cssText += ";" + mark; }, mark);
  await shot(p, "r265a", ".bnote");
  p = await open("/?home", false);
  await p.evaluate(({ mark, F }) => { const a = document.querySelector(".l-coach-act"); a.insertAdjacentHTML("beforebegin", `<div class="demo-try" style="${mark};padding:8px;margin:8px 0;${F}"><button class="pill pill-primary pill-wide" style="min-height:48px">Try it as a coach, 14 days ›</button><small style="display:block;margin-top:8px;font-size:14px;color:#53627f;line-height:1.45">Sign in with Google or your email. You get two example clients and a real week to open; no code, no card.</small></div>`); }, { mark, F });
  await note(p, "New: Try it as a coach opens a demo account of your own, 14 days, after a sign in. Get a coach code stays for the real thing.", ".demo-try");
  await shot(p, "r265b", ".bnote");
  // 2. Clients with the two example clients
  p = await open("/clients?coachdemo");
  await p.evaluate((html) => { const m = [...document.querySelectorAll("main")].pop(); m.insertAdjacentHTML("afterbegin", html); }, BANNER(14, "demo-banner"));
  await note(p, "New: Clients opens with Nina and Lena, two example clients built from Coach Milan's own cooked week: plates, photos, cards, a goal set by the coach. Each demo is its own account; two coaches never see each other's taps.", ".demo-banner", "afterend");
  await shot(p, "r265c");
  // 3. a client's week
  p = await open("/clients?coachdemo");
  const row = p.locator(".client-card, .history-row, .client-row").first();
  if (await row.count()) { await row.click().catch(() => {}); await p.waitForTimeout(900); }
  await p.evaluate((html) => { const m = [...document.querySelectorAll("main")].pop(); m.insertAdjacentHTML("afterbegin", html); }, BANNER(14, "demo-banner"));
  await note(p, "New: a client's page as the coach sees it. The demo coach can set a goal, answer a card and send a note; the AI answers too, up to 30 calls in the 14 days.", ".demo-banner", "afterend");
  await shot(p, "r265d");
  // 4. the end of the demo
  p = await open("/clients?coachdemo");
  await p.evaluate(({ mark, F }) => { const m = [...document.querySelectorAll("main")].pop(); m.insertAdjacentHTML("afterbegin", `<div class="demo-end" style="${mark};margin:12px;padding:14px;background:#fff;display:flex;flex-direction:column;gap:10px;${F}"><b style="font-size:18px">Your demo ends in 2 days</b><span style="font-size:15px;line-height:1.5">Keep coaching with Chef Mealan. Plans from €49 a month for 10 clients, your own seat free, from launch. Until then, your clients join with your code.</span><button class="pill pill-primary pill-wide" style="min-height:48px">Get my coach code ›</button><button class="link" style="min-height:44px">Not yet</button></div>`); }, { mark, F });
  await note(p, "New: from day 12 the demo says what comes next: the first plan of the pricing paper (H1) as a line, from launch, nothing charged. Get my coach code sends the request with I am a coach already picked; Coach Milan answers as today.", ".demo-end", "afterend");
  await shot(p, "r265e");
  // 5. day 15 with no plan (Coach Milan 16:04): the seat is free only inside a plan
  p = await open("/clients?coachdemo");
  await p.evaluate(({ mark, F }) => { const m = [...document.querySelectorAll("main")].pop(); m.querySelectorAll("section, .label, .card").forEach((x) => { x.style.opacity = ".35"; }); m.insertAdjacentHTML("afterbegin", `<div class="demo-over" style="${mark};margin:12px;padding:14px;background:#fff;display:flex;flex-direction:column;gap:10px;${F}"><b style="font-size:18px">Your demo is over</b><span style="font-size:15px;line-height:1.5">The example clients and Chef Mealan's answers are off. Your account stays. Coach with your own clients, or join the beta as a member. Payment opens at launch; until then both doors go to Coach Milan.</span><button class="pill pill-primary pill-wide" style="min-height:48px">Get my coach code ›</button><button class="pill pill-wide" style="min-height:48px">Join the beta ›</button></div>`); }, { mark, F });
  await note(p, "New: day 15 with no plan. The coach's own seat is free only inside a paid plan, so a demo with no plan ends here: the account stays, the examples and the AI go, two doors stay open. Until payment exists (PR3) both lead to the request form; Join the beta becomes Join as a member then.", ".demo-over", "afterend");
  await shot(p, "r265f");
  await b.close(); server.kill();
})();
