// Board B143 (Coach Milan 14 November 17:20, a bug on Plan; 17:26: first the drawing). Fill with Chef Mealan: the page jumps to the bottom
// on first open, on a tap on a meal and on a chip; after Put them in the plan, Undo is a narrow underlined pill.
// DT287 (0.3.142, board Stories215; Coach Milan 12 November 13:28 and 13:32; brainstorm 15:00 to 15:35, Go 15:50): Fill the open
// slots, on the goal and a different week. Each open slot has two or three choices, each with why; the protein of the week
// rotates (chicken twice this week comes after fish); chips per slot: Another protein, Lighter, Something I crave; a tap picks;
// Put them in the plan, on the right, puts the picks in. Serbian.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const path = require("node:path"), fs = require("node:fs");
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8")); seed.items = [];
const F = (n) => seed.foods.find((x) => x.name === n);
const beans = { id: "f-beans", name: "Kidney beans, cooked", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "2026-11-01T10:00:00Z", readyToEat: true, calories: 127, protein: 8.7, fats: 0.5, carbs: 22.8, fiber: 6.4 };
seed.foods = [...seed.foods, beans];
const it = (id, food, g) => ({ id, food, grams: g, locked: true });
const R = (id, title, main, g) => ({ id, title, savedAt: "2026-10-01T08:00:00Z", items: [it(id + "a", main, g), it(id + "b", F("Rice, cooked"), 150)], portion: g + 150 });
seed.meals = [R("chk", "Chicken and rice", F("Chicken breast, cooked"), 170), R("sal", "Salmon and rice", F("Salmon, cooked"), 170), R("egg", "Eggs and rice", F("Eggs"), 220), R("bea", "Beans and rice", beans, 300)];
const ate = (d, id) => ({ id: "fb" + d, status: "eaten", taste: "", notes: "", createdAt: `2026-11-${String(12 - d).padStart(2, "0")}T13:00:00.000Z`, recipeId: "chk", meal: { ...seed.meals[0], id: "m" + d } });
seed.feedback = [ate(1), ate(2)];
const PORT = "3514", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: "/home/claude/platemate-scanner", env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (lang = "en", width = 390) => {
    const ctx = await b.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-12T07:00:00+01:00"));
    await page.addInitScript(({ s, lang }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (lang !== "en") localStorage.setItem("chefmealan-lang", lang); localStorage.setItem("seeded", "1"); }, { s: seed, lang });
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(page);
    await page.goto(U + "/plan"); await page.waitForTimeout(1500);
    await page.locator("button.plan-fill").click(); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  const logOf = (page, ev) => page.evaluate((e) => JSON.parse(localStorage.getItem("chefmealan-log") || "[]").filter((x) => x.event === e), ev);
  const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
  const NOTEST = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
  const R = "/home/claude/boards/rs";
  const fixedNote = (page, t) => page.evaluate(({ t, st }) => { const d = document.createElement("div"); d.style.cssText = st + ";position:fixed;left:0;right:0;top:150px;z-index:99"; d.textContent = t; document.body.appendChild(d); }, { t, st: NOTEST });
  const note = (page, t, sel) => page.evaluate(({ t, st, sel }) => { const d = document.createElement("div"); d.style.cssText = st; d.textContent = t; document.querySelector(sel).insertAdjacentElement("beforebegin", d); d.id = "nt"; }, { t, st: NOTEST, sel });
  const snap = async (page, name) => { await page.evaluate(() => document.querySelectorAll(".chat-fab, .toast").forEach((x) => (x.style.visibility = "hidden"))); await page.waitForTimeout(250); await page.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
  const toTop = (page, sel, off) => page.evaluate(({ sel, off }) => { const e = document.querySelector(sel); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - off); }, { sel, off });
  try {
    // 1. Plan with the Fill button
    let o = await open(); let page = o.page; await o.ctx.close();
    { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const pg = await ctx.newPage();
      await pg.clock.setFixedTime(new Date("2026-11-12T07:00:00+01:00"));
      await pg.addInitScript(({ s }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
        localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { s: seed });
      await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(pg);
      await pg.goto(U + "/plan"); await pg.waitForTimeout(1500);
      await pg.evaluate((m) => { document.querySelector("button.plan-fill").style.cssText += ";" + m; }, mark);
      await note(pg, "1. Plan. You tap Fill the open slots with Chef Mealan.", "button.plan-fill"); await toTop(pg, "#nt", 300);
      await snap(pg, "b143a"); await ctx.close(); }
    // 2. now: the answer opens, the page lands near the bottom
    o = await open(); page = o.page;
    await fixedNote(page, "2. Now: the page lands near the bottom. The meals to choose from are above, out of sight.");
    await snap(page, "b143b");
    // 3. now: scrolled up, a meal tapped: down again
    await page.evaluate(() => document.querySelectorAll("div").forEach((d) => { if (d.style.position === "fixed" && d.style.top === "150px") d.remove(); }));
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
    await page.locator(".fill-rows").last().locator(".fill-slot").first().locator(".fill-choice").nth(1).click(); await page.waitForTimeout(900);
    await fixedNote(page, "3. Now: you scroll up and tap a meal. The page jumps to the bottom again. The chips Another protein, Lighter and Something I crave do the same.");
    await snap(page, "b143c");
    // 4. now: Put them in the plan, Undo narrow
    await page.evaluate(() => document.querySelectorAll("div").forEach((d) => { if (d.style.position === "fixed" && d.style.top === "150px") d.remove(); }));
    await page.locator(".fill-rows").last().getByRole("button", { name: "Put them in the plan" }).click(); await page.waitForTimeout(900);
    await page.evaluate((m) => { document.querySelector(".fill-put").style.cssText += ";" + m; }, mark);
    await note(page, "4. Now: In the plan, with Undo under it as a narrow pill, 33 px wide and underlined.", ".fill-put"); await toTop(page, "#nt", 330);
    await snap(page, "b143d"); await o.ctx.close();
    // 2 new: the answer opens at its top
    o = await open(); page = o.page;
    await page.evaluate((m) => { const bs = [...document.querySelectorAll(".bubble.mealan")]; const bb = bs[bs.length - 1]; bb.id = "ans"; bb.style.cssText += ";" + m; }, mark);
    await note(page, "2. New: the page shows the top of Chef Mealan's answer, with the first meal to choose in view.", "#ans"); await toTop(page, "#nt", 170);
    await snap(page, "b143e");
    // 3 new: a meal tapped, the page stays
    await page.evaluate(() => document.getElementById("nt").remove()); await toTop(page, ".fill-rows .fill-slot", 260);
    const y = await page.evaluate(() => window.scrollY);
    await page.locator(".fill-rows").last().locator(".fill-slot").first().locator(".fill-choice").nth(1).click(); await page.waitForTimeout(900);
    await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(300);
    await page.evaluate((m) => { const c = document.querySelector(".fill-rows .fill-slot .fill-choice.on"); c.style.cssText += ";" + m; }, mark);
    await fixedNote(page, "3. New: the tap picks the meal, and the page stays where it is. The same for the chips.");
    await snap(page, "b143f");
    // 4 new: In the plan on its own line; Undo left, Back to the plan right
    await page.evaluate(() => document.querySelectorAll("div").forEach((d) => { if (d.style.position === "fixed" && d.style.top === "150px") d.remove(); }));
    await page.locator(".fill-rows").last().getByRole("button", { name: "Put them in the plan" }).click(); await page.waitForTimeout(900);
    await page.evaluate((m) => { const fp = document.querySelector(".fill-put"); const back = fp.querySelector(".back-after");
      fp.outerHTML = `<div class="fill-put-new" style="${m};margin-top:12px;padding:0"><b style="display:block;color:var(--top);font-weight:900;margin:0 0 10px">✓ In the plan</b><div class="button-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0"><button type="button" class="pill pill-small pill-action" style="min-height:44px;height:44px;padding:0 18px;margin:0;box-sizing:border-box">Undo</button><button type="button" class="pill pill-small pill-primary" style="min-height:44px;height:44px;padding:0 18px;margin:0;box-sizing:border-box">${back ? back.textContent : "Back to the plan"}</button></div></div>`; }, mark);
    await note(page, "4. New: In the plan on its own line, in line with the meal names. Under it one row, both buttons 44 px high and level: Undo on the left, Back to the plan on the right, its edge in line with the lines between the meals.", ".fill-put-new"); await toTop(page, "#nt", 330);
    const u = await page.evaluate(() => { const r = document.querySelector(".fill-put-new .pill-action").getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }); console.log("new Undo", u, await page.evaluate(() => { const f = document.querySelector(".fill-put-new"); const r = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right), Math.round(b.top), Math.round(b.height)]; }; const row = document.querySelector(".fill-rows .fill-row"); return { msg: r(f.querySelector("b")), undo: r(f.querySelector(".pill-action")), back: r(f.querySelector(".pill-primary")), mealText: r(row.querySelector("b")), row: r(row) }; }));
    await snap(page, "b143g"); await o.ctx.close();
  } finally { await b.close(); server.kill(); }
})();
