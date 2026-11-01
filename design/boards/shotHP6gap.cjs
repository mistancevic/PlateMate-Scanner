// HP6 version 2 (Coach Milan 1 November 19:24 and 19:42): the gap under Join the beta, free: the link Or join the waiting list
// is 44 px tall to be easy to tap, and on a phone where the line wraps it pushes the two lines apart. Drawn into 0.3.47.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3396";
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const NOTE = "outline:3px solid #2e7be8;outline-offset:2px;border-radius:12px;background:#fff8d6;padding:8px 10px;font-size:14px;line-height:1.45;color:#172742;font-weight:500;margin:8px 12px";
  await fetch(U + "/api/beta/spots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spots: 3 }) }).catch(() => {});
  for (const v of ["now", "new"]) {
    const page = await (await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, locale: "en-GB", reducedMotion: "reduce" })).newPage();
    await page.goto(U + "/?home"); await page.waitForTimeout(2200);
    const box = await page.evaluate(({ v, NOTE }) => {
      for (const x of document.querySelectorAll(".l-sticky")) x.style.display = "none";
      if (v === "new") { const st = document.createElement("style"); st.textContent = ".l-photo .l-beta .link { display: inline; min-height: 0; padding: 12px 2px; margin: -12px 0; }"; document.head.appendChild(st); }
      const beta = document.querySelector(".l-photo .l-beta"); beta.style.outline = "3px solid #2e7be8"; beta.style.outlineOffset = "4px"; beta.style.borderRadius = "8px";
      const d = document.createElement("div"); d.style.cssText = NOTE;
      d.textContent = v === "now" ? "Now, on a phone 412 px wide: the link is 44 px tall so it is easy to tap. Where the sentence wraps, that height pushes the two lines apart: a wide gap after what." : "New: the link keeps its 44 px for the finger, drawn around it, so the lines sit at their normal distance.";
      document.querySelector(".l-photo").before(d); window.scrollTo(0, 0);
      const ph = document.querySelector(".l-photo").getBoundingClientRect(), dr = d.getBoundingClientRect();
      return { top: dr.top + scrollY - 8, photoTop: ph.top + scrollY, bottom: ph.bottom + scrollY + 10 };
    }, { v, NOTE });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${R}/hp6gap-${v}.png`, fullPage: true, clip: { x: 0, y: box.top, width: 412, height: box.bottom - box.top } });
    console.log("shot", v);
    await page.close();
  }
  await fetch(U + "/api/beta/spots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spots: null }) }).catch(() => {});
  await b.close();
})();
