// Board DT318: correcting what Chef Mealan read from a photo (Coach Milan, 18 November 2026, 19:26 and 21:44 to 21:51).
// Row 1: his steps on the app as built in 0.3.159. Row 2: the new flow, whole: one edit mode for the foods, by hand or by words.
const ROOT = process.env.ROOT || "/home/claude/pm159";
const start = require(ROOT + "/tests/flows/plate157.cjs"); const fs = require("node:fs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs318"; fs.mkdirSync(R, { recursive: true });
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", RED = "outline:3px solid #d13a3a;outline-offset:2px;border-radius:12px", TAP = "outline:4px solid #f0a81c;outline-offset:2px";
const NB = "background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;";
const NOTE = NB + MARK, GNOTE = NB + MARK.replace("#2a72d9", "#5b6b8a");
const PEN = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
const XS = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
const IMG = "data:image/jpeg;base64," + fs.readFileSync(ROOT + "/tests/flows/plate.jpg").toString("base64");
const f = (name, grams, kcal, pr, fa, ca, fi) => ({ name, grams, low: Math.round(grams * 0.75), high: Math.round(grams * 1.3), calories: kcal, protein: pr, fats: fa, carbs: ca, fiber: fi, confidence: "medium" });
const READ1 = { dish: "Chicken and fries", foods: [f("Chicken breast, grilled", 250, 165, 31, 3.6, 0, 0), f("Sweet potato fries, baked", 180, 150, 2, 5, 24, 3.5), f("Yogurt, 10% fat", 80, 120, 3.5, 10, 4, 0)], unsure: { name: "Chicken breast, grilled", options: [200, 350] }, which: null, course: "main", vessel: "plate", serves: 1 };
const READ2 = { dish: "Chicken and fries", foods: [f("Chicken breast, grilled", 250, 165, 31, 3.6, 0, 0), f("Sweet potato fries, baked", 180, 150, 2, 5, 24, 3.5), f("Yogurt, 0.2% fat", 80, 40, 4.3, 0.2, 5, 0), f("Mayonnaise", 20, 680, 1, 75, 1, 0)], unsure: { name: "Chicken breast, grilled", options: [220, 350] }, which: null, course: "main", vessel: "plate", serves: 1 };
(async () => { const h = await start("3711"); try {
  const css = (p) => p.addStyleTag({ content: ".chat-fab { display: none !important } nav { visibility: hidden }" });
  const ev = (p, fn, x = {}) => p.evaluate(fn, { MARK, RED, TAP, NOTE, GNOTE, PEN, XS, IMG, ...x });
  const pic = (p) => ev(p, ({ IMG }) => document.querySelectorAll(".mp-big-img img, .mp-shot img, .pa-photo img, .mp-help img").forEach((i) => { i.src = IMG; }));
  const clear = (p) => p.evaluate(() => { document.querySelectorAll("[data-n]").forEach((e) => e.remove()); document.querySelectorAll("[data-t]").forEach((e) => { e.style.outline = ""; e.removeAttribute("data-t"); }); });
  const mark = (p, sel, how, text) => ev(p, ({ MARK, RED, TAP, sel, how, text }) => { const all = [...document.querySelectorAll(sel)]; const e = text ? all.find((x) => x.textContent.includes(text)) : all[0]; if (!e) return; e.style.cssText += ";" + (how === "red" ? RED : how === "tap" ? TAP : MARK); e.setAttribute("data-t", "1"); }, { sel, how, text });
  const note = (p, sel, html, grey, where = "afterend") => ev(p, ({ NOTE, GNOTE, sel, html, grey, where }) => { const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = grey ? GNOTE : NOTE; n.innerHTML = html; document.querySelector(sel).insertAdjacentElement(where, n); }, { sel, html, grey, where });
  const shot = async (p, name, hh = 900) => { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width: 390, height: Math.min(hh, full) } }); console.log("shot", name); };
  const shotAt = async (p, name, sel, above, hh) => { const y = await p.evaluate(({ sel, above }) => Math.max(0, document.querySelector(sel).getBoundingClientRect().top + scrollY - above), { sel, above }); await p.waitForTimeout(300); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y, width: 390, height: Math.min(hh, full - y) } }); console.log("shot", name); };
  const fresh = async () => { const p = await h.open({ foods: [] }); let n = 0; await p.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(n++ ? READ2 : READ1) })); await h.toPhoto(p, false); await h.readIt(p); await css(p); await pic(p); return p; };
  const btn = (p, t) => p.locator("button").filter({ hasText: t }).first();
  // ================= row 1: as it is today
  let p = await fresh();
  await mark(p, ".mp-tag", "red", "Yogurt"); await mark(p, ".rv-change button", "tap");
  await note(p, ".rv-change", "<b>Step 1. The read.</b> Three foods as chips. Red: the chip says Yogurt. Which yogurt was taken is not shown. To correct a food I tap Change the foods.", true);
  await shot(p, "t_1", 1000);
  await clear(p); await p.locator(".rv-change button").click(); await p.waitForTimeout(800); await css(p); await pic(p);
  await mark(p, "button.choice", "tap", "~200 g");
  await note(p, ".mp-ask", "<b>Step 2. Another screen opens.</b> Here Chef Mealan asks about the chicken. On the read he did not. I tap ~200 g.", true);
  await shotAt(p, "t_2", ".mp-tags", 330, 900);
  await clear(p); await btn(p, "~200 g").click(); await p.waitForTimeout(600);
  await ev(p, ({ RED }) => { const b = [...document.querySelectorAll(".name-link")].find((x) => /Yogurt/.test(x.textContent)); b.style.cssText += ";" + RED; b.setAttribute("data-t", "1"); });
  await ev(p, ({ GNOTE }) => { const s = [...document.querySelectorAll("small, p")].find((x) => /^Swipe a food left/.test(x.textContent.trim())); const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = GNOTE; n.innerHTML = "<b>Step 3. The food list, lower on that screen.</b> Red: only here I see it is Yogurt, 10% fat. Mine was 0.2%. I swipe the row left to swap it."; s.insertAdjacentElement("afterend", n); });
  await shotAt(p, "t_3", ".pt-open", 60, 760);
  await clear(p);
  const row = p.locator(".name-link").filter({ hasText: "Yogurt" }).first(); await row.scrollIntoViewIfNeeded(); const bx = await row.boundingBox();
  await p.mouse.move(bx.x + 60, bx.y + 34); await p.mouse.down(); for (let k = 1; k <= 14; k++) { await p.mouse.move(bx.x + 60 - k * 16, bx.y + 34); await p.waitForTimeout(25); } await p.mouse.up(); await p.waitForTimeout(1500);
  await p.evaluate(() => getSelection().removeAllRanges()); await p.screenshot({ path: `${R}/t_4.png` }); console.log("shot t_4");
  console.log("SWAPTEXT:", (await p.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 400));
  await p.context().close();
  p = await fresh(); await p.locator(".rv-change button").click(); await p.waitForTimeout(800); await css(p); await pic(p); await btn(p, "~200 g").click(); await p.waitForTimeout(500);
  await p.locator(".mp-again-link").click(); await p.waitForTimeout(700); await pic(p);
  const ta = p.locator(".mp-help textarea, .mp-help input[type=text], .mp-help .pa-words").first(); await ta.fill("The yogurt was 0.2% fat. There was mayo too, under the chicken."); await p.waitForTimeout(300);
  await mark(p, ".mp-help .pill-primary", "tap");
  await note(p, ".mp-help", "<b>Step 5. A third place.</b> The link Wrong foods? Help Chef Mealan read it opens this form. I write what was wrong and tap the button. This worked well.", true);
  await shotAt(p, "t_5", ".mp-help", 200, 900);
  await clear(p); await p.locator(".mp-help .pill-primary").click(); await p.waitForTimeout(3000); await css(p); await pic(p);
  console.log("AFTER:", (await p.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 700));
  if (await p.locator(".mp-ask").count()) { await mark(p, ".mp-ask", "red"); await note(p, ".mp-ask", "<b>Step 6. He read again.</b> The yogurt is right and the mayonnaise is there. Red: he asks about the chicken a second time, now 220 g or 350 g. My 200 g is gone.", true); await shotAt(p, "t_6", ".mp-tags", 150, 900); }
  else { await p.screenshot({ path: `${R}/t_6.png`, fullPage: true }); console.log("t_6 plain"); }
  await p.context().close();

  // ================= row 2: the new flow, whole
  const LAB = (t) => `<span style="display:block;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#5b6b8a">${t}</span>`;
  const base = (p) => ev(p, ({ LAB }) => { const sub = [...document.querySelectorAll("p, span, div, small")].find((x) => x.children.length === 0 && /^Read from your photo/.test(x.textContent.trim())); if (sub) sub.textContent = "Chef Mealan named it from your photo.";
    const t = document.querySelector(".meal-line-text"); if (t) t.innerHTML = LAB + '<span class="meal-line-unset" style="color:#172742">No meal selected</span>'; const c = document.querySelector(".rv-change"); if (c) c.style.display = "none"; }, { LAB: LAB("Meal and day") });
  // the foods block: a small title with the pencil (or the X), then chips or the edit rows
  const foods = (p, o) => ev(p, ({ MARK, TAP, PEN, XS, LAB, o }) => { document.querySelectorAll("[data-fh], [data-ed], [data-q]").forEach((e) => e.remove()); const tags = document.querySelector(".mp-tags"), say = document.querySelector(".mp-big-say");
    const hd = document.createElement("div"); hd.setAttribute("data-fh", "1"); hd.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin:10px 0 6px"; hd.innerHTML = LAB + `<button type="button" class="icon" style="${o.open ? MARK : o.tapPen ? TAP : o.markPen ? MARK : ""}">${o.open ? XS : PEN}</button>`; tags.insertAdjacentElement("beforebegin", hd);
    say.textContent = `Your photo, 18:00. ${o.rows.length} foods read, amounts estimated (~).`;
    if (!o.open) { tags.style.display = ""; tags.innerHTML = o.rows.map((r) => `<span class="mp-tag" style="${r.mark ? MARK : ""}">${r.name} ${r.est ? "~" : ""}${r.g} g</span>`).join(""); }
    else { tags.style.display = "none"; const ed = document.createElement("div"); ed.setAttribute("data-ed", "1"); ed.style.cssText = "margin:4px 0 10px";
      const pill = (t, extra = "") => `<button type="button" class="pill pill-small" style="min-height:40px;padding:0 12px;${extra}">${t}</button>`;
      ed.innerHTML = `<div style="border:1.5px solid #cfd9ea;border-radius:14px;padding:10px;margin-bottom:10px;${o.markWords ? MARK : ""}"><b style="font-size:14px">Tell Chef Mealan what is wrong</b><textarea class="search pa-words" rows="2" style="width:100%;box-sizing:border-box;margin:6px 0;min-height:64px" placeholder="What it is, what is missing. You can leave it empty.">${o.words || ""}</textarea><div style="display:flex;gap:8px;justify-content:flex-end">${pill("🎤 Say it")}${pill("Read again", o.tapRead ? TAP : "")}</div></div>`
        + (o.chef ? `<div class="bubble mealan chef-line" style="margin:0 0 10px;${MARK}"><b>Chef Mealan:</b> ${o.chef}</div>` : "")
        + o.rows.map((r) => `<div style="border-top:1px solid #e3e9f3;padding:10px 0;${r.mark ? MARK + ";padding:10px 6px" : ""}"><b style="display:block;font-size:15px;margin-bottom:6px">${r.name}${r.tag ? ` <span style="font-weight:700;font-size:12px;color:#1d7a4f;background:#e2f5ea;border-radius:8px;padding:2px 6px">${r.tag}</span>` : ""}</b><div style="display:flex;align-items:center;gap:8px"><span style="display:inline-flex;align-items:center;gap:4px;min-height:40px;padding:0 10px;border:1.5px solid ${r.field ? "#2a72d9" : "#cfd9ea"};border-radius:12px;font-weight:800;${r.field ? MARK : ""}">${r.est ? "~" : ""}${r.g}</span><span>g</span><span style="flex:1"></span>${pill("Swap")}${pill("Remove", "color:#b3261e;border-color:#e8b4b0")}</div></div>`).join("")
        + `<div style="border-top:1px solid #e3e9f3;padding-top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px">${pill("+ Add a food")}<button type="button" class="link" style="font-size:13px">Retake, + Photo, Fit to my target ›</button></div>`;
      tags.insertAdjacentElement("afterend", ed); }
    if (o.q) { const q = document.createElement("div"); q.setAttribute("data-q", "1"); q.className = "mp-ask"; q.style.cssText = "margin:10px 0;" + MARK; q.innerHTML = `<small><b>One thing I cannot tell from the photo:</b> is the chicken breast about 200 g or 350 g?</small><div class="button-row"><button type="button" class="choice" style="${o.q === "200" ? TAP : ""}">~200 g</button><button type="button" class="choice">~350 g</button><button type="button" class="pill pill-small pill-action" style="${o.q === "neither" ? TAP : ""}">Neither</button></div>`; document.querySelector(".mp-big-row").insertAdjacentElement("afterend", q); } }, { LAB: LAB("Foods"), o });
  const A = { name: "Chicken breast, grilled", g: 250, est: true }, B = { name: "Sweet potato fries, baked", g: 180, est: true }, C = { name: "Yogurt, 10% fat", g: 80, est: true };
  const A2 = { ...A, g: 200, est: false }, C2 = { name: "Yogurt, 0.2% fat", g: 80, est: true }, D = { name: "Mayonnaise", g: 20, est: true };
  const anchor = async (p, html, grey) => { await clear(p); await note(p, ".mp-big-row", html, grey); };
  p = await fresh(); await base(p);
  await foods(p, { rows: [A, B, { ...C, mark: true }], markPen: true, q: "200" });
  await ev(p, ({ NOTE }) => { const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = NOTE; n.innerHTML = "<b>Step 1. The read.</b> New: the foods have a small title and <b>one pencil</b>. A chip shows the food's full name, so I see it is Yogurt, 10% fat. Chef Mealan's question stands here, under the chips, with a third answer: Neither. Change the foods is gone. Amber: I tap ~200 g."; document.querySelector("[data-q]").insertAdjacentElement("afterend", n); });
  await shot(p, "n_1", 1160);
  await foods(p, { rows: [{ ...A2, mark: true }, B, C], tapPen: true });
  await anchor(p, "<b>Step 2. Answered.</b> The chip says 200 g, without the ~: it is my amount now. The question is gone. Amber: I tap the pencil.");
  await shot(p, "n_2", 1000);
  await foods(p, { rows: [A2, B, { ...C, mark: true }], open: true });
  await ev(p, ({ NOTE }) => { document.querySelectorAll("[data-n]").forEach((e) => e.remove()); const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = NOTE; n.innerHTML = "<b>Step 3. Edit mode, in place.</b> The pencil is the <b>X that closes it</b>. On top: tell Chef Mealan what is wrong. Under it each food is a row: its full name, the grams as a field, Swap, Remove. Then + Add a food. Every change is saved at once, no Done."; document.querySelector("[data-ed]").insertAdjacentElement("afterend", n); });
  await shotAt(p, "n_3", "[data-fh]", 150, 1000);
  await foods(p, { rows: [A2, B, C], open: true, words: "The yogurt was 0.2% fat. There was mayo too, under the chicken.", markWords: true, tapRead: true });
  await ev(p, ({ NOTE }) => { document.querySelectorAll("[data-n]").forEach((e) => e.remove()); const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = NOTE; n.innerHTML = "<b>Step 4. By words.</b> I write or say what was wrong. Amber: I tap Read again. It is the form that worked well, moved to the place where I correct."; document.querySelector("[data-ed]").firstElementChild.insertAdjacentElement("afterend", n); });
  await shotAt(p, "n_4", "[data-fh]", 150, 1000);
  await foods(p, { rows: [{ ...A2, mark: true, tag: "yours" }, B, { ...C2, mark: true, tag: "changed" }, { ...D, mark: true, tag: "new" }], open: true, words: "", chef: "I changed the yogurt to 0.2% fat and added mayonnaise. Your 200 g of chicken stay." });
  await ev(p, ({ NOTE }) => { document.querySelectorAll("[data-n]").forEach((e) => e.remove()); const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = NOTE; n.innerHTML = "<b>Step 5. He read again.</b> One line says what he changed. The yogurt is 0.2% fat, the mayonnaise is new. <b>My 200 g of chicken stay, and he does not ask again.</b> A wrong or doubled food: Remove."; document.querySelector("[data-ed]").insertAdjacentElement("afterend", n); });
  await shotAt(p, "n_5", "[data-fh]", 150, 1100);
  await foods(p, { rows: [A2, B, C2, D] });
  await anchor(p, "<b>Step 6. Closed with the X.</b> The chips again, with what I corrected. Below, the read goes on as today: This plate, and What do you do with it?.");
  await shot(p, "n_6", 1000);
  await foods(p, { rows: [A, B, C], q: "neither", markPen: true });
  await anchor(p, "", false); await clear(p);
  await foods(p, { rows: [{ ...A, field: true }, B, C], open: true });
  await ev(p, ({ NOTE }) => { const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = NOTE; n.innerHTML = "<b>Neither.</b> When both amounts are wrong, a tap on Neither opens edit mode with that food's grams ready to type. Today the third button is Skip, and it only closes the question."; document.querySelector("[data-ed]").insertAdjacentElement("afterend", n); });
  await shotAt(p, "n_7", "[data-fh]", 150, 1000);
  await p.context().close();
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 800)); process.exit(1); });
