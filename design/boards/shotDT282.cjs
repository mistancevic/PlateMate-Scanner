// Board DT282 (Coach Milan 11 November 20:45 to 20:46, on a call with a tester): Your cooks leads somewhere. A tap on a cook's
// photo opens that cook; Add to the recipe's photos puts it in the gallery; the row of offered photos goes.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = "/home/claude/platemate-scanner", PORT = "3713", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F2 = "font-family:Nunito,system-ui,sans-serif;color:#172742";
const W = (n) => "data:image/webp;base64," + fs.readFileSync(`${ROOT}/public/landing/hero/${n}-m.webp`).toString("base64");
const P = { curry: W("curry"), meat: W("meatballs"), ques: W("quesadilla"), sq: W("squares"), waf: W("waffle") };
const F = (id) => seed.foods.find((f) => f.id === id);
const meal = { id: "m-s", title: "Egg and turkey sandwiches", items: [{ id: "a", food: F("f-bread"), grams: 100, locked: false }, { id: "b", food: F("f-egg"), grams: 208, locked: false }, { id: "c", food: F("f-chicken"), grams: 60, locked: false }], portion: 368, steps: [], savedAt: "2026-11-10T10:00:00Z", photo: P.ques, photos: [] };
const cards = [
  { id: "c1", meal: { ...meal }, recipeId: "m-s", status: "eaten", taste: "Good", notes: "With more pepper next time.", createdAt: "2026-11-11T19:30:00Z", photo: P.sq, coverAsk: "kept" },
  { id: "c2", meal: { ...meal }, recipeId: "m-s", status: "eaten", taste: "DaaM good", notes: "", createdAt: "2026-11-08T08:10:00Z", photo: P.ques, coverAsk: "used" },
];
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { ...seed, meals: [meal], feedback: cards });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-s"); await p.waitForTimeout(1500); return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); }, { t, NOTE, sel, where });
  const shot = async (p, name, sel, tall) => { if (tall) await p.setViewportSize({ width: 390, height: tall }); await p.evaluate((sel) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - 90 : 0); }, sel); await p.waitForTimeout(400); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name, sel && await p.locator(sel).count()); await p.context().close(); };
  // a. now: the gallery with the offered row, and Your cooks lower down
  let p = await open();
  await p.evaluate(({ mark }) => { const o = document.querySelector(".rq-offer"); if (o) o.style.cssText += ";" + mark; const c = document.querySelector(".rq-cooks"); if (c) c.style.cssText += ";" + mark; }, { mark });
  await note(p, "Now (0.3.134), the recipe page: under the gallery, From the times you made it, a tap adds the photo. Lower, Your cooks shows the cooks' photos, but a tap on them does nothing.", ".rq-offer");
  await shot(p, "rdt282a", ".bnote", 1300);
  // b. new: Your cooks, the photos are buttons
  p = await open();
  await p.evaluate(({ mark }) => { document.querySelector(".rq-offer")?.remove(); const c = document.querySelector(".rq-cooks"); const ph = c.querySelector(".rc-photos"); ph.style.cssText += ";" + mark;
    [...ph.querySelectorAll("img")].forEach((im) => { im.style.cursor = "pointer"; }); const m = c.querySelector("small.muted:last-of-type"); if (m) m.textContent = "Tap a photo to open that cook: its photos, the foods, how it tasted, your words."; }, { mark });
  await note(p, "New, the recipe page, Your cooks: each photo opens its cook. The row From the times you made it, under the gallery, is gone: the cook is where you take a photo from.", ".rq-cooks");
  await shot(p, "rdt282b", ".bnote", 1000);
  // c. new: the cook, opened
  p = await open();
  const row = (n, g) => `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #e3eaf7;font-size:15px"><span>${n}</span><b>${g}</b></div>`;
  const COOK = `<div style="padding:12px;${F2}"><button class="link" style="min-height:44px">‹ Egg and turkey sandwiches</button>
    <b style="font-size:22px;display:block">Cooked on Wednesday, 11 November</b><small style="font-size:14px;color:#53627f">Dinner, 20:30 · Good</small>
    <img src="${P.sq}" style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;display:block;margin-top:12px">
    <div style="display:flex;gap:8px;margin-top:8px"><img src="${P.sq}" style="width:64px;height:64px;object-fit:cover;border-radius:10px;outline:3px solid #1f5fc7;outline-offset:2px"><img src="${P.curry}" style="width:64px;height:64px;object-fit:cover;border-radius:10px"></div>
    <button class="pill pill-primary pill-wide" style="min-height:48px;margin-top:12px;${mark}">Add to the recipe's photos</button>
    <small style="display:block;font-size:13px;color:#53627f;margin-top:6px;line-height:1.45">It goes into the recipe's gallery. The cover is chosen there.</small>
    <div style="margin-top:14px;background:#fff;border-radius:12px;padding:4px 12px">${row("Wholegrain bread", "2 slices")}${row("Eggs", "4 eggs")}${row("Chicken breast, cooked", "60 g")}</div>
    <p style="font-size:14px;margin-top:12px"><b>Your words:</b> With more pepper next time.</p></div>`;
  await p.evaluate((html) => { const m = [...document.querySelectorAll("main")].pop(); m.innerHTML = `<div>${html}</div>`; window.scrollTo(0, 0); }, COOK);
  await note(p, "New, a cook, opened from Your cooks: its photos (a tap picks one), Add to the recipe's photos, the foods as they were that day, the taste and your words. A photo already in the gallery says In the recipe's photos.", "main > div", "afterbegin");
  await shot(p, "rdt282c", null, 1100);
  await b.close(); server.kill();
})();
