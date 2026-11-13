// Board DT266 (Coach Milan 8 November 16:44 to 16:49): Coach Milan's certifications on Who's behind it, for trust. "Now": 0.3.115.
// "New": drawn in by DOM with the six certificates he sent.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", C = "/home/claude/boards/certs", ROOT = "/home/claude/platemate-scanner", PORT = "3490", U = `http://127.0.0.1:${PORT}`;
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F = "font-family:Nunito,system-ui,sans-serif;color:#172742";
const b64 = (f) => `data:image/jpeg;base64,${fs.readFileSync(`${C}/${f}`).toString("base64")}`;
const CERTS = [
  ["nut-s.jpg", "Certified Nutrition Coach", "Mindvalley with Viome", "2024", "The food answers: what a plate does, and how much."],
  ["fit-s.jpg", "10X Fitness Coaching Certification", "Mindvalley", "2023", "The training week and the day types."],
  ["holo-s.jpg", "Certified Holobody Coach", "Mindvalley", "2023", "The whole-body frame behind the goals."],
  ["pf-s.jpg", "AI Product Management Certificate", "Product Faculty, capstone honors", "2026", "How Chef Mealan was built, and where it started."],
  ["aim-s.jpg", "AI Mastery", "Mindvalley", "2026", "The AI side of the builder."],
  ["biz-s.jpg", "Certified Business Coach", "Mindvalley, ICF credits", "2022", "Coaching coaches on the business with Chef Mealan."],
];
const badge = ([f, n, by, y]) => `<button style="flex:none;display:flex;flex-direction:column;align-items:flex-start;gap:6px;width:236px;padding:6px;background:#fff;border:1.5px solid #d1dcf0;border-radius:12px;text-align:left;${F}"><img src="${b64(f)}" style="width:224px;border-radius:8px;display:block"><b style="font-size:12.5px;line-height:1.3;padding:0 4px">${n}</b><small style="font-size:11.5px;color:#53627f;line-height:1.3;padding:0 4px 4px">${by} · ${y}</small></button>`;
const ROW = `<div class="cert-row" style="${mark};padding:8px;margin:12px 0;max-width:100%;min-width:0;box-sizing:border-box;overflow:hidden"><small style="display:block;font-size:12px;font-weight:800;letter-spacing:.05em;color:#53627f;margin:0 0 8px 4px">CERTIFIED</small><div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">${CERTS.map(badge).join("")}</div><small style="display:block;margin:8px 4px 0;font-size:13px;color:#53627f">Tap one to see the certificate.</small></div>`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (path) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage(); await p.goto(U + path); await p.waitForTimeout(1500); return p; };
  const shot = async (p, name, sel, off = 90) => { await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - off); }, { sel, off }); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  // 1. home page, now
  let p = await open("/?home");
  await p.evaluate((mark) => { document.querySelector(".l-behind .l-split > div").style.cssText += ";" + mark; }, mark);
  await note(p, "Now, home page (0.3.115): Who's behind it says product manager, coach and author in words. The coaching certificate was kept for the personal page (1 November). Nothing on the home page shows the certifications behind the food and training answers.", ".l-behind .l-split");
  await shot(p, "r266a", ".bnote");
  // 2. home page, the row of badges
  p = await open("/?home");
  await p.evaluate((html) => { document.querySelector(".l-behind .l-split > div").style.minWidth = "0"; document.querySelector(".l-behind .l-behind-links").insertAdjacentHTML("beforebegin", html); }, ROW);
  await note(p, "New, home page: a carousel of six certificate thumbnails under Milan's lines, with name, issuer and year. One and a half show at a time, so it is clear there are more; it scrolls sideways. A tap opens the whole certificate.", ".cert-row");
  await shot(p, "r266b", ".bnote");
  // 3. the certificate open, full size, with its number and QR
  p = await open("/?home");
  await p.evaluate(({ img, F, mark }) => { document.body.insertAdjacentHTML("beforeend", `<div style="position:fixed;inset:0;background:rgba(15,25,42,.92);display:flex;flex-direction:column;justify-content:center;gap:12px;padding:16px;${F}"><div style="display:flex;justify-content:space-between;align-items:center;color:#fff"><b style="font-size:16px">Certified Nutrition Coach · 2024</b><button style="min-width:44px;min-height:44px;background:none;border:0;color:#fff;font-size:22px">✕</button></div><img src="${img}" style="width:100%;border-radius:8px;${mark}"><div style="display:flex;justify-content:space-between;color:#c9d6ee;font-size:14px"><span>‹ 10X Fitness</span><span>2 of 6</span><span>Holobody ›</span></div></div>`); }, { img: b64("nut-s.jpg"), F, mark });
  await p.waitForTimeout(300); await p.screenshot({ path: `${R}/r266c.png` }); console.log("shot r266c"); await p.context().close();
  // 4. /about, all six with one line each
  p = await open("/about");
  await p.evaluate(({ certs, F, mark }) => {
    const a = document.querySelector("article"); const links = a.querySelector(".about-links");
    const cards = certs.map(([img, n, by, y, line]) => `<div style="display:flex;flex-direction:column;gap:6px;padding-bottom:14px;border-bottom:1px solid #d1dcf0"><img src="${img}" style="width:100%;border-radius:8px;border:1px solid #d1dcf0"><b style="font-size:16px">${n}</b><small style="font-size:13px;color:#53627f">${by} · ${y}</small><span style="font-size:15px;line-height:1.45">${line}</span></div>`).join("");
    links.insertAdjacentHTML("beforebegin", `<div class="cert-about" style="${mark};padding:8px;margin:14px 0;display:flex;flex-direction:column;gap:14px;${F}"><h2 style="font-size:22px;margin:4px 0 0">Certifications</h2>${cards}<small style="font-size:13px;color:#53627f">Tap a certificate to see it full size, with its number.</small></div>`);
  }, { certs: CERTS.map(([f, ...r]) => [b64(f), ...r]), F, mark });
  await note(p, "New, /about: all six certificates one under another, full width, each with one line on what it means for the app. Tap: full size.", ".cert-about");
  await p.evaluate(() => { const e = document.querySelector(".bnote"); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 90); }); await p.waitForTimeout(300);
  await p.screenshot({ path: `${R}/r266d.png`, clip: { x: 0, y: 0, width: 390, height: 1500 }, fullPage: true }); console.log("shot r266d"); await p.context().close();
  // 5. the coach section: Business Coach
  p = await open("/?home");
  await p.evaluate(({ F, mark }) => { const act = document.querySelector(".l-coach-act"); act.insertAdjacentHTML("beforebegin", `<div class="cert-coach" style="${mark};padding:8px;margin:8px 0;${F}"><small style="font-size:14px;color:#53627f;line-height:1.45"><b style="color:#172742">Certified Business Coach</b>, Mindvalley with ICF credits, 2022, and 20 years of building products. Coaching coaches on the business with Chef Mealan, not only on the food.</small></div>`); }, { F, mark });
  await note(p, "New, home page, the coach section: the Business Coach line, for coaches: the business with Chef Mealan, not only the food.", ".cert-coach");
  await shot(p, "r266e", ".bnote");
  await b.close(); server.kill();
})();
