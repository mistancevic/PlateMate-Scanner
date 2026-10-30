// DT168 (Coach Milan 30 October 10:57: "We need to fix data privacy. Double check that and if there is in some other parts also"):
// the privacy audit as panels: who can read what now, after the fix, and what the person is told
const { chromium } = require("playwright");
const R = "/home/claude/boards/rs";
const CSS = `body{margin:0;font-family:Nunito,ui-sans-serif,system-ui,sans-serif;background:#eef3fb;color:#172742}
.p{padding:16px}.h{font-size:22px;font-weight:900;margin:4px 0 6px}.s{font-size:13px;color:#5b6b8a;font-weight:600;margin-bottom:10px;line-height:1.4}
.c{background:#fff;border:1px solid #d9e2f1;border-radius:14px;padding:12px 14px;margin:10px 0}.c b{display:block;font-size:15px}
.r{display:flex;gap:8px;padding:7px 0;border-bottom:1px solid #e3e9f4;font-size:13px;line-height:1.35}.r:last-child{border:0}.r span:first-child{flex:1;font-weight:700}.r span:last-child{flex:0 0 42%;text-align:right}
.bad{color:#b4231a;font-weight:800}.ok{color:#13916a;font-weight:800}.mid{color:#8a4b00;font-weight:800}.k{font-size:11px;font-weight:900;letter-spacing:.05em;color:#5b6b8a;margin:12px 2px 2px}
.note{outline:3px solid #2e7be8;outline-offset:3px;border-radius:10px;background:#fff8d6;padding:8px 10px;margin:4px 0 12px;font-size:14px;line-height:1.45}`;
const row = (a, b, cls) => `<div class="r"><span>${a}</span><span class="${cls}">${b}</span></div>`;
const PAGES = {
  r168a: `<div class="note">Now, 0.3.9: what a coach's account can read of a client, by the database rules, whatever the app shows.</div>
  <div class="h">Who can read what, now</div><div class="s">A coach's app downloads the client's whole record and shows only part of it. Anyone with the coach's sign-in and a browser console can read the rest.</div>
  <div class="k">THE CLIENT'S RECORD</div><div class="c">${row("Body data: sex, birth year, height, weight, body fat", "coach can read", "bad")}${row("Health answers, allergies, every declaration", "coach can read", "bad")}${row("Library, recipes, notes, taste in your words", "coach can read", "bad")}${row("Photo copies from before October", "coach can read", "bad")}${row("Any field, also allergies and the 18+ date", "coach can change", "bad")}${row("The week, goal, notes, weigh-ins", "coach reads: promised", "ok")}</div>
  <div class="k">ON THE PHONE</div><div class="c">${row("Sign out", "keeps everything on the phone", "bad")}${row("The next person signing in", "gets the last person's data saved into their account", "bad")}</div>
  <div class="k">ON THE SERVER</div><div class="c">${row("Access requests, book sign-ups: name, email, phone", "any coach account", "bad")}${row("A coach's send-back note on a published recipe", "public", "mid")}${row("Member numbers", "salt can be guessed", "mid")}</div>`,
  r168b: `<div class="note">New: the record split in two. What the coach needs stays readable for the coach; everything private moves to a part only you read. The rules enforce it, not the screens.</div>
  <div class="h">Who can read what, after</div><div class="s">Your private part: only you. Our server reads it only to keep Chef Mealan safe for you (adult, allergies, health answers).</div>
  <div class="k">YOUR PRIVATE PART</div><div class="c">${row("Body data, health answers, allergies, declarations", "only you", "ok")}${row("Library, recipes, notes, your own words", "only you", "ok")}${row("Old photo copies", "only you, then deleted", "ok")}</div>
  <div class="k">WHAT YOUR COACH READS</div><div class="c">${row("Your week, goal and numbers, notes", "your coach, as promised", "ok")}${row("Weigh-ins as a trend", "your coach, as promised", "ok")}${row("Health situations: which and when", "your coach, never your words", "ok")}${row("The parts of Your summary you share", "your coach, kept up to date", "ok")}</div>
  <div class="k">WHAT YOUR COACH CAN CHANGE</div><div class="c">${row("Goal, formula, notes, check-in day, Chef's chat confirmation", "only these", "ok")}${row("Your allergies, answers, body data", "never", "ok")}</div>
  <div class="k">ON THE PHONE AND SERVER</div><div class="c">${row("Sign out", "clears the phone; nothing passes to the next account", "ok")}${row("Access requests, book sign-ups", "Coach Milan as owner only", "ok")}${row("Published recipes", "no coach note, rating or ids", "ok")}${row("Delete my account", "also published recipes, cook status, requests", "ok")}</div>`,
  r168c: `<div class="note">New: what the person is told matches what the code does. Three choices are yours, marked ?.</div>
  <div class="h">Said plainly</div><div class="s">Privacy notice and the Coach page, rewritten where they promise more than the code does today.</div>
  <div class="k">DISCLOSED, NOT HIDDEN</div><div class="c">${row("Gemini gets your allergies and the health situations you ticked, to keep suggestions safe", "added to the notice", "ok")}${row("Searching a product sends the typed text to Open Food Facts", "added", "ok")}${row("Export my data: everything, also photo files and recipes", "complete export", "ok")}</div>
  <div class="k">YOUR CHOICE</div><div class="c">${row("? Members' food catalogue: each reviewed food goes with its market and date. In a small pilot that can point to a person", "drop market and date, or opt-in", "mid")}${row("? Weight to the coach: the trend uses kg today, even with body data off", "trend as direction and %, kg only when body data is on", "mid")}${row("? Airtable button (coach only): remove, or list Airtable as a processor", "your call", "mid")}</div>
  <div class="k">ONE THING ONLY YOU CAN DO</div><div class="c">${row("A secret for member numbers in the deploy settings", "I write the step; you paste it once", "mid")}</div>`,
};
(async () => {
  const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  for (const [name, html] of Object.entries(PAGES)) { await page.setContent(`<style>${CSS}</style><div class="p">${html}</div>`); await page.screenshot({ path: `${R}/${name}.png`, fullPage: true }); console.log("shot " + name); }
  await b.close();
})();
