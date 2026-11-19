// Board DT307, redrawn 19 November 2026 on the app as built in 0.3.162 (Coach Milan 11:16: Add more is a good one, redraw).
// Points 2 and 3 are drawn on today's read, which since DT318 holds his checks and the field Tell Chef Mealan what to check.
// Points 1, 4 and 5 are the same proposals as on 18 November, on today's screens. From shotRead.cjs of 18 November.
// "Now" frames are the app itself, red where the point is. "Proposed" frames are the app's own screens changed in place
// (blue outline, yellow note). Run: ROOT=/home/claude/pm159 BOARDS_SHOTS=... CHROME=/usr/bin/google-chrome node shotRead.cjs
const ROOT = process.env.ROOT || require("node:path").resolve(__dirname, "../..");
const start = require(ROOT + "/tests/flows/plate157.cjs");
const fs = require("node:fs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs307"; fs.mkdirSync(R, { recursive: true });
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", RED = "outline:3px solid #d13a3a;outline-offset:2px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`;
const CHEV = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
const POT = { dish: "Chicken soup", foods: [{ name: "Chicken breast, cooked", grams: 400, low: 300, high: 500, calories: 165, protein: 31, fats: 3.6, carbs: 0, fiber: 0, confidence: "medium" }, { name: "Carrot", grams: 300, low: 200, high: 400, calories: 41, protein: 0.9, fats: 0.2, carbs: 10, fiber: 2.8, confidence: "medium" }, { name: "Noodles, cooked", grams: 500, low: 400, high: 600, calories: 138, protein: 4.5, fats: 2.1, carbs: 25, fiber: 1.2, confidence: "low" }], unsure: null, which: null, course: "main", vessel: "pot", serves: 4, cooking: ["simmered", "pureed"] };
const noNav = (p) => p.addStyleTag({ content: "nav, .chat-fab { display: none !important }" });
const shot = async (p, name, h, y = 0) => { if (!y) await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(350); const full = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y, width: 390, height: Math.min(h || full, full - y) } }); console.log("shot", name, Math.min(h || full, full - y)); };
// run code in the page with the styles at hand
const ev = (p, fn, extra = {}) => p.evaluate(fn, { MARK, RED, NOTE, CHEV, ...extra });
const note = (el, html, where = "afterend") => { /* in page */ };
const topOf = (p, sel, pad = 120) => p.evaluate(({ sel, pad }) => { const e = document.querySelector(sel); return Math.max(0, e.getBoundingClientRect().top + scrollY - pad); }, { sel, pad });
(async () => { const h = await start("3726"); try {
  const photoScreen = async (o = {}) => { const p = await h.open({ foods: [], ...o }); await h.toCam(p); await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(700); await p.locator(".cam-analyze").click(); await p.waitForTimeout(1500); await pic(p); return p; };
  const f = (name, grams, kcal, pr, fa, ca, fi) => ({ name, grams, low: Math.round(grams * 0.75), high: Math.round(grams * 1.3), calories: kcal, protein: pr, fats: fa, carbs: ca, fiber: fi, confidence: "medium" });
  const READ = { dish: "Grilled chicken with rice", foods: [f("Chicken breast, grilled", 180, 165, 31, 3.6, 0, 0), f("Rice, cooked", 150, 130, 2.7, 0.3, 28, 0.4)], unsure: { name: "Chicken breast, grilled", options: [140, 240] }, which: null, course: "main", vessel: "plate", serves: 1 };
  const IMG = "data:image/jpeg;base64," + fs.readFileSync(ROOT + "/tests/flows/plate.jpg").toString("base64");
  const pic = (p) => p.evaluate((IMG) => document.querySelectorAll("main img").forEach((i) => { if (i.getBoundingClientRect().width > 150) { i.src = IMG; i.style.objectFit = "cover"; } }), IMG);
  const readScreen = async () => { const p = await photoScreen(); await p.unroute("**/api/plate-photo"); await p.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) })); await h.readIt(p); await pic(p); return p; };
  const setDinner = async (p) => { await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(500); await h.row(p, "Dinner", ".plate-end").click(); await p.waitForTimeout(900); };

  // ---------- point 1: a way back
  let p = await photoScreen(); await noNav(p);
  await ev(p, ({ RED, NOTE }) => { const b = [...document.querySelectorAll("main button")].find((x) => /Remove the photo/.test(x.textContent)); b.style.cssText += ";" + RED; const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.162.</b> The only way out is Remove the photo. There is no way back to the camera for another shot."; document.querySelector("main").appendChild(n); });
  await shot(p, "b_0", 900);
  await p.context().close();
  p = await readScreen(); await noNav(p);
  await ev(p, ({ NOTE }) => { const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.162.</b> No way back to the photo screen, for another photo of the plate or to read it again from the start."; document.querySelector(".plan-line").insertAdjacentElement("afterend", n); });
  await shot(p, "b_1", 900);
  await p.context().close();
  p = await photoScreen(); await noNav(p);
  await ev(p, ({ MARK, NOTE, CHEV }) => { const m = document.querySelector("main"); const b = document.createElement("button"); b.type = "button"; b.className = "link ask-back"; b.innerHTML = CHEV + "Back to the camera"; b.style.cssText += ";" + MARK; m.insertAdjacentElement("afterbegin", b);
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> One light row at the top: Back to the camera, for another shot. It is the Back link the question screen already has. <b>Remove the photo</b> stays as the Cancel: the Plate as it was, nothing changed."; m.appendChild(n); });
  await shot(p, "b_2", 960);
  await p.context().close();
  p = await readScreen(); await noNav(p);
  await ev(p, ({ MARK, NOTE, CHEV }) => { const m = document.querySelector("main"); const mk = () => { const b = document.createElement("button"); b.type = "button"; b.className = "link ask-back"; b.innerHTML = CHEV + "Back to the photo"; b.style.cssText += ";" + MARK; return b; };
    m.insertAdjacentElement("afterbegin", mk()); const sec = document.querySelector(".read-view"); const b2 = mk(); b2.style.marginTop = "14px"; sec.insertAdjacentElement("afterend", b2);
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> Back to the photo at the top: the photo screen again, with my words kept, to add something and read again. The same link once more at the bottom, because the read scrolls."; b2.insertAdjacentElement("afterend", n); });
  await shot(p, "b_3", 0);
  await p.context().close();

  // ---------- point 2: fewer boxes, the photo not smaller
  p = await readScreen(); await noNav(p);
  await ev(p, ({ RED }) => { for (const s of [".read-view", ".mp-big", ".rv-tell", ".rv-chef", ".plate-end"]) { const e = document.querySelector(s); if (e) e.style.cssText += ";" + RED; } });
  await ev(p, ({ NOTE }) => { const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.162.</b> Red: five boxes besides the result. Since DT318 the box of the photo also holds his check and the field, in a box of its own."; document.querySelector(".read-view").insertAdjacentElement("afterend", n); });
  await shot(p, "x_0", 0);
  await p.context().close();
  p = await readScreen(); await noNav(p);
  await p.addStyleTag({ content: ".read-view{background:none!important;border:0!important;box-shadow:none!important;padding:0!important}.read-view .mp-big{border:0!important;background:none!important;padding:0!important;box-shadow:none!important}.read-view .mp-big-img{border-radius:16px;overflow:hidden}.read-view .rv-chef{border:0!important;background:none!important;padding:4px 0!important;box-shadow:none!important}.read-view .plate-end{border:0!important;background:none!important;padding:8px 0 0!important;box-shadow:none!important}.read-view .rv-tell{border:0!important;background:none!important;padding:0!important;box-shadow:none!important}.read-view .readout{margin-top:14px}" });
  await ev(p, ({ NOTE }) => { const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> One box is left: the result. The card around everything, the box around the photo, the box around Tell Chef Mealan what to check, Chef Mealan's box and the box around What do you do with it? are gone. The field keeps its own edge, as every field in the app, and his check keeps its colour. The photo is as wide as the page, wider than today."; document.querySelector(".read-view").insertAdjacentElement("afterend", n); });
  await shot(p, "x_1", 0);
  const w0 = await p.evaluate(() => document.querySelector(".mp-big-img img").getBoundingClientRect().width); console.log("photo width proposed", w0);
  await p.context().close();

  // ---------- point 3: + Add more on the read
  p = await readScreen(); await noNav(p);
  await ev(p, ({ RED, NOTE }) => { const r = document.querySelector(".rv-change"); r.style.cssText += ";" + RED; const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.162.</b> To add a food he missed by hand: Continue on the Plate, scroll to the end of the food list, + Add more to your plate. Three steps. In words, the field above says it to him."; r.insertAdjacentElement("afterend", n); });
  await shot(p, "a_0", 820, await topOf(p, ".mp-tags", 60));
  await p.context().close();
  p = await readScreen(); await noNav(p);
  await ev(p, ({ MARK, NOTE }) => { const r = document.querySelector(".rv-change"); r.style.display = "flex"; r.style.justifyContent = "space-between"; r.style.gap = "8px"; const b = document.createElement("button"); b.type = "button"; b.className = "pill pill-small"; b.textContent = "+ Add more"; b.style.cssText += ";" + MARK; r.insertAdjacentElement("afterbegin", b);
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> + Add more stands left of Continue on the Plate. One tap opens the Plate with + Add more to your plate already open: the search, Photo or scan, Add manually. Continue on the Plate and the field stay as they are. No new element."; r.insertAdjacentElement("afterend", n); });
  await shot(p, "a_1", 820, await topOf(p, ".mp-tags", 60));
  await p.context().close();

  // ---------- point 4: Save in My recipes as a tick
  p = await readScreen(); await setDinner(p); await noNav(p);
  await ev(p, ({ RED, NOTE }) => { const r = document.querySelector(".rv-go"); r.style.cssText += ";" + RED; const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.162.</b> Two buttons side by side. Save in My recipes looks like a second way to finish, and it is not: it only marks the plate to be kept."; r.insertAdjacentElement("afterend", n); });
  await shot(p, "t_0", 620, await topOf(p, ".rv-chef", 40));
  // the tick in a row of its own, Cancel left of Done: the drawing of 18 November 18:46, after Coach Milan's look (shotRead2.cjs)
  const TICK = `<label style="display:flex;align-items:center;gap:10px;min-height:44px;font-size:15px;font-weight:700;color:#172742"><span style="width:24px;height:24px;border:2px solid #2a72d9;border-radius:6px;display:inline-grid;place-items:center;color:#2a72d9;font-weight:900;background:#fff"></span>Save in My recipes</label>`;
  await ev(p, ({ MARK, NOTE, TICK }) => { document.querySelector(".rv-go").nextElementSibling.remove(); const r = document.querySelector(".rv-go"); r.style.outline = ""; const row = document.createElement("div"); row.style.cssText = "margin:10px 0 4px;" + MARK; row.innerHTML = TICK; r.insertAdjacentElement("beforebegin", row);
    r.querySelector(".rv-save").remove(); const c = document.createElement("button"); c.type = "button"; c.className = "pill pill-small"; c.textContent = "Cancel"; r.insertAdjacentElement("afterbegin", c); r.style.cssText += ";display:flex;justify-content:space-between;align-items:center;gap:8px;" + MARK;
    const d = r.querySelector(".rv-done"); d.style.minWidth = "150px"; d.style.flex = "none";
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New, as drawn 18 November 18:46.</b> The tick stands in a row of its own, above the buttons, off when the read opens. Under it <b>Cancel</b> on the left and <b>Done</b> on the right. Cancel logs nothing and takes the meal off again: the read is back at What do you do with it?. It does what the row No meal selected does."; r.insertAdjacentElement("afterend", n); }, { TICK });
  await shot(p, "t_1", 700, await topOf(p, ".rv-chef", 40));
  await p.context().close();

  // ---------- point 5: the pot
  const pot = async () => { const q = await h.open({ foods: [] }); await q.unroute("**/api/plate-look"); await q.route("**/api/plate-look", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ vessel: "pot", course: "main" }) })); await q.unroute("**/api/plate-photo"); await q.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(POT) }));
    await h.toCam(q); await q.locator("#camera-shutter-button").click(); await q.waitForTimeout(700); await q.locator(".cam-analyze").click(); await q.waitForTimeout(1800); await pic(q); return q; };
  p = await pot(); await noNav(p);
  const potRow = async (q) => q.evaluate(() => { const e = [...document.querySelectorAll("main *")].find((x) => x.children.length === 0 && /How much of it is yours/.test(x.textContent)); let r = e; while (r && !r.querySelector(".pa-opt, .choice, button, [role=radio]")) r = r.parentElement; r.setAttribute("data-pot", "1"); return r.outerHTML.slice(0, 900); });
  console.log("POTROW:", await potRow(p));
  await ev(p, ({ RED }) => { document.querySelector("[data-pot]").style.cssText += ";" + RED; });
  await shot(p, "p_0", 900);
  await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2500); await noNav(p); await pic(p);
  await ev(p, ({ NOTE }) => { const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.162.</b> The whole pot opens as a whole recipe on the plate: a long page, a choice of portions, and no read. I only wanted to log my bowl."; document.querySelector(".plan-line").insertAdjacentElement("afterend", n); });
  await shot(p, "p_1", 1000);
  await p.context().close();
  p = await pot(); await noNav(p);
  await ev(p, ({ MARK, NOTE }) => { const r = document.querySelector("[data-pot]") || (() => { const e = [...document.querySelectorAll("main *")].find((x) => x.children.length === 0 && /How much of it is yours/.test(x.textContent)); let r = e; while (r && !r.querySelector(".pa-opt, .choice, button, [role=radio]")) r = r.parentElement; return r; })();
    const walk = document.createTreeWalker(r, NodeFilter.SHOW_TEXT); let t; while ((t = walk.nextNode())) t.nodeValue = t.nodeValue.replace("How much of it is yours?", "How much of it do you eat?").replace("The whole pot", "All of it").replace("My portion", "A part of it");
    const opts = [...r.querySelectorAll(".pa-opt, .choice, button, [role=radio]")]; const on = opts.find((o) => /All of it/.test(o.textContent)), off = opts.find((o) => /A part of it/.test(o.textContent));
    if (on && off) { const a = on.className, b = off.className; on.className = b; off.className = a; /* B149: one tick, the look's: swapping the classes moves it */ }
    const g = document.createElement("div"); g.style.cssText = "display:flex;align-items:center;gap:8px;margin:10px 0 0;font-size:15px;color:#172742"; g.innerHTML = 'About <span style="display:inline-block;min-width:74px;min-height:44px;line-height:44px;text-align:center;border:1.5px solid #c9d6ee;border-radius:12px;background:#fff;font-weight:700">350</span> g <small style="color:#5b6b85">Leave it empty and Chef Mealan takes one portion.</small>'; r.appendChild(g); r.style.cssText += ";" + MARK;
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> The question asks what I eat, not whose pot it is. A part of it takes grams. The read then shows what I eat, alone, as for a plate. The pot becomes a recipe only when Save in My recipes is ticked."; document.querySelector("main").appendChild(n); });
  await shot(p, "p_2", 1100);
  await p.context().close();

} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 800)); process.exit(1); });
