// DT161 (Coach Milan 29 October 19:11 to 19:15): how you eat. Carbs and fat as chips in the goal setup; Paleo, Meat only and Other in What you eat
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8")); seed.items = [];
const PORT = "3340", U = `http://127.0.0.1:${PORT}`;
const MEM = require("/home/claude/boards/member159.cjs"); const MICRO = require("/home/claude/boards/micro158.cjs");
const FAT_SHARE = Number(/FAT_SHARE = ([\d.]+)/.exec(fs.readFileSync(path.join(ROOT, "src/personal.ts"), "utf8"))[1]);
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  await page.clock.setFixedTime(new Date("2026-10-29T10:10:00"));
  await page.addInitScript(([s]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
    localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
    localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "each", week: { passive: 3, active: 1, easy: 2, hard: 1 }, sex: "male", birthYear: 1981, heightCm: 182, weightKg: 85, lifestyle: { weekdays: "work", hours: "fixed", slot: "9-5", move: "sitting", meals: 3 } }));
    localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-20T16:00:00Z", consentBodyAt: "2026-10-20T16:00:00Z", declaredAt: "2026-10-20T16:00:00Z", aiConfirmedAt: "2026-10-20T16:00:00Z" }));
    localStorage.setItem("seeded", "1"); }, [seed]);
  await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
  const R = "/home/claude/boards/rs";
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742";
  const shot = async (name) => { await page.waitForTimeout(400); await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue; if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); }); await page.waitForTimeout(200); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  // the app's own calculation for this profile (as DT160): protein 160 g; week average 2,500 kcal; days Monday 2,850, Tuesday and
  // Thursday 2,600, Wednesday, Saturday and Sunday 2,300, Friday 2,400 kcal. Fat by the chip, carbs the rest; Very low carb: carbs
  // typed (50 g in the drawing, the person's own number), fat the rest each day.
  const KCAL = [2850, 2600, 2300, 2600, 2400, 2300, 2300], P = 160, AVG = 2500;
  const SPLITS = { balanced: 0.30, carbs: 0.25, fat: 0.35 };
  const daysOf = (split) => KCAL.map((k) => { if (split === "low") { const c = 50; return { f: Math.round((k - P * 4 - c * 4) / 9), c }; } const f = Math.round((AVG * SPLITS[split]) / 9); return { f, c: Math.max(0, Math.round((k - P * 4 - f * 9) / 4)) }; });
  for (const sp of ["balanced", "carbs", "fat", "low"]) console.log(sp, JSON.stringify(daysOf(sp)));
  const goalShot = (split, note) => page.evaluate(({ split, note, mark, NOTE, days, AVG }) => {
    for (const w of document.querySelectorAll(".goal-pick-wrap:not(.on)")) w.remove();
    const pc = document.querySelector(".protein-card");
    const chip = (id, name, hint) => `<button type="button" class="activity ${split === id ? "on" : ""}" style="${split === id ? "background:var(--base,#e8f0fd);border-color:#2e7be8" : ""}"><b>${split === id ? "✓ " : ""}${name}</b><small>${hint}</small></button>`;
    const fats = days.map((d) => d.f), carbs = days.map((d) => d.c);
    const lo = Math.round(AVG * 0.2 / 9), hi = Math.round(AVG * 0.35 / 9);
    const KC = [2850, 2600, 2300, 2600, 2400, 2300, 2300], NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const below = days.map((d, i) => ({ n: NAMES[i], s: (d.c * 400) / KC[i] })).filter((x) => x.s < 45);
    const fatShare = days.map((d, i) => Math.round((d.f * 900) / KC[i]));
    const belowLine = below.length === 7 ? "On every day your carbs are below 45 % of the energy, the bottom of EFSA's range." : below.length ? `On ${below.length === 3 && below.every((x) => ["Wednesday", "Saturday", "Sunday"].includes(x.n)) ? "your rest days" : below.map((x) => x.n).join(", ")} your carbs are below 45 % of the energy, the bottom of EFSA's range.` : "";
    let card;
    if (split === "low") {
      card = `<section class="card protein-card"><label class="field"><span>Your carbs a day, g</span><input value="50" readonly style="font-weight:900"></label>
        <div class="protein-top" style="margin-top:6px"><b>${Math.min(...fats)} to ${Math.max(...fats)} g</b><span>of fat a day</span></div>
        <p class="protein-line">Your carbs stay at 50 g every day; fat takes the rest and goes up and down with your training. That is ${Math.min(...fatShare)} to ${Math.max(...fatShare)} % of your energy from fat, above the 20 to 35 % range, and carbs below the 45 to 60 % range (EFSA). Your choice: the Explorer shows where you are against both.</p></section>`;
    } else {
      const f = fats[0], at = ((f - lo) / (hi - lo)) * 100, pct = Math.round((f * 900) / AVG);
      const word = { balanced: "Balanced", carbs: "More carbs", fat: "More fat" }[split];
      card = `<section class="card protein-card"><div class="protein-top"><b>${f} g</b><span>of fat a day</span></div>
        <div class="protein-bar" aria-hidden="true"><span class="protein-mark" style="left:${at}%"></span></div><div class="protein-ends"><span>${lo} g</span><span>${hi} g</span></div>
        <p class="protein-line">The range is 20 to 35 % of your energy (EFSA), ${lo} to ${hi} g on your week's 2,500 kcal. Yours is ${pct} %: ${word}. Carbs take the rest, ${Math.min(...carbs)} to ${Math.max(...carbs)} g, up and down with your training. ${belowLine}</p></section>`;
    }
    pc.insertAdjacentHTML("afterend", `<div style="${mark};outline-offset:6px;margin:16px 0 4px"><b class="section-title" style="margin-top:4px">3. Carbs and fat</b><p class="small muted" style="margin:0 0 8px">How you like to eat. Protein stays set by your goal; this moves the rest between carbs and fat. You can change it at any time.</p>
      <div class="activity-list">${chip("balanced", "Balanced", "Fat 30 % of your energy, carbs the rest. Chef Mealan's default.")}${chip("carbs", "More carbs", "Fat 25 %, more room for carbs: hard training and endurance.")}${chip("fat", "More fat", "Fat 35 %, the top of the range, fewer carbs.")}${chip("low", "Very low carb", "You set your carbs; fat takes the rest. Outside the usual ranges.")}</div>${card}</div>`);
    for (const t of document.querySelectorAll(".section-title")) if (/^3\. Your days/.test(t.textContent)) t.textContent = "4. Your days";
    const rows = [...document.querySelectorAll(".dt-row")];
    rows.forEach((r, i) => { const c = r.querySelector(".dt-cells"); if (!c || !days[i]) return; const kids = c.children, kf = kids[kids.length - 2], kc = kids[kids.length - 1]; kf.textContent = days[i].f; kc.textContent = days[i].c; kf.style.cssText = kc.style.cssText = "color:#1d5fc4;font-weight:900"; });
    if (split === "low") for (const n of document.querySelectorAll("p, small, span, div")) if (n.childElementCount === 0 && /Protein and fat stay the same every day/.test(n.textContent)) n.textContent = n.textContent.replace("Protein and fat stay the same every day. Carbs go up and down with your training.", "Protein and carbs stay the same every day. Fat goes up and down with your training.");
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; document.querySelector(".section-title").before(d);
    window.scrollTo(0, 0);
  }, { split, note, mark, NOTE, days: daysOf(split), AVG });
  const openGoal = async () => { await page.goto(U + "/me/goal"); await page.waitForTimeout(1200); await page.getByRole("button", { name: "Change the goal" }).click(); await page.waitForTimeout(1200); };
  await openGoal();
  await goalShot("balanced", "New: a step in the goal setup, Carbs and fat. Four chips; Balanced is today's rule. A card like the protein card shows your fat in its range, and what the carbs get. The day table follows the chip.");
  await shot("r161a");
  await openGoal();
  await goalShot("fat", "New: More fat. Fat goes to 35 %, the top of the range; carbs get less on every day. The card names the days your carbs sit below EFSA's 45 %: all but Monday.");
  await shot("r161b");
  await openGoal();
  await goalShot("low", "New: Very low carb. You type your carbs; fat takes the rest. Now carbs stay the same every day and fat moves with training. The card says where that sits against both ranges, without telling you to change it.");
  await shot("r161c");
  // the Lifestyle page: What you eat
  const lifeShot = (pick, other, note) => page.evaluate(({ pick, other, note, mark, NOTE }) => {
    const pesc = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Pescatarian"); const row = pesc.parentElement;
    for (const b of row.querySelectorAll("button")) b.classList.remove("on");
    for (const n of ["Paleo", "Meat only", "Other"]) { const b = pesc.cloneNode(true); b.textContent = n; b.classList.remove("on"); row.appendChild(b); }
    const on = [...row.querySelectorAll("button")].find((b) => b.textContent.trim() === pick); on.classList.add("on");
    row.style.cssText += ";" + mark + ";outline-offset:4px";
    const hint = { "Meat only": `Meat, fish and eggs. They bring almost no carbs, so your carbs come close to zero. Very low carb fits your numbers: <a href="#" style="color:#2e7be8;font-weight:800;text-decoration:none">set it under Goal ›</a>`, Paleo: "No grains, legumes or dairy." }[pick];
    row.insertAdjacentHTML("afterend", (hint ? `<small class="setting-hint" style="display:block;margin-top:8px;${mark};outline-offset:2px">${hint}</small>` : "") +
      (pick === "Other" ? `<label class="field" style="display:block;margin-top:8px;${mark};outline-offset:4px"><span>How you eat, in your words</span><input value="${other}" readonly></label>` : "") +
      `<small class="setting-hint" style="display:block;margin-top:6px;${mark};outline-offset:2px">Chef Mealan reads this with every plate and recipe it suggests.</small>`);
    const d = document.createElement("div"); d.style.cssText = NOTE; d.textContent = note; row.closest("section, .seg, div").before(d);
    const top = d.getBoundingClientRect().top; window.scrollTo(0, 0);
  }, { pick, other, note, mark, NOTE });
  await page.goto(U + "/me/lifestyle"); await page.waitForTimeout(1300);
  await lifeShot("Meat only", "", "New: What you eat gets Paleo, Meat only and Other. Meat only says what it means for your numbers and links to the Carbs and fat step. Chef Mealan now reads this choice; until now only protein did.");
  await shot("r161d");
  await page.goto(U + "/me/lifestyle"); await page.waitForTimeout(1300);
  await lifeShot("Other", "Mediterranean, no gluten", "New: Other, for a way of eating we don't list. You write it in your words; Chef Mealan reads it with every suggestion. Your numbers stay on your Carbs and fat chip.");
  await shot("r161e");
  await b.close(); server.kill();
})();
