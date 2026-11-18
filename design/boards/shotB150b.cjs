// Board B150, second row (Coach Milan, 18 November 2026, 19:34): the time of a meal cannot be changed; only the meal times
// from Slots and times are offered. On the app as built in 0.3.159. Run as shotB150.cjs.
const ROOT = process.env.ROOT || "/home/claude/pm159";
const start = require(ROOT + "/tests/flows/plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs150";
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", RED = "outline:3px solid #d13a3a;outline-offset:2px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`, RNOTE = NOTE.replace(/#2a72d9/g, "#d13a3a");
(async () => { const h = await start("3698"); try {
  const p = await h.open({ foods: [] }); await h.toPhoto(p, true); await h.readIt(p);
  await p.locator(".plan-line-pen").click(); await p.waitForTimeout(500); await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Sat 14" }).click(); await p.waitForTimeout(400); await h.row(p, "Dinner", ".meal-line-open").click(); await p.waitForTimeout(900);
  await p.addStyleTag({ content: "nav, .chat-fab { display: none !important }" });
  console.log("LINE html:", await p.evaluate(() => document.querySelector(".meal-line-text").innerHTML.slice(0, 400)));
  const shot = async (name) => { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: 0, width: 390, height: 640 } }); console.log("shot", name); };
  await p.evaluate(({ RED, RNOTE }) => { const t = document.querySelector(".meal-line-text"); const d = t.lastElementChild; d.setAttribute("data-when", "1"); d.style.cssText += ";" + RED; const n = document.createElement("div"); n.id = "tn"; n.style.cssText = RNOTE; n.innerHTML = "<b>As it is in 0.3.159.</b> 20:00 is Dinner's time from Slots and times. I ate at another time and cannot say so: there is nothing to tap."; document.querySelector(".meal-line").insertAdjacentElement("afterend", n); }, { RED, RNOTE });
  await shot("n_4");
  await p.evaluate(({ MARK, NOTE }) => { document.getElementById("tn").remove(); const d = document.querySelector("[data-when]"); d.style.outline = ""; const txt = d.textContent.trim(); const i = txt.lastIndexOf(", "); const day = i > 0 ? txt.slice(0, i) : txt;
    d.innerHTML = day + ', <span style="display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 10px;margin-left:2px;border:1.5px solid #c9d6ee;border-radius:12px;background:#fff;font-weight:700;' + MARK + '">15:57 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>';
    const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> The time in the meal line is a field. It starts at the photo's time when the photo is from that day, otherwise at the meal's time. A tap opens the phone's clock, and the meal is logged at the time I set. The meal stays Dinner."; document.querySelector(".meal-line").insertAdjacentElement("afterend", n); }, { MARK, NOTE });
  await shot("n_5");
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 500)); process.exit(1); });
