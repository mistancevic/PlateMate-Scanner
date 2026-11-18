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

  // ================= row 2: the new flow, whole (Coach Milan 23:44: tap a chip and tell Chef Mealan; by hand on the Plate; his checks stay)
  const LAB = (t) => `<span style="display:block;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#5b6b8a">${t}</span>`;
  const base = (p) => ev(p, ({ LAB }) => { const sub = [...document.querySelectorAll("p, span, div, small")].find((x) => x.children.length === 0 && /^Read from your photo/.test(x.textContent.trim())); if (sub) sub.textContent = "Chef Mealan named it from your photo.";
    const t = document.querySelector(".meal-line-text"); if (t) t.innerHTML = LAB + '<span class="meal-line-unset" style="color:#172742">No meal selected</span>'; }, { LAB: LAB("Meal and day") });
  const chips = (p, o) => ev(p, ({ MARK, TAP, o }) => { document.querySelectorAll("[data-fd], [data-n]").forEach((e) => e.remove()); const tags = document.querySelector(".mp-tags"), say = document.querySelector(".mp-big-say"), ch = document.querySelector(".rv-change button");
    tags.innerHTML = o.rows.map((r) => `<span class="mp-tag" style="${r.on ? "background:#e3edff;box-shadow:inset 0 0 0 1.5px #2a72d9;" : ""}${r.tap ? TAP : r.mark ? MARK : ""}">${r.on ? "✓ " : ""}${r.name} ${r.est ? "~" : ""}${r.g} g${r.tag ? ` <span style="font-weight:700;font-size:11px;color:#1d7a4f;background:#e2f5ea;border-radius:8px;padding:1px 6px">${r.tag}</span>` : ""}</span>`).join("");
    say.textContent = `Your photo, 18:00. ${o.rows.length} foods read, amounts estimated (~).`;
    const pill = (t, extra = "") => `<button type="button" class="pill pill-small" style="min-height:40px;padding:0 12px;${extra}">${t}</button>`;
    const fd = document.createElement("div"); fd.setAttribute("data-fd", "1"); fd.style.cssText = "margin:10px 0 4px";
    fd.innerHTML = `<div style="border:1.5px solid #cfd9ea;border-radius:14px;padding:10px;${o.markField ? MARK : ""}"><b style="font-size:14px;display:block">Tell Chef Mealan what is wrong</b>${o.about ? `<small style="display:block;margin:4px 0 0;color:#1d4fa3;font-weight:700">About: ${o.about}</small>` : `<small class="muted" style="display:block;margin:4px 0 0">Tap a food above, or write what is missing.</small>`}<textarea class="search pa-words" rows="2" style="width:100%;box-sizing:border-box;margin:6px 0;min-height:${o.words ? 64 : 44}px" placeholder="What it is, what it is not, what is missing.">${o.words || ""}</textarea><div style="display:flex;gap:8px;justify-content:flex-end">${pill("🎤 Say it")}${pill("Read again", o.tapRead ? TAP : "")}</div></div>`
      + (o.chef ? `<div class="bubble mealan chef-line" style="margin:10px 0 0;${MARK}"><b>Chef Mealan:</b> ${o.chef}</div>` : "")
      + (o.note ? `<div data-n="1" style="background:#fff8d6;padding:8px 10px;margin:12px 0 0;font-size:14px;line-height:1.45;color:#172742;text-align:left;${MARK}">${o.note}</div>` : "");
    document.querySelector(".mp-big-row").insertAdjacentElement("afterend", fd);
    ch.textContent = "Edit on the Plate"; ch.style.outline = ""; if (o.tapEdit) ch.style.cssText += ";" + TAP; else if (o.markEdit) ch.style.cssText += ";" + MARK; }, { o });
  const A = { name: "Chicken breast, grilled", g: 250, est: true }, B = { name: "Sweet potato fries, baked", g: 180, est: true }, C = { name: "Yogurt, 10% fat", g: 80, est: true };
  const C2 = { name: "Yogurt, 0.2% fat", g: 80, est: true }, D = { name: "Mayonnaise", g: 20, est: true };
  p = await fresh(); await base(p);
  await chips(p, { rows: [A, B, { ...C, tap: true }], markField: true, markEdit: true, note: "<b>Step 1. The read.</b> New: a chip shows the food's full name, so I see it is Yogurt, 10% fat. Under the chips one field for Chef Mealan. The button says Edit on the Plate. A tap on a chip no longer turns it into a number. Amber: I tap the yogurt." });
  await shot(p, "n_1", 1200);
  await chips(p, { rows: [A, B, { ...C, on: true }], about: "Yogurt, 10% fat", words: "It was 0.2% fat. There was mayo too, under the chicken.", markField: true, tapRead: true, note: "<b>Step 2. By words.</b> The chip is marked, and the field says what my words are about. I write or say what it is, and what is missing. Amber: I tap Read again." });
  await shotAt(p, "n_2", ".mp-tags", 150, 760);
  await chips(p, { rows: [A, B, { ...C2, mark: true, tag: "changed" }, { ...D, mark: true, tag: "new" }], chef: "I changed the yogurt to 0.2% fat and added mayonnaise.", tapEdit: true, note: "<b>Step 3. He read again.</b> One line says what he changed. The chips show it. An amount I set before stays, and he does not ask about it again. To correct by hand: amber, I tap Edit on the Plate." });
  await shotAt(p, "n_3", ".mp-tags", 150, 820);
  await clear(p); await p.locator(".rv-change button").click(); await p.waitForTimeout(900);
  await p.locator(".mp-again-link").click(); await p.waitForTimeout(600); await p.locator(".mp-help textarea, .mp-help .pa-words").first().fill("It was 0.2% fat. There was mayo too."); await p.locator(".mp-help .pill-primary").click(); await p.waitForTimeout(3000); await css(p); await pic(p);
  await ev(p, ({ NOTE }) => { const s = [...document.querySelectorAll("small, p")].find((x) => /^Swipe a food left/.test(x.textContent.trim())); const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = NOTE; n.innerHTML = "<b>Step 4. By hand, on the Plate.</b> No change: the food list you know. Grams as fields, a swipe to swap or remove, + Add more to your plate. Chef Mealan's own questions about a kind or an amount stay on this screen, as today."; s.insertAdjacentElement("afterend", n); });
  await shotAt(p, "n_4", ".pt-open", 60, 760);
  await p.context().close();
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 800)); process.exit(1); });
