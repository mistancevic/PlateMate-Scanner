// Boards DT84 and DT85 (Milan 23 October 20:58, Tester 3's call; drawn 24 October 00:37): Share with Coach Milan after making a
// meal, and the photo taken while making it as the cover. Drawn on a copy of main with a joined coach; nothing in the repo changed.
const { chromium } = require("/home/claude/PlateMate-Scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const R = process.env.BOARDS_SHOTS || __dirname + "/rs", CWD = process.env.APP_DIR || __dirname + "/wt-draw", PORT = "3496";
const PHOTO = fs.readFileSync(__dirname + "/meal-photo.jpg");
(async () => {
  const s = spawn(process.execPath, ["dist/server.cjs"], { cwd: CWD, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 3500));
  const b = await chromium.launch({ executablePath: process.env.CHROME });
  const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) if (["fixed", "sticky"].includes(getComputedStyle(el).position) && !el.closest(".sheet-backdrop") && !el.closest("nav")) el.style.display = "none"; });
  const shot = async (p, name, sel, block = "center") => { await p.waitForTimeout(300); await flat(p); if (sel) await p.locator(sel).first().evaluate((e, b) => e.scrollIntoView({ block: b }), block); await p.waitForTimeout(250); await p.screenshot({ path: `${R}/dt8485${name}.png` }); };
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  try {
    const seed = JSON.parse(fs.readFileSync("/home/claude/PlateMate-Scanner/tests/flows/seed.json", "utf8"));
    const f = (n) => seed.foods.find((x) => x.name === n);
    seed.items = []; seed.feedback = [];
    seed.meals = [{ id: "bowl", title: "Chicken rice bowl", savedAt: "2026-10-20T08:00:00Z", portion: 400,
      items: [["Chicken breast, cooked", 150], ["Rice, cooked", 200], ["Greek yogurt 2%", 50]].map(([n, g], i) => ({ id: "b" + i, food: f(n), grams: g, locked: true })), steps: ["Warm the chicken and the rice.", "Top with the yogurt."] }];
    await p.addInitScript((s) => { if (!localStorage.getItem("seeded")) { localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("draw-coach", "1");
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "recomp", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" })); localStorage.setItem("seeded", "1"); } }, seed);
    await require("/home/claude/PlateMate-Scanner/tests/flows/adult.cjs")(p);
    await p.goto(`http://127.0.0.1:${PORT}/`); await p.waitForTimeout(1500);
    await p.locator("nav button").filter({ hasText: "Recipes" }).click(); await p.waitForTimeout(800);
    await p.getByText("Chicken rice bowl", { exact: true }).last().click(); await p.waitForTimeout(900);
    await p.getByRole("button", { name: /^Make it$/ }).first().click(); await p.waitForTimeout(1000);
    await p.getByRole("button", { name: /^(Keep it as it is|Make it as it is)$/ }).first().click(); await p.waitForTimeout(900);
    await p.getByRole("button", { name: "I'm making it", exact: true }).click(); await p.waitForTimeout(600);
    await p.locator("label.plate-photo").filter({ hasText: "Take a photo" }).locator("input").setInputFiles([{ name: "plate.jpg", mimeType: "image/jpeg", buffer: PHOTO }]); await p.waitForTimeout(900);
    await p.getByRole("button", { name: "On to How was it?" }).click(); await p.waitForTimeout(600);
    await p.getByRole("button", { name: "DaaM good" }).click(); await p.waitForTimeout(300);
    await shot(p, "BuiltSave", "button.pill-wide", "end");
    await p.getByRole("button", { name: "Save", exact: true }).click(); await p.waitForTimeout(1200);
    await p.evaluate(() => scrollTo(0, 0)); await shot(p, "BuiltLanded");
    await shot(p, "BuiltCard", ".rq-landed", "center");
    await p.locator(".rq-share-link").click(); await p.waitForTimeout(400);
    await shot(p, "BuiltAsk", ".rq-landed", "center");
    await p.getByRole("button", { name: "Was this OK?" }).click(); await p.waitForTimeout(600);
    await shot(p, "BuiltShared", ".rq-landed", "center");
    await p.locator("nav button").filter({ hasText: "Today" }).click(); await p.waitForTimeout(900);
    await shot(p, "BuiltToday", ".log-card", "center");
    
  } catch (e) { console.log("ERR", e.message); await p.screenshot({ path: `${R}/dt8485err.png` }); }
  await b.close(); s.kill();
})();
