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
  const fresh = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-02T09:10:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.removeItem("chefmealan-goal");
      localStorage.setItem("chefmealan-region", "munich");
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "female", birthYear: 1990, weightKg: 68, kitchens: ["Balkan"], lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-11-01T09:00:00Z", consentBodyAt: "2026-11-01T09:00:00Z", declaredAt: "2026-11-01T09:00:00Z", aiConfirmedAt: "2026-11-01T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
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
  // a. Today
  for (const v of ["now", "new"]) {
    const p = await fresh(); await p.go("/today");
    await p.evaluate(({ v, mark, NOTE, STEPS }) => {
      const strip = [...document.querySelectorAll(".strip-button")].find((x) => /Set your goal/.test(x.textContent));
      const note = (el, t) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; el.before(d); };
      if (v === "now") { if (strip) { strip.style.cssText += ";" + mark; note(strip, "Now: after the first screen (Not now), a new person sees one strip, Set your goal. Nothing says the height is missing or the training week is not set, and the rest of the app is open."); } return; }
      const done = STEPS.filter((s) => s[1]).length;
      const card = document.createElement("section"); card.className = "card"; card.style.cssText = mark + ";padding:14px 16px;margin:10px 0";
      card.innerHTML = `<b style="display:block;font-size:17px">Finish setting up: ${done} of ${STEPS.length} done</b>
        <small class="muted" style="display:block;margin:4px 0 8px">Everything works already. These make your numbers and your plan yours.</small>
        ${STEPS.map(([n, ok, why]) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--line)"><span style="width:22px;height:22px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;${ok ? "background:#1f9d55;color:#fff" : "border:2px solid #9aa7bd;color:#9aa7bd"}">${ok ? "✓" : ""}</span><span style="flex:1"><b style="font-size:15px">${n}</b>${why ? `<small style="display:block;color:#5b6b8a">${why}</small>` : ""}</span></div>`).join("")}
        <button class="pill pill-primary pill-wide" style="margin-top:10px;min-height:48px">Continue: Profile, the height</button>`;
      if (strip) { strip.replaceWith(card); } else document.querySelector("main").prepend(card);
      note(card, "New: one card on Today until the steps are done: how many are done, each step with a tick or what is missing, and one button to the next one. It goes away by itself when all five are done. Coach and Google Calendar are optional and not in the list.");
    }, { v, mark, NOTE, STEPS });
    await shot(p, `r208${v === "now" ? "a" : "b"}`); await p.context().close();
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
        tag.textContent = s[1] ? "✓ Done" : "To do"; row.lastElementChild.before(tag);
        if (!s[1] && s[2]) row.querySelector("small").textContent = s[2];
      }
      note("New: each step says Done or To do; a step to do says what is missing. Coach, Google Calendar and Your summary say nothing: they are optional.");
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
      line.innerHTML = `Still needed for your numbers: height. <button class="link" style="min-height:44px">Go to the height</button>`;
      next?.appendChild(line);
      note(document.querySelector(".form"), "New: a field the next step needs says so when you leave it empty or wrong. Next: Goal still goes on; under it, what is still missing, and a link to that field. Name and body fat stay optional.");
    }, { v, mark, NOTE });
    await shot(p, `r208${v === "now" ? "e" : "f"}`); await p.context().close();
  }
  await b.close();
})();
