// Board DT235 (Stories189; Coach Milan 7 November 21:03 Go, board asked for 22:17, after the build): text contrast 4.5:1.
// "Now": 0.3.108 (the build before). "New": 0.3.109 as released. Each pair the same screen, same data, same moment.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs", OLD = "/home/claude/pm263", NEW = "/home/claude/platemate-scanner";
const mark = "outline:3px solid #2a72d9;outline-offset:2px;border-radius:8px", NOTE = `outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px;background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const seed = JSON.parse(fs.readFileSync(path.join(NEW, "tests/flows/seed.json"), "utf8")); seed.feedback = [];
const F = (id, name, calories, protein, fats, carbs, fiber = 0) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber, photo: undefined, photos: undefined, icon: undefined, barcode: undefined, places: [] });
const salmon = [[180, F("sa", "Salmon fillet, raw", 208, 20, 13, 0)], [150, F("rc", "Basmati rice, dry", 356, 8.5, 0.9, 78, 1.3)], [120, F("br", "Broccoli", 34, 2.8, 0.4, 7, 2.6)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const state = { ...seed, meals: [{ id: "m-sa", title: "Salmon, rice and broccoli", items: salmon, portion: 450, steps: ["Cook the rice."], savedAt: "2026-11-01T18:00:00Z" }], items: salmon, title: "Salmon, rice and broccoli" };
const SHOTS = [
  ["foods", "/foods", ".chips", "the PD chips Low−, Low and High: dark words; the PD pills on coral, amber and mint: dark words; Remove in the deeper red"],
  ["plate", "/plate", ".readout", "the blue PD card: its labels fully white, the blue a shade deeper; Empty plate in the deeper red"],
  ["today", "/today", "main > *", "the small print on the tinted goal card (of 82 g fat): the grey a shade darker"],
  ["recipe", "/my-recipes/m-sa", ".readout", "the recipe's PD card: white labels, the letters band darker so its letters read"],
  ["summary", "/me/summary", ".sum-part", "Your summary: ✓ Chef reads in the deeper green"],
];
(async () => {
  const servers = [[OLD, "3486"], [NEW, "3487"]].map(([root, port]) => spawn(process.execPath, ["dist/server.cjs"], { cwd: root, env: { ...process.env, NODE_ENV: "production", PORT: port, GEMINI_API_KEY: "" }, stdio: "ignore" }));
  for (const port of ["3486", "3487"]) for (let i = 0; i < 60; i++) { try { await fetch(`http://127.0.0.1:${port}/`); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const shot = async (port, url, tag, sel, note) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date("2026-11-07T11:30:00"));
    await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ name: "Milan", dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 4 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, state);
    await require(NEW + "/tests/flows/adult.cjs")(page);
    await page.goto(`http://127.0.0.1:${port}${url}`); await page.waitForTimeout(1500);
    await page.evaluate(({ note, NOTE, sel }) => { for (const t of document.querySelectorAll(".toast, .chef-fab")) t.style.display = "none"; const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = note; const e = document.querySelector(sel) || document.querySelector("main > *"); e.before(d); }, { note, NOTE, sel });
    const top = await page.evaluate(() => Math.max(0, document.querySelector(".bnote").getBoundingClientRect().top + window.scrollY - 70));
    await page.evaluate((y) => window.scrollTo(0, y), top); await page.waitForTimeout(300);
    await page.screenshot({ path: `${R}/r235${tag}.png` }); console.log("shot", tag); await ctx.close();
  };
  for (const [name, url, sel, what] of SHOTS) {
    await shot("3486", url, name + "_now", sel, `Now (0.3.108): ${what.split(":")[0]}, as it was.`);
    await shot("3487", url, name + "_new", sel, `New (0.3.109): ${what}.`);
  }
  // the colours, side by side, with their contrast
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const row = (label, a, b2, fgA, fgB, rA, rB) => `<tr><td style="padding:8px 4px;font-weight:700">${label}</td><td><span style="display:inline-block;padding:8px 10px;border-radius:10px;background:${a};color:${fgA};font-weight:800">Aa ${rA}</span></td><td><span style="display:inline-block;padding:8px 10px;border-radius:10px;background:${b2};color:${fgB};font-weight:800;outline:3px solid #2a72d9;outline-offset:2px">Aa ${rB}</span></td></tr>`;
  await page.setContent(`<html><body style="margin:0;padding:16px;background:#eef3fc;font-family:Nunito,system-ui,sans-serif;color:#172742"><h2 style="margin:0 0 4px">The colours</h2><p style="margin:0 0 12px;color:#53627f">Text needs 4.5 : 1 against its background (WCAG 2.2 AA, 1.4.3).</p>
    <table style="border-collapse:separate;border-spacing:0 6px;font-size:14px"><tr><th></th><th style="text-align:left">Now</th><th style="text-align:left">New</th></tr>
    ${row("Blue, white on it", "#2e7be8", "#2a72d9", "#fff", "#fff", "4.1", "4.7")}
    ${row("Green, white on it", "#13916a", "#0f7d5b", "#fff", "#fff", "4.0", "5.1")}
    ${row("Grey on a tinted card", "#dae6fb", "#dae6fb", "#5b6b8a", "#53627f", "4.3", "4.9")}
    ${row("Low chip (coral)", "#f0705c", "#f0705c", "#fff", "#172742", "2.9", "5.1")}
    ${row("Close chip (amber)", "#f6b94a", "#f6b94a", "#fff", "#172742", "1.8", "8.5")}
    ${row("Red link on white", "#ffffff", "#ffffff", "#f0705c", "#a33a2b", "2.9", "6.6")}
    </table><p style="color:#53627f;font-size:13px">Unchanged: ink, navy, the blue text of links, the soft backgrounds. The home page's footer links get an underline, so they read as links inside grey text.</p></body></html>`);
  await page.screenshot({ path: `${R}/r235colours.png` }); console.log("shot colours");
  await b.close(); servers.forEach((s) => s.kill());
})();
