// Board HP6 (Coach Milan 1 November 17:37 and 17:48): the calculator section in the home page's pattern: a small label, a
// title as the hook, one short line, and the calculator where the other sections have their clip. Drawn into 0.3.46.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3396";
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const mark = "outline:3px solid #2e7be8;outline-offset:4px;border-radius:12px", NOTE = "outline:3px solid #2e7be8;outline-offset:2px;border-radius:12px;background:#fff8d6;padding:8px 10px;font-size:14px;line-height:1.45;color:#172742;font-weight:500";
  for (const [desk, vw, vh, tag] of [[false, 390, 844, "p"], [true, 1366, 820, "d"]]) {
    const page = await (await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: desk ? 1.5 : 2, locale: "en-GB", reducedMotion: "reduce" })).newPage();
    for (const v of ["now", "new", "ref"]) {
      if (desk && v === "ref") continue;
      await page.goto(U + "/?home"); await page.waitForTimeout(2000);
      const box = await page.evaluate(({ v, mark, NOTE, desk }) => {
        for (const x of document.querySelectorAll(".l-sticky")) x.style.display = "none";
        const sec = document.querySelector(".l-calc");
        const note = (t, before) => { const d = document.createElement("div"); d.style.cssText = NOTE + ";margin:12px 0"; d.textContent = t; before.before(d); };
        if (v === "ref") { const one = document.querySelector(".l-new .l-one"); note("For comparison, the Cook section as it is: a small label, a title, a few lines, and the clip beside it. Every section on the home page has this shape.", one); one.style.cssText += ";" + mark; const r = one.getBoundingClientRect(); return { y: r.top + scrollY - 160, h: r.height + 210 }; }
        if (v === "now") note("Now: one bold line, then the calculator. No label, no title, so it does not look like the other sections.", sec.firstElementChild);
        if (v === "new") {
          const box = sec.querySelector(".l-try-box"); const lead = sec.querySelector(".l-try-lead"); lead.remove();
          const one = document.createElement("div"); one.className = "l-one"; one.style.cssText = "margin-top:0;" + mark + (desk ? ";display:block" : "");
          one.innerHTML = `<div class="l-one-text"><span class="l-eyebrow">Try it here</span><h2>Make your craving fit your plan</h2><p>Pick what you crave and a food you have at home. See how much of it makes the plate fit.</p></div>`;
          box.before(one); one.appendChild(box);
          // Coach Milan 19:51: mobile first; on a computer the words run the whole width, the calculator centred under them
          sec.style.maxWidth = desk ? "1000px" : "";
          if (desk) { box.style.maxWidth = "620px"; box.style.margin = "18px auto 0"; const t = one.querySelector(".l-one-text p"); t.style.maxWidth = "none"; }
          note("New: the same shape as the other sections. A small label, Try it here. The title is the hook. One short line says what to do. The calculator takes the place of the clip. Mobile first: on a computer too the words run the whole width and the calculator sits centred under them (Coach Milan 19:51).", one);
        }
        const r = sec.getBoundingClientRect(); return { y: r.top + scrollY - 140, h: Math.min(r.height + 180, desk ? 1250 : 1500) };
      }, { v, mark, NOTE, desk });
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${R}/hp6${tag}-${v}.png`, fullPage: true, clip: { x: 0, y: Math.max(0, box.y), width: vw, height: box.h } });
      console.log("shot", tag, v);
    }
  }
  await b.close();
})();
