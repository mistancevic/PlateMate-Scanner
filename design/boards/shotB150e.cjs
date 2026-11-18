// Board B150, redrawn with the words as calls to act (Coach Milan, 18 November 2026, 20:28 to 20:32): an empty name is
// Untitled with the pencil; no meal set is the white button Put it on a day; the row that takes it off is Not on any day;
// Not counted is gone. And the step that was missing in both rows: All of it, then Done (his question of 20:23).
// On the app as built in 0.3.159; changed in place, blue outline and yellow note.
const ROOT = process.env.ROOT || "/home/claude/pm159";
const start = require(ROOT + "/tests/flows/plate157.cjs"); const fs = require("node:fs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs150";
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const TAP = "outline:4px solid #f0a81c;outline-offset:2px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`;
const GNOTE = NOTE.replace(/#2a72d9/g, "#5b6b8a");
const PEN = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
const XS = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const BTN = '<button type="button" data-put="1" style="display:inline-flex;align-items:center;min-height:46px;padding:0 18px;border:1.5px solid #2a72d9;border-radius:14px;background:#fff;font:inherit;font-weight:800;font-size:16px;color:#1d4fa3">Put it on a day</button>';
const FIELD = (t) => `<span style="display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 10px;border:1.5px solid #2a72d9;border-radius:12px;background:#fff;font-weight:700;color:#172742;outline:3px solid #2a72d9;outline-offset:2px">${t} <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>`;
(async () => { const h = await start("3702"); try {
  const sd0 = JSON.parse(fs.readFileSync(ROOT + "/tests/flows/seed.json", "utf8")); const F = (n) => sd0.foods.find((f) => f.name.startsWith(n));
  const bowl = { title: "Chicken rice bowl", kcal: 574, protein: 64, source: "plate", items: [{ id: "a", food: F("Rice"), grams: 200, locked: false }, { id: "b", food: F("Chicken"), grams: 190, locked: false }], portion: 390 };
  const planned = { "2026-11-14": { dinner: bowl }, "2026-11-15": { dinner: bowl } };
  const css = (p) => p.addStyleTag({ content: ".chat-fab { display: none !important } nav { visibility: hidden }" });
  const shot = async (p, name, hh = 820) => { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width: 390, height: Math.min(hh, full) } }); console.log("shot", name); };
  const shotAt = async (p, name, sel, above, hh) => { const y = await p.evaluate(({ sel, above }) => Math.max(0, document.querySelector(sel).getBoundingClientRect().top + scrollY - above), { sel, above }); await p.waitForTimeout(300); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y, width: 390, height: Math.min(hh, full - y) } }); console.log("shot", name); };
  const ev = (p, fn, x = {}) => p.evaluate(fn, { MARK, NOTE, GNOTE, TAP, PEN, XS, BTN, ...x });
  const clear = (p) => p.evaluate(() => { document.querySelectorAll("[data-n]").forEach((e) => e.remove()); document.querySelectorAll("[data-t]").forEach((e) => { e.style.outline = ""; e.removeAttribute("data-t"); }); });
  const noteAfter = (p, sel, html, grey) => ev(p, ({ NOTE, GNOTE, sel, html, grey }) => { const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = grey ? GNOTE : NOTE; n.innerHTML = html; document.querySelector(sel).insertAdjacentElement("afterend", n); }, { sel, html, grey });
  // the meal line, drawn new. kind: "button" (nothing set, closed), "open" (nothing set, edit mode), or [meal, day]
  const line = (p, kind, tap) => ev(p, ({ MARK, TAP, BTN, kind, tap }) => { const t = document.querySelector(".meal-line-text"); const pen = document.querySelector(".plan-line-pen") || document.querySelector(".plan-line-x");
    if (kind === "button") { t.innerHTML = BTN; t.style.outline = ""; if (pen) pen.style.display = "none"; const b = t.querySelector("button"); b.style.cssText += ";" + (tap ? TAP : MARK); }
    else if (kind === "open") { t.innerHTML = '<span class="meal-line-unset" style="color:#172742">Put it on a day</span>'; t.style.cssText += ";" + MARK; if (pen) pen.style.display = ""; }
    else { t.innerHTML = `<span class="meal-line-unset" style="color:#172742">${kind[0]}</span><span class="meal-line-day" style="display:block">${kind[1]}</span>`; t.style.cssText += ";" + MARK; if (pen) pen.style.display = ""; } }, { kind, tap });
  // ---- 1: the photo on the Plate, name empty
  let p = await h.open({ foods: [], planned }); await h.toPhoto(p, true); await css(p);
  await ev(p, ({ MARK, PEN }) => { const i = document.querySelector(".title-input"); i.placeholder = "Untitled"; i.value = ""; let row = i.closest(".title-row");
    if (!row) { row = document.createElement("div"); row.style.cssText = "display:flex;align-items:center;gap:8px"; i.insertAdjacentElement("beforebegin", row); row.appendChild(i); i.style.flex = "1"; const b = document.createElement("button"); b.type = "button"; b.className = "icon title-pen"; b.innerHTML = PEN; row.appendChild(b); }
    const s = document.createElement("p"); s.setAttribute("data-sub", "1"); s.textContent = "Name it, or Chef Mealan will."; s.style.cssText = "margin:6px 0 10px;font-size:14px;color:#5b6b8a"; row.insertAdjacentElement("afterend", s); const box = document.createElement("div"); box.style.cssText = MARK + ";padding:2px 4px;margin-bottom:10px"; row.insertAdjacentElement("beforebegin", box); box.appendChild(row); box.appendChild(s); });
  await line(p, "button");
  await noteAfter(p, ".meal-line", "<b>Step 1. Two lines changed, nothing else.</b> The name: <b>Untitled</b>, with the pencil, and under it Name it, or Chef Mealan will. The meal line: the white button <b>Put it on a day</b>. Today these say Chef Mealan names it, and Meal and day not set.");
  await shot(p, "h_1", 900);
  await p.context().close();
  // ---- 2: the read (a fresh page, so nothing drawn on step 1 stays)
  p = await h.open({ foods: [], planned }); await h.toPhoto(p, true); await h.readIt(p); await css(p);
  await line(p, "button", true);
  await noteAfter(p, ".meal-line", "<b>Step 2. The read. No change but the button.</b> Chef Mealan named the plate. It is on no day, so the read ends with What do you do with it?. Amber: the tap on Put it on a day.");
  await shot(p, "h_2", 1400);
  // ---- 3: edit mode
  await clear(p); await p.evaluate(() => { const b = document.querySelector(".plan-line-pen"); b.style.display = ""; });
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(500); await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Sat 14" }).click(); await p.waitForTimeout(500);
  const editBase = () => ev(p, ({ MARK, XS }) => { const pen = document.querySelector(".plan-line-pen"); pen.innerHTML = XS; pen.style.cssText += ";" + MARK; const c = document.querySelector(".meal-line-open .pcal"); if (!c.querySelector("[data-ref]")) { const q = document.createElement("b"); q.setAttribute("data-ref", "1"); q.className = "pcal-q"; q.textContent = "The photo was taken on Saturday, 15:57."; q.style.cssText = "display:block;margin:0 0 8px;" + MARK; c.insertAdjacentElement("afterbegin", q); }
    for (const r of document.querySelectorAll(".meal-line-open .pcal-row")) if (/Just looking/.test(r.textContent)) { (r.querySelector("b") || r.firstElementChild).textContent = "Not on any day"; r.lastElementChild.textContent = ""; }
    const walk = document.createTreeWalker(document.querySelector(".meal-line-open"), NodeFilter.SHOW_TEXT); let t; while ((t = walk.nextNode())) if (/Just looking/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace("Just looking", "Not on any day"); });
  const markRow = (name, field) => ev(p, ({ name, field }) => { for (const r of document.querySelectorAll(".meal-line-open .pcal-row")) { const on = new RegExp("^\\s*(✓\\s*)?" + name).test(r.textContent); const b = r.querySelector("b") || r.firstElementChild; b.textContent = b.textContent.replace(/^✓\s*/, ""); r.style.background = on ? "#e3edff" : ""; if (on) { b.textContent = "✓ " + b.textContent; if (field) r.lastElementChild.innerHTML = field; } } }, { name, field });
  const rowsNote = async (html) => { await clear(p); await noteAfter(p, ".meal-line-open .pcal-rows", html); };
  await editBase(); await line(p, "open"); await markRow("Not on any day");
  await rowsNote("<b>Step 3. Edit mode.</b> The button opened it. The <b>X closes it</b>, and that is all the X does. It opens on the photo's day. The photo's time is a reference and cannot be changed. <b>Not on any day</b> is marked, because nothing is set.");
  await shot(p, "h_3", 900);
  // ---- 4: Dinner and its time
  await markRow("Dinner", FIELD("19:30")); await line(p, ["Dinner", "Saturday, 14 November, 19:30"]);
  await rowsNote("<b>Step 4. I tap Dinner and set its time.</b> The line above shows it at once: saved, no Done. The time in Dinner's row is a field: a tap opens the phone's clock. I set 19:30, for this dinner on this day only.");
  await shot(p, "h_4", 900);
  // ---- the way back
  await ev(p, () => { for (const r of document.querySelectorAll(".meal-line-open .pcal-row")) if (/Dinner/.test(r.textContent)) r.lastElementChild.textContent = "20:00 · planned: Chicken rice bowl"; });
  await markRow("Not on any day"); await line(p, "open");
  await rowsNote("<b>The way back.</b> In edit mode a tap on <b>Not on any day</b> takes the plate off the day again. Closed, the line is the button Put it on a day. This takes the place of the X that removed the meal.");
  await shot(p, "h_8", 900);
  await p.context().close();
  // ---- 5: closed; 6: All of it, Done; 7: the Plan
  p = await h.open({ foods: [], planned }); await h.toPhoto(p, true); await h.readIt(p);
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(500); await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Sat 14" }).click(); await p.waitForTimeout(400); await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(900); await css(p);
  const closed = () => ev(p, ({ MARK, PEN }) => { const x = document.querySelector(".plan-line-x"); x.innerHTML = PEN; x.style.cssText += ";" + MARK; document.querySelector(".meal-line-day").textContent = "Saturday, 14 November, 19:30"; document.querySelector(".meal-line-text").style.cssText += ";" + MARK; });
  await closed();
  await noteAfter(p, ".meal-line", "<b>Step 5. Closed with the X.</b> The line shows the meal with its day and time, and the pencil to open edit mode again. Below, the read as it is today: it now asks Did you eat it?.");
  await shot(p, "h_5", 1500);
  await clear(p);
  await p.locator(".rv-eat .pa-opt").first().click(); await p.waitForTimeout(400);
  await ev(p, ({ TAP }) => { const d = document.querySelector(".rv-done"); d.style.cssText += ";" + TAP; d.setAttribute("data-t", "1"); });
  await p.evaluate(() => { const o = document.querySelector(".rv-eat .pa-opt"); const w = document.createTreeWalker(o, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) t.nodeValue = t.nodeValue.replace(/^\s*✓\s*/, ""); });
  await noteAfter(p, ".rv-eat", "<b>Step 6. No change.</b> I tap <b>All of it</b>, then <b>Done</b>. Done logs the meal. New is only where it lands: on Saturday, as its dinner, at 19:30.");
  await shotAt(p, "h_6", ".rv-eat", 40, 520);
  await clear(p); await p.locator(".rv-done").click(); await p.waitForTimeout(1500);
  await p.addStyleTag({ content: "nav { visibility: visible !important }" }); await h.tab(p, "Plan"); await p.waitForTimeout(500); await p.locator("main button").filter({ hasText: /^Sat 14/ }).first().click(); await p.waitForTimeout(700); await p.addStyleTag({ content: "nav, .chat-fab { display: none !important }" });
  await ev(p, ({ MARK, NOTE }) => { const e = document.querySelector(".past-eaten"); const walk = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let t; while ((t = walk.nextNode())) t.nodeValue = t.nodeValue.replace("20:00", "19:30"); e.style.cssText += ";" + MARK;
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>Step 7. One dinner.</b> I tap Plan in the bottom bar, then Sat 14. Saturday shows the meal I ate as its dinner, at the time I set. The planned Chicken rice bowl no longer asks. Today shows nothing of it."; (document.querySelector(".past-add") || e).insertAdjacentElement("afterend", n); });
  await shotAt(p, "h_7", ".past-eaten", 330, 1100);
  await p.context().close();
  // ---- first row, the step that was missing: All of it, then Done, as the app is today
  p = await h.open({ foods: [], planned }); await h.toPhoto(p, true); await h.readIt(p);
  await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(500); await p.locator(".plate-end .pcal-day").filter({ hasText: "Sun 15" }).click(); await p.waitForTimeout(400); await h.row(p, "Lunch", ".plate-end").click(); await p.waitForTimeout(800);
  await p.locator(".plan-line-x").click(); await p.waitForTimeout(500); await p.locator(".plan-line-pen").click(); await p.waitForTimeout(500); await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(900); await css(p);
  await p.locator(".rv-eat .pa-opt").first().click(); await p.waitForTimeout(400);
  await ev(p, ({ TAP }) => { const d = document.querySelector(".rv-done"); d.style.cssText += ";" + TAP; });
  await noteAfter(p, ".rv-eat", "<b>Step 6.</b> With Dinner set, the read asks Did you eat it?. I tap <b>All of it</b>, then <b>Done</b>. Done logs the meal: with the photo's time, Saturday, and the dinner of today.", true);
  await shotAt(p, "f_6", ".rv-eat", 40, 520);
  await p.context().close();
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 800)); process.exit(1); });
