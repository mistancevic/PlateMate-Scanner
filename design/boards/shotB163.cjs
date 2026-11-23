// Board B163 (Coach Milan 23 November 2026, 19:03 to 20:53): a food's name in the steps. Main on top (0.3.188), new below.
// One scratch build of main (/home/claude/work/b163, not committed); board-new turns the new names on. The recipe is Lazy
// Burek with Coach Milan's own packs; its steps were written by Chef Mealan, so they hold the names as cut then.
const ROOT = process.env.BOARD_ROOT || "/home/claude/work/b163";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process"); const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs163", PORT = "3712", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const food = (id, name, calories, protein, carbs, fats, fiber, extra = {}) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, ...extra });
const Q = food("q", "Körniger Frischkäse Tworog 2,5% Fett", 100, 12, 3, 4.5, 0, { barcode: "4056489000001" }), P = food("p", "Frischer Blätterteig", 400, 6, 36, 25, 1.5, { barcode: "4056489000002" }),
  S = food("s", "Alpen JodSalz", 0, 0, 0, 0, 0), E = food("e", "Eggs", 143, 12.6, 0.7, 9.5, 0, { source: "Reference table", refId: "egg" }), F = food("f", "Feta Leicht", 180, 17, 1, 12, 0, { barcode: "4056489000003" }),
  O = food("o", "Avocadoöl", 884, 0, 0, 100, 0), SE = food("se", "Sesam Ganzes Korn", 573, 18, 12, 50, 12);
const it = (id, f, g, part) => ({ id, food: f, grams: g, locked: false, ...(part ? { part } : {}) });
const I = { q: it("a", Q, 250, "Filling"), p: it("b", P, 375, "Base"), s: it("c", S, 3, "Filling"), e: it("d", E, 122, "Filling"), f: it("h", F, 150, "Filling"), o: it("i", O, 10), se: it("g", SE, 15) };
const tok = (x, n) => `[[i:${x.id}|${n}]]`;
const recipe = { id: "m-burek", title: "Lazy Burek", items: Object.values(I), makes: { n: 4, unit: "portions" }, portion: 231, savedAt: "2026-11-23T16:00:00Z",
  steps: [`Preheat your oven to 200 °C. Mix ${tok(I.q, "körniger frischkäse tworog 2")}, ${tok(I.s, "alpen jodsalz")}, ${tok(I.e, "eggs")}, and ${tok(I.f, "feta leicht")} together in a bowl.`, `Put baking paper and lay out ${tok(I.p, "frischer blätterteig")}.`, `Pour the filling into it, spray ${tok(I.o, "avocadoöl")}, and sprinkle with ${tok(I.se, "sesam ganzes korn")}.`, "Bake at 200 °C for 25 minutes until golden brown and crisp."] };
const MARK = "outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px";
const NOTE = `${MARK};background:#fff8d6;padding:8px 10px;margin:12px 0;font-size:14px;line-height:1.45;color:#172742;font-family:Nunito,system-ui,sans-serif;font-weight:400;text-align:left;position:relative;z-index:5`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const open = async (isNew) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 1, timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-11-23T21:00:00+01:00"));
    await p.addInitScript(([s, isNew]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "quick" }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      if (isNew) localStorage.setItem("board-new", "1"); localStorage.setItem("seeded", "1"); }, [{ ...seed, foods: [...seed.foods, Q, P, S, E, F, O, SE], meals: [recipe], feedback: [] }, isNew]);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/my-recipes/m-burek"); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.querySelectorAll(".chat-fab").forEach((e) => (e.style.display = "none")); const st = document.createElement("style"); st.textContent = "header, .topbar, .bottom-nav { position: static !important; } .bottom-nav { display: none !important; }"; document.head.appendChild(st); });
    return p;
  };
  const card = (t) => `[...document.querySelectorAll("section.card")].find((x) => (x.querySelector("b")?.textContent || "").trim() === "${t}")`;
  const shot = async (p, name, html) => {
    await p.evaluate(([html, MARK, NOTE]) => { const c = [...document.querySelectorAll("section.card")].find((x) => (x.querySelector("b")?.textContent || "").trim() === "Steps");
      const ol = c.querySelector("ol, .rq-steps, .steps") ?? c; ol.style.cssText += ";" + MARK;
      const n = document.createElement("div"); n.className = "board-note"; n.style.cssText = NOTE; n.innerHTML = html; ol.insertAdjacentElement("afterend", n); }, [html, MARK, NOTE]);
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const c = [...document.querySelectorAll("section.card")].find((x) => (x.querySelector("b")?.textContent || "").trim() === "Steps"); const a = c.getBoundingClientRect(), z = document.querySelector(".board-note").getBoundingClientRect(); return { y: a.top + scrollY - 10, h: z.bottom - a.top + 30 }; });
    await p.screenshot({ path: `${R}/${name}.png`, fullPage: true, clip: { x: 0, y: r.y, width: 390, height: r.h } }); console.log(name); };
  try {
    let p = await open(false);
    await shot(p, "1a", "Körniger Frischkäse Tworog 2,5% Fett reads <b>körniger frischkäse tworog 2</b>: cut at the comma of 2,5%. Every name in small letters: <b>frischer blätterteig</b>, though German writes its nouns with a capital.");
    await p.context().close();
    p = await open(true);
    await shot(p, "2a", "<b>New:</b> the names as on the packs: <b>Körniger Frischkäse Tworog 2,5% Fett</b>, <b>Frischer Blätterteig</b>. A basic food stays in small letters: <b>2 eggs</b>. The steps already written show it too: the name comes from the food.");
    await p.context().close();
  } catch (e) { console.log("ERR", e.message); } finally { await b.close(); server.kill(); }
})();
