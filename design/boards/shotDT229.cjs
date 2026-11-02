// Board DT228 v2 and DT229 (Coach Milan 2 November 21:31): more than one photo of a meal, staged like a pack's sides, read
// together; and the shutter's steady ring, prominent. Now: 0.3.61 (main dist on 3387). New: the same pages with the change
// drawn in. Nothing in the repo changes.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3387";
const seed = JSON.parse(fs.readFileSync("/home/claude/platemate-scanner/tests/flows/seed.json", "utf8"));
const crepePic = "data:image/webp;base64," + fs.readFileSync("/home/claude/platemate-scanner/public/landing/hero/waffle-m.webp").toString("base64");
const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px", NOTE = `${mark};background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742`;
const F = (id, name, calories, protein, fats, carbs, fiber = 0) => ({ ...seed.foods[0], id, name, brand: "", source: "label", calories, protein, fats, carbs, fiber, photo: undefined, photos: undefined, icon: undefined, barcode: undefined, table: undefined, places: [] });
const crepes = [[104, F("eg", "Eggs", 143, 12.6, 9.5, 0.7)], [100, F("mi", "Milk 1.5%", 47, 3.4, 1.5, 4.9)], [35, F("wf", "Wheat flour, white", 364, 10, 1, 76, 2.7)], [25, F("wh", "vanilla whey protein powder", 380, 78, 6, 8)], [180, F("qu", "Quark, low fat (Magerquark)", 67, 12, 0.2, 4)], [81, F("ba", "Banana", 89, 1.1, 0.3, 22.8, 2.6)], [15, F("cc", "chocolate chips", 500, 5, 28, 60, 4)]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, food: f }));
const STEPS = ["Whisk [[i:eg|eggs]], [[i:mi|milk]], [[i:wf|wheat flour]] and [[i:wh|vanilla whey protein powder]] in a bowl until smooth.", "Heat a pan on the stovetop at 180 °C. Pour in batter and cook each crêpe for 2 minutes per side until golden.", "Stir [[i:qu|quark]] in a bowl until creamy. Slice [[i:ba|banana]] into thin pieces.", "Fill the crêpes, fold them over, and scatter [[i:cc|chocolate chips]] on top to serve."];
const TITLE = "Vanilla protein crepes with sweet quark and banana";
const recipe = { id: "m-cr", title: TITLE, items: crepes, portion: 540, steps: STEPS, stepsFor: crepes.map((i) => i.food.name), savedAt: "2026-11-02T16:40:00Z" };
seed.feedback = [];
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  const fresh = async (state = {}, path = "/today") => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB", timezoneId: "Europe/Berlin", permissions: ["camera"] });
    const p = await ctx.newPage();
    const s = { ...seed, meals: [recipe], items: [], title: "", ...state };
    await p.addInitScript((s) => {
      window.SpeechRecognition = function () { this.start = () => {}; this.stop = () => {}; };
      Object.defineProperty(navigator, "wakeLock", { value: { request: async () => ({ release: async () => {} }) }, configurable: true });
      if (localStorage.getItem("seeded")) return; localStorage.setItem("platemate-pilot-v1", JSON.stringify(s));
      localStorage.setItem("chefmealan-goal", JSON.stringify({ band: "maintain", setBy: "you", setAt: "2026-10-20T16:00:00Z", source: "profile" }));
      localStorage.setItem("chefmealan-region", "munich"); localStorage.setItem("chefmealan-cook-voice", "on");
      localStorage.setItem("chefmealan-personal", JSON.stringify({ dayMode: "same", sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, kitchens: ["Balkan"], plan: Array(7).fill({ work: true, kind: "rest" }), lifestyle: { weekdays: "work", hours: "fixed", move: "sitting", meals: 3 } }));
      localStorage.setItem("chefmealan-safety", JSON.stringify({ situations: [], flags: [], allergies: [], none: true, adultAt: "2026-10-06T09:00:00Z", consentBodyAt: "2026-10-06T09:00:00Z", declaredAt: "2026-10-06T09:00:00Z", aiConfirmedAt: "2026-10-06T09:00:00Z" }));
      localStorage.setItem("seeded", "1"); }, s);
    await require("/home/claude/platemate-scanner/tests/flows/adult.cjs")(p);
    await p.goto(U + path); await p.waitForTimeout(1500);
    return p;
  };
  const hide = (p) => p.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, .chat-fab, [class*=fab]")) t.style.display = "none"; for (const el of document.querySelectorAll("body *")) { const cs = getComputedStyle(el); if (cs.position !== "fixed" || el.closest(".cook-mode") || el.classList.contains("cook-mode")) continue; if (el.tagName === "NAV" || el.querySelector("nav")) { if (el.getBoundingClientRect().top > 100) { el.style.position = "static"; document.body.appendChild(el); } } else el.style.display = "none"; } });
  const shot = async (p, name, full = true) => { await p.waitForTimeout(300); await hide(p); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200); await p.screenshot({ path: `${R}/${name}.png`, fullPage: full }); console.log("shot", name); };
  const note = (p, t, where = "main") => p.evaluate(({ t, NOTE, where }) => { document.querySelector(".bnote")?.remove(); const d = document.createElement("div"); d.className = "bnote"; d.style.cssText = NOTE; d.textContent = t; const m = document.querySelector(where) || document.querySelector("main"); m.prepend(d); }, { t, NOTE, where });
  const cut = async (p, name, sel, h = 1300) => { await p.waitForTimeout(300); await hide(p); const y = await p.evaluate((sel) => { const e = document.querySelector(sel); return e ? Math.max(0, e.getBoundingClientRect().top + scrollY - 120) : 0; }, sel); await p.setViewportSize({ width: 390, height: h }); await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(250); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };





  const PLATE = require("node:fs").readFileSync("/home/claude/platemate-scanner/tests/flows/plate.jpg");
  const pic = "data:image/jpeg;base64," + PLATE.toString("base64");
  const camShot = async (p, name) => { await p.waitForTimeout(300); await p.evaluate(() => { for (const t of document.querySelectorAll(".toast, .chef-fab, .chat-fab")) t.style.display = "none"; }); await p.screenshot({ path: `${R}/${name}.png` }); console.log("shot", name); };
  // ---- DT228 v2: more photos of a meal, in the camera ----
  let p = await fresh({ items: [], title: "" }, "/plate");
  await p.locator(".mp-button").click(); await p.waitForTimeout(1800);
  await note(p, "Now (0.3.61): in Meal, the shutter reads the photo at once. One photo per read; a pack can have several, a meal cannot.", ".camera-ui");
  await camShot(p, "r228e");
  await p.locator(".cam-modes button").filter({ hasText: "Group" }).click(); await p.waitForTimeout(800);
  await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(900);
  await p.locator("#camera-shutter-button").click(); await p.waitForTimeout(900);
  await p.evaluate((mark) => {
    document.querySelector(".bnote")?.remove();
    for (const b of document.querySelectorAll(".cam-modes button")) { const on = b.textContent.trim() === "Meal"; b.setAttribute("aria-pressed", on ? "true" : "false"); b.classList.toggle("on", on); }
    const say = document.querySelector(".cam-say"); if (say) say.textContent = "The whole plate, from above. Then the inside, another side, or the menu";
    const t = document.querySelector(".cam-title"); if (t) t.textContent = "Photo of my meal";
    const st = document.querySelector(".cam-staged"); if (st) { st.style.cssText += ";" + mark; const b = st.querySelector("b"); if (b) b.textContent = "2 photos of this meal"; }
    const an = document.querySelector(".cam-analyze"); if (an) { an.textContent = "Read 2 photos"; an.style.cssText += ";" + mark; }
    const fr = document.querySelector(".group-frame, .cam-frame"); 
    const sw = document.querySelector(".auto-switch"); if (sw) sw.outerHTML = `<small class="cam-small auto-note">The shutter adds a photo. Read them when you have what you want.</small>`;
    for (const c of document.querySelectorAll(".cam-corner, .group-frame, [class*=corner]")) c.style.display = "none";
  }, mark);
  await note(p, "New: in Meal the shutter stages the photo, like a pack's sides. Add the inside, another side or the menu; Read 2 photos reads them together.", ".camera-ui");
  await camShot(p, "r228f");
  await p.context().close();
  // ---- DT228 v2: more photos on the Plate after the read ----
  const fish = F("fi", "Fish fillet, breaded, fried", 230, 14, 12, 16, 0.8), pot = F("po", "Roasted potatoes", 150, 2.5, 6, 22, 2.2);
  const its = [[180, fish], [150, pot]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, est: true, food: f }));
  p = await fresh({ items: its, title: "Breaded fish with roasted potatoes", photo: { image: pic, at: new Date().toISOString() } }, "/plate");
  await p.evaluate(({ mark, pic }) => { const a = document.querySelector(".mp-again-link"); if (!a) return;
    a.outerHTML = `<div style="${mark};display:flex;flex-direction:column;gap:8px;margin:8px 0;padding:6px"><b style="font-size:14px">Help Chef Mealan read it</b><div style="display:flex;gap:8px;align-items:center"><img src="${pic}" style="width:56px;height:56px;border-radius:10px;object-fit:cover"><img src="${pic}" style="width:56px;height:56px;border-radius:10px;object-fit:cover;filter:hue-rotate(40deg) brightness(.9)"><button class="pill pill-small" style="min-height:56px;min-width:56px">＋ Photo</button></div><label style="display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:700">Tell Chef Mealan what it is<input class="search" style="min-height:44px" value="pork schnitzel, breaded, Augustiner"></label><button class="pill pill-small pill-primary" style="min-height:44px;align-self:flex-start">Read it again with 2 photos and this</button><small class="muted" style="font-size:13px">The photos and your words go together. Your corrections are replaced by the new read.</small></div>`; }, { mark, pic });
  await note(p, "New: under the photo, ＋ Photo adds the inside, another side or the menu; with your words, Read it again reads them all together.");
  await cut(p, "r228g", ".mp-line", 1000);
  await p.context().close();
  // ---- DT229: the shutter's steady ring ----
  p = await fresh({ items: [], title: "" }, "/plate");
  await p.locator(".mp-button").click(); await p.waitForTimeout(1500);
  await p.locator(".cam-modes button").filter({ hasText: "Label" }).click(); await p.waitForTimeout(900);
  const ring = (p, isNew) => p.evaluate(({ isNew, mark }) => {
    document.querySelector(".bnote")?.remove(); const s = document.querySelector("#camera-shutter-button"); s.querySelector("svg.ring-mock")?.remove();
    const C = 2 * Math.PI * 37, steady = 0.6;
    s.insertAdjacentHTML("beforeend", isNew
      ? `<svg class="ring-mock" style="position:absolute;inset:-12px;width:calc(100% + 24px);height:calc(100% + 24px);transform:rotate(-90deg);pointer-events:none" viewBox="0 0 104 104"><circle cx="52" cy="52" r="48" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="8"/><circle cx="52" cy="52" r="48" fill="none" stroke="#34c759" stroke-width="8" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 48}" stroke-dashoffset="${(1 - steady) * 2 * Math.PI * 48}"/></svg>`
      : `<svg class="ring-mock" style="position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg);pointer-events:none" viewBox="0 0 80 80"><circle cx="40" cy="40" r="37" fill="none" stroke="#2e7be8" stroke-width="5" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${(1 - steady) * C}"/></svg>`);
  }, { isNew, mark });
  await ring(p, false);
  await note(p, "Now (0.3.61): the ring that fills while the camera holds steady is blue, 5 px, on the shutter's white rim: barely visible. Here at 60%.", ".camera-ui");
  await camShot(p, "r229a");
  await ring(p, true);
  await note(p, "New: outside the shutter, 8 px, bright green on a dark track: the part still to fill shows too. Here at 60%.", ".camera-ui");
  await camShot(p, "r229b");
  await p.context().close();
  await b.close();
})();
