// Board HP5 (Coach Milan 1 November 15:38 to 15:48): the button on the first screen, over a photo of Milan's own food. Three
// versions of his own photo: 1a one photo full width (the curry) with the words on a dark fade; 1b a strip of four of his
// dishes; 1c one photo (the meatballs pan) with the words on a white card. On a phone and on a computer. Drawn into 0.3.45.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3396", P = "/home/claude/photos/hp5";
const ph = (k) => "data:image/jpeg;base64," + fs.readFileSync(`${P}/${k}.jpg`).toString("base64");
const IMG = Object.fromEntries(["curry", "meatballs", "quesadilla", "squares", "waffle"].map((k) => [k, ph(k)]));
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const mark = "outline:3px solid #2e7be8;outline-offset:-3px", NOTE = "outline:3px solid #2e7be8;outline-offset:2px;border-radius:12px;background:#fff8d6;padding:8px 10px;font-size:14px;line-height:1.45;color:#172742;font-weight:500";
  const words = (dark) => `<span style="display:inline-block;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:${dark ? "#fff" : "#1f5fc7"};opacity:.9">For people with a nutrition plan</span>
    <h1 style="margin:10px 0 10px;font-size:clamp(34px,6vw,56px);line-height:1.04;letter-spacing:-.5px;color:${dark ? "#fff" : "#172742"}">Live your nutrition plan, day by day.</h1>
    <p style="margin:0 0 16px;font-size:17px;line-height:1.5;color:${dark ? "rgba(255,255,255,.92)" : "#172742"};max-width:34ch">Chef Mealan plans your meals with you, and finds the meal that still fits when the day surprises you.</p>
    <button class="pill pill-primary" style="min-height:52px;padding:0 26px;font-size:18px">Join the beta, free</button>
    <p style="margin:10px 0 0;font-weight:900;color:${dark ? "#8ff0b5" : "#127a46"}">3 spots left in this round</p>
    <p style="margin:4px 0 0;font-size:14px;color:${dark ? "rgba(255,255,255,.85)" : "#3d4a63"}">Use it most days for four weeks, and tell us what breaks. <u>Or join the waiting list</u></p>
    <p style="margin:10px 0 0;font-size:12px;color:${dark ? "rgba(255,255,255,.7)" : "#5b6b8a"}">Milan's own cooking, at home.</p>`;
  const hero = (v, desk) => {
    const H = desk ? "78vh" : "calc(100svh - 64px)";
    if (v === "1a") return `<section class="hp5" style="position:relative;height:${H};min-height:${desk ? 560 : 640}px;margin:0 calc(50% - 50vw);background:#172742 url(${IMG.curry}) center/cover;${mark}">
      <div style="position:absolute;inset:0;background:${desk ? "linear-gradient(90deg,rgba(15,24,42,.86) 0%,rgba(15,24,42,.55) 42%,rgba(15,24,42,0) 70%)" : "linear-gradient(0deg,rgba(15,24,42,.9) 0%,rgba(15,24,42,.65) 45%,rgba(15,24,42,0) 72%)"}"></div>
      <div style="position:absolute;${desk ? "left:max(32px,calc(50vw - 560px));top:50%;transform:translateY(-50%);max-width:560px" : "left:16px;right:16px;bottom:22px"}">${words(true)}</div></section>`;
    if (v.startsWith("1d")) {
      const order = ["curry", "meatballs", "quesadilla", "waffle", "squares"], k = Number(v.split("-")[1]) - 1;
      const dots = order.map((_, i) => `<span style="width:${i === k ? 22 : 8}px;height:8px;border-radius:999px;background:${i === k ? "#fff" : "rgba(255,255,255,.55)"}"></span>`).join("");
      return `<section class="hp5" style="position:relative;height:${H};min-height:${desk ? 560 : 640}px;margin:0 calc(50% - 50vw);background:#172742 url(${IMG[order[k]]}) center/cover;${mark}">
      <div style="position:absolute;inset:0;background:${desk ? "linear-gradient(90deg,rgba(15,24,42,.86) 0%,rgba(15,24,42,.55) 42%,rgba(15,24,42,0) 70%)" : "linear-gradient(0deg,rgba(15,24,42,.9) 0%,rgba(15,24,42,.65) 45%,rgba(15,24,42,0) 72%)"}"></div>
      <div style="position:absolute;${desk ? "left:max(32px,calc(50vw - 560px));top:50%;transform:translateY(-50%);max-width:560px" : "left:16px;right:16px;bottom:22px"}">${words(true)}</div>
      <div style="position:absolute;${desk ? "right:32px;bottom:22px" : "right:16px;top:14px"};display:flex;gap:6px;align-items:center">${dots}</div></section>`;
    }
    if (v === "1b") {
      const tiles = (desk ? ["curry", "meatballs", "quesadilla", "squares"] : ["curry", "meatballs", "quesadilla", "squares"]).map((k) => `<div style="background:url(${IMG[k]}) center/cover"></div>`).join("");
      return `<section class="hp5" style="position:relative;height:${H};min-height:${desk ? 560 : 640}px;margin:0 calc(50% - 50vw);display:grid;grid-template-columns:${desk ? "repeat(4,1fr)" : "1fr 1fr"};grid-template-rows:${desk ? "1fr" : "1fr 1fr"};gap:3px;background:#fff;${mark}">${tiles}
      <div style="position:absolute;inset:0;background:${desk ? "linear-gradient(90deg,rgba(15,24,42,.88) 0%,rgba(15,24,42,.6) 40%,rgba(15,24,42,.05) 68%)" : "linear-gradient(0deg,rgba(15,24,42,.92) 0%,rgba(15,24,42,.7) 48%,rgba(15,24,42,.05) 75%)"}"></div>
      <div style="position:absolute;${desk ? "left:max(32px,calc(50vw - 560px));top:50%;transform:translateY(-50%);max-width:560px" : "left:16px;right:16px;bottom:22px"}">${words(true)}</div></section>`;
    }
    return `<section class="hp5" style="position:relative;height:${H};min-height:${desk ? 560 : 640}px;margin:0 calc(50% - 50vw);background:#172742 url(${IMG.meatballs}) center ${desk ? "45%" : "center"}/cover;${mark}">
      <div style="position:absolute;${desk ? "left:max(32px,calc(50vw - 560px));top:50%;transform:translateY(-50%);width:500px" : "left:12px;right:12px;bottom:14px"};background:rgba(255,255,255,.96);border-radius:20px;padding:${desk ? "28px 30px" : "18px 18px"};box-shadow:0 12px 40px rgba(0,0,0,.25)">${words(false)}</div></section>`;
  };
  const NOTES = {
    now: "Now: the button is about one screen down, under the calculator; no photo.",
    "1a": "1a: one of your photos, full width: the curry with rice. The words and the button on a dark fade, white text. The calculator follows right under it.",
    "1b": "1b: a strip of four of your dishes: curry, meatballs, quesadilla, the chocolate squares. Four across on a computer, two by two on a phone. Your real week, at a glance.",
    "1d-1": "1d, photo 1 of 5: 1a's look, the photo changing by itself every 5 to 6 seconds with a slow crossfade: curry, meatballs, quesadilla, waffle, chocolate squares. The words and the button stay still. The dots show which; a tap on a dot shows that dish.",
    "1d-2": "1d, photo 2 of 5: the meatballs. The same words, the same place.",
    "1d-4": "1d, photo 4 of 5: the waffle. A phone set to reduce motion sees the first photo only.",
    "1c": "1c: one photo, the meatballs pan, full width, and the words and button on a white card over it. No fade; the photo shows whole around the card.",
  };
  for (const [desk, vw, vh, tag] of [[false, 390, 844, "p"], [true, 1366, 820, "d"]]) {
    const page = await (await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: desk ? 1.5 : 2, locale: "en-GB" })).newPage();
    for (const v of (process.env.ONLY ? process.env.ONLY.split(",") : ["now", "1a", "1b", "1c", "1d-1", "1d-2", "1d-4"])) {
      if (desk && (v === "now" || v === "1d-4")) continue;
      await page.goto(U + "/"); await page.waitForTimeout(2200);
      await page.evaluate(({ v, html, note, NOTE, desk }) => {
        for (const x of document.querySelectorAll(".l-sticky")) x.style.display = "none";
        const d = document.createElement("div"); d.style.cssText = NOTE + (desk ? ";max-width:1100px;margin:8px auto" : ";margin:8px 12px"); d.textContent = note;
        if (html) {
          const heroEl = document.querySelector(".l-hero");
          heroEl.insertAdjacentHTML("beforebegin", html);
          heroEl.querySelector(".l-hero-text").style.display = "none";   // the words moved onto the photo
          const cta = heroEl.querySelector(".l-cta-hook"); if (cta) cta.style.display = "none";   // the beta box moved up
          heroEl.style.marginTop = "18px";
        }
        document.querySelector(".l-top").after(d);
        window.scrollTo(0, 0);
      }, { v, html: v === "now" ? "" : hero(v, desk), note: NOTES[v], NOTE, desk });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${R}/hp5${tag}-${v}.png`, clip: { x: 0, y: 0, width: vw, height: desk ? 1150 : 1250 } });
      console.log("shot", tag, v);
    }
  }
  await b.close();
})();
