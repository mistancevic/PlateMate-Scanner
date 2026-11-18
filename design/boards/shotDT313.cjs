// Boards DT313, DT314 and B148 (prep for 0.3.158, "the meal model, closed"), drawn 18 November 2026 on the app as built
// in 0.3.157. DT313: a dish from Recipes, from the Plan or from the chat onto a plate with foods gets the question a photo
// gets. DT314: A plate from earlier, Ate it, asks the meal in the calendar. B148: the calendar under Ate it and Plan it does not change its day. The barcode frames (s_0 to s_2) are kept for reference; a barcode onto a plate of now is agreed on the board DT308.12.
// "Now" frames are the app itself; "proposed" frames are the app's own screens with words changed in place (blue outline,
// yellow note). Run: ROOT=/home/claude/pm157 BOARDS_SHOTS=... CHROME=/usr/bin/google-chrome node shotDT313.cjs
const ROOT = process.env.ROOT || "/home/claude/pm157";
const start = require(ROOT + "/tests/flows/plate157.cjs"), more = require(ROOT + "/tests/flows/more.cjs");
const fs = require("node:fs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs158"; fs.mkdirSync(R, { recursive: true });
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", TAP = "outline:4px solid #f0a81c;outline-offset:2px", RED = "outline:3px solid #d13a3a;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`;
const F = (sd, n) => sd.foods.find((f) => f.name.startsWith(n));
const bowl = (sd) => ({ id: "r1", title: "Chicken and rice bowl", items: [{ id: "r1a", food: F(sd, "Rice"), grams: 200, locked: false }, { id: "r1b", food: F(sd, "Chicken"), grams: 190, locked: false }], portion: 390, savedAt: "2026-11-10T10:00:00Z" });
const seedRec = (sd) => { sd.meals = [bowl(sd)]; };
// in the page: outline an element, put a note after or before it
const deco = (p, list) => p.evaluate(({ list, MARK, TAP, RED, NOTE }) => { for (const [sel, how, text, nth] of list) { const all = [...document.querySelectorAll(sel)]; const el = all[nth || 0]; if (!el) { console.log("no " + sel); continue; }
  if (how === "mark") el.style.cssText += ";" + MARK; else if (how === "tap") el.style.cssText += ";" + TAP; else if (how === "red") el.style.cssText += ";" + RED;
  else { const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = text; el.insertAdjacentElement(how === "before" ? "beforebegin" : "afterend", n); } } }, { list, MARK, TAP, RED, NOTE });
const byText = (p, sel, re, how) => p.evaluate(({ sel, re, how, MARK, TAP, RED }) => { const el = [...document.querySelectorAll(sel)].find((e) => new RegExp(re).test(e.textContent)); if (el) el.style.cssText += ";" + ({ mark: MARK, tap: TAP, red: RED })[how]; return !!el; }, { sel, re, how, MARK, TAP, RED });
const shot = async (p, name, h, y = 0) => { if (!y) await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(350); const full = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y, width: 390, height: Math.min(h || full, full - y) } }); console.log("shot", name); };
const view = async (p, name) => { await p.waitForTimeout(250); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
const noNav = (p) => p.addStyleTag({ content: "nav, .chef-fab, .talk-fab, [class*=fab] { display: none !important }" });
(async () => { const h = await start("3690"); try {
  // ---------- DT313 a: now. A recipe from Recipes onto a plate with foods
  let p = await h.open({ seed: seedRec });
  await h.tab(p, "Recipes"); await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(900); await noNav(p);
  await byText(p, "main button", "^Change it first$", "tap");
  const cy = await p.evaluate(() => { const b = [...document.querySelectorAll("main button")].find((e) => /^Change it first$/.test(e.textContent)); return Math.max(0, b.getBoundingClientRect().top + scrollY - 520); });
  await shot(p, "r_0", 760, cy);
  await p.getByRole("button", { name: "Change it first" }).click(); await p.waitForTimeout(1200); await noNav(p);
  await deco(p, [[".plate-ask", "red"], [".plate-ask", "after", "<b>As it is in 0.3.157.</b> The old look: no warning, the foods of the plate are not named, and Start a new plate comes first.<br><b>Start a new plate throws skyr, oats and banana away.</b> They are saved nowhere, and there is no Undo."]]);
  await shot(p, "r_1", 640);
  await p.context().close();
  // ---------- DT313 b: as built in 0.3.157 for a photo (the screen to reuse)
  p = await h.open({}); await h.toPhoto(p); await h.readIt(p); await p.waitForTimeout(600); await noNav(p);
  await shot(p, "r_2", 760);
  await p.context().close();
  // ---------- DT313 c: proposed. The same screen for a recipe from Recipes (drawn on the screen a recipe link gets today)
  p = await h.open({ seed: seedRec });
  await p.locator(".add-more-open").click(); await p.waitForTimeout(300); await p.locator(".add-more").getByRole("button", { name: "Recipe link" }).click(); await p.waitForTimeout(500);
  await p.locator("main input[type=url]").fill("https://www.kitchenstories.com/en/recipes/margherita-pizza"); await p.getByRole("button", { name: "Read it" }).click(); await p.waitForTimeout(1500);
  await p.getByRole("button", { name: "Put it on my plate" }).click(); await p.waitForTimeout(800); await noNav(p);
  await p.evaluate(() => { const walk = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT); let n; while ((n = walk.nextNode())) { n.nodeValue = n.nodeValue.replace("The recipe is Margherita pizza: 5 foods, for 2 pizzas.", "The recipe is Chicken and rice bowl, from My recipes: 2 foods.").replace("Back to the recipe", "Back to the recipe"); } });
  await deco(p, [[".ask-back", "mark"], [".plate-ask-photo", "mark"], [".plate-ask-photo", "after", "<b>New.</b> The screen a photo and a recipe link get, with no new element. <b>Back to the recipe</b> returns to the recipe's page with nothing changed; it takes the place of Keep my plate.<br>The same screen for a meal from the Plan (Back to the plan) and a dish from the chat (Back to the chat)."]]);
  await shot(p, "r_3", 900);
  await p.context().close();
  // ---------- DT313 d: proposed. After Start a new plate: the old plate is saved, one line with Undo (the line of DT308.12)
  p = await h.open({ seed: seedRec });
  await h.tab(p, "Recipes"); await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(900);
  await p.getByRole("button", { name: "Change it first" }).click(); await p.waitForTimeout(1000);
  await p.getByRole("button", { name: "Start a new plate" }).click(); await p.waitForTimeout(1000);
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const f = (n) => s.foods.find((x) => x.name.startsWith(n));
    const items = [{ id: "s1", food: f("Skyr"), grams: 250, locked: false }, { id: "s2", food: f("Oats"), grams: 80, locked: false }, { id: "s3", food: f("Banana"), grams: 118, locked: false }];
    s.meals.push({ id: "old1", title: "Skyr, Oats & Banana", items, portion: 448, savedAt: "2026-11-15T17:00:00Z" });
    s.oldPlate = { id: "old1", title: "Skyr, Oats & Banana", kind: "recipe", made: true, back: { items, title: "", portion: null } }; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await p.reload(); await p.waitForTimeout(1500); await noNav(p);
  await deco(p, [[".old-plate", "mark"], [".old-plate", "after", "<b>New here.</b> The line a photo's new plate gets today: the old plate is in My recipes, Undo brings it back and takes the recipe off."]]);
  await shot(p, "r_4", 760);
  await p.context().close();

  // ---------- DT314 a, b: now. A plate from earlier, Ate it
  const oldSeed = (sd) => { sd.items = [{ id: "o1", food: F(sd, "Skyr"), grams: 250, locked: false }, { id: "o2", food: F(sd, "Oats"), grams: 80, locked: false }]; sd.plateAt = "2026-11-14T19:10:00+01:00"; };
  p = await h.open({ foods: [], seed: oldSeed }); await noNav(p);
  await byText(p, ".chef-ask button", "^Ate it$", "tap");
  await shot(p, "o_0", 560);
  await p.getByRole("button", { name: "Ate it" }).click(); await p.waitForTimeout(1200); await noNav(p);
  await p.evaluate(({ NOTE }) => { const t = document.querySelector("[role=status], .toast, .notice") || document.querySelector("main").firstElementChild; const n = document.createElement("div"); n.style.cssText = NOTE + ";margin:64px 16px 12px";
    n.innerHTML = "<b>As it is in 0.3.157.</b> One tap and it is logged. The app picked the meal itself, the one nearest to 19:10, and does not say which. I was never asked, and it can be the wrong meal."; document.querySelector("main").insertAdjacentElement("afterbegin", n); }, { NOTE });
  await shot(p, "o_1", 620);
  await p.context().close();
  // ---------- DT314 c, d: proposed. Ate it opens the calendar on the plate's day, the nearest meal marked
  p = await h.open({ foods: [], seed: oldSeed });
  await p.getByRole("button", { name: "Keep working on it" }).click(); await p.waitForTimeout(800);
  await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(900);
  const days = await p.locator(".pcal button").allInnerTexts(); console.log("days:", days.map((t) => t.replace(/\s+/g, " ")).join(" | "));
  // B148: under Ate it a tap on another day does nothing in 0.3.157 (the day's tap is overwritten by closing More)
  await p.evaluate(({ TAP, NOTE }) => { const d = document.querySelector(".pcal-day"); d.style.cssText += ";" + TAP; const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a");
    n.innerHTML = "<b>Bug in 0.3.157 (B148).</b> Under Ate it and under Plan it, a tap on another day does nothing: the calendar stays on the day it opened on. Only More, then a date, moves it. The calendar behind the pencil is not affected."; document.querySelector(".pcal").insertAdjacentElement("afterend", n); }, { TAP, NOTE });
  const by = await p.evaluate(() => Math.max(0, document.querySelector(".pcal").getBoundingClientRect().top + scrollY - 150));
  await noNav(p); await shot(p, "o_b", 640, by);
  await p.evaluate(() => { document.querySelector(".pcal-day").style.outline = ""; document.querySelector(".pcal").nextElementSibling.remove(); });
  await p.locator(".pcal-more").click(); await p.waitForTimeout(300); await p.locator(".pcal input[type=date]").fill("2026-11-14"); await p.waitForTimeout(700); await noNav(p);
  await p.evaluate(() => { const i = document.querySelector(".pcal input[type=date]"); if (i) i.style.display = "none"; document.querySelector(".pcal-more").classList.remove("on"); document.querySelector(".pcal-days").scrollLeft = 0; });
  await p.evaluate(({ MARK, NOTE }) => { document.querySelector(".pcal-day").style.cssText += ";" + MARK; const n = document.createElement("div"); n.id = "b148n"; n.style.cssText = NOTE; n.innerHTML = "<b>After the fix.</b> Sat 14 is marked and the rows are Saturday's meals, all not eaten. Nothing new is drawn: it is what the calendar behind the pencil does."; document.querySelector(".pcal").insertAdjacentElement("afterend", n); }, { MARK, NOTE });
  await shot(p, "o_c", 640, by);
  await p.evaluate(() => { document.getElementById("b148n").remove(); document.querySelector(".pcal-day").style.outline = ""; const q = document.querySelector(".pcal-q"); if (q) q.textContent = "Which meal? The plate was started on Saturday, 19:10:"; });
  console.log("on:", await p.locator(".pcal-day.on").allInnerTexts());
  console.log("rows:", (await h.rows(p)).join(" | "));
  await p.evaluate(({ MARK, NOTE }) => { const c = document.querySelector(".pcal"); c.style.cssText += ";" + MARK; const r = [...document.querySelectorAll(".pcal-row")].find((e) => /Dinner/.test(e.textContent)); if (r) { r.style.background = "#e3edff"; r.style.boxShadow = "inset 0 0 0 2px #2a72d9"; const b = r.querySelector("b") || r.firstElementChild; if (b && !/✓/.test(b.textContent)) b.textContent = "✓ " + b.textContent; }
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> Ate it on a plate from earlier opens the calendar of the board DT308, on the day the plate was started. The nearest meal is marked as the guess: Dinner, for 19:10. One tap on a row logs it there. Another day or meal is one tap more."; c.insertAdjacentElement("afterend", n); }, { MARK, NOTE });
  const py = await p.evaluate(() => Math.max(0, document.querySelector(".pcal").getBoundingClientRect().top + scrollY - 150));
  await shot(p, "o_2", 720, py);
  await p.locator(".pcal-row").filter({ hasText: /Dinner/ }).first().click(); await p.waitForTimeout(1200); await noNav(p);
  console.log("after:", (await h.body(p)).slice(0, 160));
  await p.evaluate(({ MARK }) => { const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = walk.nextNode())) if (/^Logged|is in Saturday/.test(n.nodeValue.trim())) { n.parentElement.closest("div").style.cssText += ";" + MARK; break; } }, { MARK });
  await shot(p, "o_3", 620);
  await p.context().close();

  // ---------- DT315: a food from a barcode, as it is
  p = await h.open({});
  await p.unroute("**/api/product/**");
  await p.route("**/api/product/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ product_name: "Protein pudding vanilla", brand: "Ehrmann", calories: 75, protein: 10, fats: 1.5, carbs: 5, fiber: 0, source: "Open Food Facts · review required" }) }));
  await (await more(p, "scan")).click(); await p.waitForTimeout(2000);
  await p.getByRole("button", { name: /^Barcode$/ }).click(); await p.waitForTimeout(400);
  const field = p.locator('input[aria-label="Type the barcode"]'); await field.fill("4006040000001"); await p.keyboard.press("Enter"); await p.waitForTimeout(900);
  await byText(p, "button", "^Use the code only$", "tap"); await view(p, "s_0");
  await p.getByRole("button", { name: "Use the code only" }).click(); await p.waitForTimeout(1400); await view(p, "s_1");
  await p.getByLabel(/I checked the values/).check(); await p.getByRole("button", { name: /Confirm & save food/ }).click(); await p.waitForTimeout(1200); await noNav(p);
  await byText(p, ".row-food, .item, li, .plate-row", "Protein pudding", "mark");
  await p.evaluate(({ NOTE }) => { const m = document.querySelector(".meal-line"); const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>As it is in 0.3.157.</b> The food joins the plate with no question, one message on top, and the meal line stays as it was. On a plate of now this reads right: one food is not a dish."; m.insertAdjacentElement("afterend", n); }, { NOTE });
  await shot(p, "s_2", 1100);
  await p.context().close();
  // a food onto a plate from earlier: the old question
  p = await h.open({ foods: [], seed: oldSeed });
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.plateAsked = undefined; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
  await h.tab(p, "Recipes"); await p.waitForTimeout(300);
  const foods = require(ROOT + "/tests/flows/foods.cjs"); await foods(p).catch((e) => console.log("foods:", e.message.slice(0, 120)));
  await p.waitForTimeout(600); console.log("FOODS:", (await h.main(p)).slice(0, 300));
  await p.evaluate(() => { const bs = [...document.querySelectorAll("button")].filter((b) => /^Add to meal$/.test(b.textContent.trim())); let best = null, len = 1e9; for (const b of bs) { let e = b.parentElement; for (let i = 0; i < 5 && e; i++, e = e.parentElement) if (/Banana/.test(e.textContent)) { if (e.textContent.length < len) { len = e.textContent.length; best = b; } break; } } best && best.click(); }); await p.waitForTimeout(1200);
  await noNav(p); console.log("FOODQ:", (await h.main(p)).slice(0, 420));
  if (await p.locator(".plate-ask").count()) { await deco(p, [[".plate-ask", "red"], [".plate-ask", "after", "<b>As it is in 0.3.157.</b> Only a plate from earlier asks. It is the old look again, and Start a new plate throws the old plate away."]]); await shot(p, "s_3", 640); }
  await p.context().close();
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 700)); process.exit(1); });
