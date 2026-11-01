// Board HP4 (Coach Milan 1 November 15:03 to 15:28 "Draw all three as variations so I can pick once I see it"): a visual in
// the hero. A: the app in a phone frame, the meal clip (your photo read into the Plate). B: Milan's photo, small, beside the
// headline. C: the app in its frame with Milan's photo as a round badge on it. Drawn into the real home page, 0.3.45.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3396";
const img = (f, t) => `data:${t};base64,` + fs.readFileSync(f).toString("base64");
const PLATE = img("/tmp/fr/m-3.6.png", "image/png"), CHEF = img("/tmp/landroot/dist/landing/chef.webp", "image/webp");
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const mark = "outline:3px solid #2e7be8;outline-offset:4px;border-radius:14px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-weight:500";
  const frame = (w) => `<span style="display:block;width:${w}px;border:6px solid var(--ink);border-radius:var(--r-card);overflow:hidden;box-shadow:var(--shadow-float);background:var(--base)"><img src="${PLATE}" alt="" style="display:block;width:100%"></span>`;
  const variants = {
    a: (desk) => `<figure class="hp4" style="margin:${desk ? "22px 0 0" : "18px auto 0"};width:${desk ? 250 : 220}px;${mark}">${frame(desk ? 250 : 220)}<figcaption style="font-size:13px;color:#5b6b8a;margin-top:8px;text-align:center">Your photo, read onto the plate</figcaption></figure>`,
    b: (desk) => `<figure class="hp4" style="margin:${desk ? "18px 0 0" : "14px 0 0"};display:flex;gap:12px;align-items:center;${mark}"><img src="${CHEF}" alt="" style="width:${desk ? 120 : 96}px;height:${desk ? 140 : 112}px;object-fit:cover;object-position:top;border-radius:16px;box-shadow:var(--shadow-float)"><figcaption style="font-size:14px;line-height:1.4;color:#172742"><b>Milan Stancevic</b><br>Product and recipe builder, and the maker of Chef Mealan</figcaption></figure>`,
    c: (desk) => `<figure class="hp4" style="position:relative;margin:${desk ? "26px 0 0" : "26px auto 0"};width:${desk ? 250 : 220}px;${mark}">${frame(desk ? 250 : 220)}<span style="position:absolute;left:-14px;top:-18px;display:flex;align-items:center;gap:8px;background:#fff;border-radius:999px;padding:4px 12px 4px 4px;box-shadow:var(--shadow-float)"><img src="${CHEF}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;object-position:50% 12%"><b style="font-size:13px;color:#172742;white-space:nowrap">Chef Mealan by Milan</b></span><figcaption style="font-size:13px;color:#5b6b8a;margin-top:8px;text-align:center">Your photo, read onto the plate</figcaption></figure>`,
  };
  const NOTES = {
    now: "Now: the first screen is words and the calculator; nothing shows the app or a person.",
    a: "A: the app in its phone frame, under the promise. It plays the meal clip: your photo, then the plate with its PD and \"fits your plan\". On a computer it sits under the words, left of the calculator. Your photo stays in Who's behind it.",
    b: "B: your photo, small, beside your name and the line from the book cover. It says a person made this, before it says what the app does.",
    c: "C: the app in its frame, with your photo as a round badge on it: Chef Mealan by Milan. Both, small.",
  };
  for (const [desk, vw, vh, tag] of [[false, 390, 844, "p"], [true, 1280, 900, "d"]]) {
    const page = await (await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
    for (const v of ["now", "a", "b", "c"]) {
      if (desk && v === "now") continue;
      await page.goto(U + "/"); await page.waitForTimeout(2200);
      await page.evaluate(({ v, html, note, NOTE, desk }) => {
        for (const x of document.querySelectorAll(".l-sticky")) x.style.display = "none";
        if (desk && v !== "now") document.querySelector(".l-hero").style.alignItems = "start";
        const text = document.querySelector(".l-hero-text");
        if (html) { const lead = text.querySelector(".l-try-lead"); (v === "b" ? text.querySelector("h1") : lead).insertAdjacentHTML(v === "b" ? "beforebegin" : "beforebegin", html); }
        const d = document.createElement("div"); d.style.cssText = NOTE + (desk ? ";max-width:1100px;margin:10px auto" : ";margin:10px 16px"); d.textContent = note; document.querySelector(".l-top").after(d);
        window.scrollTo(0, 0);
      }, { v, html: v === "now" ? "" : variants[v](desk), note: NOTES[v], NOTE, desk });
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${R}/hp4${tag}-${v}.png`, clip: { x: 0, y: 0, width: vw, height: desk ? 1250 : 1500 } });
      console.log("shot", tag, v);
    }
  }
  await b.close();
})();
