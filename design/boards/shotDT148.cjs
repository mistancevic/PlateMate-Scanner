// DT148 (UX2 and Bug 1, Tester 3, 28 October): Chef Mealan's idea, its foods, swap and add, and the wait
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
// Tester 3 started in Belgrade: his Belgrade foods stay in the library, with their place
const bg = (name, c, p, f, cb) => ({ ...seed.foods[0], id: "bg-" + name.replace(/\W+/g, "-").toLowerCase(), name, brand: "Maxi", calories: c, protein: p, fats: f, carbs: cb, fiber: 0, photo: undefined, photos: undefined, table: undefined, icon: undefined, places: ["belgrade"] });
seed.foods = [...seed.foods, bg("Jogurt 2,8 %", 57, 3.2, 2.8, 4.5), bg("Kiselo mleko 2,8 %", 57, 3.1, 2.8, 4.4), bg("Pileće belo meso", 110, 23, 1.5, 0), bg("Sir za mazanje, light", 150, 11, 10, 4)];
const PORT = "3316", U = `http://127.0.0.1:${PORT}`;
const IDEA = { idea: { title: "Cheesecake cup", why: "Creamy and sweet like cheesecake, with oats for the base.", items: [
  { name: "Quark, low fat", grams: 200, calories: 67, protein: 12, fats: 0.3, carbs: 4 },
  { name: "Oats", grams: 30, calories: 372, protein: 13.5, fats: 7, carbs: 59 },
  { name: "Strawberries", grams: 120, calories: 32, protein: 0.7, fats: 0.3, carbs: 7.7 },
  { name: "Honey", grams: 10, calories: 304, protein: 0.3, fats: 0, carbs: 82 } ] } };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-28T21:55:00"));
  await page.addInitScript(([s]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-28T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-28T16:00:00Z", consentBodyAt: "2026-10-28T16:00:00Z", declaredAt: "2026-10-28T16:00:00Z", aiConfirmedAt: "2026-10-28T16:00:00Z" }));
    localStorage.setItem("chefmealan-places-v1", "1");
    localStorage.setItem("chefmealan-region", "limassol"); localStorage.setItem("seeded", "1"); }, [seed]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  let hold = false;
  await page.route("**/api/members", (r) => r.fulfill({ json: { recipes: [] } }));
  await page.route("**/api/crave", async (r) => { while (hold) await new Promise((x) => setTimeout(x, 100)); r.fulfill({ json: IDEA }); });
  const R = "/home/claude/boards/rs";
  const NOTE = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px;background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px";
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.classList.contains("sheet-backdrop")) { el.style.position = "static"; el.style.background = "transparent"; continue; } if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (name) => { await page.waitForTimeout(400); await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const noteBefore = (sel, text) => page.evaluate(({ sel, text, NOTE }) => { const x = document.querySelector(sel); if (!x) return console.log("no " + sel); const d = document.createElement("div"); d.className = "dt-note"; d.style.cssText = NOTE; d.textContent = text; x.before(d); }, { sel, text, NOTE });
  const toPlate = async () => { await page.goto(U + "/"); await page.waitForTimeout(800); await page.getByRole("button", { name: /^Plate$/ }).last().click(); await page.waitForTimeout(800); };
  const ask = async () => { await page.getByLabel("What are you craving?").fill("cheesecake"); await page.waitForTimeout(500); await page.getByRole("button", { name: /Ask Chef Mealan/ }).first().click(); };
  // a, now: the wait
  await toPlate(); hold = true; await ask(); await page.waitForTimeout(600);
  await noteBefore(".crave-thinking", "Now (0.2.127): the wait is one card of text. Nothing moves, so it is unclear that anything is going on.");
  await page.evaluate((m) => { const x = document.querySelector(".crave-thinking"); if (x) x.style.cssText += ";" + m; }, mark);
  await shot("r148a");
  await page.evaluate(() => document.querySelectorAll(".dt-note").forEach((n) => n.remove()));
  await page.evaluate(() => { const x = document.querySelector(".crave-thinking"); if (x) x.style.outline = "none"; });
  hold = false; await page.waitForTimeout(1500);
  // b, now: the idea, its foods in one grey line
  await page.evaluate((m) => { const x = document.querySelector(".crave-idea"); if (x) x.style.cssText += ";" + m; }, mark);
  await noteBefore(".crave-idea", "Now: the idea's foods are one grey line. No swipe, no swap, no add. Quark is there because Chef Mealan's instructions name quark, and it is never told you shop in Limassol.");
  await shot("r148b");
  // c, now: on the plate, swap Quark
  await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1200);
  const row = page.locator(".swipe-fg").filter({ hasText: "Quark" }).first();
  const bb = await row.boundingBox();
  await page.mouse.move(bb.x + bb.width - 60, bb.y + bb.height / 2); await page.mouse.down();
  for (let k = 1; k <= 10; k++) await page.mouse.move(bb.x + bb.width - 60 - k * 15, bb.y + bb.height / 2);
  await page.mouse.up(); await page.waitForTimeout(800);
  const swapNames = await page.locator(".sheet .row-text b").allInnerTexts(); console.log("swap now:", swapNames.join(" | "));
  await page.evaluate((m) => { const x = document.querySelector(".sheet"); if (x) x.style.cssText += ";" + m; }, mark);
  await page.evaluate((NOTE) => { const x = document.querySelector(".sheet"); const d = document.createElement("div"); d.className = "dt-note"; d.style.cssText = NOTE; d.textContent = "Now: swipe Quark to swap. First comes Quark again (Magerquark), the food Marko doesn't know. Then skyr, cottage cheese, Greek yogurt, whey, milk, biscuits, fruit, almonds, ice cream: one list, sorted by PD, whatever kind of food it is. A basic food sold in Limassol that is not in the library never shows."; x.prepend(d); x.style.maxHeight = "86dvh"; }, NOTE);
  await page.waitForTimeout(400); await page.screenshot({ path: `${R}/r148c.png` }); console.log("shot r148c");
  await page.keyboard.press("Escape"); await page.goto(U + "/"); await page.waitForTimeout(500);
  // d, now: the plate after Quark is removed: Add is far below
  await page.getByRole("button", { name: /^Plate$/ }).last().click(); await page.waitForTimeout(1000);
  const row2 = page.locator(".swipe-fg").filter({ hasText: "Quark" }).first(); const b2 = await row2.boundingBox();
  if (b2) { await page.mouse.move(b2.x + 60, b2.y + b2.height / 2); await page.mouse.down(); for (let k = 1; k <= 10; k++) await page.mouse.move(b2.x + 60 + k * 15, b2.y + b2.height / 2); await page.mouse.up(); await page.waitForTimeout(800); }
  await page.evaluate((m) => { const c = document.querySelector(".plate-card .rows"); if (c) c.style.cssText += ";" + m; const q = [...document.querySelectorAll("p.label")].find((n) => /Quick picks/.test(n.textContent || "")); if (q) { q.style.cssText += ";" + m; const nx = q.nextElementSibling; if (nx) nx.style.cssText += ";" + m; } }, mark);
  await noteBefore(".plate-card", "Now: Quark is removed. To add a food, scroll past the plate, the readout and the buttons to the list at the bottom. Nothing near the foods says so.");
  await shot("r148d");

  // e, new: the wait moves
  await page.goto(U + "/"); await page.waitForTimeout(500); await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = []; s.title = ""; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await toPlate(); hold = true; await ask(); await page.waitForTimeout(600);
  await page.evaluate((m) => {
    const x = document.querySelector(".crave-thinking"); if (!x) return;
    const logo = "/icon.svg";
    x.style.cssText += ";" + m + ";display:flex !important;flex-direction:row !important;gap:14px;align-items:center;text-align:left";
    x.innerHTML = `<div style="position:relative;width:64px;height:64px;flex:none"><img src="${logo}" style="width:64px;height:64px;transform:rotate(-8deg)"><span style="position:absolute;right:-6px;top:-4px;font-size:18px;letter-spacing:2px;color:#2e7be8;font-weight:900">• • ·</span></div><div><b>Chef Mealan is making a cheesecake idea</b><small class="muted" style="display:block;margin-top:4px">From your foods, sold in Limassol · 8 s</small><div style="margin-top:8px;height:6px;border-radius:3px;background:#dfe8f8;overflow:hidden"><div style="width:38%;height:100%;background:#2e7be8;border-radius:3px;margin-left:30%"></div></div></div>`;
  }, mark);
  await noteBefore(".crave-thinking", "New: Chef Mealan's hat bobs and stirs, three dots steam, and a bar runs back and forth. The seconds count. After 20 seconds: Taking longer than usual. Still on it. The same card for a recipe read and for the method.");
  await shot("r148e");
  await page.evaluate(() => document.querySelectorAll(".dt-note").forEach((n) => n.remove()));
  hold = false; await page.waitForTimeout(1500);
  // f, new: the idea's foods as rows, with Swap and + Add a food
  await page.evaluate((m) => {
    const card = document.querySelector(".crave-idea"); if (!card) return;
    const line = [...card.querySelectorAll("small")].find((n) => /g Quark/.test(n.textContent || "")); if (!line) return;
    const foods = [["🥣", "Quark, low fat", "200 g", "Chef Mealan's estimate"], ["🌾", "Oats", "30 g", "PD 3.5, yours"], ["🍓", "Strawberries", "120 g", "Chef Mealan's estimate"], ["🍯", "Honey", "10 g", "PD 0.1, yours"]];
    const box = document.createElement("div"); box.style.cssText = "margin:8px 0;border-top:1px solid #e3e8f2;" + m;
    box.innerHTML = foods.map(([i, n, g, w]) => `<div style="display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid #e3e8f2"><span style="font-size:22px;width:30px;text-align:center">${i}</span><div style="flex:1"><b style="display:block">${n}</b><small class="muted">${w}</small></div><b>${g}</b><button class="pill pill-small">Swap</button></div>`).join("") + `<button class="link" style="display:block;padding:10px 2px;font-weight:800">+ Add a food</button><small class="muted" style="display:block">Swap or add, and the idea goes on your plate with the change.</small>`;
    line.replaceWith(box);
    const sum = document.createElement("small"); sum.className = "muted"; sum.textContent = "One serving: 314 kcal · 29 g protein."; box.after(sum);
  }, mark);
  await noteBefore(".crave-idea", "New: each food of the idea is a row, with Swap. + Add a food comes after the last one. Quark is now unlikely here: Chef Mealan is told you shop in Limassol and is no longer pointed at quark.");
  await shot("r148f");
  // g, new: Swap, kitchen sense first
  await page.getByRole("button", { name: "Put it on my plate" }).click(); await page.waitForTimeout(1200);
  const row3 = page.locator(".swipe-fg").filter({ hasText: "Quark" }).first(); const b3 = await row3.boundingBox();
  await page.mouse.move(b3.x + b3.width - 60, b3.y + b3.height / 2); await page.mouse.down(); for (let k = 1; k <= 10; k++) await page.mouse.move(b3.x + b3.width - 60 - k * 15, b3.y + b3.height / 2); await page.mouse.up(); await page.waitForTimeout(800);
  await page.evaluate(({ m, NOTE }) => {
    const sh = document.querySelector(".sheet"); if (!sh) return; sh.style.cssText += ";max-height:90dvh;" + m;
    const row = (i, n, w, g, cls, take) => `<div class="row row-food row-button" style="display:flex;align-items:center;gap:10px"><span class="thumb thumb-sm">${i}</span><div class="row-text" style="flex:1"><b>${n}</b><small>${w}</small></div>${take ? '<span class="pill pill-small">Take it</span>' : ""}<span class="pdpill pdpill-${cls}">${g}</span></div>`;
    sh.innerHTML = `<div class="dt-note" style="${NOTE}">New: the same kind of food first, then what is sold where you shop, then PD. A basic food sold in Limassol shows even when it is not in your foods yet. The same food you swap away is left out. Every line says why.</div>
      <div class="card-top"><span>Swap Quark, low fat for</span><button class="link">Cancel</button></div>
      <p class="small">The same kind of food first, sold where you shop. The grams bring the plate to your PD 5.2.</p>
      <small class="pick-group crave-group" style="display:block;margin-top:8px">Soft dairy, like quark</small>
      <div class="rows">
      ${row("🥛", "Greek yogurt 2%", "Yours · in Limassol shops as Γιαούρτι στραγγιστό · PD 13.6", "72 g", "high")}
      ${row("🧀", "Cottage cheese", "Yours · PD 12.2", "65 g", "high")}
      ${row("📘", "Anari, fresh whey cheese", "Basic food sold in Limassol, not in your foods yet · PD 6.5", "207 g", "high", true)}
      ${row("📘", "Sheep's milk yoghurt, Cypriot", "Basic food sold in Limassol · PD 5.2, so it can't lift the plate", "can't reach", "low", true)}
      </div>
      <small class="muted" style="display:block;margin:8px 0">Quark, low fat (Magerquark) is left out: it is the food you swap away.</small>
      <button class="link" style="font-weight:800">Other kinds: whey protein powder, milk and 5 more ›</button>`;
  }, { m: mark, NOTE });
  await page.waitForTimeout(400); await page.screenshot({ path: `${R}/r148g.png` }); console.log("shot r148g");
  await page.keyboard.press("Escape"); await page.goto(U + "/"); await page.waitForTimeout(500);
  // h, new: + Add a food right under the last food, the search opens there
  await page.getByRole("button", { name: /^Plate$/ }).last().click(); await page.waitForTimeout(1000);
  const row4 = page.locator(".swipe-fg").filter({ hasText: "Quark" }).first(); const b4 = await row4.boundingBox();
  if (b4) { await page.mouse.move(b4.x + 60, b4.y + b4.height / 2); await page.mouse.down(); for (let k = 1; k <= 10; k++) await page.mouse.move(b4.x + 60 + k * 15, b4.y + b4.height / 2); await page.mouse.up(); await page.waitForTimeout(800); }
  await page.evaluate((m) => {
    const rows = document.querySelector(".plate-card .rows"); if (!rows) return;
    const add = document.createElement("div"); add.style.cssText = "padding:10px 4px;" + m;
    add.innerHTML = `<button class="link" style="font-weight:800;font-size:16px">+ Add a food</button>
      <input class="search" value="yog" style="margin-top:8px;width:100%" aria-label="Find a food">
      <div class="rows" style="margin-top:6px">
        <div class="row row-food"><span class="thumb thumb-sm">🥛</span><div class="row-text"><b>Greek yogurt 2%</b><small>Yours · PD 13.6</small></div><button class="pill pill-small">+ Add</button></div>
        <div class="row row-food"><span class="thumb thumb-sm">📘</span><div class="row-text"><b>Sheep's milk yoghurt, Cypriot</b><small>Basic food sold in Limassol · PD 5.2</small></div><button class="pill pill-small">Take it</button></div>
        <div class="row row-food"><span class="thumb thumb-sm">📘</span><div class="row-text"><b>Talattouri, yoghurt with cucumber and mint</b><small>Basic food sold in Limassol · savoury, held back for this sweet plate</small></div></div>
      </div><small class="muted">Your foods first, then the basic foods sold where you shop. Scan and Manual stay above.</small>`;
    rows.after(add);
  }, mark);
  await noteBefore(".plate-card", "New: after a food is removed, or any time, + Add a food sits right under the last food. A tap opens the search there, with your foods first and the basic foods sold where you shop. No scrolling to Quick picks.");
  await shot("r148h");
  fs.writeFileSync(R + "/r148-swapnow.json", JSON.stringify(swapNames));
  await b.close(); server.kill();
})();
