// Board B151 v7 (Coach Milan 20 November 2026, 20:37 to 20:50): the pencil block asks When do you eat it? with Already ate it,
// Now, Later. Today a meal starts on Later, so nothing counts without a tap that says so; a past day is Already ate it, a coming
// day Later. Under the row a line says what it does. Once it counts, the app's Recorded line stands under the top line. Branches:
// taking it back, and a meal that already holds something. Sunday 15 November 2026, 18:00 (tests/flows/plate157.cjs), one scratch
// build of 0.3.170 (/home/claude/work/b151, not committed). The scratch shows the row and its lines; the counting and planning
// behind it are not built: Today is shown from a record put in by hand, and the dish Dinner already holds (5b) is put in by a flag. Today's row: shotB151v3.cjs.
const start = require("/home/claude/work/b151/tests/flows/plate157.cjs");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs151v7";
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
const F = (id, name, kcal, protein) => ({ id, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", calories: kcal, protein, fats: 5, carbs: 10, fiber: null });
const held = { id: "h1", meal: { id: "hm", title: "Chicken, rice and greens", items: [{ id: "hi", food: F("hf", "Chicken, rice and greens", 160, 13), grams: 400, locked: false }], portion: 400, savedAt: "2026-11-15T17:20:00+01:00" }, status: "eaten", taste: "", notes: "", createdAt: "2026-11-15T17:20:00+01:00", slot: { date: "2026-11-15", slotId: "dinner", name: "Dinner", time: "20:00" } };
(async () => { const h = await start("3691"); try {
  for (const flow of (process.env.ONLY || "2,3,4,5").split(",")) {
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
    const dinnerLater = "<b>New:</b> When do you eat it? Three answers. Today a meal starts on Later: it goes into the plan and nothing counts. Nothing ever counts without a tap that says so.";
    if (flow === "2") {
      await top(); await note(".meal-line", "<b>No change:</b> skyr, oats and a banana on the Plate, at 18:00. No meal selected. I tap the pencil.");
      await shot("2a"); await clean();
      await pen(); await at(".meal-line", 90);
      await note(".b151-status", "<b>New:</b> the block says what the choice does. With no meal: nothing counts. I tap Dinner.", [".b151-status"]);
      await shot("2b"); await clean();
      await meal("Dinner"); await note(".b151-status", dinnerLater + " I already ate, so I tap Already ate it.", [".b151-status"]);
      await shot("2c"); await clean();
      await pick("Already ate it"); await note(".b151-status", "<b>New:</b> Already ate it: it counts in today's Dinner, at the meal's time (the field next to Dinner changes it), and the day is calculated again. No other button logs it. I close with the X.", [".b151-status"]);
      await shot("2d"); await clean();
      await close(); await top();
      await note(".b151-rec", "<b>New:</b> the top line says Dinner, the day and time, Eaten. Under it the app's own line for a recorded plate: my changes here go there too.", [".meal-line", ".b151-rec"]);
      await shot("2e"); await clean();
      await at(".b151-end", 420);
      await note(".b151-end", "<b>New:</b> no question, no Ate it, no Plan it. It is eaten, so no Prepare it. The last step: Save it to My recipes.", [".b151-end"]);
      await shot("2f"); await clean();
      await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); const t = new Date(); t.setHours(20, 0, 0, 0); const d = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
        s.feedback = [{ id: "b151", meal: { id: "b151m", title: "Skyr, Oats & Banana", items: s.items, portion: 448, savedAt: t.toISOString() }, status: "eaten", taste: "", notes: "", createdAt: t.toISOString(), slot: { date: d, slotId: "dinner", name: "Dinner", time: "20:00" } }]; s.items = []; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); });
      await p.goto(p.url().replace(/\/plate.*/, "/today")); await p.waitForTimeout(1500); await p.addStyleTag({ content: ".chat-fab { display: none !important }" });
      await p.locator(".log-card-open").first().evaluate((e) => e.scrollIntoView({ block: "center" }));
      await note(".log-card-open", "<b>No change:</b> on Today the meal is in Dinner, Eaten, and the day's numbers hold it.");
      await shot("2g");
    } else if (flow === "3") {
      await pen(); await meal("Dinner"); await note(".b151-status", dinnerLater + " I am about to eat, so I tap Now.", [".b151-status"]);
      await shot("3a"); await clean();
      await pick("Now"); await note(".b151-status", "<b>New:</b> Now: it counts in today's Dinner from this moment. If I don't eat it after all, one tap on Later takes it out again.", [".b151-status"]);
      await shot("3b"); await clean();
      await close(); await top();
      await note(".b151-rec", "<b>New:</b> the top line: Dinner, Now. It counts, so the Recorded line is here too.", [".meal-line", ".b151-rec"]);
      await shot("3c"); await clean();
      await at(".b151-end", 420);
      await note(".b151-end", "<b>New:</b> Now keeps Prepare it, in case I still cook it. Then Save it to My recipes.", [".b151-end"]);
      await shot("3d");
    } else if (flow === "4") {
      await pen(); await p.locator(".meal-line-open .pcal-day").filter({ hasText: "Mon 16" }).first().click(); await p.waitForTimeout(500);
      await meal("Lunch"); await note(".b151-status", "<b>New:</b> the pencil, Monday, Lunch. A coming day: Later is set and the other two cannot be chosen. It goes into Monday's Lunch in the plan.", [".b151-status"]);
      await shot("4a"); await clean();
      await close(); await top();
      await note(".meal-line", "<b>New:</b> the top line: Lunch, Monday, Planned. Nothing counts, so no Recorded line.", [".meal-line"]);
      await shot("4b"); await clean();
      await at(".b151-end", 420);
      await note(".b151-end", "<b>New:</b> not eaten, so Prepare it is there, as today. Then Save it to My recipes.", [".b151-end"]);
      await shot("4c");
    } else {
      await p.evaluate(() => localStorage.setItem("board-held", "Chicken, rice and greens"));
      await pen(); await meal("Dinner"); await pick("Already ate it");
      await note(".b151-status", "<b>A branch from B151.2d:</b> Dinner already holds a dish. The block says so and asks, in the app's own words: Replace it, or Add a dish.", [".b151-held"]);
      await shot("5b"); await clean();
      await p.evaluate(() => { localStorage.removeItem("board-held"); localStorage.setItem("board-back", "1"); }); await pick("Later");
      await note(".b151-status", "<b>A branch from B151.2d:</b> taking it back. A tap on Later takes the plate out of today's Dinner again, and the line says so.", [".b151-status"]);
      await shot("5a");
    }
    await p.context().close();
  }
} finally { h.kill(); await h.b.close(); } })().catch((e) => { console.log("ERR", e.message.slice(0, 500)); process.exit(1); });
