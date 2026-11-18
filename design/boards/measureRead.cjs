// Measures the cards and the agreement block of each board of genRead.py, so the generator can place the rows.
const { chromium } = require((process.env.ROOT || "/home/claude/pm159") + "/node_modules/playwright"); const fs = require("node:fs");
(async () => { const out = JSON.parse(fs.readFileSync(process.env.BOARDS_OUT || "/home/claude/boards/outRead.json", "utf8")); const b = await chromium.launch({ executablePath: process.env.CHROME }); const res = {};
  for (const [id, o] of Object.entries(out)) { const p = await b.newPage({ viewport: { width: o.w, height: 1000 } });
    await p.setContent(`<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"><style>body{margin:0;font-family:'Nunito',ui-sans-serif,system-ui,sans-serif;font-size:15px;color:#172742}</style></head><body>${o.inner}</body></html>`, { waitUntil: "load" }).catch(() => {});
    await p.waitForTimeout(1200);
    res[id] = await p.evaluate(() => { const ac = document.querySelector("[data-ac]"); return { cards: [...document.querySelectorAll("[data-card]")].map((c) => Math.ceil(c.offsetHeight)), ac: ac ? Math.ceil(ac.offsetHeight) : 0 }; });
    if (process.env.SHOT) await p.screenshot({ path: `${process.env.SHOT}/${id}.png`, fullPage: true });
    await p.close(); }
  fs.writeFileSync(__dirname + "/" + (process.env.HEIGHTS || "heightsRead.json"), JSON.stringify(res)); console.log(JSON.stringify(res)); await b.close(); })();
