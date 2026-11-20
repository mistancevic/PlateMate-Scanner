// Board B151 v3 (Coach Milan 20 November 2026, 16:08 to 16:13): the flow rethought. The meal is set in one place, the line at
// the top with its pencil; with nothing set it shows the clock's guess, and nothing counts until an action. At the end, no
// question and no chips: Save it, Plan it, Ate it act at once on that meal. Ate it takes you to Today, as now; the meal opened
// again says Ate it, blue with a tick. Two whole flows: today on top, new below, every screen. The app on Sunday 15 November
// 2026, 18:00 (tests/flows/plate157.cjs), one scratch build of 0.3.170 (/home/claude/work/b151, not committed); the flag
// board-now shows the app as it is.
const start = require("/home/claude/work/b151/tests/flows/plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs151v3";
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => { const h = await start("3695"); try {
  for (const now of [true, false]) {
    const T = now ? "c" : "n";
    const p = await h.open({});
    await p.evaluate((now) => { if (now) localStorage.setItem("board-now", "1"); else localStorage.removeItem("board-now"); }, now);
    await p.reload(); await p.waitForTimeout(1500);
    await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
    const note = (sel, html, marks = []) => p.evaluate(([sel, html, marks, MARK, NOTE]) => { for (const m of marks) document.querySelector(m).style.cssText += ";" + MARK; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; document.querySelector(sel).insertAdjacentElement("afterend", n); }, [sel, html, marks, MARK, NOTE]);
    const clean = () => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
    const at = (sel, off = 120) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + scrollY - off)); }, [sel, off]);
    const shot = async (name) => { await p.waitForTimeout(350); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
    // 1: the plate with foods, its top
    await p.evaluate(() => window.scrollTo(0, 0));
    await note(".meal-line", now ? "<b>The start:</b> skyr, oats and a banana on the Plate, at 18:00. Meal and day: No meal selected."
      : "<b>New:</b> with nothing set, the line shows the guess from the time: Dinner? Nothing counts yet: the guess is only a suggestion until Ate it or Plan it.", now ? [] : [".meal-line"]);
    await shot(`${T}1`); await clean();
    if (!now) { // the branch: the pencil, the edit mode as it is
      await p.locator(".plan-line-pen").first().click(); await p.waitForTimeout(700); await p.evaluate(() => window.scrollTo(0, 0));
      await note(".meal-line", "<b>No change, a branch from the pencil:</b> edit mode as today. The guess is not set yet, so No meal selected keeps its tick. A tap on Lunch would set Lunch; the X closes it.");
      await shot("n1b"); await clean();
      await p.locator(".plan-line-close").first().click(); await p.waitForTimeout(500);
    }
    // 2: the end of the plate
    await at(".plate-end", 260);
    await note(".plate-end .plate-end-btns", now ? "<b>As it is:</b> a question, What do you do with it?, and three chips that look alike. Ate it opens a second calendar for the meal."
      : "<b>New:</b> no question, no chips. Three buttons act at once on the meal at the top. Ate it is the main button: the meal is now.", now ? [] : [".plate-end"]);
    await shot(`${T}2`); await clean();
    if (now) { // 3: Ate it tapped, its calendar
      await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(600);
      await at(".plate-end", 120);
      await note(".plate-end .pcal", "<b>As it is:</b> Ate it turns blue with no tick, and a calendar opens to choose the meal again: a second place for what the top line sets. I tap Dinner.");
      await shot("c3"); await clean();
      await p.locator(".plate-end .pcal-row.on").click(); await p.waitForTimeout(1500);
    } else {
      await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(1500);
    }
    // 4: Today
    const card = p.locator(".log-card-open").first(); await card.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await note(".log-card-open", now ? "<b>Today:</b> the meal is logged as Dinner and says Eaten. I tap Change or delete to open it."
      : "<b>No change:</b> Ate it logged the plate to Dinner and took me to Today. I tap Change or delete to open it.");
    await shot(`${T}4`); await clean();
    // 5: the meal opened again
    await p.locator(".meal-change").first().click(); await p.waitForTimeout(1000); await p.evaluate(() => window.scrollTo(0, 0));
    await p.evaluate(() => [...document.querySelectorAll("body *")].filter((e) => ["fixed", "sticky"].includes(getComputedStyle(e).position) && (e.textContent || "").trim().startsWith("Logged:")).forEach((e) => (e.style.display = "none")));
    await note(".pm-when", now ? "<b>As it is:</b> the meal I ate, opened again. Nothing on it says it is eaten."
      : "<b>New:</b> Ate it, blue with a small tick on its left: this meal is eaten. A status, not a button.", now ? [] : [".pm-ate"]);
    await shot(`${T}5`);
    await p.context().close();
  }
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 500)); process.exit(1); });
