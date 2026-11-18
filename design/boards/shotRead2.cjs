// Frames added on 18 November 2026, 18:46, after Coach Milan's look at the boards: DT307.4b (the tick in a row of its own,
// Cancel left of Done), DT306b (Don't count it as an answer, Add a food leaves the card), and screens for the four small
// tickets DT315, DT316, DT317 and B149, which had words only. On the app as built in 0.3.159.
// Run: ROOT=/home/claude/pm159 BOARDS_SHOTS=... CHROME=/usr/bin/google-chrome node shotRead2.cjs
const ROOT = process.env.ROOT || "/home/claude/pm159";
const start = require(ROOT + "/tests/flows/plate157.cjs");
const fs = require("node:fs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs160"; fs.mkdirSync(R, { recursive: true });
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", RED = "outline:3px solid #d13a3a;outline-offset:2px;border-radius:12px", TAP = "outline:4px solid #f0a81c;outline-offset:2px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`;
const RNOTE = NOTE.replace(/#2a72d9/g, "#d13a3a");
const F = (sd, n) => sd.foods.find((f) => f.name.startsWith(n));
const noNav = (p) => p.addStyleTag({ content: "nav, .chat-fab { display: none !important }" });
const shot = async (p, name, h, y = 0) => { if (!y) await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(350); const full = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y, width: 390, height: Math.min(h || full, full - y) } }); console.log("shot", name, Math.min(h || full, full - y)); };
const ev = (p, fn, extra = {}) => p.evaluate(fn, { MARK, RED, TAP, NOTE, RNOTE, ...extra });
const topOf = (p, sel, pad = 120) => p.evaluate(({ sel, pad }) => { const e = document.querySelector(sel); return Math.max(0, e.getBoundingClientRect().top + scrollY - pad); }, { sel, pad });
(async () => { const h = await start("3695"); try {
  const readScreen = async () => { const p = await h.open({ foods: [] }); await h.toPhoto(p); await h.readIt(p); return p; };
  const setDinner = async (p) => { await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(500); await h.row(p, "Dinner", ".plate-end").click(); await p.waitForTimeout(900); };
  const TICK = (on) => `<label style="display:flex;align-items:center;gap:10px;min-height:44px;font-size:15px;font-weight:700;color:#172742"><span style="width:24px;height:24px;border:2px solid #2a72d9;border-radius:6px;display:inline-grid;place-items:center;color:#2a72d9;font-weight:900;background:#fff">${on ? "✓" : ""}</span>Save in My recipes</label>`;

  // ---------- DT307.4b: the tick in a row of its own, Cancel left of Done
  let p = await readScreen(); await setDinner(p); await noNav(p);
  await ev(p, ({ MARK, NOTE, TICK }) => { const r = document.querySelector(".rv-go"); const row = document.createElement("div"); row.style.cssText = "margin:10px 0 4px;" + MARK; row.innerHTML = TICK; r.insertAdjacentElement("beforebegin", row);
    r.querySelector(".rv-save").remove(); const c = document.createElement("button"); c.type = "button"; c.className = "pill pill-small"; c.textContent = "Cancel"; r.insertAdjacentElement("afterbegin", c); r.style.cssText += ";display:flex;justify-content:space-between;align-items:center;gap:8px;" + MARK;
    const d = r.querySelector(".rv-done"); d.style.minWidth = "150px"; d.style.flex = "none";
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New, changed 18 November 18:46.</b> The tick stands in a row of its own, above the buttons, off when the read opens. Under it <b>Cancel</b> on the left and <b>Done</b> on the right. Cancel logs nothing and takes the meal off again: the read is back at What do you do with it?. It does what the X on the meal line does."; r.insertAdjacentElement("afterend", n); }, { TICK: TICK(false) });
  await shot(p, "t_1", 700, await topOf(p, ".rv-chef", 40));
  // ---------- DT306: the card today, and the card with Don't count it as an answer
  const eatHtml = await p.evaluate(() => document.querySelector(".rv-eat").outerHTML);
  await p.context().close();
  p = await readScreen(); await setDinner(p);
  await p.getByRole("button", { name: "Change the foods" }).click(); await p.waitForTimeout(1000); await noNav(p);
  await p.evaluate(() => { const b = [...document.querySelectorAll("main button")].find((x) => /^Ate\s*half$/.test(x.textContent.trim())); b.parentElement.setAttribute("data-four", "1"); b.parentElement.parentElement.setAttribute("data-chefcard", "1"); });
  const am = await p.evaluate(() => { const e = document.querySelector(".add-more-open"); if (e) e.setAttribute("data-am", "1"); return !!e; });
  await ev(p, ({ MARK, NOTE, eatHtml, am }) => { const r = document.querySelector("[data-four]"); const w = document.createElement("div"); w.style.cssText = MARK + ";padding:2px;margin-top:8px";
    w.innerHTML = eatHtml + '<div class="button-row" style="display:flex;justify-content:flex-end;margin-top:12px"><button type="button" class="pill pill-small pill-primary" style="min-width:150px">Done</button></div>'; r.replaceWith(w);
    const chips = w.querySelector(".pa-chips"); const last = chips.lastElementChild.cloneNode(true); last.textContent = "Don't count it"; chips.appendChild(last);
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New, changed 18 November 18:46.</b> Two buttons are gone from here. <b>Don't count it</b> is the fourth answer to Did you eat it?: it belongs to that question. <b>Add a food</b> leaves the card: it only jumped to + Add more to your plate, which stands right above. Done is the one button."; w.insertAdjacentElement("afterend", n);
    if (am) { const a = document.querySelector("[data-am]"); a.style.cssText += ";" + MARK; } }, { eatHtml, am });
  await shot(p, "d_1", 900, await topOf(p, "[data-am]", 30));
  await p.context().close();

  // ---------- DT315: How to, log it with a photo
  p = await h.open({ foods: [] });
  await p.locator("header .menu-button").click(); await p.waitForTimeout(500); await p.locator(".howto-row").click(); await p.waitForTimeout(600);
  await p.locator(".ht-photoLog").click(); await p.waitForTimeout(500); await noNav(p);
  const steps = await p.evaluate(() => { const e = [...document.querySelectorAll("main *, .menu-screen *, body *")].filter((x) => /Under Did you eat it\? choose All of it/.test(x.textContent)).sort((a, b) => a.textContent.length - b.textContent.length); const el = e[0]; if (!el) return "NONE " + document.body.innerText.replace(/\s+/g, " ").slice(0, 400); el.setAttribute("data-s4", "1"); return el.tagName + " " + el.className + " | parent " + el.parentElement.tagName + "." + el.parentElement.className; });
  console.log("STEP4:", steps);
  const hy = await topOf(p, "[data-s4]", 360);
  await ev(p, ({ RED, RNOTE }) => { const s = document.querySelector("[data-s4]"); s.style.cssText += ";" + RED; const n = document.createElement("div"); n.id = "hn"; n.style.cssText = RNOTE; n.innerHTML = "<b>As it is in 0.3.159.</b> Did you eat it? is not on the screen at this step. The read asks What do you do with it? first."; (s.closest("ol, ul") || s.parentElement).insertAdjacentElement("afterend", n); });
  await shot(p, "h_0", 760, hy);
  await ev(p, ({ MARK, NOTE }) => { document.getElementById("hn").remove(); const s = document.querySelector("[data-s4]"); s.style.outline = ""; s.textContent = "Check the foods he read. Tap Ate it, then the meal."; s.style.cssText += ";" + MARK;
    const li = s.closest("li"); const l5 = li.cloneNode(true); const s5 = l5.querySelector("[data-s4]"); s5.removeAttribute("data-s4"); s5.textContent = "Under Did you eat it? choose All of it, Half or Part of it, then Done."; li.insertAdjacentElement("afterend", l5); const num = [...l5.querySelectorAll("*")].find((x) => x.children.length === 0 && x.textContent.trim() === "4"); if (num) num.textContent = "5";
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> Step 4 names the buttons that are there: Ate it, then the meal. Step 5 is the old step 4's second half. Words only."; (s.closest("ol, ul") || s.parentElement).insertAdjacentElement("afterend", n); });
  await shot(p, "h_1", 800, hy);
  await p.context().close();

  // ---------- DT317: Start cooking with a plate from earlier
  const oldSeed = (sd) => { sd.items = [{ id: "o1", food: F(sd, "Skyr"), grams: 250, locked: false }, { id: "o2", food: F(sd, "Oats"), grams: 80, locked: false }]; sd.plateAt = "2026-11-14T19:10:00+01:00";
    sd.meals = [{ id: "r1", title: "Chicken and rice bowl", items: [{ id: "r1a", food: F(sd, "Rice"), grams: 200, locked: false }, { id: "r1b", food: F(sd, "Chicken"), grams: 190, locked: false }], portion: 390, savedAt: "2026-11-10T10:00:00Z", steps: ["Cook the rice.", "Grill the chicken.", "Put both in a bowl."] }]; };
  p = await h.open({ foods: [], seed: oldSeed });
  await p.locator(".old-ate").click(); await p.waitForTimeout(500);
  const calHtml = await p.evaluate(() => document.querySelector(".old-ate-cal").outerHTML);
  await p.locator(".old-ate").click(); await p.waitForTimeout(300);
  await h.tab(p, "Recipes"); await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(800);
  await p.getByRole("button", { name: "Start cooking" }).click(); await p.waitForTimeout(1200); await noNav(p);
  console.log("COOKASK:", (await h.main(p)).slice(0, 420));
  await ev(p, ({ TAP, RNOTE }) => { const b = [...document.querySelectorAll(".chef-ask button")].find((x) => /^Ate it$/.test(x.textContent.trim())); b.style.cssText += ";" + TAP; b.setAttribute("data-ate", "1"); const n = document.createElement("div"); n.id = "kn"; n.style.cssText = RNOTE; n.innerHTML = "<b>As it is in 0.3.159.</b> Ate it logs Saturday's plate at once, to the meal nearest 19:10, and the cooking starts. I am not asked which meal."; document.querySelector(".chef-ask").appendChild(n); });
  await shot(p, "k_0", 760);
  await ev(p, ({ MARK, NOTE, calHtml }) => { document.getElementById("kn").remove(); const b = document.querySelector("[data-ate]"); b.style.outline = ""; const links = document.querySelector(".chef-ask .ca-links"); const w = document.createElement("div"); w.innerHTML = calHtml; const c = w.firstElementChild; c.style.cssText += ";" + MARK; links.insertAdjacentElement("afterend", c);
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> The calendar of the board DT314, under these buttons too. A tap on a row logs the plate there, and the recipe opens to cook."; c.insertAdjacentElement("afterend", n); }, { calHtml });
  await shot(p, "k_1", 1000);
  await p.context().close();

  // ---------- B149: two ticks
  p = await h.open({ foods: [] });
  await p.unroute("**/api/plate-look"); await p.route("**/api/plate-look", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ vessel: "pot", course: "main" }) }));
  await h.toCam(p); await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(700); await p.locator(".cam-analyze").click(); await p.waitForTimeout(1800); await noNav(p);
  const wy = await topOf(p, ".pa-share", 90);
  await ev(p, ({ RED, RNOTE }) => { const o = document.querySelector(".pa-share .pa-opt.on"); o.style.cssText += ";" + RED; const n = document.createElement("div"); n.id = "wn"; n.style.cssText = RNOTE; n.innerHTML = "<b>As it is in 0.3.159.</b> Two ticks on the chosen answer."; document.querySelector(".pa-share").insertAdjacentElement("afterend", n); });
  await shot(p, "w_0", 300, wy);
  await ev(p, ({ MARK, NOTE }) => { document.getElementById("wn").remove(); const o = document.querySelector(".pa-share .pa-opt.on"); o.style.outline = ""; o.querySelector("span[aria-hidden]").remove(); o.style.cssText += ";" + MARK; const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>After the fix.</b> One tick."; document.querySelector(".pa-share").insertAdjacentElement("afterend", n); });
  await shot(p, "w_1", 300, wy);
  await p.context().close();
  p = await h.open({ foods: [], seed: oldSeed });
  await p.getByRole("button", { name: "Keep working on it" }).click().catch(() => {}); await p.waitForTimeout(400);
  await h.tab(p, "Recipes"); await p.locator(".recipe-tile").first().click(); await p.waitForTimeout(800); await noNav(p);
  const gsel = await p.evaluate(() => { const e = [...document.querySelectorAll("main *")].find((x) => x.children.length === 0 && /^Good for$/.test(x.textContent.trim())); const c = e.closest("section, .card") || e.parentElement; c.setAttribute("data-good", "1"); const on = [...c.querySelectorAll("button")].filter((b) => /✓/.test(b.textContent)); on.forEach((b) => b.setAttribute("data-on", "1")); return on.map((b) => b.className + ":" + b.innerHTML.slice(0, 80)).join(" || "); });
  console.log("GOOD:", gsel);
  const gy = await topOf(p, "[data-good]", 20);
  await ev(p, ({ RED, RNOTE }) => { document.querySelectorAll("[data-on]").forEach((b) => { b.style.cssText += ";" + RED; }); const n = document.createElement("div"); n.id = "gn"; n.style.cssText = RNOTE + ";margin:12px 16px"; n.innerHTML = "<b>As it is in 0.3.159.</b> Two ticks on Lunch and on Dinner."; document.querySelector("[data-good]").insertAdjacentElement("afterend", n); });
  await shot(p, "w_2", 330, gy);
  await ev(p, ({ MARK, NOTE }) => { document.getElementById("gn").remove(); document.querySelectorAll("[data-on]").forEach((b) => { b.style.outline = ""; const walk = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let t, done = false; while ((t = walk.nextNode())) if (!done && /✓/.test(t.nodeValue)) { t.nodeValue = t.nodeValue.replace(/✓\s*/, ""); done = true; } const sv = b.querySelector("svg"); if (sv && !done) sv.remove(); b.style.cssText += ";" + MARK; });
    const n = document.createElement("div"); n.style.cssText = NOTE + ";margin:12px 16px"; n.innerHTML = "<b>After the fix.</b> One tick each."; document.querySelector("[data-good]").insertAdjacentElement("afterend", n); });
  await shot(p, "w_3", 330, gy);
  await p.context().close();

  // ---------- DT316: the five certain lines, as a table (no screen shows them any more)
  const en = JSON.parse(fs.readFileSync(ROOT + "/src/i18n/en.json", "utf8")); const one = (v) => (typeof v === "string" ? v : v.other || Object.values(v)[0]);
  const rows = [["app.wouldJoinPlate", "The old question for a food onto a plate from earlier. Replaced in 0.3.159 (DT313)."], ["app.fromRecipesHas", "The old question for a recipe from Recipes. Replaced in 0.3.159 (DT313)."], ["app.fromPlanHas", "The old question for a meal from the Plan. Replaced in 0.3.159 (DT313)."], ["plate.keepMine", "The button Keep my plate. Back took its place in 0.3.159 (DT313)."], ["chef.plateAddOrNew", "Chef Mealan's old question line. Still named in two unit tests, which go with it."]];
  const chef = "Your plate already has {foods}. {what} Start a new plate with it, or add it to yours?";
  const q = await h.b.newPage({ viewport: { width: 1020, height: 600 } });
  await q.setContent(`<html><body style="margin:0;padding:18px;font-family:system-ui,sans-serif;color:#172742;background:#fff"><div style="font-size:20px;font-weight:800;margin-bottom:4px">Certain today: five English lines no screen shows</div><div style="font-size:15px;color:#5b6b85;margin-bottom:14px">Each is in the English, Serbian and German files. Tick the ones that go.</div><table style="border-collapse:collapse;width:100%;font-size:16px;line-height:1.4"><tr style="background:#172742;color:#fff;text-align:left"><th style="padding:10px;width:44px">Go</th><th style="padding:10px;width:44%">The English line</th><th style="padding:10px">What it was, and why no screen shows it</th></tr>${rows.map(([k, why]) => `<tr><td style="padding:12px 10px;border-bottom:1px solid #d1dcf0;vertical-align:top"><span style="display:inline-block;width:22px;height:22px;border:2px solid #2a72d9;border-radius:6px"></span></td><td style="padding:12px 10px;border-bottom:1px solid #d1dcf0;vertical-align:top;font-weight:700">${k.startsWith("chef.") ? chef : one(en[k])}</td><td style="padding:12px 10px;border-bottom:1px solid #d1dcf0;vertical-align:top">${why}</td></tr>`).join("")}</table><div style="margin-top:14px;padding:10px 12px;background:#fff8d6;border:3px solid #2a72d9;border-radius:12px;font-size:15px;line-height:1.45"><b>The rest.</b> A first sweep finds 126 more lines whose name stands nowhere in the code: 29 on the Plate, 22 in the goal setup, 12 in sheets, 10 in Served, and others. A sweep can be wrong, so I check each one by hand and bring you the same table for them. No line goes without your tick.</div></body></html>`);
  await q.waitForTimeout(300); const qh = await q.evaluate(() => document.body.scrollHeight); await q.setViewportSize({ width: 1020, height: qh }); await q.screenshot({ path: `${R}/u_0.png` }); console.log("shot u_0", qh); await q.close();
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 800)); process.exit(1); });
