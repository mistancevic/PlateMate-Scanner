// Board HP2 (Milan 27 October 14:25 and 14:27): the home page for visitors. Start from anything (barcode, label, a group of
// labels, a photo of the meal), one plate with PD and the letters, recipes for your day, the shopping list. The new section
// replaces the five old videos; clips, not stills (the board shows the clips' first frames). Drawn in the browser.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const ROOT = "/home/claude/platemate-scanner", R = "/home/claude/boards/rs";
const PORT = "3330", U = `http://127.0.0.1:${PORT}`, LAND = "http://127.0.0.1:5199/land.html";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const Fd = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, from) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: Fd(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-12T10:00:00Z", ...(from ? { from } : {}) }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4);
const pudding = meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Nutella/, 15], [/^Milk/, 50]], 1, "coach");
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8);
const planned = (m, source) => { const w = m.items.reduce((s, i) => s + i.grams, 0), r = Math.min(1, m.portion / w); const k = m.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0) * r, p = m.items.reduce((s, i) => s + (i.food.protein * i.grams) / 100, 0) * r; return { title: m.title, kcal: Math.round(k), protein: Math.round(p), source, mealId: m.id, items: m.items, portion: m.portion }; };
const PLAN = {}; ["20", "21", "22", "23", "24", "25", "26"].forEach((d, i) => { PLAN[`2026-10-${d}`] = { breakfast: planned(crepes, "mine"), lunch: i % 2 ? planned(sarma, "mine") : planned(pudding, "coach") }; });
const F2 = (id, name, calories, protein, fats, carbs, icon, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, icon, ...extra });
const CH = F2("chk", "Chicken breast, grilled", 165, 31, 3.6, 0, "🍗"), RI = F2("rice", "Rice, cooked", 130, 2.7, 0.3, 28, "🍚", { fiber: 0.4 }), SA = F2("sal", "Mixed salad, dressed", 60, 1.2, 4.5, 3.5, "🥗", { fiber: 1.5 });
const img = (f) => "data:image/jpeg;base64," + fs.readFileSync(f).toString("base64");
const PH = img(`${R}/photo-chicken.jpg`);
const svg = (x) => "data:image/svg+xml;base64," + Buffer.from(x).toString("base64");
// an invented pack on a kitchen counter: no real brand
const PACK = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#cdbb9f"/><rect x="120" y="140" width="360" height="520" rx="28" fill="#f7f5ef" stroke="#d8d2c4" stroke-width="4"/><rect x="120" y="190" width="360" height="120" fill="#2e5d8f"/><text x="300" y="262" font-family="Georgia" font-size="54" fill="#fff" text-anchor="middle">Fjell</text><text x="300" y="370" font-family="Arial" font-weight="700" font-size="44" fill="#2e5d8f" text-anchor="middle">SKYR</text><text x="300" y="412" font-family="Arial" font-size="26" fill="#2e5d8f" text-anchor="middle">natural · 450 g</text><rect x="190" y="460" width="220" height="150" fill="#fff"/>BARS<text x="300" y="604" font-family="monospace" font-size="20" text-anchor="middle">4 006040 123456</text></svg>`.replace("BARS", Array.from({ length: 38 }, (_, i) => `<rect x="${200 + i * 5.3}" y="470" width="${(i * 7) % 3 + 1}" height="110" fill="#111"/>`).join("")));
const LABEL = "data:image/svg+xml;base64," + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="600" height="800" fill="#e9e2d0"/><rect x="150" y="190" width="300" height="420" fill="#fff" stroke="#222" stroke-width="3"/>
<text x="165" y="228" font-family="Arial" font-weight="700" font-size="22">Nutrition declaration</text><text x="165" y="256" font-family="Arial" font-size="17">per 100 g</text>
${[["Energy", "263 kJ / 63 kcal"], ["Fat", "0.2 g"], ["of which saturates", "0.1 g"], ["Carbohydrate", "4.0 g"], ["of which sugars", "4.0 g"], ["Protein", "11 g"], ["Salt", "0.1 g"]].map(([a, b], i) => `<line x1="165" x2="435" y1="${272 + i * 46}" y2="${272 + i * 46}" stroke="#222" stroke-width="1.5"/><text x="165" y="${302 + i * 46}" font-family="Arial" font-size="17">${a}</text><text x="435" y="${302 + i * 46}" font-family="Arial" font-size="17" text-anchor="end">${b}</text>`).join("")}</svg>`).toString("base64");
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const ctxOf = async (s, plan, time) => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ["camera"], timezoneId: "Europe/Berlin" }); const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date(time));
    await p.addInitScript(([s, plan]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-12T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z", aiConfirmedAt: "2026-10-05T08:00:00Z" }));
      if (plan) localStorage.setItem("chefmealan-planned", JSON.stringify(plan));
      localStorage.setItem("seeded", "1"); }, [s, plan]);
    await require(`${ROOT}/tests/flows/adult.cjs`)(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Grilled chicken with rice and salad: a plain lunch plate.", around: "", better_as: "" }) }));
    return p; };
  try {
    // the shopping list and Recipes, on the shopping walkthrough's week
    let p = await ctxOf({ ...seed, items: [], meals: [crepes, sarma, pudding], feedback: [], goals: { ...seed.goals, calories: 2800, protein: 180, fats: 93, carbs: 300 } }, PLAN, "2026-10-20T14:00:00Z");
    await p.goto(U + "/plan"); await p.waitForTimeout(1500);
    await p.locator(".plan-shop").click(); await p.waitForTimeout(700);
    await p.getByRole("dialog", { name: "Shopping lists" }).getByRole("button", { name: /Make shopping list/ }).click(); await p.waitForTimeout(700);
    await p.getByRole("dialog", { name: "Shopping lists" }).screenshot({ path: `${R}/hp-shop.png` }); console.log("shot hp-shop");
    await p.keyboard.press("Escape"); await p.waitForTimeout(300);
    await p.goto(U + "/plan"); await p.waitForTimeout(1200); await p.locator("nav button").filter({ hasText: "Recipes" }).click(); await p.waitForTimeout(1800);
    await p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (["fixed", "sticky"].includes(cs.position) && el.tagName !== "HEADER") el.style.display = "none"; }
      const add = [...document.querySelectorAll("section, .card")].find((x) => /^Add a recipe/.test((x.textContent || "").trim())); if (add) add.style.display = "none"; });
    await p.screenshot({ path: `${R}/hp-recipes.png` }); console.log("shot hp-recipes");
    await p.close();
    // the camera, four ways in, with a picture where the camera would be
    p = await ctxOf({ ...seed, items: [], meals: [], feedback: [] }, null, "2026-10-25T13:05:00");
    await p.goto(U + "/plate"); await p.waitForTimeout(1500);
    await p.getByRole("button", { name: "Scan", exact: true }).first().click(); await p.waitForTimeout(1500);
    for (const [mode, pic, name] of [["Barcode", PACK, "hp-barcode"], ["Label", LABEL, "hp-label"], ["Group", PACK, "hp-group"], ["Meal", PH, "hp-meal"]]) {
      await p.locator(".cam-modes button").filter({ hasText: mode }).click(); await p.waitForTimeout(700);
      await p.evaluate((pic) => { document.querySelectorAll(".hp-pic").forEach((x) => x.remove()); const v = document.querySelector("video"); if (v) { const i = document.createElement("img"); i.className = "hp-pic"; i.src = pic; i.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 55%"; v.after(i); v.style.opacity = "0"; } }, pic);
      await p.waitForTimeout(300); await p.screenshot({ path: `${R}/${name}.png` }); await p.screenshot({ path: `${R}/${name}-c.png`, clip: { x: 0, y: 0, width: 390, height: 560 } }); console.log("shot " + name);
    }
    await p.close();
    // one plate: the photo read, the PD block, the letters
    p = await ctxOf({ ...seed, foods: [...seed.foods, CH, RI, SA], meals: [], feedback: [], title: "Grilled chicken with rice and salad", photo: { image: PH, at: "2026-10-25T13:05:00", unsure: null },
      items: [{ id: "a", food: CH, grams: 180, locked: false, est: { low: 140, high: 240 } }, { id: "b", food: RI, grams: 150, locked: false, est: { low: 120, high: 200 } }, { id: "c", food: SA, grams: 90, locked: false, est: { low: 60, high: 120 } }] }, null, "2026-10-25T13:05:00");
    await p.goto(U + "/plate"); await p.waitForTimeout(2200);
    await p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (["fixed", "sticky"].includes(cs.position)) el.style.display = "none"; } });
    const card = p.locator(".plate-card"); const bb = await card.boundingBox(); const ro = await p.locator(".readout").first().boundingBox();
    await p.setViewportSize({ width: 390, height: Math.ceil(ro.y + ro.height + 30) });
    await p.screenshot({ path: `${R}/hp-plate.png`, clip: { x: 0, y: Math.max(0, bb.y - 10), width: 390, height: Math.ceil(ro.y + ro.height + 16 - Math.max(0, bb.y - 10)) } }); console.log("shot hp-plate");
    await p.close();
    // the home page now, and with the new section in place of the five videos
    const lp = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
    await lp.goto(LAND); await lp.waitForTimeout(2500);
    await lp.screenshot({ path: `${R}/hp-now.png`, fullPage: true }); console.log("shot hp-now");
    await lp.locator(".l-moments").screenshot({ path: `${R}/hp-now-videos.png` }); console.log("shot hp-now-videos");
    const still = (n) => "data:image/png;base64," + fs.readFileSync(`${R}/${n}.png`).toString("base64");
    const S = { barcode: still("hp-barcode-c"), label: still("hp-label-c"), group: still("hp-group-c"), meal: still("hp-meal-c"), plate: still("hp-plate"), recipes: still("hp-recipes"), shop: still("hp-shop") };
    for (const [w, file] of [[390, "hp-new"], [1280, "hp-new-wide"]]) {
      await lp.setViewportSize({ width: w, height: 900 }); await lp.goto(LAND); await lp.waitForTimeout(2000);
      await lp.evaluate((S) => {
        const old = document.querySelector(".l-moments"); if (!old) return;
        const mark = "outline:3px solid #2e7be8;outline-offset:6px;border-radius:14px";
        const clip = (src, alt, ratio) => `<div style="position:relative;border-radius:14px;overflow:hidden;background:#0f1f3a;${ratio ? `aspect-ratio:${ratio}` : ""}"><img src="${src}" alt="${alt}" style="width:100%;display:block;${ratio ? "height:100%;object-fit:cover;object-position:top" : ""}"><span style="position:absolute;left:8px;bottom:8px;background:rgba(15,31,58,.82);color:#fff;font:800 12px Nunito,sans-serif;border-radius:999px;padding:3px 9px">▶ clip, 8 s</span></div>`;
        const way = (t, line, src) => `<div style="display:flex;flex-direction:column;gap:6px">${clip(src, t, "390/560")}<h3 style="margin:4px 0 0;font-size:16px">${t}</h3><p style="margin:0;color:#3d4a63;font-size:14px;line-height:1.4">${line}</p></div>`;
        const sec = document.createElement("section"); sec.className = "l-steps"; sec.style.cssText = mark;
        sec.innerHTML = `<span class="l-eyebrow">Start from anything</span><h2>What you eat, read in seconds</h2>
          <p style="color:#3d4a63;font-size:16px;line-height:1.5;max-width:720px">Scan a barcode, a nutrition label, all sides of a pack, or take a photo of the meal in front of you. Each one lands on your plate.</p>
          <style>.hp-ways,.hp-two{display:grid;gap:22px;grid-template-columns:1fr}.hp-one{display:grid;gap:22px;grid-template-columns:1fr;align-items:start}@media (min-width:760px){.hp-ways{grid-template-columns:repeat(4,1fr)}.hp-two{grid-template-columns:1fr 1fr}.hp-one{grid-template-columns:1fr 380px}}</style><div class="hp-ways" style="margin-top:14px">
            ${way("A barcode", "The pack's values from the product database, or from the pack's photos.", S.barcode)}
            ${way("A nutrition label", "Hold the table in the frame. Chef Mealan reads it, you check it.", S.label)}
            ${way("A group of labels", "Every side of a pack in a few photos, read as one food.", S.group)}
            ${way("A photo of your meal", "Chef Mealan names the foods and estimates the grams. You correct what you know.", S.meal)}
          </div>
          <div style="margin-top:34px"><span class="l-eyebrow">One plate</span><h2>Everything lands on one plate</h2>
            <div class="hp-one">
              <div style="display:flex;flex-direction:column;gap:10px;font-size:15px;line-height:1.5;color:#172742">
                <p style="margin:0"><b>PD, protein density:</b> grams of protein per 100 kcal. Your target comes from your goal, your body and your training. The big number says how the plate stands against it.</p>
                <p style="margin:0"><b>F C Fi P:</b> fat, carbs, fibre, protein, in the order of a food label. A capital letter: as your day needs. Small: under. A plus: more than your day. A minus: close to none.</p>
                <p style="margin:0"><b>Then you decide:</b> eat it, eat one portion, add a protein side, or let Chef Mealan fit it to your target.</p>
              </div>${clip(S.plate, "the plate", null)}</div></div>
          <div class="hp-two" style="margin-top:34px">
            <div style="display:flex;flex-direction:column;gap:8px"><span class="l-eyebrow">Plan</span><h2 style="margin:0">Recipes for your day</h2><p style="margin:0;color:#3d4a63;font-size:15px;line-height:1.45;min-height:4.4em">Yours, your coach's and the members', sorted for what is left of your day. Pick one for a meal of your plan.</p>${clip(S.recipes, "recipes", "390/640")}</div>
            <div style="display:flex;flex-direction:column;gap:8px"><span class="l-eyebrow">Shop</span><h2 style="margin:0">Your shopping list</h2><p style="margin:0;color:#3d4a63;font-size:15px;line-height:1.45;min-height:4.4em">The planned week's foods added up, with the meals they are for. Tick as you shop.</p>${clip(S.shop, "shopping list", "390/640")}</div>
          </div>
          <div style="margin-top:22px;background:#fff8d6;outline:3px solid #2e7be8;border-radius:10px;padding:10px 12px;font-size:14px;line-height:1.45;color:#172742">New: this section takes the place of the five videos from 0.2.51 (Today, Plan, a craving, a recipe from a link, how a meal carried you), recorded before the camera modes, the photo of the meal, the PD block and the recipes bar. No carousel: on a phone everything sits one below another; on a computer the four ways in sit in one row of four, the plate beside its explanation, recipes and the shopping list side by side at the same height. Each picture is the first frame of a short clip of the real app on test data, about 8 seconds, without sound, playing when it comes into view. The hero with the craving calculator, recipes, coach, Milan, the numbers you can check, the book and the form stay as they are.</div>`;
        old.replaceWith(sec);
      }, S);
      await lp.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (cs.position === "fixed") el.style.display = "none"; } });
      await lp.waitForTimeout(800); await lp.locator("section[style*='outline']").first().screenshot({ path: `${R}/${file}.png` }); console.log("shot " + file);
    }
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
