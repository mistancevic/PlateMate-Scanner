// HP2 (0.2.114, board Stories90; Milan 27 October 14:25 to 15:34): the home page's short clips, recorded from the real app on
// test data. Start from anything: a barcode, a nutrition label, a group of labels, a photo of the meal; one plate; recipes for
// your day; the shopping list. The AI's answers are stand-ins (page.route) and the pack is invented (Fjell Skyr): no real brand.
// Run after npm run build: node scripts/record-home-clips.cjs. Writes public/landing/way-*.mp4, .webm and .webp, only when every
// rule in docs/rules/home-clips.md passes (HC1 to HC13); a failed rule stops the run and lists what failed.
// One clip alone: CLIPS=languages checks its rules and writes nothing; CLIPS=languages CLIPS_OUT=public/landing records it there.
const { chromium } = require("playwright");
const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const ROOT = path.resolve(__dirname, ".."), OUT = process.env.CLIPS_OUT || path.join(ROOT, "public/landing");
const PORT = "3296", U = `http://127.0.0.1:${PORT}`;
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "tests/flows/seed.json"), "utf8"));
const Fd = (re) => seed.foods.find((f) => re.test(f.name));
const meal = (id, title, parts, n, from) => { const items = parts.map(([f, g], k) => ({ id: `${id}${k}`, food: Fd(f), grams: g, locked: true })); const w = items.reduce((s, i) => s + i.grams, 0); return { id, title, items, portion: Math.round(w / n), savedAt: "2026-10-12T10:00:00Z", ...(from ? { from } : {}) }; };
const crepes = meal("m1", "DaaM good protein crêpes", [[/^Eggs/, 240], [/^Milk/, 500], [/^Oats/, 120], [/^Whey/, 60]], 4);
const pudding = meal("m2", "Chocolate quark pudding", [[/^Quark/, 250], [/^Whey/, 25], [/^Nutella/, 15], [/^Milk/, 50]], 1, "coach");
const sarma = meal("m3", "Sarma", [[/chicken/i, 800], [/^Rice/, 1200], [/^Oats/, 200]], 8);
const planned = (m, source) => { const w = m.items.reduce((s, i) => s + i.grams, 0), r = Math.min(1, m.portion / w); const k = m.items.reduce((s, i) => s + (i.food.calories * i.grams) / 100, 0) * r, p = m.items.reduce((s, i) => s + (i.food.protein * i.grams) / 100, 0) * r; return { title: m.title, kcal: Math.round(k), protein: Math.round(p), source, mealId: m.id, items: m.items, portion: m.portion }; };
const svg = (x) => "data:image/svg+xml;base64," + Buffer.from(x).toString("base64");
const ASSETS = path.join(ROOT, "design/home-clips");
const photo = (f) => (fs.existsSync(path.join(ASSETS, f)) ? "data:image/jpeg;base64," + fs.readFileSync(path.join(ASSETS, f)).toString("base64") : null);
// HC2: a real EAN-13, so the app's own scanner reads it from the camera picture
const CODE12 = "400604012345";
const CODE = CODE12 + String((10 - [...CODE12].reduce((n, d, k) => n + Number(d) * (k % 2 ? 3 : 1), 0) % 10) % 10);
const ean13 = (code, x0, y0, m, h) => {
  const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
  const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
  const Rr = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
  const P = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"][Number(code[0])];
  const bits = "101" + [...code.slice(1, 7)].map((d, k) => (P[k] === "L" ? L : G)[Number(d)]).join("") + "01010" + [...code.slice(7)].map((d) => Rr[Number(d)]).join("") + "101";
  return [...bits].map((b, k) => (b === "1" ? `<rect x="${x0 + k * m}" y="${y0}" width="${m}" height="${h}" fill="#111"/>` : "")).join("");
};
// HC6: made-up packs only. The back of a skyr cup, the barcode where the camera's barcode frame is
// HP3 (Coach Milan, 1 November 12:31): the tub is a picture made with AI for an invented brand, Fjell; the real EAN-13
// the app's scanner reads is drawn into its empty white label by design/home-clips/pack.py
const BARCODE = photo("pack-barcode.jpg");
const LABEL_ROWS = [["Energy", "276 kJ / 66 kcal"], ["Fat", "0.3 g"], ["of which saturates", "0.2 g"], ["Carbohydrate", "3.8 g"], ["of which sugars", "3.8 g"], ["Protein", "11.6 g"], ["Salt", "0.1 g"]];
const LABEL = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960"><rect width="720" height="960" fill="#e9e2d0"/><rect x="190" y="230" width="340" height="470" fill="#fff" stroke="#222" stroke-width="3"/><text x="206" y="272" font-family="Arial" font-weight="700" font-size="24">Nutrition declaration</text><text x="206" y="302" font-family="Arial" font-size="19">per 100 g</text>${LABEL_ROWS.map(([a, b], i) => `<line x1="206" x2="514" y1="${320 + i * 52}" y2="${320 + i * 52}" stroke="#222" stroke-width="1.5"/><text x="206" y="${354 + i * 52}" font-family="Arial" font-size="19">${a}</text><text x="514" y="${354 + i * 52}" font-family="Arial" font-size="19" text-anchor="end">${b}</text>`).join("")}</svg>`);
// HC4: three packs in one picture
// the camera shows the middle of the picture (x 140 to 580 of 720): the three packs stand there
const cup = (x, top, name, line, color) => `<rect x="${x}" y="${top}" width="136" height="250" rx="16" fill="#f7f5ef" stroke="#d8d2c4" stroke-width="3"/><rect x="${x}" y="${top + 26}" width="136" height="58" fill="${color}"/><text x="${x + 68}" y="${top + 66}" font-family="Georgia" font-size="${name.length > 6 ? 22 : 28}" fill="#fff" text-anchor="middle">${name}</text><text x="${x + 68}" y="${top + 126}" font-family="Arial" font-weight="700" font-size="18" fill="${color}" text-anchor="middle">${line}</text>`;
const GROUP = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="960"><rect width="720" height="960" fill="#cdbb9f"/>${cup(146, 360, "Fjell", "SKYR", "#2e5d8f")}${cup(292, 340, "Kornfeld", "OATS", "#8a5a1f")}${cup(438, 360, "Nusshof", "PEANUT", "#b3261e")}</svg>`);
const MEAL = photo("meal.jpg");
const RECIPE_PHOTOS = { m1: photo("recipe-crepes.jpg"), m2: photo("recipe-pudding.jpg"), m3: photo("recipe-sarma.jpg"), "m-pr": photo("recipe-prebranac.jpg") };
// HC11 in every language: the bar's Explorer and Clients as the app's three word files name them (Entdecken, Istraživač)
const tabWords = (k) => { const out = [JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n/en.json"), "utf8"))[k]];
  for (const f of ["sr-Latn", "de"]) { const l = JSON.parse(fs.readFileSync(path.join(ROOT, `src/i18n/${f}.json`), "utf8")).screens?.[k]; if (l?.checked) out.push(l.text); }
  return new RegExp(out.join("|")); };
const EXPLORER_TAB = tabWords("tab.explorer"), CLIENTS_TAB = tabWords("tab.clients");
const SKYR = { success: true, product_name: "Fjell Skyr natural", brand: "Fjell", basis: "100g", calories: 66, protein: 11.6, fats: 0.3, carbs: 3.8, fiber: 0, notes: "", error_reason: "", table: [], source: "Product database · review required" };
const LABEL_READ = { ...SKYR, source: "Label photo · review required", table: LABEL_ROWS.map(([name, v]) => ({ name, amount: Number(String(v).match(/([\d.]+) ?k?c?a?l?$/)?.[1] ?? 0), unit: /kcal/.test(v) ? "kcal" : "g" })) };
const GROUP_READ = { entities: [
  { ...SKYR },
  { product_name: "Kornfeld Oats", brand: "Kornfeld", calories: 372, protein: 13.5, fats: 7, carbs: 58.7, fiber: 10 },
  { product_name: "Nusshof Peanut butter", brand: "Nusshof", calories: 588, protein: 25, fats: 50, carbs: 20, fiber: 6 }] };
// HP3 (Coach Milan, 1 November 12:31): the meal is Milan's real dinner of 31 October, salmon, potatoes and broccoli
const READ = { dish: "Salmon with potatoes and broccoli", foods: [
  { name: "Salmon, oven baked", grams: 230, low: 180, high: 280, calories: 206, protein: 22.1, fats: 12.4, carbs: 0, fiber: 0, confidence: "medium" },
  { name: "Baby potatoes, with herbs", grams: 220, low: 170, high: 270, calories: 98, protein: 2, fats: 1.5, carbs: 19, fiber: 1.8, confidence: "medium" },
  { name: "Broccoli, cooked", grams: 260, low: 200, high: 320, calories: 35, protein: 2.4, fats: 0.4, carbs: 7.2, fiber: 3.3, confidence: "medium" }], unsure: null };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const fails = []; const rule = (ok, id, what) => { console.log(`${ok ? "ok  " : "FAIL"} ${id} ${what}`); if (!ok) fails.push(`${id} ${what}`); };
  // HC5 before anything: the photos must be there
  rule(Boolean(MEAL), "HC5", `the meal photo: ${path.relative(ROOT, path.join(ASSETS, "meal.jpg"))}`);
  rule(Boolean(BARCODE), "HC5", "the pack photo: design/home-clips/pack-barcode.jpg");
  for (const [id, f] of [["m1", "recipe-crepes.jpg"], ["m2", "recipe-pudding.jpg"], ["m3", "recipe-sarma.jpg"], ["m-pr", "recipe-prebranac.jpg"]]) rule(Boolean(RECIPE_PHOTOS[id]), "HC5", `a recipe photo: design/home-clips/${f}`);
  // HC9: the page says what the clips are
  // since DT203 the note's words live in src/i18n/en.json; LandingScreen.tsx shows them by their keys
  { const en = JSON.parse(fs.readFileSync(path.join(ROOT, "src/i18n/en.json"), "utf8")), ls = fs.readFileSync(path.join(ROOT, "src/screens/LandingScreen.tsx"), "utf8");
    const notes = Object.keys(en).filter((k) => /^home\./.test(k) && /Clips of the app on test data/.test(en[k]));
    rule(notes.length > 0 && notes.every((k) => ls.includes(`w("${k}")`)), "HC9", `the section says the clips are the app on test data (${notes.join(", ") || "no line"})`); }
  const server = spawn(process.execPath, ["dist/server.cjs"], { cwd: ROOT, env: { ...process.env, NODE_ENV: "production", PORT, GEMINI_API_KEY: "" }, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { await fetch(U + "/"); break; } catch { await sleep(500); } }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "clips-"));
  // the camera sees a picture: each one becomes a fake camera feed, so the photos taken in the clip show it too
  const feeds = {};
  { const b0 = await chromium.launch(); const pg = await b0.newPage({ viewport: { width: 720, height: 960 } });
    for (const [k, src] of [["barcode", BARCODE], ["label", LABEL], ["group", GROUP], ["meal", MEAL]]) {
      if (!src) continue;
      // HP3: every picture is a camera view now, the meal too (before, a cover photo sat on a blurred copy of itself)
      const fit = `<img src="${src}" style="width:720px;height:960px;object-fit:cover">`;
      await pg.setContent(`<body style="margin:0;position:relative;width:720px;height:960px;overflow:hidden">${fit}</body>`); await sleep(400);
      const png = path.join(tmp, `${k}.png`); await pg.screenshot({ path: png });
      feeds[k] = path.join(tmp, `${k}.y4m`);
      execFileSync("ffmpeg", ["-y", "-loop", "1", "-i", png, "-t", "2", "-r", "15", "-vf", "scale=720:960,format=yuv420p", feeds[k]], { stdio: "ignore" });
    }
    await b0.close(); }
  const made = [], strokes = [];
  // CLIPS=shop,label records only those, to try a change; it never writes clips into public/landing. With CLIPS_OUT=<dir> it
  // writes them there (scripts/record-built-video.cjs does this for the /built video, BP1 0.3.52)
  const ONLY = process.env.CLIPS ? process.env.CLIPS.split(",") : null;
  // a small seeded random (mulberry32), so a clip's hand is the same on every run and different from the other clips'
  const seeded = (k) => { let a = [...k].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703); return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const clip = async (name, run, x = {}) => {
    if (ONLY && !ONLY.includes(name)) return;
    const dir = path.join(tmp, name); fs.mkdirSync(dir);
    const b = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", ...(x.feed && feeds[x.feed] ? [`--use-file-for-fake-video-capture=${feeds[x.feed]}`] : [])] });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, permissions: ["camera"], timezoneId: "Europe/Berlin", recordVideo: { dir, size: { width: 390, height: 844 } } });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date(x.time || "2026-10-25T13:05:00"));
    const s = { ...seed, items: x.items ?? [], meals: x.meals ?? [], feedback: [], ...(x.state || {}) };
    await page.addInitScript(([s, plan]) => { if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-12T08:00:00Z", source: "exact" }));
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan", "Italian"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-05T08:00:00Z", consentBodyAt: "2026-10-05T08:00:00Z", declaredAt: "2026-10-05T08:00:00Z", aiConfirmedAt: "2026-10-05T08:00:00Z" }));
      if (plan) localStorage.setItem("chefmealan-planned", JSON.stringify(plan));
      localStorage.setItem("seeded", "1"); }, [s, x.plan || null]);
    // HC1, HC10 (Milan 27 October 17:14: the taps and the movement looked like one pattern on every clip): a fingertip, as a
    // phone's "show touches" draws it. It travels to each tap on a slight curve with ease in and out, presses (smaller, blue),
    // lifts with a ripple; a scroll is a drag with the page moving under the finger, then the page glides on. The finger rests
    // faint between actions and fades when idle. Everything is counted, so the rules can check it.
    await page.addInitScript(() => {
      const W = window; W.__rings = 0; W.__ripples = 0; W.__swipes = 0; W.__travels = 0; W.__synced = [];
      let f = null, cx = -100, cy = -100, idle = 0;
      const css = ".hc-f{position:fixed;z-index:2147483647;left:0;top:0;width:42px;height:42px;margin:-21px 0 0 -21px;border-radius:50%;background:rgba(23,39,66,.38);border:2.5px solid rgba(255,255,255,.95);box-shadow:0 0 0 1px rgba(23,39,66,.35),0 4px 12px rgba(0,0,0,.28);pointer-events:none;opacity:0;transition:opacity .3s,transform .11s ease-out,background .11s}.hc-f.on{opacity:.9}.hc-f.down{opacity:1;transform:scale(.8);background:rgba(46,123,232,.75)}.hc-rip{position:fixed;z-index:2147483646;width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:50%;border:3px solid rgba(46,123,232,.85);pointer-events:none;animation:hc-rip .5s ease-out forwards}@keyframes hc-rip{from{transform:scale(.8);opacity:.9}to{transform:scale(2);opacity:0}}";
      const ensure = () => { if (f) return; const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st); f = document.createElement("div"); f.className = "hc-f"; document.body.appendChild(f); };
      const at = (x, y) => { cx = x; cy = y; f.style.left = x + "px"; f.style.top = y + "px"; };
      const wake = () => { clearTimeout(idle); f.classList.add("on"); };
      const rest = () => { clearTimeout(idle); idle = setTimeout(() => f && f.classList.remove("on"), 1300); };
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      const frames = (ms, step) => new Promise((done) => { const t0 = performance.now(); const go = (now) => { const t = Math.min(1, (now - t0) / ms); step(t); t < 1 ? requestAnimationFrame(go) : done(); }; requestAnimationFrame(go); });
      addEventListener("pointerdown", () => { W.__rings++; }, true);
      // HC13 (Coach Milan, 1 November 14:06: hands free must look hands free): a voice command shows as a bubble with the words
      // said, at the bottom, while the app answers it; nothing is tapped
      W.__said = 0;
      W.__voice = (text) => { const st = document.getElementById("hc-v-css") || Object.assign(document.head.appendChild(document.createElement("style")), { id: "hc-v-css", textContent: ".hc-v{position:fixed;z-index:2147483647;left:50%;bottom:118px;transform:translate(-50%,8px);background:#172742;color:#fff;font:800 20px Nunito,system-ui,sans-serif;padding:10px 18px 10px 14px;border-radius:999px;box-shadow:0 6px 18px rgba(0,0,0,.3);display:flex;gap:10px;align-items:center;opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;white-space:nowrap}.hc-v.on{opacity:1;transform:translate(-50%,0)}.hc-v i{width:12px;height:12px;border-radius:50%;background:#3ddc84;box-shadow:0 0 0 6px rgba(61,220,132,.25)}" });
        void st; W.__said++; const v = document.createElement("div"); v.className = "hc-v"; v.innerHTML = "<i></i>\u201C" + text + "\u201D"; document.body.appendChild(v);
        requestAnimationFrame(() => v.classList.add("on")); setTimeout(() => v.classList.remove("on"), 1050); setTimeout(() => v.remove(), 1400); };
      W.__finger = {
        // travel on a quadratic curve; bend is how far the curve leans, in px
        move: async (x, y, ms, bend, from) => { ensure(); if (from) at(from[0], from[1]); wake(); W.__travels++;
          const x0 = cx, y0 = cy, dx = x - x0, dy = y - y0, len = Math.hypot(dx, dy) || 1, mx = (x0 + x) / 2 - (dy / len) * bend, my = (y0 + y) / 2 + (dx / len) * bend;
          await frames(ms, (t) => { const e = ease(t), u = 1 - e; at(u * u * x0 + 2 * u * e * mx + e * e * x, u * u * y0 + 2 * u * e * my + e * e * y); }); },
        down: () => { ensure(); wake(); f.classList.add("down"); },
        up: () => { f.classList.remove("down"); W.__ripples++; const r = document.createElement("div"); r.className = "hc-rip"; r.style.left = cx + "px"; r.style.top = cy + "px"; document.body.appendChild(r); setTimeout(() => r.remove(), 600); rest(); },
        // a drag up by d px over ms, the page moving with the finger, then a glide of g px
        drag: async (d, ms, g, gms) => { ensure(); wake(); W.__swipes++; f.classList.add("down");
          let el = document.elementFromPoint(cx, cy); while (el && !(el.scrollHeight > el.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(el).overflowY))) el = el.parentElement;
          const sc = el || document.scrollingElement, top0 = sc.scrollTop, y0 = cy;
          await frames(ms, (t) => { const e = t; at(cx, y0 - d * e); sc.scrollTop = top0 + d * e; });
          const moved = sc.scrollTop - top0; f.classList.remove("down"); rest();
          const top1 = sc.scrollTop; await frames(gms, (t) => { sc.scrollTop = top1 + g * (1 - Math.pow(1 - t, 3)); });
          W.__synced.push({ finger: d, page: moved, end: sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2 }); },
      };
    });
    if (x.init) await page.addInitScript(x.init);
    await require(path.join(ROOT, "tests/flows/adult.cjs"))(page);
    await page.route("**/api/cover", (r) => r.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.route("**/api/dish", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ makesIt: true, why: "Salmon with potatoes and broccoli: a plain dinner plate.", around: "", better_as: "" }) }));
    await page.route("**/api/product/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SKYR) }));
    await page.route("**/api/scan", (r) => { const group = r.request().postDataJSON()?.mode === "group"; r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(group ? GROUP_READ : LABEL_READ) }); });
    await page.route("**/api/plate-photo", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(READ) }));
    if (x.routes) await x.routes(page);
    const t0 = Date.now();
    await page.goto(U + (x.path || "/plate")); await sleep(1600);
    // HP3: steps to reach the clip's first screen, before it starts; clicked without a pointer, so no finger is drawn
    if (x.setup) { const click = async (loc, wait = 600) => { await loc.waitFor({ timeout: 6000 }); await loc.evaluate((el) => el.click()); await sleep(wait); }; await x.setup(page, click); await sleep(500); }
    let from = (Date.now() - t0) / 1000, lastAct = from, taps = 0, swipes = 0, says = 0, posterAt = null;
    // HC10: this clip's hand. A seeded random per clip: where the thumb comes from, which side it scrolls on, how fast it moves
    // DT253: a clip with many taps can have a quicker hand (x.quick, under 1): travel and the moment before a press are shorter
    const rnd = seeded(name), hand = { side: 210 + rnd() * 110, pace: 0.85 + rnd() * 0.4, entry: [250 + rnd() * 120, 880] }, quick = x.quick || 1;
    let first = true, last = hand.entry;
    const travel = async (x, y) => { const d = Math.hypot(x - last[0], y - last[1]);
      const ms = Math.round(((first ? 480 : 220) + Math.min(320, d * 0.6) * hand.pace) * quick), bend = (rnd() - 0.5) * Math.min(80, d * 0.25);
      await page.evaluate(([x, y, ms, bend, from]) => window.__finger.move(x, y, ms, bend, from), [x, y, ms, bend, first ? hand.entry : null]); first = false; last = [x, y]; };
    const act = {
      // a tap: the finger travels there, presses a little off the centre as a thumb does, a real click, lifts
      tap: async (loc, wait = 900) => { await loc.waitFor({ timeout: 6000 }); const bb = await loc.boundingBox();
        const x = bb.x + bb.width * (0.5 + (rnd() - 0.5) * Math.min(0.4, 24 / bb.width)), y = bb.y + bb.height * (0.5 + (rnd() - 0.5) * Math.min(0.35, 14 / bb.height));
        const hit = await loc.evaluate((el, [x, y]) => { const h = document.elementFromPoint(x, y); return Boolean(h && (el === h || el.contains(h))); }, [x, y]);
        if (!hit) { const info = await page.evaluate(([x, y]) => { const h = document.elementFromPoint(x, y); const sc = document.scrollingElement; return `${h ? h.tagName + "." + h.className + " " + (h.textContent || "").slice(0, 30) : "nothing"}; scrollTop ${sc.scrollTop} of ${sc.scrollHeight}`; }, [x, y]); throw new Error(`tap at ${Math.round(x)},${Math.round(y)} on ${(await loc.textContent().catch(() => "")).slice(0, 30)} lands on ${info}; scroll first`); }
        await travel(x, y); await sleep((90 + rnd() * 120) * quick);
        await page.evaluate(() => window.__finger.down()); await page.mouse.move(x, y); await page.mouse.down(); await sleep(70 + rnd() * 60); await page.mouse.up(); await page.evaluate(() => window.__finger.up());
        taps++; lastAct = (Date.now() - t0) / 1000; await sleep(wait); },
      // a scroll: the finger goes to the scroll side, drags up part of the way with the page under it, and the page glides on
      swipe: async (dy, wait = 1200) => { const x = hand.side + (rnd() - 0.5) * 30, y = 560 + rnd() * 140;
        await travel(x, y); await sleep((120 + rnd() * 100) * quick);
        const d = Math.round(Math.min(dy * (0.5 + rnd() * 0.15), 300)), ms = Math.round((340 + rnd() * 160) * hand.pace * quick), gms = Math.round((360 + Math.min(520, (dy - d) * 0.45) + rnd() * 120) * Math.max(quick, 0.7));
        await page.evaluate(([d, ms, g, gms]) => window.__finger.drag(d, ms, g, gms), [d, ms, dy - d, gms]); last = [x, y - d];
        strokes.push(`${Math.round(x)}/${d}/${ms}`); swipes++; lastAct = (Date.now() - t0) / 1000; await sleep(wait); },
      // a voice command: the bubble shows the words, then the app hears them through the browser's recognition
      say: async (text, wait = 1200) => { says++; await page.evaluate((t) => window.__voice(t), text); await sleep(380);
        const heard = await page.evaluate((t) => window.__hear(t.toLowerCase()), text); if (!heard) rule(false, "HC13", `${name}: the app was not listening for "${text}"`);
        lastAct = (Date.now() - t0) / 1000; await sleep(wait); },
      mark: () => { from = (Date.now() - t0) / 1000; },
      at: () => (Date.now() - t0) / 1000 - from,
      // HC12 (DT253): the poster is this moment of the clip, what the clip is about, in place of the last screen
      poster: () => { posterAt = (Date.now() - t0) / 1000; },
      // DT253: an end frame on the app's blue, the words given; the loop's fade follows it (HC7). Not an action: nothing tapped
      card: async (text) => { await page.evaluate((t) => { const c = document.createElement("div"); c.className = "hc-card";
        c.style.cssText = "position:fixed;inset:0;z-index:2147483645;display:grid;place-items:center;background:#2e7be8;color:#fff;font:800 25px Nunito,system-ui,sans-serif;text-align:center;padding:0 24px;opacity:0;transition:opacity .35s";
        c.textContent = t; document.body.appendChild(c); requestAnimationFrame(() => (c.style.opacity = "1")); }, text); },
    };
    let checks = {};
    try { checks = (await run(page, act)) || {}; } catch (e) { rule(false, "run", `${name}: ${e.message.split("\n")[0]}`); }
    await sleep(1700);
    // HC11 (Coach Milan, 1 November 11:40): the app's bar, where the clip shows it, has all five tabs with Explorer; a coach's
    // bar has six, Clients the sixth (DT210, 0.3.50)
    const bar = await page.evaluate(() => { const n = document.querySelector(".bottom-nav"); if (!n || getComputedStyle(n).display === "none") return null; return [...n.querySelectorAll("button")].map((x) => x.textContent.trim()); }).catch(() => null);
    rule(bar === null || ((bar.length === 5 || (bar.length === 6 && bar.some((t) => CLIENTS_TAB.test(t)))) && bar.some((t) => EXPLORER_TAB.test(t))), "HC11", `${name}: the bar ${bar ? bar.join(", ") : "is not on screen"}`);
    const saidDrawn = await page.evaluate(() => window.__said || 0).catch(() => -1);
    if (says) rule(saidDrawn === says, "HC13", `${name}: ${says} voice commands, ${saidDrawn} bubbles`);
    const drawn = await page.evaluate(() => ({ rings: window.__rings, ripples: window.__ripples, swipes: window.__swipes, travels: window.__travels, synced: window.__synced })).catch(() => ({ rings: -1, ripples: -1, swipes: -1, travels: -1, synced: [] }));
    const end = (Date.now() - t0) / 1000;
    const video = page.video(); await ctx.close(); await b.close(); const raw = await video.path();
    const len = end - from;
    rule(drawn.rings === taps && drawn.ripples === taps && drawn.swipes === swipes && taps + swipes > 0, "HC1", `${name}: ${taps} taps, ${drawn.rings} presses, ${drawn.ripples} lifts; ${swipes} swipes, ${drawn.swipes} drawn`);
    rule(drawn.travels === taps + swipes, "HC10", `${name}: the finger travelled to every action (${drawn.travels} of ${taps + swipes})`);
    const slip = drawn.synced.filter((v) => !v.end && Math.abs(v.page - v.finger) > 4);
    rule(slip.length === 0, "HC10", `${name}: the page moved with the finger on every scroll${slip.length ? ": " + slip.map((v) => `${v.finger} px finger, ${v.page} px page`).join(", ") : ""}`);
    rule(end - lastAct >= 1.5, "HC7", `${name}: the last screen held ${(end - lastAct).toFixed(1)} s`);
    // HC8: 6 to 12 s; the language clip up to 20 s (Coach Milan, 7 November 14:06: nine frames, about 2 s each)
    const most = x.most || 12;
    rule(len >= 6 && len <= most, "HC8", `${name}: ${len.toFixed(1)} s (6 to ${most})`);
    const poster = posterAt === null ? null : posterAt - from;
    if (x.poster) rule(poster !== null && poster > 1 && poster < len - 1.5, "HC12", `${name}: the poster is ${x.poster}, at ${poster === null ? "no moment" : poster.toFixed(1) + " s"}`);
    for (const [k, v] of Object.entries(checks)) rule(Boolean(v.ok), k, `${name}: ${v.what}`);
    made.push({ name, raw, from, len, most, poster });
  };
  // HC7: fade in and out to the page's background, so the loop reads as a new start
  const encode = ({ name, raw, from, len, most, poster }) => {
    const base = path.join(OUT, `way-${name}`), t = Math.min(len, most + 0.5);
    const vf = `fade=t=in:st=0:d=0.3:color=0xEEF3FC,fade=t=out:st=${(t - 0.4).toFixed(2)}:d=0.4:color=0xEEF3FC`;
    const cut = ["-y", "-ss", from.toFixed(2), "-i", raw, "-t", t.toFixed(2), "-an", "-vf", vf];
    execFileSync("ffmpeg", [...cut, "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${base}.mp4`], { stdio: "ignore" });
    execFileSync("ffmpeg", [...cut, "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0", "-deadline", "good", "-cpu-used", "4", `${base}.webm`], { stdio: "ignore" });
    // HC12 (Coach Milan, 1 November 11:57): the poster is the clip's last settled screen, what the clip is about, before
    // the fade; the first frame was Plan for both the recipes and the shopping list
    // for the four ways in, what the clip is about is the camera with the pack or the plate in it, not the Plate after
    // DT253: the languages clip's poster is the moment it marked, the recipe in German
    const at = poster !== null ? poster.toFixed(2) : { barcode: 0.8, label: 1.6, group: 1.6, meal: 0.9, coach: 0.8, explorer: 2.0 }[name];
    execFileSync("ffmpeg", ["-y", ...(at ? ["-ss", String(at)] : ["-sseof", "-1.1"]), "-i", `${base}.mp4`, "-frames:v", "1", "-c:v", "libwebp", "-quality", "70", `${base}.webp`], { stdio: "ignore" });
    console.log("clip", name, `${len.toFixed(1)} s`);
  };
  // every click goes through a.tap, so every ring is counted (HC1)
  const manual = async (page, a) => { const sw = page.locator(".auto-switch"); if (await sw.count() && /Auto shot/.test(await sw.textContent())) await a.tap(sw, 200); };
  const openScan = async (page, a) => { await a.tap(page.getByRole("button", { name: "Scan", exact: true }).first(), 0); await page.locator(".auto-switch").waitFor({ timeout: 4000 }).catch(() => {}); await manual(page, a); await sleep(500); };
  const toMode = async (page, a, m) => { await a.tap(page.locator(".cam-modes button").filter({ hasText: m }), 500); };
  const saveFood = async (page, a) => {
    await a.tap(page.getByText(/I checked the values/).first(), 450);
    await a.tap(page.getByRole("button", { name: /Confirm & save food/ }), 1600);
  };
  const onPlate = (page, name) => page.locator(".plate-card").getByText(name).count().then((n) => n > 0).catch(() => false);
  try {
    await clip("barcode", async (page, a) => {
      await openScan(page, a); await toMode(page, a, "Barcode"); a.mark();
      // the app's scanner reads the code from the camera picture; nothing is typed
      await page.getByText(/Code read/).waitFor({ timeout: 8000 }).catch(() => {});
      const read = await page.getByText(/Code read/).first().textContent().catch(() => "");
      await sleep(700);
      await a.tap(page.getByRole("button", { name: "Use the code only" }), 1800);
      await a.swipe(1300, 600);
      await saveFood(page, a);
      return { HC2: { ok: read.includes(CODE), what: `the scanner read the code on the pack: ${read.trim()} (pack: ${CODE})` }, HC3: { ok: await onPlate(page, "Fjell Skyr natural"), what: "the food is on the plate" } };
    }, { feed: "barcode" });
    await clip("label", async (page, a) => {
      await openScan(page, a); await toMode(page, a, "Label"); a.mark(); await sleep(400);
      await a.tap(page.locator("#camera-shutter-button"), 500);
      await a.tap(page.getByRole("button", { name: /^Analyze/ }), 1300);
      await a.swipe(1360, 500);
      const energy = await page.locator("input").evaluateAll((xs) => xs.map((x) => x.value)).catch(() => []);
      await saveFood(page, a);
      return { HC3: { ok: energy.includes("66") && await onPlate(page, "Fjell Skyr natural"), what: `the app's table holds the label's 66 kcal, then the food is on the plate` } };
    }, { feed: "label" });
    await clip("group", async (page, a) => {
      await openScan(page, a); await toMode(page, a, "Group"); a.mark(); await sleep(1000);
      await a.tap(page.locator("#camera-shutter-button"), 900);
      await a.tap(page.getByRole("button", { name: /^Analyze/ }), 3600);
      const all = (await page.locator("main").textContent().catch(() => "")) || "";
      const found = ["Fjell Skyr natural", "Kornfeld Oats", "Nusshof Peanut butter"].filter((n) => all.includes(n));
      return { HC4: { ok: found.length === 3, what: `three packs in the picture, ${found.length} named at the end` } };
    }, { feed: "group" });
    if (MEAL) await clip("meal", async (page, a) => {
      await a.tap(page.locator(".mp-button"), 1000); a.mark(); await sleep(900);
      await a.tap(page.locator("#camera-shutter-button"), 2600);
      await a.swipe(650, 1500); await a.swipe(450, 1200);
    }, { feed: "meal" });
    const Fx = (id, name, calories, protein, fats, carbs, fiber) => ({ ...seed.foods[0], id, name, brand: "estimate", source: "estimate", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, table: undefined });
    const CH = Fx("sal", "Salmon, oven baked", 206, 22.1, 12.4, 0, 0), RI = Fx("pot", "Baby potatoes, with herbs", 98, 2, 1.5, 19, 1.8), SA = Fx("bro", "Broccoli, cooked", 35, 2.4, 0.4, 7.2, 3.3);
    await clip("plate", async (page, a) => {
      await sleep(1200);
      await a.tap(page.locator(".letters-row").first(), 1600);
      await a.swipe(380, 1400);
      await a.tap(page.locator(".nt").getByRole("button", { name: /Per 100 kcal/ }), 600);
    }, { state: { foods: [...seed.foods, CH, RI, SA], title: "Salmon with potatoes and broccoli", items: [{ id: "a", food: CH, grams: 230, locked: false }, { id: "b", food: RI, grams: 220, locked: false }, { id: "c", food: SA, grams: 260, locked: false }] } });
    const withPhoto = (m) => (RECIPE_PHOTOS[m.id] ? { ...m, photo: RECIPE_PHOTOS[m.id] } : m);
    const meals = [crepes, sarma, pudding].map(withPhoto);
    const PLAN = {}; ["20", "21", "22", "23", "24", "25", "26"].forEach((d, i) => { PLAN[`2026-10-${d}`] = { breakfast: planned(crepes, "mine"), lunch: i % 2 ? planned(sarma, "mine") : planned(pudding, "coach") }; });
    await clip("recipes", async (page, a) => {
      await a.tap(page.locator("nav button").filter({ hasText: "Recipes" }), 1800);
      await a.swipe(420, 1500); await a.swipe(420, 1500);
      const tiles = await page.evaluate(() => [...document.querySelectorAll("main .recipe-tile")].map((t) => Boolean(t.querySelector("img"))));
      return { HC5: { ok: tiles.length >= 3 && tiles.every(Boolean), what: `every recipe tile shows its photo (${tiles.filter(Boolean).length} of ${tiles.length})` } };
    }, { meals, plan: PLAN, time: "2026-10-20T14:00:00Z", path: "/plan" });
    await clip("shop", async (page, a) => {
      await sleep(700); await a.swipe(240, 500); await a.tap(page.locator(".plan-shop"), 1200);
      await a.tap(page.getByRole("dialog", { name: "Shopping lists" }).getByRole("button", { name: /Make shopping list/ }), 1200);
      const rows = page.locator(".shop-row"); await a.tap(rows.nth(1), 1100); await a.tap(rows.nth(3), 600);
    }, { meals, plan: PLAN, time: "2026-10-20T14:00:00Z", path: "/plan" });
    // HP3 (0.3.42, board Stories147; Coach Milan 1 November 13:24 Go): four more clips, for Cook it, Your day, Explorer and the coach
    const Fc = (id, name, calories, protein, carbs, fats, fiber) => ({ ...seed.foods[0], id, name, brand: "", calories, protein, carbs, fats, fiber, photo: undefined, photos: undefined, icon: "🍽️" });
    const bowlItems = [[160, Fc("c", "Chicken breast, raw", 120, 22.5, 0, 2.6, 0)], [80, Fc("r", "Basmati rice, dry", 356, 8.5, 78, 0.9, 1.3)], [120, Fc("s", "Spinach, fresh", 23, 2.9, 3.6, 0.4, 2.2)], [8, Fc("o", "Olive oil", 884, 0, 0, 100, 0)], [6, Fc("g", "Garlic", 149, 6.4, 33, 0.5, 2.1)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
    const bowl = { id: "m-bowl", title: "Chicken rice bowl", items: bowlItems, portion: 374, savedAt: "2026-10-27T10:00:00Z", stepsFor: bowlItems.map((i) => i.food.name), steps: [
      "Rinse [[i:r|rice]] and bring it to the boil in 200 ml water. Cover and cook on low heat for 12 minutes.", "Cut [[i:c|chicken]] into strips. Season with salt and pepper.", "Slice [[i:g|garlic]] thin.",
      "Heat [[i:o|olive oil]] in a pan on medium high heat. Fry the chicken 6 minutes, turning once, until no pink is left inside.", "Add [[i:s|spinach]] and the garlic. Stir 2 minutes, until the spinach wilts.", "Put the rice in a bowl and the chicken and spinach on top."] };
    // the browser's voice is stood in for: nothing is read aloud in a recording
    const voice = () => { const synth = { speak: () => {}, cancel: () => {}, getVoices: () => [] }; Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true }); window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true }); window.__recs = [];
      window.SpeechRecognition = function () { const me = this; window.__recs.push(me); me.start = () => { me.on = true; }; me.stop = () => { me.on = false; }; };
      window.__hear = (text) => { const r = window.__recs.filter((x) => x.on).at(-1); if (!r || !r.onresult) return false; r.onresult({ results: [{ 0: { transcript: text }, isFinal: true, length: 1 }] }); return true; }; };
    await clip("cook", async (page, a) => {
      const cm = page.locator(".cook-mode");
      // one tap to turn the voice on; then only words (Coach Milan 14:06)
      await a.tap(cm.getByRole("button", { name: "Turn voice on" }), 900);
      await a.say("Next", 1000); await a.say("Next", 1000); await a.say("Repeat", 1100); await a.say("Next", 1100);
      await a.say("Timer 6 minutes", 1200);
      const t = await cm.textContent();
      return { HC13: { ok: /4 of 6/.test(t) && /6:00|5:5\d/.test(t), what: "by voice: step 4 of 6, its 6 minute timer running" } };
    }, { meals: [bowl], init: voice, path: "/", time: "2026-10-30T18:40:00", setup: async (page, click) => {
      await click(page.locator("nav button").filter({ hasText: "Recipes" }), 700);
      await click(page.locator(".recipe-tile").filter({ hasText: "Chicken rice bowl" }), 700);
      // DT211 v8 (0.3.53): Start cooking sits in the recipe's Steps block and opens cook mode straight away
      await click(page.getByRole("button", { name: "Start cooking", exact: true }), 1500); } });
    await clip("situation", async (page, a) => {
      await a.tap(page.locator(".ex-map .menu-row").filter({ hasText: "A late evening" }).first(), 1300);
      await a.swipe(520, 1500); await a.swipe(560, 1400);
      return { HP3: { ok: /A late evening after work/.test(await page.locator(".explorer").textContent()), what: "the situation page, A late evening after work" } };
    }, { path: "/", setup: async (page, click) => {
      await click(page.locator(".bottom-nav button").filter({ hasText: "Explorer" }), 700);
      await click(page.locator(".ex-parts").getByRole("radio", { name: "Situations" }), 600); } });
    await clip("explorer", async (page, a) => {
      await a.tap(page.locator(".ex-parts").getByRole("radio", { name: "The body" }), 1100);
      await a.swipe(300, 1100);
      await a.tap(page.locator(".ex-map .menu-row").filter({ hasText: "Glycogen" }).first(), 1300);
      await a.swipe(480, 1300);
      return { HP3: { ok: /Glycogen/.test(await page.locator(".explorer").textContent()), what: "The body, then the Glycogen page" } };
    }, { path: "/", setup: async (page, click) => { await click(page.locator(".bottom-nav button").filter({ hasText: "Explorer" }), 700); } });
    await clip("coach", async (page, a) => {
      await sleep(900);
      await a.tap(page.locator("section.waiting button.menu-row").filter({ hasText: /look at this/ }).first(), 1600);
      await a.swipe(380, 1300); await a.swipe(360, 600);
      return { HP3: { ok: !/Davorka/.test(await page.locator("main").textContent()), what: "made-up names only" } };
    }, { path: "/today?coachdemo", setup: async (page, click) => { await click(page.locator(".bottom-nav button").filter({ hasText: "Clients" }), 900); } });
    // DT253 (board Stories188; Coach Milan 7 November 13:45 to 14:06): Chef Mealan in three languages, nine beats of about 2 s.
    // Today in English; Settings, Language, Srpski; Danas; a recipe saved from a Serbian link, as written; Deutsch (Beta); the
    // recipe offered in German and translated (a stand-in for Chef Mealan's translation); cook mode on Get it ready, one "weiter"
    // heard; an end frame. The poster is the recipe in German (HC12).
    const Fl = (id, name, calories, protein, fats, carbs) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber: 0, photo: undefined, photos: undefined, icon: undefined, barcode: undefined });
    const prItems = [[250, Fl("be", "Pasulj, kuvan", 127, 8.7, 0.5, 23)], [120, Fl("on", "Crni luk", 40, 1.1, 0.1, 9)], [15, Fl("oi", "Suncokretovo ulje", 884, 0, 100, 0)]].map(([g, f], k) => ({ id: "i" + k, grams: g, food: f, locked: false }));
    const prebranac = { id: "m-pr", title: "Prebranac", items: prItems, portion: 385, savedAt: "2026-11-03T18:00:00Z", stepsFor: prItems.map((i) => i.food.name), photo: RECIPE_PHOTOS["m-pr"],
      source: { name: "recepti.rs", url: "https://recepti.rs/prebranac", from: "link" },
      steps: ["Iseci [[i:i1|crni luk]] na tanke polukrugove i propržite ga na [[i:i2|ulju]] 10 minuta, dok ne omekša.", "Dodaj [[i:i0|pasulj]], sve stavi u vatrostalnu posudu i peci 40 minuta na 200 °C."] };
    const GERMAN = { title: "Prebranac (gebackene Bohnen)", steps: ["Schneide die [[i:i1|Zwiebel]] in dünne Halbringe und brate sie 10 Minuten im [[i:i2|Öl]], bis sie weich ist.", "Gib die [[i:i0|Bohnen]] dazu, gib alles in eine Auflaufform und backe es 40 Minuten bei 200 °C."],
      foods: [{ id: "i0", name: "Bohnen, gekocht" }, { id: "i1", name: "Zwiebel" }, { id: "i2", name: "Sonnenblumenöl" }] };
    await clip("languages", async (page, a) => {
      const text = async (sel = "main") => ((await page.locator(sel).first().innerText().catch(() => "")) || "").replace(/\s+/g, " ");
      const menu = async (row, lang) => {
        await a.tap(page.locator("header .menu-button"), 120);
        await a.tap(page.locator(".menu-row").filter({ hasText: row[0] }).first(), 120);
        await a.tap(page.locator("button.menu-row").filter({ hasText: row[1] }).first(), 150);
        await a.tap(page.locator(".lang-row").filter({ hasText: lang }), 600);
      };
      const c = {}, beat = (n) => console.log(`     beat ${n} at ${a.at().toFixed(1)} s`);
      let tiles = [];
      const recipe = async () => {
        await a.tap(page.locator(".bottom-nav button").nth(3), 250);
        tiles = await page.evaluate(() => [...document.querySelectorAll("main .recipe-tile")].map((t) => Boolean(t.querySelector("img"))));
        await a.tap(page.locator(".recipe-tile").filter({ hasText: "Prebranac" }), 250);
      };
      // 1. Today in English
      beat(1); await sleep(700); c.en = /Today/.test(await text("header h1"));
      // 2. Menu, Settings, Language: Srpski (latinica)
      beat(2); await menu([/Settings/, /Language/], "Srpski");
      // 3. Today again: Danas
      beat(3); await a.tap(page.locator(".menu-head button.link").last(), 750); c.sr = /Danas/.test(await text("header h1"));
      // 4. Recipes: Prebranac, from a Serbian link, as written: its page in Srpski, the source recepti.rs
      beat(4); await recipe(); await sleep(650); c.asWritten = /Prebranac/.test(await text("main")) && /recepti\.rs/.test(await text(".rq-source"));
      // 5. Meni, Podešavanja, Jezik: Deutsch (Beta)
      beat(5); await menu([/Podešavanja|Settings/, /Jezik|Language/], "Deutsch");
      // 6. back on the recipe: Chef Mealan offers it in German, auf Deutsch zeigen
      beat(6); await recipe();
      const offer = page.locator(".rq-lang-offer");
      await offer.waitFor({ timeout: 6000 });
      await a.swipe(Math.round(await offer.evaluate((e) => e.getBoundingClientRect().top + document.scrollingElement.scrollTop)) - 120, 250);
      c.offer = /auf Deutsch zeigen/i.test(await text(".rq-lang-offer"));
      await a.tap(offer.locator(".pill-primary"), 400);
      // 7. the recipe in German, Übersetzt von Chef Mealan, the Original switch: the poster
      await page.locator(".rq-lang-switch").waitFor({ timeout: 6000 }); beat(7); await sleep(250); a.poster(); await sleep(950);
      c.german = /Schneide die .*Zwiebel/.test(await text(".rq-steps")) && /Übersetzt von Chef Mealan/.test(await text(".rq-lang")) && await page.locator(".rq-lang-switch").isVisible();
      // 8. Kochen starten: Get it ready, the foods as the German steps name them; "weiter" heard ticks the first
      beat(8); await a.tap(page.locator(".rq-start button").first(), 650);
      const ready = await text(".cook-mode .cook-ready-list");
      await a.say("weiter", 350);
      const put = await page.locator(".cook-mode .cook-ready-food.put").count();
      // 9. the end frame, on the app's blue
      beat(9); await a.card("English · Srpski · Deutsch (Beta)"); await sleep(300);
      return {
        HC5: { ok: tiles.length >= 1 && tiles.every(Boolean), what: `the recipe tile shows its photo (${tiles.filter(Boolean).length} of ${tiles.length})` },
        DT253: { ok: c.en && c.sr && c.asWritten && c.offer && c.german, what: `Today, then Danas; the recipe as written; auf Deutsch zeigen; in German with its switch (${JSON.stringify(c)})` },
        HC13: { ok: /Bohnen/.test(ready) && /Zwiebel/.test(ready) && put === 1, what: `Get it ready names ${ready.slice(0, 80)}; "weiter" ticked ${put}` },
      };
    }, { meals: [prebranac], path: "/today", time: "2026-11-07T12:20:00", most: 20, poster: "the recipe in German", quick: 0.5,
      // the voice stood in for, as in the cook clip; voice on was chosen before, so cook mode listens from the start
      init: `(${voice})(); try { localStorage.setItem("chefmealan-cook-voice", "on"); } catch { /* none kept */ }`,
      routes: async (page) => {
        await page.route("**/api/status", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ai: true, airtable: false, accessRequired: false }) }));
        await page.route("**/api/recipe/translate", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(GERMAN) })); } });
  } catch (e) { rule(false, "run", (e.stack || e.message).split("\n").slice(0, 3).join(" | ")); }
  rule(new Set(strokes).size === strokes.length, "HC10", `no two scrolls in the set are the same (${strokes.length} scrolls)`);
  server.kill();
  if (fails.length) { console.log(`\n${fails.length} rule(s) failed; no clip was replaced:\n  ${fails.join("\n  ")}`); process.exit(1); }
  if (ONLY && !process.env.CLIPS_OUT) { console.log("\nCLIPS set: rules checked, no clip written"); process.exit(0); }
  for (const m of made) encode(m);
  console.log(`\nall rules passed (HC1 to HC13); ${made.length} clips written`);
})();
