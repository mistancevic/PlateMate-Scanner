// Board DT228 (Coach Milan 2 November 19:50 to 21:00): help the photo read. 1: a line with the photo, Tell Chef Mealan what it
// is, sent with it and used by Read it again. 2: Chef Mealan asks when he is unsure what a food is. Now: 0.3.61 (main dist on
// 3387). New: the same pages with the change drawn in. Nothing in the repo changes.
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
  const fish = F("fi", "Fish fillet, breaded, fried", 230, 14, 12, 16, 0.8), pot = F("po", "Roasted potatoes", 150, 2.5, 6, 22, 2.2), lem = F("le", "Lemon wedge", 29, 1, 0.3, 9, 2.8);
  const its = [[180, fish], [150, pot], [35, lem]].map(([g, f]) => ({ id: f.id, grams: g, locked: false, est: true, food: f }));
  const photo = { image: pic, at: new Date().toISOString() };
  // ---- now: the read on the Plate ----
  let p = await fresh({ items: its, title: "Breaded fish with roasted potatoes", photo }, "/plate");
  await p.evaluate((mark) => { const a = document.querySelector(".mp-again-link"); if (a) a.style.cssText += ";" + mark; }, mark);
  await note(p, "Now (0.3.61): a read that got it wrong (fish, not pork) has one way out: Read the photo again, which guesses again from the same photo.");
  await cut(p, "r228a", ".mp-line", 1000);
  // ---- new: tell Chef Mealan what it is ----
  await p.evaluate((mark) => { document.querySelector(".bnote")?.remove(); const a = document.querySelector(".mp-again-link"); if (!a) return;
    a.outerHTML = `<div class="mp-tell" style="${mark};display:flex;flex-direction:column;gap:6px;margin:8px 0;padding:6px"><label style="display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:800">Tell Chef Mealan what it is<input class="search" style="min-height:44px" value="pork schnitzel, breaded, Augustiner"></label><div style="display:flex;gap:8px;align-items:center"><button class="pill pill-small pill-primary" style="min-height:44px">Read it again with this</button><button class="pill pill-small" style="min-height:44px">🎤 Say it</button></div><small class="muted" style="font-size:13px">The photo and your words go together. Your corrections are replaced by the new read.</small></div>`; }, mark);
  await note(p, "New: under the photo, a line: Tell Chef Mealan what it is. Typed or said. Read it again with this sends the photo and your words together.");
  await cut(p, "r228b", ".mp-line", 1000);
  await p.context().close();
  // ---- new: the same line before the read, for a photo from Your photos ----
  p = await fresh({ items: [], title: "" }, "/plate");
  await p.locator(".mp-button").click(); await p.waitForTimeout(1500);
  const le = (n, b2) => { const x = Buffer.alloc(b2); b2 === 2 ? x.writeUInt16LE(n) : x.writeUInt32LE(n); return x; };
  const when = "2026:11:02 19:40:00";
  const tiff = Buffer.concat([Buffer.from("II"), le(42, 2), le(8, 4), le(1, 2), le(0x8769, 2), le(4, 2), le(1, 4), le(26, 4), le(0, 4), le(1, 2), le(0x9003, 2), le(2, 2), le(20, 4), le(44, 4), le(0, 4), Buffer.from(when + "\0", "ascii")]);
  const app1 = Buffer.concat([Buffer.from("Exif\0\0", "binary"), tiff]); const hd = Buffer.from([0xff, 0xe1, (app1.length + 2) >> 8, (app1.length + 2) & 255]);
  await p.locator(".camera-ui input[type=file]").setInputFiles({ name: "plate.jpg", mimeType: "image/jpeg", buffer: Buffer.concat([PLATE.subarray(0, 2), hd, app1, PLATE.subarray(2)]) }); await p.waitForTimeout(1500);
  await p.evaluate((mark) => { const bt = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Read the plate"); if (!bt) return;
    for (const c of document.querySelectorAll(".pa-chip")) if (c.textContent.trim() === "An idea") c.textContent = "Exploring";
    bt.parentElement.insertAdjacentHTML("beforebegin", `<label style="${mark};display:flex;flex-direction:column;gap:6px;font-size:14px;font-weight:800;padding:6px;margin:6px 0">Tell Chef Mealan what it is, if you like<input class="search" style="min-height:44px" placeholder="pork schnitzel, breaded, Augustiner"></label>`); }, mark);
  await note(p, "New: a photo from Your photos asks whose plate and when, as now. Under the chips, the same line, before the read. Empty is fine.");
  await cut(p, "r228c", ".pa, .pa-top", 1000);
  await p.context().close();
  // ---- new: Chef Mealan asks what a food is when he is unsure ----
  p = await fresh({ items: its, title: "Breaded fish with roasted potatoes", photo }, "/plate");
  await p.evaluate((mark) => { document.querySelector(".mp-again-link")?.insertAdjacentHTML("afterend", `<div class="mp-ask" style="${mark}"><small><b>One thing I cannot tell from the photo:</b> under the breading, is it pork, veal, chicken or fish?</small><div class="button-row" style="flex-wrap:wrap"><button class="choice" style="min-height:44px">Pork</button><button class="choice" style="min-height:44px">Veal</button><button class="choice" style="min-height:44px">Chicken</button><button class="choice on" style="min-height:44px">Fish</button><button class="link" style="min-height:44px">Skip</button></div><small class="muted" style="font-size:13px">A tap changes the food; its grams stay.</small></div>`); }, mark);
  await note(p, "New: when the read is unsure what a food is, Chef Mealan asks once, like he asks about a weight today. One tap; the grams stay.");
  await cut(p, "r228d", ".mp-line", 1000);
  await p.context().close();
  await b.close();
})();
