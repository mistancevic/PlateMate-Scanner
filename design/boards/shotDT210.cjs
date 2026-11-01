// Board DT210 (Coach Milan 1 November 23:28 to 23:34): the coach's clients, rethought. No more My day and My clients switch, no
// tabs that change meaning: a coach's bar has six tabs, Clients the sixth at the right with the count of what waits; Today,
// Plan, Plate and Recipes are always the coach's own; a client's page holds everything about that client, with small tabs
// inside it: Today, Week, Shared, Goal. Drawn into 0.3.49 (?coachdemo); nothing in the repo changes.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3387";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8")); seed.items = [];
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const fresh = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" });
    const p = await ctx.newPage();
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-region", "munich");
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.goto(U + "/today?coachdemo"); await p.waitForTimeout(1400);
    return p;
  };
  const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } for (const t of document.querySelectorAll(".toast")) t.style.display = "none"; window.scrollTo(0, 0); });
  const shot = async (p, name) => { await p.waitForTimeout(300); await p.evaluate(() => { for (const t of document.querySelectorAll(".toast")) t.style.display = "none"; window.scrollTo(0, 0); }); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, clip: { x: 0, y: 0, width: 390, height: 844 } }); console.log("shot", name); };
  const note = (p, t) => p.evaluate(({ t, NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; const m = document.querySelector("main") || document.body; m.prepend(d); }, { t, NOTE });
  const toClients = (p) => p.getByRole("radiogroup", { name: "Which view" }).getByRole("radio", { name: "My clients" }).click().then(() => p.waitForTimeout(800));
  // the Clients button of the My clients bar, with its count, to become the sixth tab
  const grab = async (p) => p.evaluate(() => [...document.querySelectorAll(".bottom-nav button")].find((x) => /Clients/.test(x.textContent)).outerHTML);
  // the coach's own bar (Today, Plan, Plate, Recipes, Explorer) with Clients as the sixth tab
  const six = (p, dayHtml, clientsHtml, active) => p.evaluate(({ dayHtml, clientsHtml, active, mark }) => {
    const n = document.querySelector(".bottom-nav"); n.innerHTML = dayHtml + clientsHtml;
    n.style.gridTemplateColumns = "repeat(6, minmax(0, 1fr))"; n.style.display = "grid";
    const bs = [...n.querySelectorAll("button")]; const act = bs.find((x) => /\bon\b|active/.test(x.className))?.className ?? bs[0].className; const idle = bs.find((x) => x.className !== act)?.className ?? "";
    for (const x of bs) { x.className = new RegExp("^\\s*" + active).test(x.textContent.trim()) || x.textContent.trim().startsWith(active) ? act : idle; x.style.minWidth = "0"; }
    const c = bs.find((x) => /Clients/.test(x.textContent)); c.style.cssText += ";" + mark;
  }, { dayHtml, clientsHtml, active, mark });
  // a, b: Today
  let p = await fresh(); const sw = p.getByRole("radiogroup", { name: "Which view" });
  const dayBar = await p.evaluate(() => document.querySelector(".bottom-nav").innerHTML);
  await p.evaluate((mark) => { const r = document.querySelector('[role="radiogroup"][aria-label="Which view"]'); if (r) r.style.cssText += ";" + mark; }, mark);
  await note(p, "Now: a coach switches between My day and My clients at the top of Today. In My clients, Plate becomes Clients and Today, Plan and Recipes show the picked client, so the same tab means two things.");
  await shot(p, "r210a");
  await toClients(p); const clientsBtn = await grab(p); await p.context().close();
  p = await fresh();
  await p.evaluate(() => { const r = document.querySelector('[role="radiogroup"][aria-label="Which view"]'); if (r) r.remove(); });
  await six(p, dayBar, clientsBtn, "Today");
  await note(p, "New: no switch. A coach's bar has six tabs: Today, Plan, Plate, Recipes, Explorer, and Clients at the right with the count of what waits for you. The first five are always your own; clients keep their five.");
  await shot(p, "r210b"); await p.context().close();
  // c, d: Clients
  p = await fresh(); await toClients(p); await p.locator(".bottom-nav button").filter({ hasText: "Clients" }).click(); await p.waitForTimeout(900);
  await note(p, "Now: Clients only in My clients; the bar's other tabs then show the picked client.");
  await shot(p, "r210c"); await p.context().close();
  p = await fresh(); await toClients(p); await p.locator(".bottom-nav button").filter({ hasText: "Clients" }).click(); await p.waitForTimeout(900);
  await p.evaluate(() => { const h = document.querySelector("header h1"); if (h) h.textContent = "Clients"; document.querySelector('[role="radiogroup"][aria-label="Which view"]')?.remove(); });
  await six(p, dayBar, clientsBtn, "Clients");
  await note(p, "New: Clients is a tab of its own, the same page as now: what waits for you, check-ins, to approve, the clients with the week's dots. Tap a client for their page.");
  await shot(p, "r210d"); await p.context().close();
  // e: now, the picked client's Today through the bar
  p = await fresh(); await toClients(p); await p.locator(".cw-row").first().click(); await p.waitForTimeout(600);
  await p.locator(".bottom-nav button").filter({ hasText: "Today" }).click(); await p.waitForTimeout(800);
  await note(p, "Now: the client's Today, Plan and Recipes are the bar's tabs, read-only, under the title My clients.");
  await shot(p, "r210e"); await p.context().close();
  // f: new, the client's page with tabs inside it
  p = await fresh(); await toClients(p); await p.locator(".bottom-nav button").filter({ hasText: "Clients" }).click(); await p.waitForTimeout(900);
  const row = p.locator(".client-row, .menu-row.client, [class*=client-row]").first();
  if (await row.count()) await row.click(); else await p.locator("main button").filter({ hasText: /Nina|Lena|Mia|Tom|Sara/ }).first().click();
  await p.waitForTimeout(900);
  await p.evaluate(({ mark }) => { const h = document.querySelector("header h1"); if (h) h.textContent = "Clients";
    const first = document.querySelector("main > *:not(script)"); const tabs = document.createElement("div"); tabs.setAttribute("role", "tablist"); tabs.style.cssText = mark + ";display:flex;gap:6px;margin:8px 0 12px;flex-wrap:wrap";
    tabs.innerHTML = ["Today", "Week", "Shared", "Goal"].map((t, i) => `<button role="tab" class="choice ${i === 1 ? "on" : ""}" aria-selected="${i === 1}" style="min-height:44px">${t}</button>`).join("");
    document.querySelector('[role="radiogroup"][aria-label="Which view"]')?.remove();
    const who = [...document.querySelectorAll("main *")].filter((x) => /Check-in:/.test(x.textContent) && x.children.length).sort((a, b) => a.textContent.length - b.textContent.length)[0];
    const card = who?.closest("section") || who?.closest(".card") || who; (card || first).after(tabs); }, { mark });
  await six(p, dayBar, clientsBtn, "Clients");
  await note(p, "New: a client's page holds everything about the client, with tabs inside it: Today and Week (read-only, with Suggest), Shared (the cards they sent you, each with Answer), Goal (numbers, weigh-ins, check-in day). Back goes to Clients.");
  await shot(p, "r210f"); await p.context().close();
  await b.close();
})();
