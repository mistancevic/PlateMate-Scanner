// Board B154 (Coach Milan 21 November 2026, 13:20 to 13:48): a plate logged with the pencil and then cooked is one meal, not two.
// The phone's clock: Sunday 15 November 2026, 13:50; Lunch is at 13:45, so a tap on Lunch logs the plate. B154.1 is the app as
// it is (0.3.171): the button says Prepare it again, the cook has no meal, Save asks which meal and Lunch holds the plate twice.
// B154.2 is new: Prepare it, the cook stays on Lunch, Save asks nothing, one record. B154.3: the same foods another time, from
// the eaten meal, as today. One scratch build of main (/home/claude/work/b151, not committed); the flag board-new turns the new
// behaviour on. The strip with the phone's time is stamped on by genB154.py.
const start = require("/home/claude/work/b151/tests/flows/plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs154";
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => { const h = await start("3688"); try {
  // B154.3 to B154.5: the other answers to How much did you eat?, on the new flow, branches from B154.2e
  for (const [id, ch] of (process.env.ONLY && process.env.ONLY !== "b" ? [] : [["3", "A portion"], ["4", "Later today"], ["5", "Not after all"]])) {
    const p = await h.open({ time: "2026-11-15T13:50:00+01:00" });
    await p.evaluate(() => localStorage.setItem("board-new", "1")); await p.reload(); await p.waitForTimeout(1500);
    await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
    const note = (sel, html, marks = []) => p.evaluate(([sel, html, marks, MARK, NOTE]) => { for (const m of marks) document.querySelector(m).style.cssText += ";" + MARK; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; document.querySelector(sel).insertAdjacentElement("afterend", n); }, [sel, html, marks, MARK, NOTE]);
    const clean = () => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
    const at = (sel, off = 120) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + scrollY - off)); }, [sel, off]);
    const shot = async (name) => { await p.waitForTimeout(350); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
    await p.locator(".plan-line-pen").first().click(); await p.waitForTimeout(600);
    await p.locator(".meal-line-open .pcal-row").filter({ hasText: "Lunch" }).first().click(); await p.waitForTimeout(600); await p.locator(".plan-line-close").first().click(); await p.waitForTimeout(400);
    await p.locator(".plate-end .prepare-it").click(); await p.waitForTimeout(1200);
    await p.locator(".way").first().click(); await p.getByRole("button", { name: "Make it this way ›" }).click(); await p.waitForTimeout(900);
    await p.getByRole("button", { name: /^Cooked\. Next: Eat/ }).click(); await p.waitForTimeout(800);
    const btn = p.getByRole("button", { name: ch, exact: true });
    await btn.evaluate((e) => e.id = "board-ch"); await p.locator("#board-ch").click(); await p.waitForTimeout(500);
    if (id === "3") { await p.getByRole("button", { name: "DaaM good" }).click(); await p.waitForTimeout(300); const mk = p.locator(".rq-makes input").first(); if (await mk.count()) await mk.fill("2"); await p.waitForTimeout(400); }
    await p.evaluate(() => window.scrollTo(0, 0));
    const lines = { "3": "<b>No change on the screen:</b> I choose A portion, and say it makes 2. I tap Save.", "4": "<b>No change on the screen:</b> I cooked it and eat it later today. I tap Save.", "5": "<b>No change on the screen:</b> I did not eat it after all. I tap Save." };
    await p.evaluate(([html, MARK, NOTE]) => { const b = document.getElementById("board-ch"); b.style.cssText += ";" + MARK; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; b.parentElement.insertAdjacentElement("afterend", n); }, [lines[id], MARK, NOTE]);
    await shot(`${id}a`); await clean();
    await p.locator(".eat-save").click(); await p.waitForTimeout(1200);
    await h.tab(p, "Today"); await p.waitForTimeout(600); await p.evaluate(() => window.scrollTo(0, 0));
    console.log(id, (await h.main(p)).slice(150, 800)); console.log((await h.st(p)).feedback.map((f) => [f.status, f.slot?.slotId, f.meal.title, Math.round(f.meal.items.reduce((n, i) => n + i.grams, 0)), f.left]));
    const find = { "3": "^Today's meals", "4": "^Or one from your batch", "5": "^Nothing planned or eaten yet today" }[id];
    await p.evaluate((re) => { const all = [...document.querySelectorAll("main *")].filter((x) => new RegExp(re).test((x.textContent || "").trim())); const e = all[all.length - 1]; if (e) (e.closest("section") || e.parentElement).id = "board-at"; }, find);
    const says = { "3": "<b>New:</b> Lunch holds the one portion I ate, 281 kcal, at 13:45. The recipe says it makes 2, as for any cook.", "4": "<b>New:</b> the plate is out of Lunch again: nothing is logged. The cooked meal waits here with I ate it, as for any cook kept for later.", "5": "<b>New:</b> the plate is out of Lunch again: nothing is logged, and nothing waits." }[id];
    if (id === "4") { await p.evaluate(() => { const o = document.getElementById("board-at"); if (o) o.removeAttribute("id"); }); const b = p.getByRole("button", { name: "I ate it" }).first(); if (await b.count()) await b.evaluate((e) => { (e.closest("section") || e.closest(".card") || e.parentElement.parentElement).id = "board-at"; }); }
    await p.waitForTimeout(4500);
    if (await p.locator("#board-at").count()) { await at("#board-at", id === "3" ? 330 : 200); await note("#board-at", says, ["#board-at"]); } else { await note("main", says); }
    await shot(`${id}b`); await clean();
    await p.context().close();
  }
  for (const flow of (process.env.ONLY === "b" ? [] : (process.env.ONLY || "1,2").split(","))) {
    const p = await h.open({ time: "2026-11-15T13:50:00+01:00" });
    await p.evaluate((f) => { if (f === "2") localStorage.setItem("board-new", "1"); else localStorage.removeItem("board-new"); }, flow); await p.reload(); await p.waitForTimeout(1500);
    await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
    const note = (sel, html, marks = []) => p.evaluate(([sel, html, marks, MARK, NOTE]) => { for (const m of marks) document.querySelector(m).style.cssText += ";" + MARK; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; document.querySelector(sel).insertAdjacentElement("afterend", n); }, [sel, html, marks, MARK, NOTE]);
    const clean = () => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
    const at = (sel, off = 120) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + scrollY - off)); }, [sel, off]);
    const shot = async (name) => { await p.waitForTimeout(350); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
    const top = () => p.evaluate(() => window.scrollTo(0, 0));
    const N = flow === "2";
    // a: Lunch tapped in the pencil
    await p.locator(".plan-line-pen").first().click(); await p.waitForTimeout(700);
    await p.locator(".meal-line-open .pcal-row").filter({ hasText: "Lunch" }).first().click(); await p.waitForTimeout(700); await at(".meal-line", 90);
    await note(".live-says", N ? "<b>No change:</b> it is 13:50 and Lunch is at 13:45, so the tap logs the plate in today's Lunch. I close with the X." : "It is 13:50 and Lunch is at 13:45, so the tap logs the plate in today's Lunch (B151). I close with the X.");
    await shot(`${flow}a`); await clean();
    await p.locator(".plan-line-close").first().click(); await p.waitForTimeout(500);
    // b: the end of the plate
    await at(".plate-end", 380);
    await note(".plate-end", N ? "<b>New:</b> the button says Prepare it. The plate is logged, and it was never cooked. I tap it." : "The button says Prepare it again, although this plate was never cooked. I tap it.", [".plate-end .prepare-it"]);
    await shot(`${flow}b`); await clean();
    await p.locator(".plate-end .prepare-it").click(); await p.waitForTimeout(1200); await top();
    // c: Prep
    await note(".phase-bar", N ? "<b>No change on the screen.</b> New behind it: the cook stays on today's Lunch. I pick a way and go on." : "The cook starts as a new cook. Behind the screen the plate is taken off Lunch: this cook has no meal. I pick a way and go on.");
    await shot(`${flow}c`); await clean();
    await p.locator(".way").first().click(); await p.waitForTimeout(300);
    await p.getByRole("button", { name: "Make it this way ›" }).click(); await p.waitForTimeout(900); await top();
    // d: Make
    await note(".phase-bar", N ? "<b>No change:</b> Make, with the steps to tick. I tap Cooked. Next: Eat." : "Make, with the steps to tick. I tap Cooked. Next: Eat.");
    await shot(`${flow}d`); await clean();
    await p.getByRole("button", { name: /^Cooked\. Next: Eat/ }).click(); await p.waitForTimeout(800);
    await p.getByRole("button", { name: "DaaM good" }).click(); await p.waitForTimeout(300);
    // e: Eat, before Save
    await at(".eat-save", 620);
    await note(".eat-save", N ? "<b>No change on the screen:</b> All of it, DaaM good. I tap Save." : "All of it, DaaM good. I tap Save.", [".eat-save"]);
    await shot(`${flow}e`); await clean();
    await p.locator(".eat-save").click(); await p.waitForTimeout(1200);
    if (!N) {
      // f: Save asks which meal
      await at(".eat-save", 200);
      await note(".eat-cal", "Save asks Which meal?, because this cook has no meal. Lunch says eaten: it is this same plate. A tap on Lunch asks nothing more and logs the cook as one more dish.", [".eat-cal"]);
      await shot("1f"); await clean();
      await p.locator(".eat-cal .pcal-row").filter({ hasText: "Lunch" }).first().click(); await p.waitForTimeout(1200);
    }
    await h.tab(p, "Today"); await p.waitForTimeout(600); await top();
    const last = N ? "2f" : "1g";
    await p.evaluate(() => { const e = [...document.querySelectorAll("main *")].find((x) => /^Today's meals/.test((x.textContent || "").trim()) && x.children.length < 6); if (e) e.id = "board-meals"; });
    const has = await p.locator("#board-meals").count();
    if (has) await at("#board-meals", 330);
    await note(has ? "#board-meals" : "main", N ? "<b>New:</b> Lunch holds the plate once, at 13:45, with the rating of the cook. The day counts 563 kcal. Save asked nothing." : "Lunch holds the same plate twice: 2 of 1 by the plan, and the day counts 1,125 kcal for 563 kcal eaten.", has ? ["#board-meals"] : []);
    await shot(last); await clean();
    if (N) {
      // B154.3: the same foods another time, from the eaten meal, as today
      const card = p.locator("button, a, [role=button]").filter({ hasText: /All in one/ }).last();
      await top(); console.log("TODAY", (await h.main(p)).slice(600, 1300));
    }
    await p.context().close();
  }
} catch (e) { console.log("ERR", e.message); } finally { await h.end(); } })();
