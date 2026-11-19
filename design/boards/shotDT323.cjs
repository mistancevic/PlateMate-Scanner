// Board DT323: a plate kept from the read. Don't count it on the read, and the kept plate starts as Mine (Coach Milan,
// 19 November 2026: 07:41 "draw", 07:47 yes to the proposal). Row 1: the route as the app is built in 0.3.160. Row 2: the new
// flow, whole. The new frames are drawn: the real page, with the change put into it in the browser. Nothing in the app changes.
const path = require("node:path"), fs = require("node:fs");
const ROOT = process.env.ROOT || path.resolve(__dirname, "../..");
const start = require(ROOT + "/tests/flows/plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs323"; fs.mkdirSync(R, { recursive: true });
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", RED = "outline:3px solid #d13a3a;outline-offset:2px;border-radius:12px", TAP = "outline:4px solid #f0a81c;outline-offset:2px";
const NB = "background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;white-space:normal;";
const NOTE = NB + MARK, GNOTE = NB + MARK.replace("#2a72d9", "#5b6b8a");
const IMG = "data:image/jpeg;base64," + fs.readFileSync(ROOT + "/tests/flows/plate.jpg").toString("base64");
(async () => { const h = await start(process.env.PORT || "3723"); try {
  const css = (p) => p.addStyleTag({ content: ".chat-fab { display: none !important } nav { visibility: hidden }" });
  const ev = (p, fn, x = {}) => p.evaluate(fn, { MARK, RED, TAP, NOTE, GNOTE, IMG, ...x });
  const pic = (p) => ev(p, ({ IMG }) => document.querySelectorAll("main img, .mp-big-img img").forEach((i) => { if (i.getBoundingClientRect().width > 150) { i.src = IMG; i.style.objectFit = "cover"; } }));
  const clear = (p) => p.evaluate(() => { document.querySelectorAll("[data-n]").forEach((e) => e.remove()); document.querySelectorAll("[data-t]").forEach((e) => { e.style.outline = ""; e.removeAttribute("data-t"); }); });
  const mark = (p, sel, how, text) => ev(p, ({ MARK, RED, TAP, sel, how, text }) => { const all = [...document.querySelectorAll(sel)]; const e = text ? all.find((x) => x.textContent.includes(text)) : all[0]; if (!e) { console.log("no mark for " + sel); return; } e.style.cssText += ";" + (how === "red" ? RED : how === "tap" ? TAP : MARK); e.setAttribute("data-t", "1"); }, { sel, how, text });
  const note = (p, sel, html, grey, where = "afterend") => ev(p, ({ NOTE, GNOTE, sel, html, grey, where }) => { const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = grey ? GNOTE : NOTE; n.innerHTML = html; document.querySelector(sel).insertAdjacentElement(where, n); }, { sel, html, grey, where });
  const shot = async (p, name, hh = 900) => { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width: 390, height: Math.min(hh, full) } }); console.log("shot", name); };
  const shotAt = async (p, name, sel, above, hh) => { const y = await p.evaluate(({ sel, above }) => Math.max(0, document.querySelector(sel).getBoundingClientRect().top + scrollY - above), { sel, above }); await p.waitForTimeout(300); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y, width: 390, height: Math.min(hh, full - y) } }); console.log("shot", name); };
  const photo = async () => { const p = await h.open({ foods: [] }); await h.toPhoto(p, false); await css(p); await pic(p); return p; };
  const read = async () => { const p = await photo(); await h.readIt(p); await css(p); await pic(p); return p; };
  const new1 = process.env.ONLY === "new";

  if (!new1) {
  // ================= row 1: as the app is today
  // 1. the photo, on the Plate
  let p = await photo();
  await mark(p, ".pa-go .pill", "tap");
  await note(p, ".pa-go", "<b>Step 1. The photo, on the Plate.</b> I took it with the camera. No meal is selected. I tap Read the plate.", true);
  await shot(p, "t_1", 900);
  await p.context().close();
  // 2. the read
  p = await read();
  await mark(p, ".plate-end", "red"); await mark(p, ".rv-change button", "tap");
  await note(p, ".plate-end", "<b>Step 2. The read.</b> Red: three answers. None of them keeps the plate without counting it. The way is behind Continue on the Plate, higher on this screen. I tap it.", true);
  await shot(p, "t_2", 1700);
  // 3. the Plate's screen, at Chef Mealan's card
  await clear(p); await p.locator(".rv-change button").click(); await p.waitForTimeout(800); await css(p); await pic(p);
  await mark(p, ".mp-not-counted", "tap");
  await note(p, ".mp-say", "<b>Step 3. The Plate, at the bottom.</b> After the food list and What do you do with it?, Chef Mealan's card has Don't count it. I tap it.", true);
  await shotAt(p, "t_3", ".plate-end", 330, 760);
  // 4. the kept plate
  await clear(p); await p.locator(".mp-not-counted").first().click(); await p.waitForTimeout(900); await css(p); await pic(p);
  await mark(p, ".sv-whose", "red"); await mark(p, ".sv-dishes", "red");
  console.log("SV:", await p.evaluate(() => [...document.querySelectorAll(".sv-plate *")].filter((e) => typeof e.className === "string" && e.className).map((e) => e.tagName + "." + e.className).slice(0, 40).join(" | ")));
  await note(p, ".sv-plate", "<b>Step 4. The plate is kept.</b> Red: it says Someone else's, and it is my plate. Red: Main was picked by hand. The line filled by Chef Mealan is missing, and he read the dish.", true);
  await shotAt(p, "t_4", ".sv-plate", 120, 900);
  // what Mine looks like on the app today, for the new frame
  await clear(p); await p.locator(".sv-whose button").filter({ hasText: "Mine" }).click(); await p.waitForTimeout(600);
  console.log("MINE:", (await p.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 1500));
  await p.screenshot({ path: `${R}/raw_mine.png`, fullPage: true });
  await p.context().close();
  }

  // ================= row 2: the new flow, whole
  let q = await photo();
  await mark(q, ".pa-go .pill", "tap");
  await note(q, ".pa-go", "<b>Step 1. The photo, on the Plate.</b> No change. I tap Read the plate.", true);
  await shot(q, "n_1", 900);
  await q.context().close();
  // 2. the read, with the fourth answer
  q = await read();
  await ev(q, ({ TAP }) => { const row = document.querySelector(".plate-end-btns"); const b = document.createElement("button"); b.type = "button"; b.className = "link pe-not"; b.textContent = "Don't count it"; b.style.cssText = "min-height:44px;flex-basis:100%;display:flex;justify-content:flex-end;align-items:center;padding:0 4px;"; const sp = document.createElement("span"); sp.textContent = b.textContent; b.textContent = ""; b.appendChild(sp); sp.style.cssText = "display:inline-block;padding:10px 6px;" + TAP; sp.setAttribute("data-t", "1"); row.appendChild(b); });
  await note(q, ".plate-end", "<b>Step 2. The read.</b> New: a fourth answer, Don't count it. It is quieter than the three: a link with no frame, on its own line under them. Nothing else on the read changes. I tap it.", false);
  await shot(q, "n_2", 1700);
  await shotAt(q, "n_2z", ".plate-end", 20, 260);
  // 3. the kept plate: the Plate with the Served card, as Don't count it opens it today; Mine and the dish as read
  await clear(q); await q.locator(".rv-change button").click(); await q.waitForTimeout(800); await q.locator(".mp-not-counted").first().click(); await q.waitForTimeout(900);
  await q.locator(".sv-whose button").filter({ hasText: "Mine" }).click(); await q.waitForTimeout(600); await css(q); await pic(q);
  await ev(q, () => { const lab = [...document.querySelectorAll(".sv-label")].find((x) => /Which dish/i.test(x.textContent)); if (lab && !lab.querySelector(".sv-by")) { const s = document.createElement("span"); s.className = "sv-by"; s.textContent = "filled by Chef Mealan"; lab.appendChild(s); } });
  await mark(q, ".sv-whose", "blue"); await mark(q, ".sv-dishes", "blue");
  await note(q, ".sv-plate", "<b>Step 3. The plate is kept.</b> The Plate opens with the Served card, as after Don't count it today. New: Mine is picked. New: Main is the dish Chef Mealan read, and the card says so. Whose plate stays: one tap on Someone else's changes it.", false);
  await shotAt(q, "n_3", ".sv-plate", 120, 900);
  await q.context().close();
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 600)); process.exit(1); });
