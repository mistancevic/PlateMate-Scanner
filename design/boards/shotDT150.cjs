// DT150 (Coach Milan 29 October 00:19 to 00:24): a dish keeps its proportions. Cooking, layered meals and desserts are not
// pure nutrition math: Fit sizes whole parts, a dish gets its parts, the steps say when they are out of date
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = []; seed.feedback = []; seed.meals = [];
const F2 = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "typical values", source: "estimate", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, table: undefined, icon: undefined });
const BU = F2("butter", "Butter", 741, 0.7, 82, 0.6), ST = F2("straw", "Strawberries", 32, 0.7, 0.3, 7.7);
seed.foods = [...seed.foods, BU, ST];
const id = (re) => seed.foods.find((f) => re.test(f.name)).id;
const PORT = "3318", U = `http://127.0.0.1:${PORT}`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-29T19:40:00"));
  await page.addInitScript(([s]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, kitchens: ["Balkan"], lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 4 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("chefmealan-region", "munich"); localStorage.setItem("seeded", "1"); }, [seed]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const flat = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (name) => { await page.waitForTimeout(400); await flat(); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const note = (sel, text) => page.evaluate(({ sel, text, NOTE }) => { const x = document.querySelector(sel); if (!x) return console.log("no " + sel); const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = text; x.before(d); }, { sel, text, NOTE });
  const put = async (its, title) => { await page.goto(U + "/"); await page.waitForTimeout(600); await page.evaluate(([its, title]) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.items = its.map(([id, g], k) => ({ id: "i" + k, food: s.foods.find((f) => f.id === id), grams: g, locked: false })); s.title = title; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, [its, title]); await page.reload(); await page.waitForTimeout(800); await page.locator("nav button").filter({ hasText: "Plate" }).click(); await page.waitForTimeout(1200); };
  const cup = [[id(/^Oats/), 80], [BU.id, 20], [id(/^Quark/), 100], [id(/^Eggs/), 50], [id(/^Honey/), 15], [ST.id, 80]];
  // a, now: Fit moves one food
  await put(cup, "Baked cheesecake cup");
  await page.getByRole("button", { name: /Fit to my target/ }).click(); await page.waitForTimeout(1500);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("platemate-pilot-v1")).items.map((i) => `${i.food.name.split(",")[0]} ${Math.round(i.grams)}`).join(", "));
  console.log("after fit:", after);
  await page.evaluate((m) => { const r = document.querySelector(".plate-card .rows"); if (r) r.style.cssText += ";" + m; }, mark);
  await note(".plate-card", `Now (0.2.129): a baked cheesecake cup, oats and butter for the base, quark, egg and honey for the filling, strawberries on top. Fit moved one food, the one with the most protein: ${after}. The egg that sets the filling stayed. That is nutrition math, not a recipe.`);
  await shot("r150a");
  // b, new: a dish keeps its proportions: parts, and Fit sizes the filling as a whole
  await put(cup, "Baked cheesecake cup");
  await page.evaluate((m) => {
    const rows = document.querySelector(".plate-card .rows"); if (!rows) return;
    const g = (name, list, line) => `<div class="pt-group" style="margin-bottom:6px"><div class="pt-h"><span><b>${name}</b><small style="display:block">${line}</small></span></div>${list.map(([n, a, b2]) => `<div class="row" style="display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid #d1dcf0"><b>${n}</b><span><s style="color:#5b6b8a;margin-right:6px">${a} g</s><b>${b2} g</b></span></div>`).join("")}</div>`;
    rows.innerHTML = g("Base", [["Oats", 80, 80], ["Butter", 20, 20]], "Stays as it is") + g("Filling", [["Quark, low fat", 100, 135], ["Eggs", 50, 68], ["Honey", 15, 20]], "Fit sized it as a whole, all three by a third: 2 quark to 1 egg kept") + g("Topping", [["Strawberries", 80, 80]], "Stays as it is");
    rows.style.cssText += ";" + m;
    const l = document.createElement("small"); l.style.cssText = "display:block;margin:8px 0;font-weight:700;color:#123a7a"; l.textContent = "Fit sized the filling: quark, eggs and honey together, as written. The base and the topping stay. Change any food and Fit keeps its part's proportions."; rows.after(l);
  }, mark);
  await note(".plate-card", "New: the plate is a dish (it bakes, it has parts), so Fit sizes whole parts, never one food. The filling grows as a whole and keeps its 2 to 1; the base keeps its oats to butter.");
  await shot("r150b");
  // c, new: your own cooked plate: one question
  await put(cup, "");
  await page.evaluate((m) => {
    const rows = document.querySelector(".plate-card .rows"); if (!rows) return;
    const c = document.createElement("div"); c.style.cssText = "padding:10px;margin:10px 0;background:#fff;border-radius:14px;" + m;
    c.innerHTML = `<b style="display:block">Is this one dish?</b><small style="display:block;margin:4px 0 8px">Eggs and butter are cooked, so these foods are made together. Grouped into parts, Fit keeps each part's proportions and the steps go part by part.</small><small style="display:block;margin-bottom:8px"><b>Base:</b> oats, butter · <b>Filling:</b> quark, eggs, honey · <b>Topping:</b> strawberries</small><div class="button-row"><button class="pill pill-small pill-primary">Group it like this</button><button class="pill pill-small">Change the parts</button><button class="pill pill-small">No, separate foods</button></div>`;
    rows.before(c);
  }, mark);
  await note(".plate-card", "New: a plate you build yourself with a food you cook gets one question, with the parts suggested. Chef Mealan's ideas, links and screenshots come with their parts already.");
  await shot("r150c");
  // d, new: the steps say when they are out of date
  await put([[id(/^Oats/), 80], [BU.id, 20], [id(/Greek yogurt/), 250], [id(/^Eggs/), 125], [id(/^Honey/), 38], [ST.id, 80]], "Baked cheesecake cup");
  await page.evaluate((m) => {
    const anchor = document.querySelector(".plate-card"); if (!anchor) return;
    const c = document.createElement("section"); c.className = "card mk-card plate-steps"; c.style.cssText = "margin:10px 0;" + m;
    c.innerHTML = `<b>Steps</b><small style="display:block;margin:6px 0;color:#8a5a00;font-weight:700;background:#fff4e0;padding:6px 8px;border-radius:10px">The steps were written for quark. You swapped it for Greek yogurt.</small><ol class="rp-steps" style="opacity:.55"><li><span>1</span><div>Heat the oven to 180 °C. Melt the butter and mix it with the oats; press into two cups.</div></li><li><span>2</span><div>Whisk the quark, eggs and honey smooth; pour over the base.</div></li><li><span>3</span><div>Bake for 25 minutes, until set at the edge with a slight wobble in the middle.</div></li></ol><div class="button-row"><button class="pill pill-small pill-primary">Redraft for Greek yogurt</button><button class="link">Keep them</button></div>`;
    anchor.after(c);
  }, mark);
  await note(".plate-card", "New: change a food after the steps were written, by swap, add or remove, and the steps say so and step back. One tap redrafts them for the foods on the plate. You never cook from a method written for other foods.");
  await shot("r150d");
  // e, new: Chef Mealan's culinary check reads the dish
  await put([[id(/^Oats/), 80], [BU.id, 20], [id(/^Quark/), 380], [id(/^Eggs/), 50], [id(/^Honey/), 15], [ST.id, 80]], "Baked cheesecake cup");
  await page.evaluate((m) => {
    const anchor = document.querySelector(".plate-card .rows"); if (!anchor) return;
    const c = document.createElement("div"); c.style.cssText = "padding:10px;margin:10px 0;background:#fff4e0;border-radius:14px;color:#8a5a00;" + m;
    c.innerHTML = `<b style="display:block">The filling won't set</b><small style="display:block;margin:4px 0 8px;color:#172742">380 g of quark with one egg stays soft when baked; one egg sets about 200 g. Two eggs, or less quark, or make it a no-bake cup.</small><div class="button-row"><button class="pill pill-small pill-primary">Two eggs</button><button class="pill pill-small">200 g quark</button><button class="pill pill-small">Make it no-bake</button></div>`;
    anchor.after(c);
  }, mark);
  await note(".plate-card", "New: Chef Mealan's culinary card reads the dish, not only which foods go together. When a change breaks it (too little egg to set a baked filling), he says why, with the ways to fix it.");
  await shot("r150e");
  await b.close(); server.kill();
})();
