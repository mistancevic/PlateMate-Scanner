// Board B151, redrawn 20 November 2026 (Coach Milan 15:52 to 15:57): two moments of Ate it. Choosing: Ate it stays white while
// its calendar is open; blue with a tick is for what is chosen. Eaten: the meal opened again from Today shows Ate it blue with a
// tick on its left. The app on Sunday 15 November 2026, 18:00 (tests/flows/plate157.cjs), one scratch build of 0.3.170
// (/home/claude/work/b151, not committed): the flag board-now shows the app as it is.
const start = require("/home/claude/work/b151/tests/flows/plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs151";
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left`;
(async () => { const h = await start("3697"); try {
  for (const now of [true, false]) {
    const tag = now ? "now" : "new";
    const p = await h.open({});
    await p.evaluate((now) => { if (now) localStorage.setItem("board-now", "1"); else localStorage.removeItem("board-now"); }, now);
    await p.reload(); await p.waitForTimeout(1500);
    await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
    const clip = async (name) => { await p.addStyleTag({ content: "nav.bottom-nav, .bottom-nav { display: none !important }" }); await p.waitForTimeout(300); const y = await p.evaluate(() => Math.max(0, document.querySelector(".plate-end").getBoundingClientRect().top + scrollY - 40)); const full = await p.evaluate(() => document.documentElement.scrollHeight); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y, width: 390, height: Math.min(700, full - y) } }); console.log(name); };
    const note = (sel, html, marks) => p.evaluate(([sel, html, marks, MARK, NOTE]) => { for (const m of marks) document.querySelector(m).style.cssText += ";" + MARK; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; document.querySelector(sel).insertAdjacentElement("afterend", n); }, [sel, html, marks, MARK, NOTE]);
    if (now) { await note(".plate-end .plate-end-btns", "<b>The step before:</b> the end of a plate with no meal set. I tap Ate it.", []); await clip("a0"); await p.evaluate(() => document.querySelector(".board-note").remove()); }
    await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(600);
    await note(".plate-end .pcal", now ? "<b>As it is:</b> Ate it's calendar is open and the button turned blue, with no tick. It reads as eaten, and nothing is eaten yet. Plan it does the same."
      : "<b>New:</b> Ate it stays white while you choose: it is an action. Blue with a tick is for what is chosen: Dinner. Plan it the same.", now ? [] : [".plate-end .pe-ate", ".plate-end .pcal-row.on"]);
    await clip(`${tag}_a`);
    await p.evaluate(() => document.querySelectorAll(".board-note").forEach((n) => n.remove()));
    await p.locator(".plate-end .pcal-row.on").click(); await p.waitForTimeout(1500);
    const card = p.locator(".log-card-open").first();
    await p.evaluate(() => document.querySelectorAll("style").forEach((st) => { if (st.textContent.includes(".bottom-nav { display: none")) st.remove(); }));
    if (now) { await card.evaluate((e) => { e.scrollIntoView({ block: "center" }); }); await note(".log-card-open", "<b>The step before:</b> Ate it took me to Today. The meal says Eaten. I tap Change or delete to open it.", []); await p.waitForTimeout(300); await p.screenshot({ path: `${R}/b0.png` }); console.log("b0"); await p.evaluate(() => document.querySelector(".board-note").remove()); }
    await p.evaluate(() => document.querySelectorAll("style").forEach((st) => { if (st.textContent.includes(".bottom-nav { display: none")) st.remove(); }));
    await p.locator(".meal-change").first().click(); await p.waitForTimeout(1000);
    await p.evaluate(() => document.querySelectorAll(".toast, [role=status]").forEach((t) => (t.style.display = "none")));
    await p.evaluate(() => window.scrollTo(0, 0));
    await note(".pm-when", now ? "<b>As it is:</b> the meal I ate, opened again. Nothing on it says it is eaten."
      : "<b>New:</b> Ate it, blue with a small tick on its left: this meal is eaten. A status, not a button: a tap on it does nothing.", now ? [] : [".pm-ate"]);
    await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${tag}_b.png` }); console.log(`${tag}_b`);
    await p.context().close();
  }
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 500)); process.exit(1); });
