// Board DT208 (Coach Milan 1 November 20:51 and 21:07): finishing the setup. Each step knows what the next part needs; a field
// says what is wrong when you leave it; Next goes on and says what is still missing; Me ticks the steps done; Today keeps a
// reminder until they are. Everything stays open. Drawn into 0.3.48; nothing in the repo changes.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3387";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8"));
seed.meals = []; seed.feedback = []; seed.items = [];
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const fresh = async (full = false) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-02T09:10:00"));
    await p.addInitScript(([s, full]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.removeItem("chefmealan-goal");
      if (full) { localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-11-01T08:00:00Z", source: "profile" })); localStorage.setItem("chefmealan-client-name", "Milan"); }
      localStorage.setItem("chefmealan-region", "munich");
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1990, weightKg: 68, kitchens: ["Balkan"], lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-11-01T09:00:00Z", consentBodyAt: "2026-11-01T09:00:00Z", declaredAt: "2026-11-01T09:00:00Z", aiConfirmedAt: "2026-11-01T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, [seed, full]);
    if (full) await p.addInitScript(() => { const x = JSON.parse(localStorage.getItem("chefmealan-personal")); if (!x.heightCm) { x.sex = "male"; x.birthYear = 1981; x.heightCm = 182; x.weightKg = 95; x.plan = Array(7).fill(0).map((_, i) => ({ work: i < 5, kind: i % 2 ? "rest" : "strength" })); localStorage.setItem("chefmealan-personal", JSON.stringify(x)); } });
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    p.go = async (path) => { await p.goto(U + "/today"); await p.waitForTimeout(1500); const nn = p.getByRole("button", { name: "Not now" }); if (await nn.count()) { await nn.first().click(); await p.waitForTimeout(600); }
      if (path === "/today") return;
      await require("/home/claude/platemate-scanner/tests/flows/me.cjs")(p);
      if (path === "/me/profile") { await p.locator(".me-rows .menu-row").filter({ hasText: /^Profile/ }).first().click(); await p.waitForTimeout(600); } };
    return p;
  };
  const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } for (const t of document.querySelectorAll(".toast")) t.style.display = "none"; window.scrollTo(0, 0); });
  const shot = async (p, name) => { await p.waitForTimeout(300); await flat(p); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot", name); };
  // the five steps and whether each is done, for this seed: Profile misses the height, no goal, Lifestyle set, no training week, a shop set
  const STEPS = [["Profile", false, "Height missing"], ["Goal", false, "Not set yet"], ["Lifestyle", true, ""], ["Training week", false, "Not set yet"], ["Where I shop and cook", true, ""]];
  // a. Today (version 3, Coach Milan 21:26: no extra block, no count; one line in the goal card that is always there)
  const LINE = (v) => v === "allset"
    ? `<button class="setup-line" style="display:flex;align-items:center;gap:6px;width:100%;min-height:44px;margin-top:6px;padding:0;border:0;background:none;font:inherit;font-size:14px;font-weight:700;color:#5b6b8a;text-align:left">✓ Profile and plan fully set</button>`
    : `<button class="setup-line" style="display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;min-height:44px;margin-top:6px;padding:0 10px;border:0;border-radius:10px;background:#fff1e6;font:inherit;font-size:14px;font-weight:800;color:#a4471f;text-align:left">To set: height, goal, training week <span aria-hidden="true">›</span></button>`;
  for (const v of ["now", "missing", "allset"]) {
    const p = await fresh(v === "allset"); await p.go("/today");
    await p.evaluate(({ v, mark, NOTE, html }) => {
      const strip = [...document.querySelectorAll(".strip-button")].find((x) => /Set your goal/.test(x.textContent));
      const card = document.querySelector(".plan");
      const note = (el, t) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; el.before(d); };
      if (v === "now") { if (strip) { strip.style.cssText += ";" + mark; note(card, "Now: after the first screen (Not now), a new person sees one strip, Set your goal. Nothing says the height is missing or the training week is not set."); } return; }
      if (strip) strip.remove();
      if (v === "allset") for (const b of card.querySelectorAll(".plan-row b")) b.textContent = b.textContent === "0" ? b.textContent : b.textContent;
      // version 5 (Coach Milan 21:39): one row with the line under My goal, not two; it takes the place of Today so far, against your goal
      const sub = [...card.querySelectorAll("*")].find((e) => e.children.length === 0 && /^Today so far, against your goal/.test(e.textContent.trim()));
      if (sub) { if (v === "allset") { sub.textContent = "✓ Profile and plan fully set. Target today:"; sub.style.cssText += ";outline:3px solid #2e7be8;outline-offset:3px;border-radius:6px"; }
        else { sub.insertAdjacentHTML("afterend", html); sub.remove(); const line = card.querySelector(".setup-line"); line.style.outline = "3px solid #2e7be8"; line.style.outlineOffset = "3px"; } }
      // version 6 (Coach Milan 21:46): the PD number says of PD 6.5, like the others; Target today is said once, above them
      for (const e of card.querySelectorAll("small")) if (/^PD today, target/.test(e.textContent.trim())) { e.textContent = e.textContent.replace(/^PD today, target\s*/, "of PD "); e.style.outline = "3px solid #2e7be8"; e.style.outlineOffset = "2px"; e.style.borderRadius = "4px"; }
      note(card, v === "missing" ? "New: no extra block. Right under My goal, one row: what is still to set, by name, no count, in place of the line Today so far, against your goal. A tap opens the first one, here the height in Profile. It replaces the strip Set your goal." : "New: when nothing is missing the row under the goal says Profile and plan fully set. Target today:, in place of Today so far, against your goal, and leads into the numbers. The PD number says of PD 5.3, like of 2,550 kcal, so today and target are said once. All five numbers, fat and carbs included, as on your phone. One row, nothing to close; if something goes missing later, the row names it again.");
    }, { v, mark, NOTE, html: v === "now" ? "" : LINE(v) });
    await shot(p, `r208${v === "now" ? "a" : v === "missing" ? "b" : "g"}`); await p.context().close();
  }
  // b. Me
  for (const v of ["now", "new"]) {
    const p = await fresh(); await p.go("/me");
    await p.evaluate(({ v, mark, NOTE, STEPS }) => {
      const list = document.querySelector(".me-rows");
      const note = (t) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; list.before(d); };
      list.style.cssText += ";" + mark;
      if (v === "now") { note("Now: the steps look the same whether they are done or not."); return; }
      for (const row of list.querySelectorAll(".menu-row")) {
        const name = row.querySelector("b")?.textContent.trim(); const s = STEPS.find((x) => x[0] === name); if (!s) continue;
        const ic = row.querySelector(".menu-icon"); const tag = document.createElement("span");
        tag.style.cssText = s[1] ? "font-size:13px;font-weight:900;color:#1f7a45;white-space:nowrap" : "font-size:13px;font-weight:900;color:#a4471f;white-space:nowrap";
        if (s[1]) continue;
        tag.textContent = "To do"; row.lastElementChild.before(tag);
        if (s[2]) row.querySelector("small").textContent = s[2];
      }
      const gc = document.querySelector(".plan"); const br = gc?.querySelector(".plan-top");
      br?.insertAdjacentHTML("afterend", `<button style="display:flex;align-items:center;justify-content:space-between;width:100%;min-height:44px;margin:6px 0;padding:0 10px;border:0;border-radius:10px;background:#fff1e6;font:inherit;font-size:14px;font-weight:800;color:#a4471f;outline:3px solid #2e7be8;outline-offset:3px">To set: height, goal, training week <span aria-hidden="true">›</span></button>`);
      note("New: the goal card on Me has the same line. Below, a step still to set says To do and what is missing; a step done shows its usual line, no tag, so the page stays calm.");
    }, { v, mark, NOTE, STEPS });
    await shot(p, `r208${v === "now" ? "c" : "d"}`); await p.context().close();
  }
  // c. Profile
  for (const v of ["now", "new"]) {
    const p = await fresh(); await p.go("/me/profile");
    await p.evaluate(({ v, mark, NOTE }) => {
      const h = [...document.querySelectorAll(".field")].find((f) => /^Height/.test(f.querySelector("span")?.textContent || ""));
      const next = document.querySelector(".next-step");
      const note = (el, t) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; el.before(d); };
      if (h) h.style.cssText += ";" + mark; if (next) next.style.cssText += ";" + mark;
      if (v === "now") { note(document.querySelector(".form"), "Now (0.3.48): the height is empty and nothing says so. Next: Goal goes on, and Goal cannot calculate without it."); return; }
      const msg = document.createElement("small"); msg.style.cssText = "display:block;color:#a4471f;font-weight:800;margin-top:4px"; msg.textContent = "Height: needed for your numbers."; h?.parentElement.after(msg);
      const line = document.createElement("div"); line.style.cssText = "display:flex;gap:8px;align-items:center;margin-top:6px;font-size:14px;font-weight:800;color:#a4471f";
      line.innerHTML = `<button style="display:flex;align-items:center;justify-content:space-between;width:100%;min-height:44px;padding:0 10px;border:0;border-radius:10px;background:#fff1e6;font:inherit;font-size:14px;font-weight:800;color:#a4471f;text-align:left">Still needed for your numbers: height <span aria-hidden="true">›</span></button>`;
      next?.appendChild(line);
      note(document.querySelector(".form"), "New: a field the next step needs says so when you leave it empty or wrong. Next: Goal still goes on; under it one line, the whole line a link to the field: Still needed for your numbers: height. Name and body fat stay optional.");
    }, { v, mark, NOTE });
    await shot(p, `r208${v === "now" ? "e" : "f"}`); await p.context().close();
  }
  await b.close();
})();
