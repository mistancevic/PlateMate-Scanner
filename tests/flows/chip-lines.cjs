// B165 and B166 (0.3.192, board Stories293; Coach Milan, Go 24 November 2026, 00:13). B165: a food chip in a step flows like a
// word; one too long for the line goes on to the next line like text, open where it breaks, with the comma straight after it and
// 250 g kept with Körniger; a chip that fits moves down whole; lines of chips do not touch; the page stays 390 px wide; a tap on
// the food under the steps still takes the whole chip out; the publish sheet's steps do the same. B166: inside a recipe's PD
// card, the numbers' note, the fibre line and Per 100 kcal's lines read in the table's colours, never white on white.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = path.resolve(__dirname, "../..");
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats, fiber, extra = {}) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, ...extra });
const Q = food("q", "Körniger Frischkäse Tworog 2,5% Fett", 100, 12, 3, 4.5, 0, { barcode: "4056489000001" }), P = food("p", "Frischer Blätterteig", 400, 6, 36, 25, 1.5, { barcode: "4056489000002" }),
  E = food("e", "Eggs", 143, 12.6, 0.7, 9.5, 0, { source: "Reference table", refId: "egg" }), F = food("f", "Feta Leicht", 180, 17, 1, 12, 0, { barcode: "4056489000003" }),
  G = food("g", "Granola Crunchy Mix", 450, 9, 60, 18, null, { barcode: "4056489000004" });
const it = (id, f, g, part) => ({ id, food: f, grams: g, locked: false, ...(part ? { part } : {}) });
const I = { q: it("a", Q, 250, "Filling"), p: it("b", P, 375, "Base"), e: it("d", E, 122, "Filling"), f: it("h", F, 150, "Filling") };
const tok = (x, n) => `[[i:${x.id}|${n}]]`;
const burek = { id: "m-burek", title: "Lazy Burek", items: Object.values(I), makes: { n: 4, unit: "portions" }, portion: 224, savedAt: "2026-11-23T16:00:00Z",
  steps: [`Preheat your oven to 200 °C. Mix ${tok(I.q, "Körniger Frischkäse Tworog 2,5% Fett")}, ${tok(I.e, "eggs")} and ${tok(I.f, "Feta Leicht")} in a bowl.`, `Lay out ${tok(I.p, "Frischer Blätterteig")} on baking paper.`, "Pour the filling in and bake at 200 °C for 25 minutes."] };
const bowl = { id: "m-bowl", title: "Skyr bowl", items: [it("x", food("s", "Skyr", 63, 11, 4, 0.2, 0, { source: "Reference table" }), 250), it("y", G, 40)], makes: { n: 1, unit: "portions" }, portion: 290, savedAt: "2026-11-23T16:00:00Z", steps: ["Mix it."] };
const PORT = "3617", U = `http://127.0.0.1:${PORT}`;
const WHITE = "rgb(255, 255, 255)";
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  let fail = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fail++; };
  const errs = [];
  const open = async (url, coach = false) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: "Europe/Berlin" }); const page = await ctx.newPage(); page.on("pageerror", (e) => errs.push(e.message));
    await page.clock.setFixedTime(new Date("2026-11-24T08:00:00+01:00"));
    await page.addInitScript(({ coach, ...s }) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (coach) localStorage.setItem("chefmealan-coach", "1"); localStorage.setItem("seeded", "1"); }, { ...seed, foods: [...seed.foods, Q, P, E, F, G], meals: [burek, bowl], feedback: [], coach });
    await require("./adult.cjs")(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto(U + url); await page.waitForTimeout(1500);
    return page;
  };
  // the chips of step 1, each with its lines on screen, and the comma after the long one
  const look = (page, scope = "") => page.evaluate((scope) => {
    const f = document.querySelector(`${scope} .st-field`), fr = f.getBoundingClientRect();
    const chip = (id) => { const c = f.querySelector(`[data-item="${id}"]`); if (!c) return null; const rs = [...c.getClientRects()].map((r) => ({ top: r.top, bottom: r.bottom, left: r.left, right: r.right }));
      const k = c.querySelector(".st-keep"); return { long: c.classList.contains("st-long"), rs, keep: k ? { text: k.textContent, lines: k.getClientRects().length } : null }; };
    const q = f.querySelector('[data-item="a"]'), after = q?.nextSibling; let comma = null;
    if (after && after.nodeType === 3 && after.textContent.startsWith(",")) { const r = document.createRange(); r.setStart(after, 0); r.setEnd(after, 1); const x = r.getBoundingClientRect(); comma = { top: x.top, left: x.left }; }
    return { width: document.documentElement.scrollWidth, field: { left: fr.left, right: fr.right }, a: chip("a"), d: chip("d"), h: chip("h"), comma };
  }, scope);
  try {
    let page = await open("/my-recipes/m-burek");
    await page.getByRole("button", { name: "Edit recipe" }).click(); await page.waitForTimeout(800);
    let s = await look(page);
    ok(s.width <= 390, `B165 AC1: the page stays 390 px wide (${s.width})`);
    ok(s.a && s.a.long && s.a.rs.length >= 2 && s.a.rs.every((r) => r.right <= s.field.right + 1), `B165 AC1: the long chip goes on to the next line inside the field (${s.a?.rs.length} lines)`);
    ok(s.h && !s.h.long && s.h.rs.length === 1 && s.d && s.d.rs.length === 1, "B165 AC3: 150 g Feta Leicht and 2 eggs (L) stay whole, one line each");
    ok(s.comma && Math.abs(s.comma.top - s.a.rs[s.a.rs.length - 1].top) < 8 && s.comma.left >= s.a.rs[s.a.rs.length - 1].right - 2, "B165 AC6: the comma is right after 2,5% Fett, on the same line");
    ok(s.a.keep && s.a.keep.text === "250 g Körniger" && s.a.keep.lines === 1, "B165 AC7: 250 g stays on the same line as Körniger");
    const lines = [s.d, s.h].map((c) => c.rs[0]).sort((x, y) => x.top - y.top);
    ok(lines[1].top - lines[0].bottom >= 3, `B165 AC5: space between 2 eggs (L) and 150 g Feta Leicht on the line under it (${Math.round(lines[1].top - lines[0].bottom)} px)`);
    const fieldText = (await page.getByRole("textbox", { name: "Step 1" }).innerText()).replace(/\s+/g, " ");
    ok(/Mix 250 g Körniger Frischkäse Tworog 2,5% Fett, 2 eggs \(L\) and 150 g Feta Leicht in a bowl/.test(fieldText), "B165: the step reads as before: " + fieldText);
    await page.locator(".st-chip").filter({ hasText: "Körniger" }).click(); await page.waitForTimeout(500);
    ok(await page.locator('.st-field [data-item="a"]').count() === 0 && !/Körniger/.test(await page.getByRole("textbox", { name: "Step 1" }).innerText()), "B165 AC2: a tap on its food takes the whole long chip out of the step");
    await page.locator(".st-chip").filter({ hasText: "Körniger" }).click(); await page.waitForTimeout(500);
    s = await look(page);
    ok(s.a && s.width <= 390, "B165 AC2: put back, it lands in the step and the page stays 390 px wide");
    await page.context().close();
    // B165 AC4: the publish sheet's steps (a coach publishes, as in publish-names)
    page = await open("/my-recipes/m-burek", true);
    await page.locator(".rq-pub").getByRole("button", { name: /^(Publish|Continue)$/ }).click(); await page.waitForTimeout(1200);
    if (await page.locator(".publish-sheet .st-field").count()) {
      s = await look(page, ".publish-sheet");
      ok(s.a && s.a.long && s.a.rs.length >= 2 && s.width <= 390, "B165 AC4: in the publish sheet the long chip goes on to the next line too");
    } else ok(false, "B165 AC4: the publish sheet with its steps opens: " + (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 200));
    await page.context().close();
    // B166 on Lazy Burek's page. Changed by DT349 (0.3.193, design rule D14): the numbers open under the PD card, not inside it,
    // so they are read under the card
    page = await open("/my-recipes/m-burek");
    await page.locator(".rq-readout .letters-row").click(); await page.waitForTimeout(500);
    const colour = (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => getComputedStyle(e).color), sel);
    const note = await colour(".rq-readout + .nt .nt-note");
    ok(note.length === 1 && note[0] !== WHITE, `B166 AC1: the note under Total reads in grey, not white (${note[0]})`);
    await page.locator(".rq-readout + .nt .nt-more").click(); await page.waitForTimeout(400);
    const lines100 = await colour(".rq-readout + .nt .letters-lines small");
    ok(lines100.length >= 4 && lines100.every((c) => c !== WHITE), `B166 AC2: Per 100 kcal's ${lines100.length} lines read in the table's colours`);
    await page.context().close();
    // B166 AC3: a food with no fibre value
    page = await open("/my-recipes/m-bowl");
    await page.locator(".rq-readout .letters-row").click(); await page.waitForTimeout(500);
    const fib = await page.evaluate(() => [...document.querySelectorAll(".rq-readout + .nt .nt-fibre")].map((e) => [e.textContent, getComputedStyle(e).color]));
    ok(fib.length === 1 && fib[0][1] !== WHITE && /at least/.test(fib[0][0]), `B166 AC3: the fibre line reads in dark text: ${fib[0]?.[0]}`);
    await page.context().close();
    ok(errs.length === 0, "no page errors" + (errs.length ? ": " + errs.join("; ") : ""));
  } catch (e) { ok(false, "walkthrough error: " + e.message); }
  await b.close(); server.kill();
  console.log(fail ? `${fail} FAILED` : "all ok"); process.exit(fail ? 1 : 0);
})();
