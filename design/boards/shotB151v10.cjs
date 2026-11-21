// Board B151 v10 (Coach Milan 21 November 2026, 10:46 to 10:53): no question at all. The pencil block sets the day, the meal and
// its time, and the clock on the phone decides: a meal whose time is now or earlier counts (I am logging it), a meal still ahead
// is a plan (Today asks later if I ate it). One line under the meals says which. Eating a meal earlier than set: change its time
// in the field. An eaten plate keeps Prepare it, as Prepare it again. The strip on every screen says the time on the phone
// (stamped on by genB151v10.py): Sunday 15 November 2026, 18:00; Lunch was at 13:45, Dinner is at 20:00. One scratch build of
// 0.3.170 (/home/claude/work/b151, not committed). The scratch shows the lines; the counting and planning behind them are not
// built: Today is shown from a record put in by hand, and the dish Lunch already holds is put in by a flag. Today's row: shotB151v3.cjs.
const start = require("/home/claude/work/b151/tests/flows/plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs151v10";
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
const F = (id, name, kcal, protein) => ({ id, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", calories: kcal, protein, fats: 5, carbs: 10, fiber: null });
const held = { id: "h1", meal: { id: "hm", title: "Chicken, rice and greens", items: [{ id: "hi", food: F("hf", "Chicken, rice and greens", 160, 13), grams: 400, locked: false }], portion: 400, savedAt: "2026-11-15T17:20:00+01:00" }, status: "eaten", taste: "", notes: "", createdAt: "2026-11-15T17:20:00+01:00", slot: { date: "2026-11-15", slotId: "dinner", name: "Dinner", time: "20:00" } };
(async () => { const h = await start("3687"); try {
  for (const flow of (process.env.ONLY || "2,3,4,5,6,7").split(",")) {
    const p = await h.open({});
    await p.evaluate(() => { localStorage.removeItem("board-now"); localStorage.removeItem("board-back"); }); await p.reload(); await p.waitForTimeout(1500);
    await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
    const note = (sel, html, marks = []) => p.evaluate(([sel, html, marks, MARK, NOTE]) => { for (const m of marks) document.querySelector(m).style.cssText += ";" + MARK; const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; document.querySelector(sel).insertAdjacentElement("afterend", n); }, [sel, html, marks, MARK, NOTE]);
    const clean = () => p.evaluate(() => { document.querySelectorAll(".board-note").forEach((n) => n.remove()); document.querySelectorAll("[style*='outline: 3px']").forEach((e) => (e.style.outline = "")); });
    const at = (sel, off = 120) => p.evaluate(([sel, off]) => { const e = document.querySelector(sel); window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + scrollY - off)); }, [sel, off]);
    const shot = async (name) => { await p.waitForTimeout(350); await p.screenshot({ path: `${R}/${name}.png` }); console.log(name); };
    const top = () => p.evaluate(() => window.scrollTo(0, 0));
    const pen = async () => { await p.locator(".plan-line-pen").first().click(); await p.waitForTimeout(700); };
    const meal = async (n) => { await p.locator(".meal-line-open .pcal-row").filter({ hasText: n }).first().click(); await p.waitForTimeout(700); await at(".meal-line", 90); };
    const pick = async (n) => { await p.locator(".b151-status .choice").filter({ hasText: n }).click(); await p.waitForTimeout(500); await at(".meal-line", 90); };
    const close = async () => { await p.locator(".plan-line-close").first().click(); await p.waitForTimeout(500); };
    const day = async (n) => { await p.locator(".meal-line-open .pcal-day").filter({ hasText: n }).first().click(); await p.waitForTimeout(500); };
    if (flow === "2") {
      await top(); await note(".meal-line", "<b>No change:</b> skyr, oats and a banana on the Plate. It is 18:00. No meal selected. I tap the pencil.");
      await shot("2a"); await clean();
      await pen(); await at(".meal-line", 90);
      await note(".b151-status", "<b>New:</b> one line under the meals says what the choice does. With no meal: nothing counts. I tap Lunch.", [".b151-status"]);
      await shot("2b"); await clean();
      await meal("Lunch"); await note(".b151-status", "<b>New:</b> Lunch was at 13:45 and it is 18:00, so I am logging what I ate. No question: it counts in today's Lunch, at 13:45, and the day is calculated again. No other button logs it. I close with the X.", [".b151-status"]);
      await shot("2c"); await clean();
      await close(); await top();
      await note(".b151-rec", "<b>New:</b> the top line says Lunch, the day and time, Eaten. Under it the app's own line for a recorded plate: my changes here go there too.", [".meal-line", ".b151-rec"]);
      await shot("2d"); await clean();
      await at(".b151-end", 420);
      await note(".b151-end", "<b>New:</b> no question, no Ate it, no Plan it. It is eaten, and I may want to make it again: Prepare it again. The last step: Save it to My recipes.", [".b151-end"]);
      await shot("2e"); await clean();
      await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const t = new Date(); t.setHours(13, 45, 0, 0); const d = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
        s.feedback = [{ id: "b151", meal: { id: "b151m", title: "Skyr, Oats & Banana", items: s.items, portion: 448, savedAt: t.toISOString() }, status: "eaten", taste: "", notes: "", createdAt: t.toISOString(), slot: { date: d, slotId: "lunch", name: "Lunch", time: "13:45" } }]; s.items = []; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
      await p.goto(p.url().replace(/\/plate.*/, "/today")); await p.waitForTimeout(1500); await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
      await p.locator(".log-card-open").first().evaluate((e) => e.scrollIntoView({ block: "center" }));
      await note(".log-card-open", "<b>No change:</b> on Today the meal is in Lunch, Eaten, and the day's numbers hold it.");
      await shot("2f");
    } else if (flow === "3") {
      await pen(); await meal("Dinner"); await note(".b151-status", "<b>New:</b> Dinner is at 20:00 and it is 18:00: still ahead, so it is a plan. No question: it goes into today's Dinner in the plan, nothing counts yet, and Today will ask if I ate it.", [".b151-status"]);
      await shot("3a"); await clean();
      await close(); await top();
      await note(".meal-line", "<b>New:</b> the top line: Dinner, Planned. Nothing counts, so no Recorded line.", [".meal-line"]);
      await shot("3b"); await clean();
      await at(".b151-end", 420);
      await note(".b151-end", "<b>New:</b> Prepare it, as today. Then Save it to My recipes.", [".b151-end"]);
      await shot("3c");
    } else if (flow === "4") {
      await pen(); await meal("Dinner");
      await p.locator(".meal-line-open .pcal-row.on input[type=time]").fill("18:00"); await p.waitForTimeout(700); await at(".meal-line", 90);
      await note(".b151-status", "<b>New, from B151.3a:</b> I eat Dinner now, earlier than set. I change its time in the field to 18:00. It is no longer ahead, so it counts in today's Dinner.", [".b151-status", ".meal-line-open .pcal-row.on input[type=time]"]);
      await shot("4a"); await clean();
      await close(); await top();
      await note(".b151-rec", "<b>New:</b> the top line: Dinner, 18:00, Eaten, and the Recorded line.", [".meal-line", ".b151-rec"]);
      await shot("4b");
    } else if (flow === "5") {
      await pen(); await day("Mon 16"); await meal("Lunch");
      await note(".b151-status", "<b>New:</b> Monday, Lunch. A coming day is a plan: it goes into Monday's Lunch.", [".b151-status"]);
      await shot("5a"); await clean();
      await close(); await top();
      await note(".meal-line", "<b>New:</b> the top line: Lunch, Monday, Planned.", [".meal-line"]);
      await shot("5b"); await clean();
      await at(".b151-end", 420);
      await note(".b151-end", "<b>New:</b> Prepare it, as today. Then Save it to My recipes.", [".b151-end"]);
      await shot("5c");
    } else if (flow === "6") {
      await pen(); await day("Sat 14"); await meal("Dinner");
      await note(".b151-status", "<b>New:</b> Saturday, Dinner. A past day is logging: it counts in Saturday's Dinner.", [".b151-status"]);
      await shot("6a"); await clean();
      await close(); await top();
      await note(".b151-rec", "<b>New:</b> the top line: Dinner, Saturday, Eaten, and the Recorded line.", [".meal-line", ".b151-rec"]);
      await shot("6b");
    } else {
      await p.evaluate(() => localStorage.setItem("board-held", "Chicken, rice and greens"));
      await pen(); await meal("Lunch");
      await note(".b151-status", "<b>A branch from B151.2c:</b> Lunch already holds a dish. The block says so and asks, in the app's own words: Replace it, or Add a dish.", [".b151-held"]);
      await shot("7b"); await clean();
      await p.evaluate(() => { localStorage.removeItem("board-held"); localStorage.setItem("board-back", "1"); });
      await p.locator(".meal-line-open .pcal-looking").click(); await p.waitForTimeout(600); await at(".meal-line", 90);
      await note(".b151-status", "<b>A branch from B151.2c:</b> taking it back. A tap on No meal selected takes the plate out of Lunch again, and the line says so.", [".b151-status"]);
      await shot("7a");
    }
    await p.context().close();
  }
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 500)); process.exit(1); });
