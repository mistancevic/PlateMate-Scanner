// Board B151 (Coach Milan, 18 November 2026, 19:51): Ate it turns blue while its calendar is open, so an action looks like a
// chosen choice. On the app as built in 0.3.159. Run as shotB150.cjs.
const ROOT = process.env.ROOT || "/home/claude/pm159";
const start = require(ROOT + "/tests/flows/plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs150";
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px", RED = "outline:3px solid #d13a3a;outline-offset:2px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`, RNOTE = NOTE.replace(/#2a72d9/g, "#d13a3a");
(async () => { const h = await start("3699"); try {
  const p = await h.open({});
  await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(600);
  await p.addStyleTag({ content: "nav, .chat-fab { display: none !important }" });
  const y = await p.evaluate(() => Math.max(0, document.querySelector(".plate-end").getBoundingClientRect().top + scrollY - 40));
  const shot = async (name) => { await p.waitForTimeout(300); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y, width: 390, height: Math.min(700, full - y) } }); console.log("shot", name); };
  await p.evaluate(({ RED, RNOTE }) => { const b = document.querySelector(".pe-ate"); b.style.cssText += ";" + RED; const n = document.createElement("div"); n.id = "an"; n.style.cssText = RNOTE; n.innerHTML = "<b>As it is in 0.3.159.</b> I tapped Ate it and its calendar opened. The button turned blue, the look of a chosen choice, with no tick. It reads as a status: eaten. Nothing is eaten yet. Plan it does the same."; document.querySelector(".plate-end .pcal").insertAdjacentElement("afterend", n); }, { RED, RNOTE });
  await shot("q_0");
  await p.evaluate(({ MARK, NOTE }) => { document.getElementById("an").remove(); const b = document.querySelector(".pe-ate"); b.style.outline = ""; b.classList.remove("on"); b.style.cssText += ";" + MARK; const n = document.createElement("div"); n.style.cssText = NOTE; n.innerHTML = "<b>New.</b> Ate it is an action, so it stays white, also while its calendar is open. The calendar under it shows what is open. A tick and the blue look stay for what is chosen: the marked meal."; document.querySelector(".plate-end .pcal").insertAdjacentElement("afterend", n); }, { MARK, NOTE });
  await shot("q_1");
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 500)); process.exit(1); });
