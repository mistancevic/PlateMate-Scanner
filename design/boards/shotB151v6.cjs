// Board B151 v6 (Coach Milan 20 November 2026, 20:21 to 20:23): the pencil block sets the meal, the day and whether it is eaten
// (Planned, Eating now, Already eaten, pre-set from the day and time), and says what that does. The top line repeats it. The end
// of the plate keeps Prepare it (while not eaten) and Save it to My recipes. Sunday 15 November 2026, 18:00
// (tests/flows/plate157.cjs), one scratch build of 0.3.170 (/home/claude/work/b151, not committed). The scratch shows the status;
// the counting and planning behind it are not built: Today and the Plan are shown from seeded records. Today's row: shotB151v3.cjs.
const start = require("/home/claude/work/b151/tests/flows/plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs151v6";
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => { const h = await start("3692"); try {
  for (const flow of ["2", "3"]) {
    const p = await h.open({});
    await p.evaluate(() => localStorage.removeItem("board-now")); await p.reload(); await p.waitForTimeout(1500);
    await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
    const note = (sel, html, marks = []) => p.evaluate(([sel, html, marks, MARK, NOTE]) => { for (const m of marks) document.querySelector(m).style.cssText += ";" + MARK; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; document.querySelector(sel).insertAdjacentElement("afterend", n); }, [sel, html, marks, MARK, NOTE]);
    const clean = () => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
    const at = (sel, off = 120) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + scrollY - off)); }, [sel, off]);
    const shot = async (name) => { await p.waitForTimeout(350); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
    const top = () => p.evaluate(() => window.scrollTo(0, 0));
    if (flow === "2") {
      await top(); await note(".meal-line", "<b>No change:</b> skyr, oats and a banana on the Plate, at 18:00. No meal selected. I tap the pencil.");
      await shot("2a"); await clean();
      await p.locator(".plan-line-pen").first().click(); await p.waitForTimeout(700); await at(".meal-line", 90);
      await note(".b151-status", "<b>New:</b> the block says what the choice does. With no meal: nothing counts. I tap Dinner.", [".b151-status"]);
      await shot("2b"); await clean();
      await p.locator(".meal-line-open .pcal-row").filter({ hasText: "Dinner" }).first().click(); await p.waitForTimeout(700); await at(".meal-line", 90);
      await note(".b151-status", "<b>New:</b> Is it eaten? One row, pre-set from the day and time: Dinner is at 20:00, so Planned. The line says where it goes. I already ate, so I tap Already eaten.", [".b151-status"]);
      await shot("2c"); await clean();
      await p.locator(".b151-status .choice").filter({ hasText: "Already eaten" }).click(); await p.waitForTimeout(500); await at(".meal-line", 90);
      await note(".b151-status", "<b>New:</b> Already eaten: it counts in today's Dinner, and the day is calculated again, now and on every change of the plate. No other button logs it. I close with the X.", [".b151-status"]);
      await shot("2d"); await clean();
      await p.locator(".plan-line-close").first().click(); await p.waitForTimeout(500); await top();
      await note(".meal-line", "<b>New:</b> the top line says all of it: Dinner, the day and time, Eaten, counted.", [".meal-line"]);
      await shot("2e"); await clean();
      await at(".b151-end", 420);
      await note(".b151-end", "<b>New:</b> no question and no Ate it or Plan it here. It is eaten, so no Prepare it. The last step: Save it to My recipes.", [".b151-end"]);
      await shot("2f"); await clean();
      // Today, from a seeded record of the same plate (the counting is not built in the scratch)
      await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const at = new Date(); at.setHours(20, 0, 0, 0); const d = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
        s.feedback = [{ id: "b151", meal: { id: "b151m", title: "Skyr, Oats & Banana", items: s.items, portion: 448, savedAt: at.toISOString() }, status: "eaten", taste: "", notes: "", createdAt: at.toISOString(), slot: { date: d, slotId: "dinner", name: "Dinner", time: "20:00" } }]; s.items = []; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
      await p.goto(p.url().replace(/\/plate.*/, "/today")); await p.waitForTimeout(1500); await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
      await p.locator(".log-card-open").first().evaluate((e) => e.scrollIntoView({ block: "center" }));
      await note(".log-card-open", "<b>No change:</b> on Today the meal is in Dinner, Eaten, and the day's numbers hold it.");
      await shot("2g");
    } else {
      await p.locator(".plan-line-pen").first().click(); await p.waitForTimeout(700);
      await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Mon 16" }).first().click(); await p.waitForTimeout(500);
      await p.locator(".meal-line-open .pcal-row").filter({ hasText: "Lunch" }).first().click(); await p.waitForTimeout(700); await at(".meal-line", 90);
      await note(".b151-status", "<b>New:</b> the pencil, Monday, Lunch. A coming day, so Planned is set by itself and the other two cannot be chosen. The line says it goes into the plan.", [".b151-status"]);
      await shot("3a"); await clean();
      await p.locator(".plan-line-close").first().click(); await p.waitForTimeout(500); await top();
      await note(".meal-line", "<b>New:</b> the top line: Lunch, Monday, Planned.", [".meal-line"]);
      await shot("3b"); await clean();
      await at(".b151-end", 420);
      await note(".b151-end", "<b>New:</b> not eaten yet, so Prepare it is there, as today. Then Save it to My recipes, the last step.", [".b151-end"]);
      await shot("3c");
    }
    await p.context().close();
  }
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 500)); process.exit(1); });
