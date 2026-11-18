// Measures the story card and the agreement block of each board of genDT313.py, so the generator can place them.
const { chromium } = require((process.env.ROOT || "/home/claude/pm157") + "/node_modules/playwright"); const fs = require("node:fs");
(async () => { const out = JSON.parse(fs.readFileSync(process.env.BOARDS_OUT || "/home/claude/boards/out158.json", "utf8")); const b = await chromium.launch({ executablePath: process.env.CHROME }); const res = {};
  for (const [id, o] of Object.entries(out)) { const p = await b.newPage({ viewport: { width: o.w, height: 1000 } });
    await p.setContent(`<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"><style>body{margin:0;font-family:'Nunito',ui-sans-serif,system-ui,sans-serif;font-size:15px;color:#172742}</style></head><body>${o.inner}</body></html>`, { waitUntil: "load" }).catch(() => {});
    await p.waitForTimeout(1200);
    res[id] = await p.evaluate(() => { const root = document.body.firstElementChild, card = root.firstElementChild, ac = root.querySelector("[data-ac]"); return { card: Math.ceil(card.offsetTop + card.offsetHeight), ac: Math.ceil(ac.offsetHeight), font: document.fonts.check("15px Nunito") }; });
    if (process.env.SHOT) await p.screenshot({ path: `${process.env.SHOT}/${id}.png`, fullPage: true });
    await p.close(); }
  fs.writeFileSync(__dirname + "/heights158.json", JSON.stringify(res)); console.log(JSON.stringify(res)); await b.close(); })();
