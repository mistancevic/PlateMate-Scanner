// Board DT87 to DT91 (Milan 24 October 11:37 to 11:49): making a dinner with Chef Mealan, from an empty Plate to the saved
// recipe. Now: main 0.2.86, untouched. New: the same pages with the change drawn in the browser. Nothing in the repo changes.
// No AI key in this workspace: Chef Mealan's two answers are stand-ins written to the prompts in server.ts.
const ROOT = process.env.APP_DIR || "/home/claude/mistancevic/platemate-scanner";
const { chromium } = require(ROOT + "/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = process.env.BOARDS_SHOTS || "/home/claude/boards/rs";
fs.mkdirSync(R, { recursive: true });
const PORT = "3294", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
seed.items = []; seed.meals = []; seed.feedback = [];
seed.goals = { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 };
const MEAL = JSON.parse(require("fs").readFileSync("/home/claude/walk/meal87.json", "utf8"));
const STEPS = { steps: [
  "Bring a large pot of salted water to the boil and cook {5} for 11 minutes, until al dente.",
  "Meanwhile, warm {4} in a pan over medium heat, add {2} and simmer for 5 minutes.",
  "Slice {1}, stir it into the sauce and heat it through, 3 to 4 minutes. Season with salt and pepper.",
  "Drain the penne, toss it in the pan and serve with {3} over the top.",
] };

(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch();
  const fresh = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-10-24T18:30:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian", "Mediterranean"], equipment: ["oven", "stovetop", "microwave"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, seed);
    await require(ROOT + "/tests/flows/adult.cjs")(p);
    await p.route("**/api/meal", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MEAL) }));
    await p.route("**/api/steps", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STEPS) }));
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    return p;
  };
  // whole screens: the header and the bar stay in the page's flow, toasts and the round chef button go
  const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue;
    if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (p, name) => { await p.waitForTimeout(350); await flat(p); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot", name); };
  // drawing helpers: change words in place, add a note block after an element
  const draw = (p, fn, arg) => p.evaluate(fn, arg);
  const swap = (p, pairs) => p.evaluate((pairs) => { const w = document.createTreeWalker(document.querySelector("main") || document.body, NodeFilter.SHOW_TEXT);
    const ns = []; while (w.nextNode()) ns.push(w.currentNode);
    for (const n of ns) for (const [a, bb] of pairs) if (n.data.includes(a)) n.data = n.data.split(a).join(bb); }, pairs);
  const setText = (p, sel, re, txt, css = "") => p.evaluate(({ sel, re, txt, css }) => { const r = new RegExp(re); let n = 0; for (const el of document.querySelectorAll(sel)) if (r.test(el.textContent)) { el.textContent = el.textContent.replace(r, txt); if (css) el.style.cssText += ";" + css; n++; } return n; }, { sel, re, txt, css });
  const mark = `outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px`;
  const note = (p, sel, html, where = "after") => p.evaluate(({ sel, html, where, mark }) => { const el = typeof sel === "string" ? document.querySelector(sel) : null; if (!el) return false;
    const d = document.createElement("div"); d.innerHTML = html; d.style.cssText = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742"; el[where](d); return true; }, { sel, html, where, mark });
  const outline = (p, sel) => p.evaluate(({ sel, mark }) => { for (const el of document.querySelectorAll(sel)) el.style.cssText += ";" + mark; }, { sel, mark });
  const byText = (p, sel, re, css) => p.evaluate(({ sel, re, css }) => { const r = new RegExp(re); for (const el of document.querySelectorAll(sel)) if (r.test(el.textContent)) el.style.cssText += ";" + css; }, { sel, re, css });

  // the steps of the flow, each from a fresh start
  const plate = async (p) => { await p.goto(U + "/plate"); await p.waitForTimeout(1500); };
  const addChicken = async (p) => { await p.locator("section, div").filter({ hasText: /^Chicken breast, cooked/ }).getByRole("button", { name: "Add" }).last().click().catch(async () => {
    await p.locator("text=Chicken breast, cooked").first().locator("xpath=ancestor::*[.//button[normalize-space()='Add']][1]").getByRole("button", { name: "Add" }).click(); }); await p.waitForTimeout(900); };
  const ideas = async (p) => { await p.getByRole("button", { name: "Make it a dinner" }).click(); await p.waitForTimeout(1500); };
  const putOn = async (p) => { await p.locator(".mm-card").first().getByRole("button", { name: "Put it on the plate" }).click(); await p.waitForTimeout(1000); };
  const makeIt = async (p) => { await p.getByRole("button", { name: "Make it", exact: true }).click(); await p.waitForTimeout(1200); };
  const toMade = async (p) => { await p.locator(".way").first().click(); await p.waitForTimeout(300); await p.getByRole("button", { name: "I'm making it this way" }).click(); await p.waitForTimeout(900); };
  const toHow = async (p) => { await p.getByRole("button", { name: "On to How was it?" }).click(); await p.waitForTimeout(800); await p.getByRole("button", { name: "DaaM good" }).click(); await p.waitForTimeout(400); };
  const save = async (p) => { await p.getByRole("button", { name: "Save", exact: true }).click(); await p.waitForTimeout(1300); };
  const keepSteps = async (p) => { await p.getByRole("button", { name: "Draft the steps with Chef Mealan" }).first().click(); await p.waitForTimeout(1300); await p.getByRole("button", { name: "Keep these steps" }).click(); await p.waitForTimeout(900); };
  const run = async (upTo) => { const p = await fresh(); await plate(p); const st = ["chicken", "ideas", "plate", "make", "made", "how", "page", "steps"];
    const fns = [addChicken, ideas, putOn, makeIt, toMade, toHow, save, keepSteps]; for (let k = 0; k < st.length && k <= st.indexOf(upTo); k++) await fns[k](p); return p; };

  try {
    // ---- Built, 0.2.87 ----
    const fitTap = async (p) => { await p.getByRole("button", { name: "Fit to my target" }).click(); await p.waitForTimeout(1500); };
    let p = await fresh(); await plate(p); await shot(p, "dt92BuiltEmpty");
    await addChicken(p); await shot(p, "dt92BuiltOne");
    await fitTap(p); await shot(p, "dt92BuiltIdeas");
    await putOn(p); await shot(p, "dt92BuiltPlate");
    await makeIt(p); await p.waitForTimeout(800); await shot(p, "dt92BuiltMake");
    await p.getByRole("button", { name: "I'm making it", exact: true }).click(); await p.waitForTimeout(800); await shot(p, "dt92BuiltMade");
    await p.getByRole("button", { name: "On to How was it?" }).click(); await p.waitForTimeout(700); await p.getByRole("button", { name: "DaaM good" }).click(); await p.waitForTimeout(300);
    await save(p); await shot(p, "dt92BuiltPage");
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
