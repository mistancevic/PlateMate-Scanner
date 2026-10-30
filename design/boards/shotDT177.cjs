// DT177 (Coach Milan 30 October 19:31): a second phone on the counter, paired for watching and hands-free cooking. Same need as
// cook mode; a second person cooking, or someone remote, are add-ons for later.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";   // 0.3.16, as merged; the new screens are drawn into it
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const PORT = "3380", U = `http://127.0.0.1:${PORT}`;
const food = (id, name, calories, protein, carbs, fats, fiber, icon) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon });
const items = [[160, food("c", "Chicken breast, raw", 120, 22.5, 0, 2.6, 0, "🍗")], [80, food("r", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3, "🍚")], [120, food("s", "Spinach, fresh", 23, 2.9, 3.6, 0.4, 2.2, "🥬")], [8, food("o", "Olive oil", 884, 0, 0, 100, 0, "🫒")], [6, food("g", "Garlic", 149, 6.4, 33, 0.5, 2.1, "🧄")]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = [
  "Rinse [[i:r|rice]] and bring it to the boil in 200 ml water. Cover and cook on low heat for 12 minutes.",
  "Cut [[i:c|chicken]] into strips. Season with salt and pepper.",
  "Slice [[i:g|garlic]] thin.",
  "Heat [[i:o|olive oil]] in a pan on medium high heat. Fry the chicken 6 minutes, turning once, until no pink is left inside.",
  "Add [[i:s|spinach]] and the garlic. Stir 2 minutes, until the spinach wilts.",
  "Put the rice in a bowl and the chicken and spinach on top.",
];
seed.items = []; seed.feedback = [];
seed.meals = [{ id: "m-bowl", title: "Chicken rice bowl with spinach", items, portion: 374, steps: STEPS, stepsFor: items.map((i) => i.food.name), savedAt: "2026-10-28T10:00:00Z" }];
const amt = (t) => t.replace(/\[\[i:(\w)\|[^\]]*\]\]/g, (_, id) => { const i = items.find((x) => x.id === id); return `<b class="st-amt">${i.grams} g ${i.food.name.split(",")[0].toLowerCase()}</b>`; });
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-30T18:40:00"));
  await page.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-30T08:00:00Z", source: "profile" }));
    localStorage.setItem("seeded", "1"); }, seed);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0 14px;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); document.querySelector(".toast")?.remove(); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  const toRecipe = async () => { await page.goto(U + "/"); await page.waitForTimeout(1000); await page.locator("nav button").filter({ hasText: "Recipes" }).click(); await page.waitForTimeout(500); await page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }).click(); await page.waitForTimeout(600); };
  const note = (t, sel = ".rq") => page.evaluate(({ t, NOTE, sel }) => { const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = t; document.querySelector(sel).prepend(d); }, { t, NOTE, sel });
  // keep only the steps card (and what is after it) under the recipe's name
  const stepsOnly = () => page.evaluate(() => { const rq = document.querySelector(".rq"), st = rq.querySelector(".rq-steps"); for (const el of [...rq.children]) { if (el === st) break; if (!el.classList.contains("rq-name") && !el.matches("h1,h2,.rq-label")) el.remove(); } });
  // the cook screen: drawn into the recipe page, in the app's own classes
  const CK = "background:var(--card,#fff);border-radius:16px;padding:14px;box-shadow:0 1px 0 var(--line)";
  const cook = ({ k, extra = "", top = "", listen = true, heard = "" }) => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><button class="pill pill-small">✕ Close</button><b style="flex:1;text-align:center;font-size:14px">Chicken rice bowl with spinach</b><small style="font-weight:800;color:var(--muted)">${k + 1} of ${STEPS.length}</small></div>
    <div style="display:flex;gap:4px;margin-bottom:12px">${STEPS.map((_, j) => `<span style="flex:1;height:5px;border-radius:3px;background:${j <= k ? "var(--brand,#2e7be8)" : "var(--line,#dde3ee)"}"></span>`).join("")}</div>
    ${top}
    <section style="${CK};min-height:250px;display:flex;flex-direction:column;justify-content:center">
      <small style="font-weight:800;color:var(--muted);letter-spacing:.04em">STEP ${k + 1}</small>
      <div style="font-size:25px;line-height:1.38;font-weight:700;margin-top:6px">${amt(STEPS[k])}</div>
      ${extra}
    </section>
    <div style="display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:8px;margin-top:12px"><button class="pill" style="height:58px;font-size:17px">‹ Back</button><button class="pill" style="height:58px;font-size:17px">↻ Repeat</button><button class="pill pill-primary" style="height:58px;font-size:18px">${k === STEPS.length - 1 ? "Done ✓" : "Next ›"}</button></div>
    ${heard}
    <div style="margin-top:12px;display:flex;align-items:center;gap:10px;${CK};padding:10px 12px"><span style="width:12px;height:12px;border-radius:50%;background:${listen ? "#13916a" : "#8a96ad"};flex:none"></span><small style="flex:1;font-weight:700;line-height:1.4">${listen ? "Listening. Say <b>next</b>, <b>back</b>, <b>repeat</b>, <b>how much rice</b>, <b>timer 5 minutes</b>, <b>what's left</b>, <b>stop</b>." : "Voice off. The buttons work the same."}</small><button class="pill pill-small">${listen ? "Voice off" : "Voice on"}</button></div>
    <small class="muted" style="display:block;margin-top:8px">The screen stays on while you cook. Each step is read aloud${listen ? "" : " when voice is on"}.</small>
    <details style="margin-top:12px;${CK}"><summary style="font-weight:800">What's in it</summary></details>`;
  const drawCook = (html) => page.evaluate((html) => { document.querySelector(".rq").innerHTML = html; for (const el of document.querySelectorAll("nav, header")) el.remove(); window.scrollTo(0, 0); }, html);

  const toMake = async () => { await toRecipe(); await page.getByRole("button", { name: "Make it", exact: true }).click(); await page.waitForTimeout(1200); for (let i = 0; i < 2; i++) { await page.getByRole("button", { name: "Lock the recipe", exact: true }).first().click(); await page.waitForTimeout(900); } };
  const doors = (m) => `<div style="${m};padding:2px;display:flex;flex-direction:column;gap:6px"><button class="pill pill-wide pill-primary">Cook it as written</button><small class="muted rq-under">Straight to Make, with the recipe as it is: the steps, Start cooking, then how it went.</small><button class="pill pill-wide">Change it first</button><small class="muted rq-under">On the Plate: change foods, or Fit to my target sets today's amounts. Then Make. The recipe stays as it is.</small></div>`;
  const CODE = `<div style="${CK};${mark};text-align:center;padding:18px"><b style="font-size:17px">Use another screen</b><small style="display:block;margin:6px 0 12px;font-weight:600;line-height:1.45">On the other phone or tablet, open <b>chefmealan.com/cook</b> and type the code, or scan.</small><div style="font-size:40px;font-weight:900;letter-spacing:.18em;font-family:ui-monospace,monospace">7K4P</div><div style="width:150px;height:150px;margin:12px auto 0;background:repeating-conic-gradient(#172742 0 25%,#fff 0 50%) 0 0/20px 20px;border:8px solid #fff;outline:1px solid var(--line)"></div><small class="muted" style="display:block;margin-top:10px">The code works once and ends after 10 minutes. The other screen sees the recipe and the steps, never your numbers.</small><button class="pill" style="height:44px;margin-top:10px">Cancel</button></div>`;
  const chips = (k, done) => `<div style="display:flex;gap:6px;margin-bottom:12px">${STEPS.map((_, j) => { const cur = j === k, d = done.includes(j); return `<button style="flex:1;height:44px;border-radius:12px;font-weight:800;font-size:16px;border:1.5px solid ${cur ? "var(--brand)" : "var(--line)"};background:${cur ? "var(--brand)" : d ? "#e9f5ef" : "var(--surface,#fff)"};color:${cur ? "#fff" : d ? "#13916a" : "var(--ink)"}">${j + 1}${d && !cur ? " ✓" : ""}</button>`; }).join("")}</div>`;
  const withChips = (html, k, done) => html.replace(/<div style="display:flex;gap:4px;margin-bottom:12px">[\s\S]*?<\/div>/, chips(k, done));
  const LINK = (t) => `<div style="${mark};display:flex;align-items:center;gap:8px;background:#e9f5ef;border-radius:12px;padding:8px 12px;margin-bottom:12px"><span style="width:10px;height:10px;border-radius:50%;background:#13916a"></span><small style="flex:1;font-weight:700;color:#0f6b4e">${t}</small><button class="pill pill-small" style="height:44px">End</button></div>`;
  // a, now: one phone does it all
  await toRecipe();
  await drawCook(withChips(cook({ k: 3 }), 3, [0, 1, 2]));
  await note("Now, after DT174 and DT175a: cook mode on your phone. The same phone is your scale, your shop list and your calls, so it leaves the counter, and the step goes with it.");
  await shot("r177a");
  // b, new: Use another screen, the code
  await toRecipe();
  await drawCook(withChips(cook({ k: 0 }), 0, []).replace('<section style="', CODE + '<section style="'));
  await note("New: Use another screen, in cook mode. A 4-letter code and a QR code. The other device opens chefmealan.com/cook: no sign-in, no install. The code works once and ends after 10 minutes.");
  await shot("r177b");
  // c, new: the second phone, joining
  await toRecipe();
  await drawCook(`<div style="text-align:center;padding:24px 0 10px"><b style="font-size:22px">Chef Mealan · Kitchen screen</b><small class="muted" style="display:block;margin-top:6px;font-weight:600">Type the code from the phone that is cooking, or scan it.</small></div>
    <div style="${CK};${mark};text-align:center;padding:18px"><input class="search" value="7K4P" style="font-size:32px;text-align:center;letter-spacing:.2em;font-weight:900;height:64px"><button class="pill pill-wide pill-primary" style="height:52px;margin-top:12px">Join</button><button class="pill pill-wide" style="height:52px;margin-top:8px">Scan the code</button></div>
    <small class="muted" style="display:block;margin-top:12px;line-height:1.5">This screen shows the recipe and the steps of the phone that is cooking. It never shows that person's numbers, goal or profile. It forgets everything when the session ends.</small>`);
  await note("New: the second phone or tablet. Type the code or scan. It gets the recipe and the steps, nothing about the person: no numbers, no goal, no profile. When the session ends it forgets everything.");
  await shot("r177c");
  // d, new: the kitchen screen
  await toRecipe();
  await drawCook(LINK("Kitchen screen · joined to Milan's phone") + withChips(cook({ k: 3, extra: `<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="pill" style="font-size:16px;height:48px">⏱ Start 6 min timer</button><button class="pill" style="font-size:16px;height:48px;${mark}">📷 Chef, look</button></div>` }), 3, [0, 1, 2]).replace("Chicken rice bowl with spinach</b>", "Chicken rice bowl with spinach</b>").replace(/<button class="pill pill-small">✕ Close<\/button>/, '<button class="pill pill-small" style="height:44px">Leave</button>'));
  await note("New: the kitchen screen. The same step, the same step buttons, the same voice commands; both screens move together. Next ticked here is ticked on your phone. One new button: Chef, look.");
  await shot("r177d");
  // e, new: Chef, look
  await toRecipe();
  await drawCook(LINK("Kitchen screen · joined to Milan's phone") + withChips(cook({ k: 3, heard: `<div style="margin-top:12px;${CK};${mark};padding:10px 12px"><small style="display:block;color:var(--muted);font-weight:800">YOU SAID</small><b>Chef, look</b><div style="margin:8px 0;height:120px;border-radius:10px;background:#e8edf3;display:flex;align-items:center;justify-content:center;color:var(--muted);font-weight:700">one photo of the pan</div><small style="display:block;color:var(--muted);font-weight:800">CHEF MEALAN, ABOUT STEP 4</small><b style="font-weight:700">The strips on the left are golden; the three at the back are still pale. Turn those, about 2 more minutes, then cut the thickest one open: no pink.</b><small class="muted" style="display:block;margin-top:6px">One photo, sent with the step, then deleted. Nothing is sent unless you ask.</small></div>` }), 3, [0, 1, 2]).replace(/<button class="pill pill-small">✕ Close<\/button>/, '<button class="pill pill-small" style="height:44px">Leave</button>'));
  await note("New: Chef, look. Say it, or tap: the kitchen screen takes one photo of the pan and sends it with the step. Chef Mealan answers aloud. Nothing is sent unless you ask; the photo is not kept. About 2 cents a session, Google's price. No live video in DT177.");
  await shot("r177e");
  // f, new: your phone meanwhile
  await toRecipe();
  await drawCook(LINK("Also on the kitchen screen · step 4 of 6") + withChips(cook({ k: 3 }), 3, [0, 1, 2]));
  await note("New: your own phone stays in cook mode and says the kitchen screen is on. Take it to the scale or answer a call; the counter keeps the step. End stops the other screen; Done on either ends the session.");
  await shot("r177f");
  await b.close(); server.kill();
})().catch((e) => { console.error(e); process.exit(1); });
