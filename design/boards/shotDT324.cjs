// Boards DT324 and DT325 (Coach Milan, 19 November 2026, 09:08): two lines of words. DT324: the line under the title on the
// Plate's screen of a photo says what the read says. DT325: the help line of a plate from an earlier day names no time.
// Each: the step before, the screen as the app is built in 0.3.160, and the same screen with the new words drawn in.
const path = require("node:path"), fs = require("node:fs");
const ROOT = process.env.ROOT || path.resolve(__dirname, "../..");
const start = require(ROOT + "/tests/flows/plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs324"; fs.mkdirSync(R, { recursive: true });
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", RED = "outline:3px solid #d13a3a;outline-offset:2px;border-radius:12px", TAP = "outline:4px solid #f0a81c;outline-offset:2px";
const NB = "background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;white-space:normal;";
const NOTE = NB + MARK, GNOTE = NB + MARK.replace("#2a72d9", "#5b6b8a");
const IMG = "data:image/jpeg;base64," + fs.readFileSync(ROOT + "/tests/flows/plate.jpg").toString("base64");
const F = (sd, n) => sd.foods.find((f) => f.name.startsWith(n));
(async () => { const h = await start(process.env.PORT || "3724"); try {
  const css = (p) => p.addStyleTag({ content: ".chat-fab { display: none !important } nav { visibility: hidden }" });
  const ev = (p, fn, x = {}) => p.evaluate(fn, { MARK, RED, TAP, NOTE, GNOTE, IMG, ...x });
  const pic = (p) => ev(p, ({ IMG }) => document.querySelectorAll("main img").forEach((i) => { if (i.getBoundingClientRect().width > 150) { i.src = IMG; i.style.objectFit = "cover"; } }));
  const leaf = (p, re, how, text) => ev(p, ({ MARK, RED, re, how, text }) => { const e = [...document.querySelectorAll("main p, main span, main div, main small")].find((x) => x.children.length === 0 && new RegExp(re).test(x.textContent.trim())); if (!e) { console.log("no leaf " + re); return; } if (text) e.textContent = text; e.style.cssText += ";" + (how === "red" ? RED : MARK); e.setAttribute("data-leaf", "1"); }, { re, how, text });
  const note = (p, sel, html, grey) => ev(p, ({ NOTE, GNOTE, sel, html, grey }) => { const n = document.createElement("div"); n.setAttribute("data-n", "1"); n.style.cssText = grey ? GNOTE : NOTE; n.innerHTML = html; document.querySelector(sel).insertAdjacentElement("afterend", n); }, { sel, html, grey });
  const shot = async (p, name, hh = 760) => { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width: 390, height: Math.min(hh, full) } }); console.log("shot", name); };
  // ---------- DT324
  let p = await h.open({ foods: [] }); await h.toPhoto(p, false); await h.readIt(p); await css(p); await pic(p);
  await ev(p, ({ TAP }) => { const b = document.querySelector(".rv-change button"); b.style.cssText += ";" + TAP; });
  await leaf(p, "^Chef Mealan named it", "blue");
  await note(p, ".rv-change", "<b>The step before: the read.</b> Blue: the line under the title, since 0.3.160. I tap Continue on the Plate.", true);
  await shot(p, "a_0", 900);
  await p.evaluate(() => document.querySelectorAll("[data-n]").forEach((e) => e.remove()));
  await p.locator(".rv-change button").click(); await p.waitForTimeout(800); await css(p); await pic(p);
  await leaf(p, "^Read from your photo", "red");
  await note(p, "[data-leaf]", "<b>As it is in 0.3.160.</b> Red: the old line. It speaks about amounts and about something below.", true);
  await shot(p, "a_1", 700);
  await p.evaluate(() => document.querySelectorAll("[data-n]").forEach((e) => e.remove()));
  await ev(p, () => { const e = document.querySelector("[data-leaf]"); e.style.outline = ""; e.removeAttribute("data-leaf"); });
  await leaf(p, "^Read from your photo", "blue", "Chef Mealan named it from your photo.");
  await note(p, "[data-leaf]", "<b>New.</b> The same line as on the read. Nothing else on this screen changes.", false);
  await shot(p, "a_2", 700);
  await p.context().close();
  // ---------- DT325: a plate from Saturday, with a photo and without
  const old = async (withPhoto) => { const q = await h.open({ foods: [], seed: (sd) => { sd.items = [{ id: "o1", food: F(sd, "Skyr"), grams: 250, locked: false }, { id: "o2", food: F(sd, "Oats"), grams: 80, locked: false }]; sd.plateAt = "2026-11-14T19:10:00+01:00"; if (withPhoto) sd.photo = { image: IMG, at: "2026-11-14T18:10:00.000Z", who: "now" }; } }); await css(q); await pic(q); return q; };
  for (const [name, withPhoto, was, tail] of [["b", true, "at the photo's time", "the photo's time"], ["c", false, "at the time it was started", "the time it was started"]]) {
    p = await old(withPhoto);
    console.log("OLD:", (await h.main(p)).slice(0, 500));
    await leaf(p, "^Ate it asks which meal", "red");
    await note(p, ".chef-ask", `<b>As it is in 0.3.160.</b> Red: the line says ${tail}. That holds only for a meal on Saturday. A meal on another day is saved at that meal's time.`, true);
    await shot(p, `${name}_1`, 760);
    await p.evaluate(() => document.querySelectorAll("[data-n]").forEach((e) => e.remove()));
    const txt = await p.evaluate(() => document.querySelector("[data-leaf]").textContent);
    await ev(p, () => { const e = document.querySelector("[data-leaf]"); e.style.outline = ""; e.removeAttribute("data-leaf"); });
    await leaf(p, "^Ate it asks which meal", "blue", txt.replace(`, and saves it there ${was}.`, ", and saves it there."));
    await note(p, ".chef-ask", "<b>New.</b> The first sentence names no time. The rest of the line, the buttons and the record are as today.", false);
    await shot(p, `${name}_2`, 760);
    await p.context().close();
  }
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 600)); process.exit(1); });
