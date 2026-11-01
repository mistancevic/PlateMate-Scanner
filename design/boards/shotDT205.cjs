// Boards DT205 (Profile), DT206 (the Plate) and DT207 (small fixes), Coach Milan 1 November 19:42 findings, 19:54 Go. Drawn
// from the two builds: now is 0.3.47 (main), new is 0.3.48 (branch dt203), the same seed.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs";
const seed = JSON.parse(fs.readFileSync("/home/claude/pm203/tests/flows/seed.json", "utf8"));
const base = { ...seed.foods[0], photo: undefined, photos: undefined, table: undefined, icon: undefined, barcode: undefined, places: [] };
const F = (id, name, calories, protein, fats, carbs) => ({ ...base, id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber: 0 });
const CH = F("ch", "Chicken breast, cooked", 165, 31, 3.6, 0), RI = F("ri", "Rice, cooked", 130, 2.7, 0.3, 28), SKYR = F("skyr", "Skyr", 63, 11, 0.2, 4);
seed.foods = [CH, RI, SKYR, ...seed.foods.filter((f) => !["ch", "ri", "skyr"].includes(f.id))]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: CH, grams: 170, locked: false }, { id: "b", food: RI, grams: 150, locked: false }]; seed.title = "Chicken and rice";
seed.photo = { image: base.photo || "", at: "2026-11-01T13:11:00" }; delete seed.photo;
const list1 = { n: 1, madeAt: "2026-10-27T10:00:00Z", from: "2026-10-27", to: "2026-10-29", meals: 3, lines: [{ key: "skyr|", name: "Skyr", brand: "", grams: 500, meals: 2 }], without: [], carried: [], carriedFrom: null, ticked: ["skyr|"], doneAt: "2026-10-29T18:00:00Z" };
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  for (const [tag, U] of [["now", "http://127.0.0.1:3396"], ["new", "http://127.0.0.1:3388"]]) {
    const fresh = async () => {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" });
      const p = await ctx.newPage();
      await p.clock.setFixedTime(new Date("2026-11-01T19:40:00"));
      await p.addInitScript(([s, l1]) => { if (localStorage.getItem("seeded")) return; s.plateAt = "2026-11-01T13:11:00"; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
        localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
        localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
        localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
        localStorage.setItem("chefmealan-shopping-lists", JSON.stringify({ lists: [l1], carry: null }));
        localStorage.setItem("seeded", "1"); }, [seed, list1]);
      await require("/home/claude/pm203/tests/flows/adult.cjs")(p);
      return p;
    };
    const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } for (const t of document.querySelectorAll(".toast")) t.style.display = "none"; window.scrollTo(0, 0); });
    const note = (p, sel, t, where = "before") => p.evaluate(({ sel, t, NOTE, where }) => { const el = document.querySelector(sel); if (!el) return; const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; el[where](d); }, { sel, t, NOTE, where });
    const markEl = (p, sel) => p.evaluate(({ sel, mark }) => { for (const e of document.querySelectorAll(sel)) e.style.cssText += ";" + mark; }, { sel, mark });
    const shot = async (p, name) => { await p.waitForTimeout(300); await flat(p); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot", name); };
    // DT205 Profile
    { const p = await fresh(); await p.goto(U + "/me/profile"); await p.waitForTimeout(1800);
      if (tag === "now") { await markEl(p, ".form > .pill-primary"); await markEl(p, ".menu-list .menu-row"); await note(p, ".form", "Now: Save sits at the end of the profile card, in the middle of the page; the health question and the way to Goal follow under it. The way to Goal is a row like any other."); }
      else { await markEl(p, ".saved-line"); await markEl(p, ".next-step .pill"); await note(p, ".form", "New: no Save. A choice is kept when you tap it, a typed number a moment after you stop typing. The line under the card says Kept as you go. The page ends on the main button Next: Goal; every step ends the same way."); }
      await shot(p, `r205${tag === "now" ? "a" : "b"}`); await p.context().close(); }
    // DT206 the Plate: a food for a plate from 13:11, at 19:40
    { const p = await fresh(); await p.goto(U + "/foods"); await p.waitForTimeout(1500);
      await p.locator(".row").filter({ hasText: "Skyr" }).first().getByRole("button", { name: "Add to meal" }).click(); await p.waitForTimeout(900);
      if (tag === "now") { await markEl(p, ".plate-card .row"); await note(p, ".plate-card", "Now, at 19:40: Skyr from Foods joins the plate started at 13:11, without a word. Tester's case: a photo plate from lunch, then a beer scanned in the evening."); }
      else { await markEl(p, ".plate-ask"); await note(p, ".plate-card", "New: a food for a plate started more than three hours ago, or on another day, asks first: Start a new plate, or Add to my plate. The same question the photo, a recipe and the plan already ask."); }
      await shot(p, `r206${tag === "now" ? "a" : "b"}`); await p.context().close(); }
    // DT207b Shopping lists
    { const p = await fresh(); await p.goto(U + "/plan"); await p.waitForTimeout(1500);
      await p.locator(".plan-shop").click(); await p.waitForTimeout(600);
      if (tag === "now") { await markEl(p, ".shop-earlier"); await note(p, ".shop-sheet .card-top", "Now: no list open, so the sheet opens on the form for list 2. The earlier list sits under it, out of sight on a phone. The button on Plan says Make a shopping list.", "after"); }
      else { await markEl(p, ".shop-earlier"); await markEl(p, ".shop-new"); await note(p, ".shop-sheet .card-top", "New: the button on Plan says Shopping lists. The earlier lists come first; New shopping list is its own button and opens the form.", "after"); }
      await p.waitForTimeout(300); await p.evaluate(() => { for (const t of document.querySelectorAll(".toast")) t.style.display = "none"; }); await p.locator(".shop-sheet").screenshot({ path: `${R}/r207${tag === "now" ? "a" : "b"}.png` }); console.log("shot sheet", tag); await p.context().close(); }
    // DT207d Travel mode
    { const p = await fresh(); await p.goto(U + "/me"); await p.waitForTimeout(1500);
      await p.locator(".travel-card").getByRole("button", { name: "Turn on" }).click(); await p.waitForTimeout(500);
      await markEl(p, ".travel-kitchens");
      await note(p, ".travel-kitchens", tag === "now" ? "Now: What do you have there? The three choices keep their text on one line and run off the side of the phone." : "New: Where do you stay? The choices wrap inside the phone.");
      await p.waitForTimeout(300); await flat(p); await p.waitForTimeout(200); await p.locator(".travel-setup").screenshot({ path: `${R}/r207${tag === "now" ? "c" : "d"}.png` }); console.log("shot travel", tag); await p.context().close(); }
  }
  await b.close();
})();
