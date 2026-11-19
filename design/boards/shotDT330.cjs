// DT330 board pictures: Clients today (main's dist) and with How to feedback in Waiting for you (scratch build at
// /home/claude/work/dt328, not committed). The coach demo, with one beta application and made-up testers (Ana, Bo).
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const OUT = process.env.BOARDS_SHOTS || "/home/claude/boards/rs330";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8")); seed.items = []; seed.meals = []; seed.feedback = [];
const S = (dir, port) => spawn(process.execPath, ["dist/server.cjs"], { cwd: dir, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" });
const reqs = [{ id: "r1", name: "Ana", email: "ana@example.com", note: "I cook for two.", createdAt: "2026-11-19T12:00:00.000Z", status: "new" }];
const testers = [
  { uid: "t1", name: "Ana", email: "ana@example.com", items: {
    scanAnywhere: { s: "didnt", at: "2026-11-19T18:40:00.000Z", note: "Holding Plate opened the menu, but Barcode showed a black camera.", v: "0.3.166" },
    photoLog: { s: "tried", at: "2026-11-19T13:10:00.000Z", r: 2, note: "The read missed the rice.", v: "0.3.166" },
    handsFree: { s: "tried", at: "2026-11-19T12:00:00.000Z", r: 5, v: "0.3.166" } } },
  { uid: "t2", name: "Bo", email: "bo@example.com", items: {
    otherLang: { s: "tried", at: "2026-11-19T17:05:00.000Z", r: 4, note: "German worked, the voice too.", v: "0.3.166" },
    eatNow: { s: "tried", at: "2026-11-19T09:00:00.000Z", r: 4, v: "0.3.166" } } }];
(async () => {
  const a = S("/home/claude/platemate-scanner", "3631"), n = S("/home/claude/work/dt328", "3632");
  for (const port of ["3631", "3632"]) for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const br = await chromium.launch();
  const open = async (port, q) => {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-19T20:35:00"));
    await p.route("**/api/access-requests", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ requests: reqs }) }));
    await p.route("**/api/howto", (r) => r.request().method() === "GET" ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ testers }) }) : r.fulfill({ status: 200, body: "{}" }));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.goto(`http://127.0.0.1:${port}/today?coachdemo${q}`); await p.waitForTimeout(1500);
    await p.locator(".bottom-nav button").last().click(); await p.waitForTimeout(1200);
    return p;
  };
  const shot = async (p, name, full) => { if (full) await p.evaluate(() => document.querySelectorAll("body *").forEach((e) => { if (getComputedStyle(e).position === "fixed") e.style.display = "none"; })); await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: !!full }); console.log(name); };
  let p = await open("3631", ""); await shot(p, "now_clients");
  p = await open("3632", "&howtodemo"); await shot(p, "new_clients"); await shot(p, "new_full", true); await p.evaluate(() => { document.querySelectorAll("body *").forEach((e) => { e.style.display = e.style.display === "none" ? "" : e.style.display; }); window.scrollTo(0, 0); });
  await p.locator(".ht-wait").first().click(); await p.waitForTimeout(800); await shot(p, "new_tester");
  await p.locator(".ht-back").click(); await p.waitForTimeout(800); await shot(p, "new_after");
  await br.close(); a.kill(); n.kill();
})();
