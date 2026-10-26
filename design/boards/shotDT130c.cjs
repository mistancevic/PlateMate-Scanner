// Boards DT129 and DT130 (Milan 26 October 12:00). DT129: the letters block, a subtle header of macro names above the letters,
// the grams, one word under them (low, match, high), and Against your planned day as the title above the table; B: the table
// out of the PD block as its own segment. DT130: Your photos inside the meal camera, as for labels; B: read it later.
// Drawn in the browser; nothing in the repo changes.
const ROOT = process.env.APP_DIR || "/home/claude/platemate-scanner";
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const { spawn } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path");
const R = "/home/claude/boards/rs";
const PORT = "3324", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join("/home/claude/platemate-scanner", "tests/flows/seed.json"), "utf8"));
const F = (id, name, calories, protein, fats, carbs, icon, brand = "estimate") => ({ ...seed.foods[0], id, name, brand, source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, icon, table: undefined });
const BAR = F("bar", "Clean Protein Bar Peanut Love", 400, 20, 14, 45, "🍫", "Clean"), YE = F("yeast", "Active dry yeast", 325, 40, 7, 41, "🍞"), PB = F("pb", "Peanut butter", 588, 25, 50, 20, "🥜");
seed.foods = [BAR, YE, PB, ...seed.foods]; seed.meals = []; seed.feedback = [];
seed.items = [{ id: "a", food: BAR, grams: 150, locked: false }, { id: "b", food: YE, grams: 10, locked: false }, { id: "c", food: PB, grams: 150, locked: false }];
seed.goals = { ...seed.goals, calories: 2750, protein: 180, fats: 90, carbs: 300 };
const mark = `outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px`;
const NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
(async () => {
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const fresh = async (items = seed.items) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, permissions: ["camera"] });
    const p = await ctx.newPage();
    await p.clock.setFixedTime(new Date("2026-10-25T13:05:00"));
    await p.addInitScript((s) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-01T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian", "Mediterranean"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, { ...seed, items });
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await p.goto(U + "/plate"); await p.waitForTimeout(1500);
    return p;
  };
  const flat = (p) => p.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (!["fixed", "sticky"].includes(cs.position)) continue;
    if (el.tagName === "NAV" || el.querySelector("nav") || el.getBoundingClientRect().top < 100) el.style.position = "static"; else el.style.display = "none"; } window.scrollTo(0, 0); });
  const shot = async (p, name) => { await p.waitForTimeout(350); await flat(p); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot", name); };
  const note = (p, sel, html, where = "after") => p.evaluate(({ sel, html, where, NOTE }) => { const el = document.querySelector(sel); if (!el) return false; const d = document.createElement("div"); d.innerHTML = html; d.style.cssText = NOTE; el[where](d); return true; }, { sel, html, where, NOTE });
  const rowOf = (p, name) => p.evaluate((name) => { const e = [...document.querySelectorAll(".plate-card .name-link")].find((x) => x.textContent.trim() === name); let r = e; while (r && !r.classList.contains("row")) r = r.parentElement; if (r) r.setAttribute("data-draw", name); return !!r; }, name);
  // the three-phase bar in place of the five steps
  const phases = (p, on) => p.evaluate(({ on, mark }) => { const bar = document.querySelector(".step-bar"); if (!bar) return; const d = document.createElement("div"); d.style.cssText = "display:flex;gap:8px;margin:6px 0 2px;" + mark + ";padding:6px";
    d.innerHTML = ["Craft", "Make", "Feedback"].map((t, i) => `<div style="flex:1;text-align:center;font-weight:800;font-size:13px;color:${i <= on ? "#1f5fc7" : "#8a97ad"}"><div style="height:6px;border-radius:3px;background:${i <= on ? "#2e7be8" : "#d1dcf0"};margin-bottom:4px"></div>${t}</div>`).join(""); bar.replaceWith(d); }, { on, mark });
  const dataUrl = (f) => "data:image/jpeg;base64," + fs.readFileSync(`${R}/${f}`).toString("base64");
  const PH = dataUrl("photo-chicken.jpg");
  try {
    const F2 = (id, name, calories, protein, fats, carbs, icon, extra = {}) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber: null, photo: undefined, photos: undefined, table: undefined, icon, ...extra });
    const QU = F2("quark", "Quark, low fat", 67, 12, 0.3, 4, "🥛"), OA = F2("oats", "Oats", 372, 13.5, 7, 58.7, "🌾", { fiber: 10 }), AP = F2("apple", "Apple", 52, 0.3, 0.2, 14, "🍎", { fiber: 2.4 }), PBt = F2("pb2", "Peanut butter", 588, 25, 50, 20, "🥜", { fiber: 6 });
    const items = [{ id: "a", food: QU, grams: 250, locked: false }, { id: "b", food: OA, grams: 40, locked: false }, { id: "c", food: AP, grams: 150, locked: false }, { id: "d", food: PBt, grams: 15, locked: false }];
    const setup = async (its = items, title = "Quark bowl") => { const p = await fresh([]);
      await p.evaluate(({ extra, items, title }) => { const s = JSON.parse(localStorage.getItem("platemate-pilot-v1")); s.foods = [...s.foods, ...extra]; s.items = items; s.fromRecipe = undefined; s.title = title; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s)); }, { extra: [QU, OA, AP, PBt], items: its, title });
      await p.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Quark, oats, apple and peanut butter: a breakfast bowl.", around: "", better_as: "" }) }));
      await p.reload(); await p.waitForTimeout(1800); return p; };
    const crop = async (p, name, sel = ".plate-card") => { await p.waitForTimeout(300); await flat(p); const el = p.locator(sel).first(); await el.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
    // DT130c v2 (Milan 26 October 15:45): the choices are chips, short, one on; the one button reads
    p = await setup([], "");
    await p.evaluate(({ mark, NOTE, PH }) => {
      const card = document.querySelector(".plate-card"); if (!card) return;
      const q = document.createElement("div"); q.style.cssText = mark + ";background:#fff;padding:12px;margin:4px 0 10px;border-radius:14px";
      const chip = (t, on) => '<span style="flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;height:34px;padding:0 10px;white-space:nowrap;border-radius:var(--r-chip,999px);font-size:var(--fs-label,13px);font-weight:700;border:1.5px solid ' + (on ? 'var(--brand)' : 'var(--line)') + ';background:' + (on ? 'var(--tint)' : 'var(--surface)') + ';color:' + (on ? 'var(--brand-text)' : 'var(--muted)') + '">' + (on ? '✓ ' : '') + t + '</span>';
      q.innerHTML = '<div style="display:flex;gap:10px;align-items:center"><img src="' + PH + '" style="width:64px;height:64px;border-radius:10px;object-fit:cover;flex:none"><div style="font-size:var(--fs-body,15px);line-height:1.4"><b>A photo from 12:40 today.</b><br>Whose plate, and when?</div></div>'
        + '<div style="display:flex;gap:8px;margin-top:12px">' + chip("Ate at 12:40", true) + chip("Eating now") + chip("An idea") + '</div>'
        + '<small style="display:block;color:var(--muted);font-size:var(--fs-small,13px);margin-top:8px;line-height:1.4">Logged at 12:40, as lunch. Tap the time on the chip to change it.</small>'
        + '<button style="display:block;width:100%;margin-top:12px;height:46px;border:0;border-radius:999px;background:var(--brand);color:#fff;font-weight:900;font-size:15px">Read the plate</button>';
      card.insertBefore(q, card.firstChild);
      const n = document.createElement("div"); n.style.cssText = NOTE; n.textContent = "Changed (Milan 15:45 and 16:18): the three are chips, not buttons. One is on; a tap picks another; nothing happens until Read the plate. The line under the chips says what the one that is on does. Ate at 12:40: Ate it logs it at 12:40, as lunch. Eating now: as from the camera. An idea (a friend's dinner on WhatsApp, a plate online): the read lands as an idea to cook, nothing is logged.";
      q.after(n);
    }, { mark, NOTE, PH });
    await crop(p, "r130whose"); await p.close();
    await shot(p, "r130later"); await p.close();
  } catch (e) { console.log("ERR", e.message); }
  await b.close(); server.kill();
})();
