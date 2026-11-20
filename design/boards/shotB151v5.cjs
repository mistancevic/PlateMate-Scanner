// Board B151 v5 (Coach Milan 20 November 2026, 18:57 to 20:08: v4, then Now and Later groups, Plan it off the Plate, Log it under the
// meal question, Eaten on the meal line): a summary of the plate before What do you do with it?, three
// equal white actions, the meal set at the top, and a short question right under Ate it when no meal is set. Two new flows under
// today's: no meal set, and the meal set first with the pencil. The app on Sunday 15 November 2026, 18:00
// (tests/flows/plate157.cjs), one scratch build of 0.3.170 (/home/claude/work/b151, not committed). Today's row: shotB151v3.cjs.
const start = require("/home/claude/work/b151/tests/flows/plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs151v5";
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => { const h = await start("3693"); try {
  for (const flow of ["a", "b", "s"]) {
    const p = await h.open({});
    await p.evaluate(() => localStorage.removeItem("board-now")); await p.reload(); await p.waitForTimeout(1500);
    await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
    const note = (sel, html, marks = []) => p.evaluate(([sel, html, marks, MARK, NOTE]) => { for (const m of marks) document.querySelector(m).style.cssText += ";" + MARK; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; document.querySelector(sel).insertAdjacentElement("afterend", n); }, [sel, html, marks, MARK, NOTE]);
    const clean = () => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
    const at = (sel, off = 120) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + scrollY - off)); }, [sel, off]);
    const shot = async (name) => { await p.waitForTimeout(350); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
    const toast = () => p.evaluate(() => [...document.querySelectorAll("body *")].filter((e) => ["fixed", "sticky"].includes(getComputedStyle(e).position) && (e.textContent || "").trim().startsWith("Logged:")).forEach((e) => (e.style.display = "none")));
    if (flow === "a") {
      await p.evaluate(() => window.scrollTo(0, 0));
      await note(".meal-line", "<b>No change:</b> skyr, oats and a banana on the Plate, at 18:00. I have not set a meal: No meal selected.");
      await shot("a1"); await clean();
      await at(".plate-end", 230);
      await note(".plate-end .b151-groups", "<b>New:</b> a summary of the plate, then What do you do with it? in two groups. Now: Prepare it, Ate it. Later: Save it, to My recipes. Plan it is not on the Plate: you plan from My recipes or the Plan.", [".plate-end .b151-sum"]);
      await shot("a2"); await clean();
      await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(600);
      await at(".plate-end", 90);
      await note(".plate-end .b151-ask", "<b>New:</b> no meal is set, so the question opens right under Ate it, pointing at it. Dinner is marked, the meal the time suggests; a tap on another meal only changes the choice. Log it logs it.", [".plate-end .b151-ask"]);
      await shot("a3"); await clean();
      await p.locator(".plate-end .b151-log").click(); await p.waitForTimeout(1500);
    } else if (flow === "s") {
      await at(".plate-end", 230);
      await note(".plate-end .b151-groups", "<b>New:</b> Save it is under Later. I tap it.", [".plate-end .pe-save"]);
      await shot("s1"); await clean();
      await p.locator(".plate-end .pe-save").click(); await p.waitForTimeout(800);
      await at(".plate-end", 230);
      await note(".plate-end .plate-end-saved", "<b>New:</b> Save it stays a white button. The line under the buttons says it is in My recipes, with its name. From there: Change it first, Start cooking, and Plan it (its own ticket).", [".plate-end .plate-end-saved"]);
      await shot("s2"); await p.context().close(); continue;
    } else {
      await p.locator(".plan-line-pen").first().click(); await p.waitForTimeout(700);
      await p.locator(".meal-line-open .pcal-row").filter({ hasText: "Dinner" }).first().click(); await p.waitForTimeout(700);
      await p.evaluate(() => window.scrollTo(0, 0));
      await note(".meal-line", "<b>No change:</b> I know my foods and set the meal first: the pencil, then Dinner. The X closes it.");
      await shot("b1"); await clean();
      await p.locator(".plan-line-close").first().click(); await p.waitForTimeout(500);
      await at(".plate-end", 230);
      await note(".plate-end .b151-groups", "<b>New:</b> the summary says the meal: Dinner, today, 20:00. Ate it logs to it at once, with no question.", [".plate-end .b151-sum"]);
      await shot("b2"); await clean();
      await p.locator(".plate-end .pe-ate").click(); await p.waitForTimeout(1500);
    }
    const card = p.locator(".log-card-open").first(); await card.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await note(".log-card-open", "<b>No change:</b> logged as Dinner, and Today opens. I tap Change or delete to open it.");
    await shot(`${flow}4`); await clean();
    await p.locator(".meal-change").first().click(); await p.waitForTimeout(1000); await p.evaluate(() => window.scrollTo(0, 0)); await toast();
    await note(".pm-when", "<b>New:</b> the meal line says it: ✓ Eaten · Dinner, 18:00, the same words and tick as on Today. No tag, so a long name fits.", [".pm-when"]);
    await shot(`${flow}5`);
    await p.context().close();
  }
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 500)); process.exit(1); });
