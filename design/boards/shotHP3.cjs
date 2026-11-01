// Board HP3 (Coach Milan 1 November 10:48 to 11:23 "Yes. Home page. Draw"): the home page for individuals and coaches. Drawn
// into the real home page (a build with a stand-in Firebase config, so the signed-out page shows). New sections show stills
// of the app as it is in 0.3.38; the clips come after the board is approved.
const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
const fs = require("node:fs");
const R = "/home/claude/boards/rs", U = "http://127.0.0.1:3396";
const img = (f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
const STILL = { cook: img(`${R}/hp3-cook.png`), situation: img(`${R}/hp3-situation.png`), explorer: img(`${R}/hp3-explorer.png`), coach: img(`${R}/hp3-coach.png`) };
(async () => {
  const b = await chromium.launch({ args: ["--lang=en-GB"] });
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "en-GB" })).newPage();
  const mark = "outline:3px solid #2e7be8;outline-offset:3px;border-radius:12px", NOTE = mark + ";background:#fff8d6;padding:8px 10px;margin:10px 0;font-size:14px;line-height:1.45;color:#172742;font-weight:500;text-align:left";
  const shot = async (name) => { await page.evaluate(() => { for (const el of document.querySelectorAll(".l-sticky")) el.style.display = "none"; window.scrollTo(0, 0); }); await page.waitForTimeout(300); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); };
  await page.goto(U + "/"); await page.waitForTimeout(2500);
  await page.evaluate(({ NOTE }) => { const d = document.createElement("div"); d.style.cssText = NOTE + ";margin:10px 16px"; d.textContent = "Now: the home page as it is on chefmealan.com, 0.3.38. Written for people with a plan; the coach has one paragraph. No beta spots, no waiting list. Nothing about cook mode, situations, Explorer or the coach's views."; document.querySelector(".l-top").after(d); }, { NOTE });
  await shot("hp3a");
  await page.goto(U + "/"); await page.waitForTimeout(2500);
  await page.evaluate(({ mark, NOTE, STILL }) => {
    const note = (el, t, where = "beforebegin") => el.insertAdjacentHTML(where, `<div style="${NOTE}">${t}</div>`);
    // the stills sit in the same phone frame as the clips, centred
    const fig = (src, cap) => `<figure style="margin:14px auto 0;text-align:center"><span style="display:block;width:220px;margin:0 auto;border:6px solid var(--ink);border-radius:var(--r-card);overflow:hidden;box-shadow:var(--shadow-float);background:var(--base)"><img src="${src}" alt="" style="display:block;width:100%;height:auto"></span><figcaption style="font-size:13px;color:#5b6b8a;margin-top:6px">${cap}</figcaption></figure>`;
    const sec = (cls, kicker, h, body, still, cap) => `<section class="l-week ${cls}" style="${mark}"><span class="l-kicker">${kicker}</span><h2>${h}</h2>${body}${still ? fig(still, cap) : ""}</section>`;
    const P = (t) => `<p>${t}</p>`, UL = (xs) => `<ul style="margin:8px 0 0;padding-left:20px;line-height:1.5">${xs.map((x) => `<li>${x}</li>`).join("")}</ul>`;
    // the top bar: For coaches
    const nav = document.querySelector(".l-topnav"); nav.querySelector(".l-recipes").style.display = "none"; document.querySelector(".l-brand b").style.whiteSpace = "nowrap";
    nav.insertAdjacentHTML("afterbegin", `<a href="#coaches" style="${mark};outline-offset:2px;padding:0 6px;margin-right:8px;font-weight:700;white-space:nowrap">Coaches</a>`);
    note(document.querySelector(".l-hero"), "New: the top bar on one line: Chef Mealan, Coaches, Sign in. Coaches scrolls to the coach section further down; nothing else. Recipes leaves the top bar on a phone (four did not fit: the brand broke into two lines); the recipes section keeps All recipes, and a computer keeps Recipes in the bar.", "beforebegin");
    // the hero box: beta, spots, commitment, waiting list
    const cta = document.querySelector(".l-cta-hook");
    const btn = cta.querySelector("button"); btn.textContent = "Join the beta, free";
    cta.querySelector("small").outerHTML = `<div style="${mark};padding:8px;margin-top:10px"><p style="margin:0;font-weight:800;color:#1f5fc7">12 spots left in this round</p>
      <p style="margin:4px 0 0">Beta testers use Chef Mealan most days for four weeks, and tell us what breaks. Free while it is in beta.</p>
      <p style="margin:8px 0 0"><a href="#wait">Not ready to test? Join the waiting list ›</a></p></div>`;
    note(cta, "New: the beta button with the spots left, from the number you set under Coach. The commitment is said before anyone signs up. The waiting list is one link away.");
    // Start from anything: two ways, not four
    const ways = [...document.querySelectorAll(".l-way")].slice(0, 4); ways[1].style.display = "none"; ways[2].style.display = "none";
    ways[0].querySelector("h3").textContent = "A barcode or a label"; ways[0].querySelector("p").textContent = "The pack's values, or the label read from a photo, every side if you need. You check it.";
    note(document.querySelector(".l-ways-grid"), "New: two clips, not four. The barcode and the labels become one. Every clip is recorded again on today's app: the bar shows all five tabs, Explorer among them (rule HC11). Each clip's picture is what the clip is about: the camera with the tub or your plate here, the last screen for the others (rule HC12). The tub and the plate are Milan's photos. Every picture of the app sits in the middle, in the same phone frame.");
    // after Plan and Shop: Cook it, Your day as it goes, Explorer
    const steps = document.querySelector(".l-ways");
    steps.insertAdjacentHTML("afterend",
      sec("l-cook", "Cook", "Cook it, hands free",
        UL(["One big step at a time, read aloud.", "Say next, back, repeat, or start a timer.", "Ask Chef in the middle: how much is left, what if the pan is too hot.", "Pictures under the steps, yours or drawn.", "A second phone or a tablet on the counter shows the steps."]),
        STILL.cook, "Cook mode, step 4 of 6, voice on")
      + sec("l-asgoes", "Your day", "Your day as it really goes",
        P("A late evening at work, a party, a day away, a bad night's sleep. Chef Mealan has a page for each, and reads it against your own plan.") + UL(["Busy times from your Google Calendar: a meal in a meeting asks before or after.", "Travel mode: the shops and the kitchen of the place you are in.", "A day off training: what changes, and what stays."]),
        STILL.situation, "A late evening after work, in Explorer")
      + sec("l-explorer", "Explorer", "Know why, not only what",
        P("The body, the situations and the nutrients in one place. Every line has its paper. Every page says when a thing helps and when it hurts, then reads your own days.") + P("No condition, no test reading, no supplement. If a condition decides what you eat, your doctor does."),
        STILL.explorer, "The body: eight families, each with its page"));
    document.querySelector(".l-coach").insertAdjacentHTML("beforebegin", `<div style="${NOTE}">Recipes from the kitchen stay here, as they are (the test server has none to show).</div>`);
    // the coach section: a section of its own
    const coach = document.querySelector(".l-coach"); coach.id = "coaches"; coach.style.cssText += mark;
    coach.innerHTML = `<span class="l-kicker">For coaches</span><h2>Coach your clients' real days</h2>
      <p>One account, two views: your own day, and your clients. Each client's day shows as they see it: the plan, the meals, the cards they share.</p>
      ${UL(["Suggest a snack or an Explorer page. The client accepts with one tap. You never change their plan.", "Answer a shared meal in one line, or react with Good or Seen.", "Waiting for you: what needs your answer, at the top.", "The client decides what you see. Body data stays off until they switch it on."])}
      ${fig(STILL.coach, "My clients: Waiting for you at the top")}
      <p style="margin-top:14px"><button class="pill pill-primary" style="min-height:44px">Get a coach code</button></p>
      <small class="muted">Coaches in the beta: free, the same four weeks, and your clients join with your code.</small>`;
    note(coach, "New: the coach gets a section of their own, with the Coaches link in the top bar and its own button. The stills are the app as it is today, Explorer on the bar; the names are made up.");
    // trust: two lines more
    const built = document.querySelector(".l-built .l-grid");
    built.insertAdjacentHTML("beforeend", `<div style="${mark}"><b>Papers read again</b><p>Every number Explorer credits to a study is checked against the study itself before each release.</p></div><div style="${mark}"><b>Nothing kept for nothing</b><p>An account nobody opens for 12 months is deleted, with everything in it.</p></div>`);
    // the forms: beta and waiting list, separate
    const req = document.querySelector(".l-request");
    req.querySelector("h2").textContent = "Join the beta, free";
    req.querySelector("p").innerHTML = `<b style="color:#1f5fc7">12 spots left in this round.</b> Use Chef Mealan most days for four weeks, and tell us what breaks. Coach Milan sends you a personal code.`;

    req.insertAdjacentHTML("afterend", `<section class="l-request" id="wait" style="${mark}"><h2>The waiting list</h2>
      <p>For when Chef Mealan opens to everyone. No testing, no code now. We write to you once, when it opens.</p>
      <div class="l-form"><input placeholder="Email" type="email"><p class="small" style="margin:10px 0 6px;font-weight:700">Which fits you?</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="choice" style="min-height:44px">I have a coach</button><button class="choice" style="min-height:44px">I am a coach</button><button class="choice on" style="min-height:44px">I train on my own</button></div><label style="display:flex;gap:8px;align-items:flex-start;font-size:14px;margin:8px 0"><input type="checkbox" checked style="width:22px;height:22px"> Write to me when Chef Mealan opens. I can leave the list at any time.</label>
      <button class="pill pill-primary" style="min-height:44px">Join the waiting list</button></div></section>`);
    note(req, "New: two forms. The beta asks for commitment and gives a code. The waiting list asks only for an email, for the paying users at launch. When the spots reach 0, the beta form steps back and the waiting list is the main button. Both keep Which fits you?, so you see who is a coach.");
    window.scrollTo(0, 0);
  }, { mark, NOTE, STILL });
  await shot("hp3b");
  await b.close();
})();
