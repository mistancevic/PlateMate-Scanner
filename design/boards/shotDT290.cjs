// Board DT290 (found building DT287, 12 November; Coach Milan 16:58 and 17:10, Draw): Fill the open slots knows which dishes suit
// which meal. Now beans and rice can come for breakfast. New: a recipe knows the meals it suits, from where you ate or planned it,
// from its foods, or as you set it; Fill keeps to it.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/platemate-scanner", PORT = "3492", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.items = [];
const F = (n) => seed.foods.find((x) => x.name === n);
const beans = { id: "f-beans", name: "Kidney beans, cooked", brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "2026-11-01T10:00:00Z", readyToEat: true, calories: 127, protein: 8.7, fats: 0.5, carbs: 22.8, fiber: 6.4 };
seed.foods = [...seed.foods, beans];
const it = (id, food, g) => ({ id, food, grams: g, locked: true });
const Rc = (id, title, main, g) => ({ id, title, savedAt: "2026-10-01T08:00:00Z", items: [it(id + "a", main, g), it(id + "b", F("Rice, cooked"), 150)], portion: g + 150, steps: ["Warm it.", "Serve."] });
seed.meals = [Rc("chk", "Chicken and rice", F("Chicken breast, cooked"), 170), Rc("sal", "Salmon and rice", F("Salmon, cooked"), 170), Rc("egg", "Eggs and rice", F("Eggs"), 220), Rc("bea", "Beans and rice", beans, 300)];
seed.feedback = [1, 2].map((d) => ({ id: "fb" + d, status: "eaten", taste: "", notes: "", createdAt: `2026-11-${String(12 - d).padStart(2, "0")}T13:00:00.000Z`, recipeId: "chk", meal: { ...seed.meals[0], id: "m" + d } }));
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const F2 = "font-family:Nunito,system-ui,sans-serif;color:#172742";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (path) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-12T07:00:00+01:00"));
    await p.addInitScript(({ s }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" })); localStorage.setItem("seeded", "1"); }, { s: seed });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + path); await p.waitForTimeout(1500);
    await p.evaluate(() => { const f = document.querySelector(".chat-fab"); if (f) f.style.visibility = "hidden"; });
    return p;
  };
  const shot = async (p, name, sel, off = 300) => { await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); }, { sel, off }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  const note = (p, t, sel) => p.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement("beforebegin", d); }, { t, NOTE, sel });
  // a: now, breakfast gets beans and rice
  let p = await open("/plan"); await p.locator("button.plan-fill").click(); await p.waitForTimeout(1500);
  const first = await p.evaluate(() => { const s = document.querySelector(".fill-slot"); s.id = "slot0"; return s.innerText.slice(0, 200); }); console.log(first);
  await p.evaluate((mark) => { const s = document.querySelector("#slot0"); s.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.142): Fill looks at PD, the slot's size and your week, not at what a breakfast is. Beans and rice comes for breakfast.", "#slot0");
  await shot(p, "r290a", "#slot0", 260);
  // b: new, breakfast gets breakfasts
  p = await open("/plan"); await p.locator("button.plan-fill").click(); await p.waitForTimeout(1500);
  const choice = (on, name, nums, why) => `<button style="display:flex;gap:10px;align-items:flex-start;text-align:left;width:100%;min-height:56px;padding:10px;margin-top:6px;background:${on ? "#eef4ff" : "#fff"};border:${on ? "2px solid #2a72d9" : "1.5px solid #d1dcf0"};border-radius:12px;${F2}"><span style="font-size:18px;color:#2a72d9">${on ? "●" : "○"}</span><span><b style="font-size:15px">${name}</b><small style="display:block;font-size:13px;color:#53627f">${nums}</small><small style="display:block;font-size:13px;color:#13804f;font-weight:700">${why}</small></span></button>`;
  await p.evaluate(({ html, mark }) => { const s = document.querySelector(".fill-slot"); s.id = "slot0"; const keep = s.querySelector(".fill-chips").outerHTML; s.innerHTML = html + keep; s.style.cssText += ";" + mark; }, { mark, html:
    `<small style="font-size:13px;color:#53627f">Breakfast, 07:30</small>` + choice(true, "Protein pancakes", "545 kcal · 41 g · PD 7.5", "A breakfast: eggs and quark, none this week") + choice(false, "Skyr bowl with berries", "430 kcal · 38 g · PD 8.8", "A breakfast: quick, no cooking") + choice(false, "Omelette with bread", "470 kcal · 36 g · PD 7.7", "A breakfast: eggs") });
  await note(p, "New: a breakfast slot gets breakfasts. Beans and rice stays for lunch or dinner, where you ate it before.", "#slot0");
  await shot(p, "r290b", "#slot0", 260);
  // c: new, the recipe says the meals it suits; you can change it
  p = await open("/my-recipes/bea");
  const at = await p.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Edit recipe/.test(x.textContent)); b.id = "editbtn"; return !!b; }); console.log("edit", at);
  const chip = (on, t) => `<button style="min-height:44px;padding:0 14px;border-radius:12px;font-weight:800;${on ? "background:#2a72d9;color:#fff;border:1.5px solid #2a72d9" : "background:#fff;color:#1f5fc7;border:1.5px solid #c9d6ee"};${F2.replace("color:#172742", "")}">${on ? "✓ " : ""}${t}</button>`;
  await p.evaluate(({ html }) => { const e = document.querySelector("#editbtn"); e.insertAdjacentHTML("beforebegin", html); }, { html:
    `<section id="goodfor" style="background:#fff;border:1.5px solid #d1dcf0;border-radius:16px;padding:12px 14px;margin:8px 0 14px;${F2}"><b style="font-size:16px">Good for</b><div style="display:flex;flex-wrap:wrap;gap:8px;margin:8px 0">${chip(false, "Breakfast")}${chip(true, "Lunch")}${chip(true, "Dinner")}${chip(false, "Snack")}</div><small style="font-size:13.5px;color:#53627f;line-height:1.45">Chef Mealan set these from when you ate it and from its foods. Tap to change. Fill the open slots keeps to them.</small></section>` });
  await p.evaluate((mark) => { const s = document.querySelector("#goodfor"); s.style.cssText += ";" + mark; }, mark);
  await note(p, "New: the recipe says which meals it suits: from when you ate or planned it, from its foods, or as you set it.", "#goodfor");
  await shot(p, "r290c", "#goodfor", 300);
  await b.close(); server.kill();
})();
