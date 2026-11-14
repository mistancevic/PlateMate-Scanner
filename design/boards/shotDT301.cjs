// Board DT301 (Coach Milan 14 November 17:25 to 17:33, Draw): the Plate, more prominent. The top box is "the place for ideas for
// cravings and cooking" and takes the look of Chef Mealan's chat bar; On the plate, empty, shows a plate and the four ways as tiles;
// Start from a recipe says what to do. 17:50: the line under What are you craving? is Get an idea for what you crave, or build your own plate.
// Chef Mealan sets the amounts. The help line under the box goes. 19:41 to 20:17: the meal line under the title; the ideas block is one card,
// the box and a Find ideas button that fires the search (A); then the dishes, then Ask Chef Mealan for one or for another, with the chef's hat;
// On the plate shows its two parts as headings: Add a food, and Have a recipe? Start from it. 20:24: Find ideas is the one button: it looks in
// your recipes and the others AND asks Chef Mealan; nothing found, his idea is the same dish or a similar one. Every new frame shows every change.
// 20:34: three ideas, each short with View more; the board follows each scenario from the first screen to where it leads.
// 21:04 to 21:05: an idea is not saved by itself; an opened idea has Save in My recipes (left) and Put it on my plate (right);
// after the tap: ✓ Saved in My recipes.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs");
const R = "/home/claude/boards/rs", ROOT = process.env.ROOT || "/home/claude/platemate-scanner", PORT = "3515", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 12px;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif`;
const PERSONAL = { dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } };
const SAFETY = { situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" };
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const IDEAS = {
    "crêpes": { title: "Protein crêpes with quark and berries", why: "Crêpes with quark inside: the protein comes up, so the plate sits near your PD.", items: [{ name: "Oat flour", grams: 40, calories: 375, protein: 13, fats: 7, carbs: 60 }, { name: "Eggs", grams: 100, calories: 143, protein: 12.6, fats: 9.5, carbs: 0.7 }, { name: "Milk, 1.5 %", grams: 100, calories: 47, protein: 3.4, fats: 1.5, carbs: 4.8 }, { name: "Quark, low fat", grams: 150, calories: 67, protein: 12, fats: 0.2, carbs: 4 }, { name: "Blueberries", grams: 80, calories: 57, protein: 0.7, fats: 0.3, carbs: 14 }], how: ["Whisk the flour, eggs and milk into a thin batter.", "Bake four thin crêpes in a hot pan, a minute a side.", "Fill with the quark and the berries, and roll."] },
    "chicken": { title: "Chicken and pepper skillet with rice", why: "A new way with chicken, close to your usual, with more vegetables.", items: [{ name: "Chicken breast, raw", grams: 160, calories: 110, protein: 23, fats: 1.5, carbs: 0 }, { name: "Bell pepper", grams: 150, calories: 31, protein: 1, fats: 0.3, carbs: 6 }, { name: "Rice, cooked", grams: 150, calories: 130, protein: 2.7, fats: 0.3, carbs: 28 }, { name: "Olive oil", grams: 8, calories: 884, protein: 0, fats: 100, carbs: 0 }], how: ["Slice the chicken and the pepper.", "Fry the chicken in the oil, then the pepper, 8 minutes in all.", "Serve over the rice."] } };
  const open = async (path = "/plate") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage(); p.on("pageerror", (e) => console.log("ERR", e.message));
    await p.clock.setFixedTime(new Date("2026-11-14T16:45:00+01:00"));
    await p.addInitScript(({ s, per, saf }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify(per)); localStorage.setItem("chefmealan-safety", JSON.stringify(saf)); localStorage.setItem("seeded", "1"); }, { s: seed, per: PERSONAL, saf: SAFETY });
    await p.route("**/api/crave", async (r) => { const body = JSON.parse(r.request().postData() || "{}"); const k = /chick/i.test(body.craving) ? "chicken" : "crêpes"; await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ idea: IDEAS[k] }) }); });
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.goto(U + path); await p.waitForTimeout(1500);
    return p;
  };
  const note = (p, t, sel, where = "beforebegin") => p.evaluate(({ t, NOTE, sel, where }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).insertAdjacentElement(where, d); d.id = "nt"; }, { t, NOTE, sel, where });
  const shot = async (p, name, sel, off = 120) => { await p.evaluate(({ sel, off }) => { const e = sel && document.querySelector(sel); window.scrollTo(0, e ? e.getBoundingClientRect().top + window.scrollY - off : 0); }, { sel, off }); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); await p.context().close(); };
  // Chef Mealan's chat bar, taken from the app itself (Plan, Fill): the bar with only its field and Send
  let bar, hat;
  { const p = await open("/plan"); hat = await p.evaluate(() => { const s = document.querySelector("button.plan-fill svg"); return s ? s.outerHTML : ""; }); const f = p.locator("button.plan-fill"); if (await f.count()) { await f.click(); await p.waitForTimeout(1200); }
    bar = await p.evaluate(() => { const c = document.querySelector(".chat-input").cloneNode(true); const bs = [...c.querySelectorAll("button.icon")]; bs.filter((x) => !/Send/i.test(x.getAttribute("aria-label") || "")).forEach((x) => x.remove()); c.querySelectorAll("input[type=file]").forEach((x) => x.remove()); return c.outerHTML; });
    await p.context().close(); }
  const newTop = (p, typed) => p.evaluate(({ bar, mark, typed }) => {
    const box = document.querySelector("input.crave-box"); const crave = box.closest(".crave");
    const wrap = document.createElement("div"); wrap.innerHTML = bar; const c = wrap.firstElementChild; c.querySelectorAll("button").forEach((x) => x.remove());
    const inp = c.querySelector("input"); inp.placeholder = "Type what you crave or want to cook"; inp.value = typed || ""; inp.setAttribute("value", typed || "");
    box.replaceWith(c);
    c.insertAdjacentHTML("afterend", '<div class="button-row" style="margin:10px 0 2px"><button type="button" class="pill pill-small pill-primary" style="height:44px;padding:0 20px">Find ideas</button></div>');
    const h = crave.querySelector(".crave-hint"); if (h) h.remove();
    crave.classList.add("card"); crave.id = "ideas"; crave.style.cssText += ";padding:14px;" + mark;
    const sub = [...document.querySelectorAll("main p, main small, main span")].find((x) => !x.children.length && /Add your foods\. Chef Mealan sets the amounts\./.test(x.textContent)); if (sub) sub.textContent = "Get an idea for what you crave, or build your own plate. Chef Mealan sets the amounts.";
    const line = document.querySelector(".plan-line"); if (line) { line.id = "mealline"; line.style.cssText += ";" + mark; crave.insertAdjacentElement("beforebegin", line); }
  }, { bar, mark, typed });
  // Find ideas: your dishes (when any), then Chef Mealan's idea under the chef's hat; no Ask button, no Another idea (Find ideas again)
  const newLines = (p, groupsHtml) => p.evaluate(({ mark, hat, groupsHtml }) => {
    const crave = document.querySelector(".crave");
    const head = [...crave.querySelectorAll(".crave-group")].find((x) => /Chef Mealan's idea/.test(x.textContent));
    if (head) { head.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px">' + hat + " Chef Mealan's idea</span>"; head.id = "chefidea"; }
    const again = crave.querySelector(".crave-again"); if (again) again.remove();
    const card = crave.querySelector(".crave-idea"); if (card) { card.classList.remove("card"); card.style.cssText += ";padding:0;border:0;box-shadow:none"; }
    if (groupsHtml) head.insertAdjacentHTML("beforebegin", groupsHtml);
    else head.insertAdjacentHTML("beforebegin", '<small class="muted" id="none" style="display:block;margin:6px 0 2px">Nothing in your recipes, Coach\'s, the members\' or your foods is crêpes.</small>');
  }, { mark, hat, groupsHtml });
  const ideaFor = async (p, t) => { await typeCraving(p, t); const g = await p.evaluate(() => { const c = document.querySelector(".crave"); const gs = [...c.querySelectorAll(".crave-group")].filter((x) => !/Nothing found/.test(x.textContent)); if (!gs.length) return ""; let html = ""; for (const g of gs) { html += g.outerHTML; const n = g.nextElementSibling; if (n && !n.classList.contains("crave-group") && !n.classList.contains("crave-line")) html += n.outerHTML; } return html; });
    const ask = p.getByRole("button", { name: /Ask Chef Mealan for (one|another)/ }).first(); await ask.click(); await p.waitForTimeout(1500); return g; };
  const newAll = async (p, typed) => { await newTop(p, typed); await newWays(p); await newRecipe(p); };
  const typeCraving = async (p, t = "crêpes") => { await p.locator("input.crave-box").fill(t); await p.waitForTimeout(700); };
  const NEWPLATE = `<div id="newplate" style="display:flex;flex-direction:column;align-items:center;gap:6px;margin:6px 0 14px">
      <svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true"><circle cx="66" cy="66" r="62" fill="#fff" stroke="#c9d6ee" stroke-width="3"/><circle cx="66" cy="66" r="44" fill="#f4f7fd" stroke="#dbe4f4" stroke-width="2"/></svg>
      <span style="color:#53627f">Nothing on the plate yet</span></div>`;
  const TILE = (icon, word) => `<button type="button" class="pill" style="flex-direction:column;gap:6px;min-height:88px;border-radius:16px;font-weight:700">${icon}<span>${word}</span></button>`;
  const newWays = (p) => p.evaluate(({ NEWPLATE, mark }) => {
    const TILE = (icon, word) => `<button type="button" class="pill" style="flex-direction:column;gap:6px;min-height:88px;border-radius:16px;font-weight:700">${icon}<span>${word}</span></button>`;
    const ways = document.querySelector(".ways"); const icons = [...ways.querySelectorAll("button svg")].map((s) => { s.setAttribute("width", "24"); s.setAttribute("height", "24"); return s.outerHTML; });
    const words = [...ways.querySelectorAll("button")].map((x) => x.textContent.trim());
    const card = ways.closest("section, .card") || ways.parentElement;
    const empty = [...card.querySelectorAll("p, small, span")].find((x) => /Nothing on the plate yet/.test(x.textContent) && !x.children.length); if (empty) empty.remove();
    const add = [...card.querySelectorAll("small.ways-label")].find((x) => /Add a food/.test(x.textContent));
    if (add) { add.insertAdjacentHTML("beforebegin", NEWPLATE); add.outerHTML = '<b id="h-add" style="display:block;font-size:var(--fs-body);font-weight:800;color:var(--ink);margin:4px 0 8px">Add a food</b>'; }
    const g = document.createElement("div"); g.id = "tiles"; g.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;" + mark;
    g.innerHTML = words.map((t, i) => TILE(icons[i] || "", t)).join(""); ways.replaceWith(g);
    const rl = [...card.querySelectorAll("small.ways-label")].find((x) => /Start from a recipe/.test(x.textContent));
    if (rl) rl.outerHTML = '<div style="border-top:1px solid var(--line);margin:16px 0 0"></div><b id="rl" style="display:block;font-size:var(--fs-body);font-weight:800;color:var(--ink);margin:14px 0 8px">Have a recipe? Start from it</b>';
  }, { NEWPLATE, mark });
  const newRecipe = (p) => p.evaluate((mark) => {
    const l = document.getElementById("rl"); const row = l.nextElementSibling; row.style.cssText += ";" + mark; row.id = "rrow";
    row.querySelectorAll("button, label").forEach((x) => { for (const n of x.childNodes) if (n.nodeType === 3 && n.textContent.trim()) { n.textContent = /Screenshot/.test(n.textContent) ? " Use a screenshot" : /Link/.test(n.textContent) ? " Paste a link" : n.textContent; } });
  }, mark);
  // three ideas, each short: title, PD, why, View more; the first one opened on request
  const ALT = [{ t: "Buckwheat crêpes with ham and cheese", pd: "6.9", w: "Savoury and filling, with buckwheat for the crêpe." }, { t: "Banana and oat crêpes with skyr", pd: "7.6", w: "Sweet without sugar added: banana in the batter, skyr inside." }];
  const threeIdeas = (p, opened) => p.evaluate(({ hat, ALT, opened, mark }) => {
    const card = document.querySelector(".crave .crave-idea"); if (!card) return;
    const short = (title, pd, why, id) => `<div class="crave-idea" id="${id}" style="border-top:1px solid var(--line);padding:12px 0 4px;display:flex;flex-direction:column;gap:6px"><div class="crave-idea-top" style="display:flex;justify-content:space-between;gap:8px"><b>${title}</b><div class="pick-pd fits"><b>${pd}</b><small>fits</small></div></div><small class="muted">${why}</small><div class="button-row" style="justify-content:flex-end;margin:0"><button type="button" class="pill pill-small pill-action" style="height:44px">View more</button></div></div>`;
    const top = card.querySelector(".crave-idea-top"); const title = top.querySelector("b").textContent; const pd = top.querySelector(".pick-pd b")?.textContent || ""; const why = card.querySelector("small.muted")?.textContent || "";
    let first;
    if (opened) { card.id = "idea1"; card.style.cssText += ";border-top:1px solid var(--line);padding-top:12px;" + mark;
      const kept = card.querySelector(".crave-kept"); if (kept) kept.remove();
      const put = [...card.querySelectorAll("button")].find((x) => /Put it on my plate/.test(x.textContent));
      if (put) put.outerHTML = (opened === "saved"
        ? '<div class="button-row" id="saverow" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0"><b style="color:var(--top);font-weight:900">✓ Saved in My recipes</b><button type="button" class="pill pill-small pill-primary" style="height:44px;padding:0 18px">Put it on my plate</button></div>'
        : '<div class="button-row" id="saverow" style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0"><button type="button" class="pill pill-small pill-action" style="height:44px;padding:0 18px">Save in My recipes</button><button type="button" class="pill pill-small pill-primary" style="height:44px;padding:0 18px">Put it on my plate</button></div>')
        + '<div class="button-row" style="justify-content:flex-end;margin:0"><button type="button" class="pill pill-small pill-action" style="height:44px">View less</button></div>';
      first = card.outerHTML; }
    else first = short(title, pd, why, "idea1");
    card.outerHTML = first + short(ALT[0].t, ALT[0].pd, ALT[0].w, "idea2") + short(ALT[1].t, ALT[1].pd, ALT[1].w, "idea3");
    const head = document.getElementById("chefidea"); if (head) head.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px">' + hat + " Chef Mealan's ideas</span>";
  }, { hat, ALT, opened, mark });
  const fixedNote = (p, t) => p.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE + ";position:fixed;left:0;right:0;top:64px;z-index:99"; d.textContent = t; document.body.appendChild(d); }, { t, NOTE });
  try {
    // ---------- Flow 1, an idea for what you crave: now ----------
    let p = await open(); await p.evaluate((m) => { document.querySelector("input.crave-box").style.cssText += ";" + m; }, mark);
    await note(p, "1. Now: Plate opens. The box hardly shows; its grey text reads like something typed; three lines of help under it.", "input.crave-box");
    await shot(p, "p301a", null);
    p = await open(); await typeCraving(p); await p.evaluate((m) => { const b = document.querySelector(".crave-ask button"); b.style.cssText += ";" + m; }, mark);
    await note(p, "2. Now: you type crêpes. Dishes would show as you type; here nothing is found. You tap Ask Chef Mealan for one.", "input.crave-box");
    await shot(p, "p301b", "#nt", 140);
    p = await open(); await typeCraving(p); await p.getByRole("button", { name: /Ask Chef Mealan for one/ }).click(); await p.waitForTimeout(1500);
    await p.evaluate((m) => { const b = [...document.querySelectorAll(".crave-idea button")].find((x) => /Put it on my plate/.test(x.textContent)); b.style.cssText += ";" + m; b.id = "putbtn"; }, mark);
    await note(p, "3. Now: one idea, Protein crêpes with quark and berries, with its foods and how to make it. You tap Put it on my plate.", "#putbtn");
    await shot(p, "p301k", "#nt", 420);
    p = await open(); await typeCraving(p); await p.getByRole("button", { name: /Ask Chef Mealan for one/ }).click(); await p.waitForTimeout(1500);
    await p.getByRole("button", { name: /Put it on my plate/ }).click(); await p.waitForTimeout(1200);
    await p.evaluate((m) => { window.scrollTo(0, 0); const el = [...document.querySelectorAll("main h1, main h2, main input, main b, main span")].find((x) => /Protein crêpes with quark and berries/.test(x.value || x.textContent || "") && (x.tagName === "INPUT" || !x.children.length)); if (el) { el.style.cssText += ";" + m; el.id = "dish"; } }, mark);
    await note(p, "4. The plate opens with that idea: Protein crêpes with quark and berries, its foods set to your meal.", "#dish");
    await shot(p, "p301l", null);
    // ---------- Flow 1: new ----------
    p = await open(); await newAll(p, "");
    await note(p, "1. New: the meal line right under the title. Then the ideas block, one card: the box, and Find ideas, the one button.", "#mealline");
    await shot(p, "p301e", null);
    p = await open(); await ideaFor(p, "crêpes"); await newAll(p, "crêpes"); await newLines(p, ""); await threeIdeas(p, false);
    await note(p, "2. New: crêpes, Find ideas. Nothing in your recipes or the others, so Chef Mealan's ideas come in the same card, under the chef's hat: three, each short, with View more.", "#none");
    await shot(p, "p301f", "#nt", 160);
    p = await open(); await ideaFor(p, "crêpes"); await newAll(p, "crêpes"); await newLines(p, ""); await threeIdeas(p, true);
    await p.evaluate((m) => { const b = [...document.querySelectorAll("#idea1 button")].find((x) => /Put it on my plate/.test(x.textContent)); b.style.cssText += ";" + m; b.id = "putbtn"; }, mark);
    await note(p, "3. New: View more opened Protein crêpes with quark and berries: its foods, how to make it. Save in My recipes on the left, Put it on my plate on the right. View less closes it. You tap Put it on my plate.", "#saverow");
    await shot(p, "p301m", "#nt", 440);
    p = await open(); await ideaFor(p, "crêpes"); await newAll(p, "crêpes"); await newLines(p, ""); await threeIdeas(p, "saved");
    await p.evaluate((m) => { const r = document.getElementById("saverow"); r.style.cssText += ";" + m; }, mark);
    await note(p, "New: an idea is not saved by itself. After Save in My recipes: ✓ Saved in My recipes, and Put it on my plate stays.", "#saverow");
    await shot(p, "p301q", "#nt", 440);
    // ---------- Also: dishes found ----------
    p = await open(); await typeCraving(p, "chicken"); await p.evaluate((m) => { const l = document.querySelector(".crave-line"); l.style.cssText += ";display:block;" + m; l.id = "resline"; }, mark);
    await note(p, "Now: chicken. Dishes as you type; under them a line and a link, Ask Chef Mealan for another.", "#resline");
    await shot(p, "p301i", "#nt", 300);
    p = await open(); { const g = await ideaFor(p, "chicken"); await newAll(p, "chicken"); await newLines(p, g); await threeIdeas(p, false); }
    await note(p, "New: chicken, Find ideas. Your dishes first, then Chef Mealan's three ideas under them, each short with View more.", "#chefidea");
    await shot(p, "p301j", "#nt", 420);
    // ---------- Flow 2, build your own plate ----------
    p = await open(); await p.evaluate((m) => { const w = document.querySelector(".ways"); w.style.cssText += ";" + m; }, mark);
    await note(p, "2. Now: further down, On the plate, empty. Four big buttons stacked. You tap Manual.", ".ways");
    await shot(p, "p301c", "#nt", 260);
    p = await open(); await p.locator(".ways button").filter({ hasText: "Manual" }).click(); await p.waitForTimeout(900);
    await fixedNote(p, "3. Manual: the sheet to type a food and its numbers.");
    await shot(p, "p301n", null);
    p = await open(); await newAll(p, "");
    await note(p, "2. New: further down, On the plate: an empty plate drawn, then Add a food as a heading over the four tiles. You tap Manual. New design, for your approval.", "#newplate");
    await shot(p, "p301g", "#nt", 200);
    // ---------- Flow 3, bring a recipe ----------
    p = await open(); await p.evaluate((m) => { const l = [...document.querySelectorAll("small.ways-label")].find((x) => /Start from a recipe/.test(x.textContent)); l.id = "rl"; l.nextElementSibling.style.cssText += ";" + m; }, mark);
    await note(p, "2. Now: under the four buttons, Start from a recipe, a small grey label over Screenshot and Link. You tap Link.", "#rl");
    await shot(p, "p301d", "#nt", 300);
    p = await open(); await p.locator(".plate-card button").filter({ hasText: /^\s*Link\s*$/ }).first().click(); await p.waitForTimeout(800);
    await p.evaluate(() => { const i = document.querySelector(".plate-card input[type=url]") || document.querySelector(".plate-card input"); if (i) i.id = "linkbox"; });
    await note(p, "3. The box for the recipe's link, and Read it.", "#linkbox");
    await shot(p, "p301o", "#nt", 300);
    p = await open(); await p.locator(".plate-card button").filter({ hasText: /^\s*Link\s*$/ }).first().click(); await p.waitForTimeout(800);
    await p.evaluate((m) => { const i = document.querySelector(".plate-card input[type=url]") || document.querySelector(".plate-card input"); if (i) i.id = "linkbox";
      const sub = [...document.querySelectorAll("main p, main small, main span")].find((x) => !x.children.length && /Add your foods\. Chef Mealan sets the amounts\./.test(x.textContent)); if (sub) sub.textContent = "Get an idea for what you crave, or build your own plate. Chef Mealan sets the amounts.";
      const l = [...document.querySelectorAll("main small")].find((x) => /use Screenshot there/.test(x.textContent)); if (l) { l.textContent = l.textContent.replace("use Screenshot there", "tap Use a screenshot there"); l.style.cssText += ";display:block;" + m; } }, mark);
    await note(p, "3. New: the same box for the link. Its line names the button by its new words: tap Use a screenshot there.", "#linkbox");
    await shot(p, "p301p", "#nt", 300);
    p = await open(); await newAll(p, "");
    await note(p, "2. New: a line, then the second part as a heading: Have a recipe? Start from it. Under it Use a screenshot and Paste a link. You tap Paste a link.", "#rl");
    await shot(p, "p301h", "#nt", 300);
  } finally { await b.close(); server.kill(); }
})();
