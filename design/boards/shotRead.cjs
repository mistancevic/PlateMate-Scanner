// The board "the read, point by point" (DT307 with B145 and DT306), drawn 18 November 2026 on the app as built in 0.3.159.
// "Now" frames are the app itself, red where the point is. "Proposed" frames are the app's own screens changed in place
// (blue outline, yellow note). Run: ROOT=/home/claude/pm159 BOARDS_SHOTS=... CHROME=/usr/bin/google-chrome node shotRead.cjs
const ROOT = process.env.ROOT || "/home/claude/pm159";
const start = require(ROOT + "/tests/flows/plate157.cjs");
const fs = require("node:fs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs160"; fs.mkdirSync(R, { recursive: true });
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
(async () => { const h = await start("3694"); try {
  const photoScreen = async (o = {}) => { const p = await h.open({ foods: [], ...o }); await h.toCam(p); await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(700); await p.locator(".cam-analyze").click(); await p.waitForTimeout(1500); return p; };
  const readScreen = async () => { const p = await photoScreen(); await h.readIt(p); return p; };
  const setDinner = async (p) => { await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(500); await h.row(p, "Dinner", ".plate-end").click(); await p.waitForTimeout(900); };

  // ---------- point 1: a way back
  let p = await photoScreen(); await noNav(p);
  await ev(p, ({ RED, NOTE }) => { const b = [...document.querySelectorAll("main button")].find((x) => /Remove the photo/.test(x.textContent)); b.style.cssText += ";" + RED; const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.159.</b> The only way out is Remove the photo. There is no way back to the camera for another shot."; document.querySelector("main").appendChild(n); });
  await shot(p, "b_0", 900);
  await p.context().close();
  p = await readScreen(); await noNav(p);
  await ev(p, ({ NOTE }) => { const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.159.</b> No way back to the photo screen, where I could add what Chef Mealan should know and read again. The way there is Change the foods, then Wrong foods?."; document.querySelector(".plan-line").insertAdjacentElement("afterend", n); });
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
  await ev(p, ({ RED }) => { for (const s of [".read-view", ".mp-big", ".rv-chef", ".plate-end"]) { const e = document.querySelector(s); if (e) e.style.cssText += ";" + RED; } });
  await shot(p, "x_0", 0);
  await p.context().close();
  p = await readScreen(); await noNav(p);
  await p.addStyleTag({ content: ".read-view{background:none!important;border:0!important;box-shadow:none!important;padding:0!important}.read-view .mp-big{border:0!important;background:none!important;padding:0!important;box-shadow:none!important}.read-view .mp-big-img{border-radius:16px;overflow:hidden}.read-view .rv-chef{border:0!important;background:none!important;padding:4px 0!important;box-shadow:none!important}.read-view .plate-end{border:0!important;background:none!important;padding:8px 0 0!important;box-shadow:none!important}.read-view .readout{margin-top:14px}" });
  await ev(p, ({ NOTE }) => { const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> One box is left: the result. The card around everything, the box around the photo, Chef Mealan's box and the box around What do you do with it? are gone. The photo is as wide as the page, wider than today."; document.querySelector(".read-view").insertAdjacentElement("afterend", n); });
  await shot(p, "x_1", 0);
  const w0 = await p.evaluate(() => document.querySelector(".mp-big-img img").getBoundingClientRect().width); console.log("photo width proposed", w0);
  await p.context().close();

  // ---------- point 3: + Add more on the read
  p = await readScreen(); await noNav(p);
  await ev(p, ({ RED, NOTE }) => { const r = document.querySelector(".rv-change"); r.style.cssText += ";" + RED; const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.159.</b> To add a food he missed: Change the foods, scroll down, + Add more to your plate. Three steps, and the read is left."; r.insertAdjacentElement("afterend", n); });
  await shot(p, "a_0", 760, await topOf(p, ".mp-tags", 60));
  await p.context().close();
  p = await readScreen(); await noNav(p);
  await ev(p, ({ MARK, NOTE }) => { const r = document.querySelector(".rv-change"); r.style.display = "flex"; r.style.justifyContent = "space-between"; r.style.gap = "8px"; const b = document.createElement("button"); b.type = "button"; b.className = "pill pill-small"; b.textContent = "+ Add more"; b.style.cssText += ";" + MARK; r.insertAdjacentElement("afterbegin", b);
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> + Add more stands left of Change the foods. One tap opens the plate with + Add more to your plate already open: the search, Photo or scan, Add manually. No new element."; r.insertAdjacentElement("afterend", n); });
  await shot(p, "a_1", 760, await topOf(p, ".mp-tags", 60));
  await p.context().close();

  // ---------- point 4: Save in My recipes as a tick
  p = await readScreen(); await setDinner(p); await noNav(p);
  await ev(p, ({ RED, NOTE }) => { const r = document.querySelector(".rv-go"); r.style.cssText += ";" + RED; const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.159.</b> Two buttons side by side. Save in My recipes looks like a second way to finish, and it is not: it only marks the plate to be kept."; r.insertAdjacentElement("afterend", n); });
  await shot(p, "t_0", 620, await topOf(p, ".rv-chef", 40));
  await ev(p, ({ MARK, NOTE }) => { document.querySelector(".rv-go").nextElementSibling.remove(); const r = document.querySelector(".rv-go"); r.style.outline = ""; r.style.display = "flex"; r.style.alignItems = "center"; r.style.justifyContent = "space-between";
    const s = r.querySelector(".rv-save"); const l = document.createElement("label"); l.style.cssText = "display:flex;align-items:center;gap:10px;min-height:44px;font-size:15px;font-weight:700;color:#172742;" + MARK; l.innerHTML = '<span style="width:24px;height:24px;border:2px solid #2a72d9;border-radius:6px;display:inline-grid;place-items:center;color:#2a72d9;font-weight:900;background:#fff">✓</span>Save in My recipes'; s.replaceWith(l);
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> A tick, drawn ticked here. Done is the one button. With the tick on, Done also keeps the plate in My recipes. With no meal set nothing changes: Save it, Plan it and Ate it stay three actions."; r.insertAdjacentElement("afterend", n); });
  await shot(p, "t_1", 620, await topOf(p, ".rv-chef", 40));
  await p.context().close();

  // ---------- point 5: the pot
  const pot = async () => { const q = await h.open({ foods: [] }); await q.unroute("**/api/plate-look"); await q.route("**/api/plate-look", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ vessel: "pot", course: "main" }) })); await q.unroute("**/api/plate-photo"); await q.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(POT) }));
    await h.toCam(q); await q.locator("#camera-shutter-button").click(); await q.waitForTimeout(700); await q.locator(".cam-analyze").click(); await q.waitForTimeout(1800); return q; };
  p = await pot(); await noNav(p);
  const potRow = async (q) => q.evaluate(() => { const e = [...document.querySelectorAll("main *")].find((x) => x.children.length === 0 && /How much of it is yours/.test(x.textContent)); let r = e; while (r && !r.querySelector(".pa-opt, .choice, button, [role=radio]")) r = r.parentElement; r.setAttribute("data-pot", "1"); return r.outerHTML.slice(0, 900); });
  console.log("POTROW:", await potRow(p));
  await ev(p, ({ RED }) => { document.querySelector("[data-pot]").style.cssText += ";" + RED; });
  await shot(p, "p_0", 900);
  await p.getByRole("button", { name: "Read the plate" }).click(); await p.waitForTimeout(2500); await noNav(p);
  await ev(p, ({ NOTE }) => { const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.159.</b> The whole pot opens as a whole recipe on the plate: a long page, a choice of portions, and no read. I only wanted to log my bowl."; document.querySelector(".plan-line").insertAdjacentElement("afterend", n); });
  await shot(p, "p_1", 1000);
  // B145: the cooking line
  const cy = await p.evaluate(({ RED }) => { const e = [...document.querySelectorAll("main *")].find((x) => x.children.length === 0 && /For cooking, not counted/.test(x.textContent)); let r = e.parentElement; r.setAttribute("data-cook", "1"); r.style.cssText += ";" + RED; return Math.max(0, r.getBoundingClientRect().top + scrollY - 330); }, { RED });
  await ev(p, ({ NOTE }) => { const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.159 (B145).</b> I typed nothing. Simmered and pureed are ways of cooking, not foods, and nobody named them."; document.querySelector("[data-cook]").insertAdjacentElement("afterend", n); });
  await shot(p, "c_0", 640, cy);
  await ev(p, ({ NOTE, MARK }) => { const c = document.querySelector("[data-cook]"); c.nextElementSibling.remove(); const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> No words from me: no For cooking line. With words, it names only the foods I named that are not counted, as oil or stock. A way of cooking never stands there."; c.replaceWith(n); });
  await shot(p, "c_1", 640, cy);
  await p.context().close();
  p = await pot(); await noNav(p);
  await ev(p, ({ MARK, NOTE }) => { const r = document.querySelector("[data-pot]") || (() => { const e = [...document.querySelectorAll("main *")].find((x) => x.children.length === 0 && /How much of it is yours/.test(x.textContent)); let r = e; while (r && !r.querySelector(".pa-opt, .choice, button, [role=radio]")) r = r.parentElement; return r; })();
    const walk = document.createTreeWalker(r, NodeFilter.SHOW_TEXT); let t; while ((t = walk.nextNode())) t.nodeValue = t.nodeValue.replace("How much of it is yours?", "How much of it do you eat?").replace("The whole pot", "All of it").replace("My portion", "A part of it");
    const opts = [...r.querySelectorAll(".pa-opt, .choice, button, [role=radio]")]; const on = opts.find((o) => /All of it/.test(o.textContent)), off = opts.find((o) => /A part of it/.test(o.textContent));
    if (on && off) { const a = on.className, b = off.className; on.className = b; off.className = a; on.innerHTML = on.innerHTML.replace(/✓\s*/g, ""); if (!/✓/.test(off.textContent)) off.innerHTML = "✓ " + off.innerHTML; for (const s of on.querySelectorAll("svg")) s.remove(); }
    const g = document.createElement("div"); g.style.cssText = "display:flex;align-items:center;gap:8px;margin:10px 0 0;font-size:15px;color:#172742"; g.innerHTML = 'About <span style="display:inline-block;min-width:74px;min-height:44px;line-height:44px;text-align:center;border:1.5px solid #c9d6ee;border-radius:12px;background:#fff;font-weight:700">350</span> g <small style="color:#5b6b85">Leave it empty and Chef Mealan takes one portion.</small>'; r.appendChild(g); r.style.cssText += ";" + MARK;
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> The question asks what I eat, not whose pot it is. A part of it takes grams. The read then shows what I eat, alone, as for a plate. The pot becomes a recipe only when Save in My recipes is ticked."; document.querySelector("main").appendChild(n); });
  await shot(p, "p_2", 1100);
  await p.context().close();

  // ---------- point 7 (DT306): Chef Mealan's card on the plate of a photo
  p = await readScreen(); await setDinner(p);
  const eatHtml = await p.evaluate(() => document.querySelector(".rv-eat").outerHTML);
  await p.getByRole("button", { name: "Change the foods" }).click(); await p.waitForTimeout(1000); await noNav(p);
  const cardSel = await p.evaluate(() => { const b = [...document.querySelectorAll("main button")].find((x) => /^Ate\s*half$/.test(x.textContent.trim())); const row = b.parentElement; row.setAttribute("data-four", "1"); let c = row.parentElement; c.setAttribute("data-chefcard", "1"); return c.className + " | " + row.className; });
  console.log("CHEFCARD:", cardSel);
  await ev(p, ({ RED, NOTE }) => { const r = document.querySelector("[data-four]"); r.style.cssText += ";" + RED; const n = document.createElement("div"); n.style.cssText = NOTE.replace(/#2a72d9/g, "#d13a3a"); n.innerHTML = "<b>As it is in 0.3.159.</b> Four buttons in one row. Two are answers to a question that is not asked (Ate half, Ate it), two are other things (Add a food, Don't count it). The words wrap."; r.insertAdjacentElement("afterend", n); });
  const dy = await topOf(p, "[data-chefcard]", 40);
  await shot(p, "d_0", 760, dy);
  await ev(p, ({ MARK, NOTE, eatHtml }) => { const r = document.querySelector("[data-four]"); r.nextElementSibling.remove(); const w = document.createElement("div"); w.style.cssText = MARK + ";padding:2px";
    w.innerHTML = eatHtml + '<div class="button-row" style="display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:12px"><span style="display:flex;gap:8px"><button type="button" class="pill pill-small">Add a food</button><button type="button" class="pill pill-small">Don\'t count it</button></span><button type="button" class="pill pill-small pill-primary" style="min-width:96px">Done</button></div>'; r.replaceWith(w);
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> The read's own block, unchanged: the question Did you eat it?, its answers under it as choices, then the card's buttons under those, with Done as the one main button."; w.insertAdjacentElement("afterend", n); }, { eatHtml });
  await shot(p, "d_1", 820, dy);
  await p.context().close();
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 800)); process.exit(1); });
