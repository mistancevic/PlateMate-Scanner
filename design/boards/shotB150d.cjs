// Board B150, the new flow drawn whole (Coach Milan, 18 November 2026, 20:12): every step of the flow, also the ones that
// hardly change, so the flow reads in one row. With his idea: no meal picked is the status Just looking; the pencil opens
// edit mode and turns into the X that closes it; a meal picked shows with its time; Just looking in edit mode takes it off.
// On the app as built in 0.3.159; changed in place, blue outline and yellow note.
const ROOT = process.env.ROOT || "/home/claude/pm159";
const start = require(ROOT + "/tests/flows/plate157.cjs"); const fs = require("node:fs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs150";
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`;
const PEN = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
const XS = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const FIELD = (t) => `<span style="display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 10px;border:1.5px solid #2a72d9;border-radius:12px;background:#fff;font-weight:700;color:#172742;outline:3px solid #2a72d9;outline-offset:2px">${t} <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>`;
(async () => { const h = await start("3701"); try {
  const sd0 = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); const F = (n) => sd0.foods.find((f) => f.name.startsWith(n));
  const bowl = { title: "Chicken rice bowl", kcal: 574, protein: 64, source: "plate", items: [{ id: "a", food: F("Rice"), grams: 200, locked: false }, { id: "b", food: F("Chicken"), grams: 190, locked: false }], portion: 390 };
  const planned = { "2026-11-14": { dinner: bowl }, "2026-11-15": { dinner: bowl } };
  const css = (p) => p.addStyleTag({ content: ".chat-fab { display: none !important } nav { visibility: hidden }" });
  const shot = async (p, name, hh = 820) => { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width: 390, height: Math.min(hh, full) } }); console.log("shot", name); };
  const ev = (p, fn, x = {}) => p.evaluate(fn, { MARK, NOTE, PEN, XS, FIELD: null, ...x });
  // the line as Just looking
  const looking = (p, withNote) => ev(p, ({ MARK, NOTE, withNote }) => { document.querySelectorAll("[data-lk], [data-n]").forEach((e) => e.remove()); const u = document.querySelector(".meal-line-unset"); u.textContent = "Just looking"; u.style.cssText += ";color:#172742"; const t = document.querySelector(".meal-line-text"); const s = document.createElement("span"); s.className = "meal-line-day"; s.setAttribute("data-lk", "1"); s.textContent = "Not counted. Pick a meal to count it."; s.style.display = "block"; t.appendChild(s); t.style.cssText += ";" + MARK;
    if (withNote) { const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = NOTE; n.innerHTML = withNote; document.querySelector(".meal-line").insertAdjacentElement("afterend", n); } }, { withNote });
  // ---- step 1 and 2
  let p = await h.open({ foods: [], planned }); await h.toPhoto(p, true); await css(p);
  await looking(p, "<b>Step 1. No change but one line.</b> With no meal picked the line says the status: <b>Just looking</b>. It took the place of Meal and day not set.");
  await shot(p, "g_1");
  await h.readIt(p); await css(p);
  await looking(p, "<b>Step 2. The read. No change but that line.</b> Just looking: nothing is counted. The read still ends with What do you do with it?. The pencil is the way to pick a meal.");
  await ev(p, ({ MARK }) => { document.querySelector(".plan-line-pen").style.cssText += ";outline:4px solid #f0a81c;outline-offset:2px"; });
  await shot(p, "g_2", 1400);
  // ---- step 3: edit mode
  await p.evaluate(() => { document.querySelectorAll("[data-n]").forEach((e) => e.remove()); document.querySelector(".plan-line-pen").style.outline = ""; });
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(500); await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Sat 14" }).click(); await p.waitForTimeout(500);
  const editBase = () => ev(p, ({ MARK, XS }) => { const pen = document.querySelector(".plan-line-pen"); pen.innerHTML = XS; pen.style.cssText += ";" + MARK; const c = document.querySelector(".meal-line-open .pcal"); if (!c.querySelector("[data-ref]")) { const q = document.createElement("b"); q.setAttribute("data-ref", "1"); q.className = "pcal-q"; q.textContent = "The photo was taken on Saturday, 15:57."; q.style.cssText = "display:block;margin:0 0 8px;" + MARK; c.insertAdjacentElement("afterbegin", q); } });
  const markRow = (name, field) => ev(p, ({ name, field }) => { for (const r of document.querySelectorAll(".meal-line-open .pcal-row")) { const on = new RegExp("^\\s*(✓\\s*)?" + name).test(r.textContent); const b = r.querySelector("b") || r.firstElementChild; b.textContent = b.textContent.replace(/^✓\s*/, ""); r.style.background = on ? "#e3edff" : ""; if (on) { b.textContent = "✓ " + b.textContent; if (field) r.lastElementChild.innerHTML = field; } } }, { name, field });
  const noteAfterRows = (html) => ev(p, ({ NOTE, html }) => { document.querySelectorAll("[data-n]").forEach((e) => e.remove()); const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = NOTE; n.innerHTML = html; document.querySelector(".meal-line-open .pcal-rows").insertAdjacentElement("afterend", n); }, { html });
  await editBase(); await markRow("Just looking");
  await noteAfterRows("<b>Step 3. Edit mode.</b> A tap on the pencil opens it, and the pencil is now the <b>X that closes it</b>. It opens on the photo's day. The photo's time is a reference and cannot be changed. <b>Just looking</b> is marked, because no meal is picked.");
  await shot(p, "g_3", 900);
  // ---- step 4: Dinner picked, its time changed
  await markRow("Dinner", FIELD("19:30"));
  await ev(p, ({ MARK }) => { const u = document.querySelector(".meal-line-unset"); u.textContent = "Dinner"; document.querySelector("[data-lk]").textContent = "Saturday, 14 November, 19:30"; });
  await noteAfterRows("<b>Step 4. I pick Dinner and set its time.</b> A tap on Dinner picks it. The line above shows it at once: saved, no Done. The time in Dinner's row is a field: a tap opens the phone's clock. I set 19:30, for this dinner on this day only.");
  await shot(p, "g_4", 900);
  // ---- step 7: back to Just looking
  await markRow("Just looking");
  await ev(p, () => { const u = document.querySelector(".meal-line-unset"); u.textContent = "Just looking"; document.querySelector("[data-lk]").textContent = "Not counted. Pick a meal to count it."; for (const r of document.querySelectorAll(".meal-line-open .pcal-row")) if (/Dinner/.test(r.textContent)) r.lastElementChild.textContent = "20:00 · planned: Chicken rice bowl"; });
  await noteAfterRows("<b>Back to Just looking, when I want it.</b> In edit mode a tap on Just looking takes the meal off again. The line says Just looking, and nothing is counted. This takes the place of the X that removed the meal.");
  await shot(p, "g_7", 900);
  await p.context().close();
  // ---- step 5: closed, with the meal and the pencil; step 6: the Plan
  p = await h.open({ foods: [], planned }); await h.toPhoto(p, true); await h.readIt(p);
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(500); await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Sat 14" }).click(); await p.waitForTimeout(400); await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(900); await css(p);
  await ev(p, ({ MARK, NOTE, PEN }) => { const x = document.querySelector(".plan-line-x"); x.innerHTML = PEN; x.style.cssText += ";" + MARK; document.querySelector(".meal-line-day").textContent = "Saturday, 14 November, 19:30"; document.querySelector(".meal-line-text").style.cssText += ";" + MARK;
    const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = NOTE; n.innerHTML = "<b>Step 5. Closed with the X.</b> The line shows the meal with its day and time, and the pencil again. The rest is the read as it is today: Did you eat it?, All of it, Done."; document.querySelector(".meal-line").insertAdjacentElement("afterend", n); });
  await shot(p, "g_5", 1500);
  await p.evaluate(() => document.querySelectorAll("[data-n]").forEach((e) => e.remove()));
  await p.locator(".rv-eat .pa-opt").first().click(); await p.waitForTimeout(300); await p.locator(".rv-done").click(); await p.waitForTimeout(1500);
  await p.addStyleTag({ content: "nav { visibility: visible !important }" }); await h.tab(p, "Plan"); await p.waitForTimeout(500); await p.locator("main button").filter({ hasText: /^Sat 14/ }).first().click(); await p.waitForTimeout(700); await p.addStyleTag({ content: "nav, .chat-fab { display: none !important }" });
  await ev(p, ({ MARK, NOTE }) => { const e = document.querySelector(".past-eaten"); const walk = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let t; while ((t = walk.nextNode())) t.nodeValue = t.nodeValue.replace("20:00", "19:30"); e.style.cssText += ";" + MARK;
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>Step 6. One dinner.</b> Saturday shows the meal I ate as its dinner, at the time I set. The planned Chicken rice bowl no longer asks. Today shows nothing of it."; (document.querySelector(".past-add") || e).insertAdjacentElement("afterend", n); });
  const y = await p.evaluate(() => Math.max(0, document.querySelector(".past-eaten").getBoundingClientRect().top + scrollY - 330));
  await p.waitForTimeout(300); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/g_6.png`, fullPage: true, clip: { x: 0, y, width: 390, height: Math.min(1100, full - y) } }); console.log("shot g_6");
  await p.context().close();
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 600)); process.exit(1); });
