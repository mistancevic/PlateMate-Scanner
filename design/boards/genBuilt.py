# Board BP1 (Stories160): the new /built, for a hiring manager with two minutes. Coach Milan 2 November 07:17 and 07:35, Draw.
# Writes the New page as HTML (built-new.html), shoots it at 1280 and 390, and lays the board: story, Now (desktop), New
# (desktop), New (phone).
import os, sys, base64, io, html, subprocess, json
sys.path.insert(0, "/home/claude/boards")
from PIL import Image
os.environ.setdefault("BOARDS_SHOTS", "/home/claude/boards/rs")
exec(open("/home/claude/boards/genDT210.py").read().split("W = SX + 3")[0])   # Board, storyCard, rowEnd, board, CHIP
CHIP["now"] = ("#5b6b8a", "#fff", "0.3.50, as it is"); CHIP["phone"] = CHIP["now"]
LEGEND = LEGEND.replace("0.3.49", "0.3.50")
import genSystem  # noqa: the arch() graph; it also rewrites System.dc.html, unchanged
R = "/home/claude/boards/rs"

def b64(path):
    return "data:image/png;base64," + base64.b64encode(open(path, "rb").read()).decode()
# thumbnails of two boards and the kanban, for the process section
def thumb(src, w=380):
    im = Image.open(src).convert("RGB"); im = im.crop((0, 0, im.size[0], min(im.size[1], int(im.size[0] * 0.75)))); im = im.resize((w, int(im.size[1] * w / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=70)
    return "data:image/webp;base64," + base64.b64encode(bb.getvalue()).decode()
S = "/tmp/claude-0/-home-claude/a3625ff7-4226-57ca-879e-055f53d2dca0/scratchpad"
for f in ["Stories158", "Stories159"]:
    if not os.path.exists(f"{S}/{f}.png"):
        subprocess.run(["node", f"{S}/rb.cjs"], check=True); break
kan = thumb(f"{S}/kanban.png"); b158 = thumb(f"{S}/Stories158.png"); b159 = thumb(f"{S}/Stories159.png")

CSS = """
*{box-sizing:border-box}body{margin:0;font-family:'Nunito',ui-sans-serif,system-ui,sans-serif;color:#172742;background:#f4f7fc;font-size:16px;line-height:1.5}
.top{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;background:#fff;border-bottom:1px solid #d1dcf0}.top b{font-size:18px;color:#123a7a}.top a{color:#1f5fc7;font-weight:700;text-decoration:none}
main{max-width:1000px;margin:0 auto;padding:24px 20px 60px}
.eyebrow{font-size:12px;font-weight:900;letter-spacing:.06em;color:#1f5fc7;text-transform:uppercase}
h1{font-size:40px;line-height:1.1;margin:6px 0 14px;font-weight:900}h2{font-size:24px;margin:44px 0 6px;font-weight:900}
.lead{font-size:18px;max-width:720px}.sub{color:#3d4a63;margin:0 0 14px}
.facts{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.fact{background:#fff;border:1.5px solid #d1dcf0;border-radius:12px;padding:10px 14px;min-width:150px}.fact b{display:block;font-size:22px;color:#123a7a}.fact span{font-size:13px;color:#3d4a63}
.card{background:#fff;border:1.5px solid #d1dcf0;border-radius:14px;padding:16px 18px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.chip{display:block;width:fit-content;border-left:4px solid;background:#f4f7fc;border-radius:6px;padding:3px 8px;font-size:13px;margin:3px 4px 0 0}.chip b{font-size:11px}
.tag{display:inline-block;color:#fff;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:800;margin-right:6px}
.step{display:flex;gap:12px;align-items:flex-start;margin-top:10px}.step .n{width:34px;height:34px;border-radius:50%;background:#123a7a;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;flex:none}
.pill{display:inline-block;background:#2e7be8;color:#fff;border-radius:999px;padding:10px 18px;font-weight:800;text-decoration:none;min-height:44px}
.pill.ghost{background:#fff;color:#1f5fc7;border:1.5px solid #2e7be8}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:8px 6px;border-bottom:1px solid #e6edf8;text-align:left;vertical-align:top}th{font-size:12px;color:#5b6b8a;letter-spacing:.04em}
.foot{font-size:13px;color:#5b6b8a;margin-top:40px}
.thumbs{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.thumbs img{width:100%;border-radius:10px;border:1.5px solid #d1dcf0;display:block}.thumbs small{display:block;font-size:12.5px;color:#3d4a63;margin-top:4px}
.loop{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.loop span{background:#fff;border:1.5px solid #d1dcf0;border-radius:10px;padding:8px 12px;font-weight:700;font-size:14px}.loop i{font-style:normal;color:#5b6b8a}
.graph svg{max-width:100%;height:auto}
@media (max-width:700px){h1{font-size:32px}.graph>div{transform:scale(0.236)!important;margin-bottom:-359px!important}.grid3,.grid2,.thumbs{grid-template-columns:1fr}.fact{min-width:46%}main{padding:16px 16px 48px}}
"""
TAGS = {"Code": "#2e7be8", "Rules": "#1e8e5a", "LLM": "#8e44ad", "Human": "#d35400"}
def chip(k, t): return f'<span class="chip" style="border-color:{TAGS[k]}"><b style="color:{TAGS[k]}">{k}</b> {t}</span>'
P5 = [("Human", "the person takes the photo"), ("LLM", "foods read, grams estimated"), ("Code", "names in one language, the numbers"), ("Rules", "the coach's checks on the plate"), ("Human", "checks the read: corrects an amount, or reads it again"), ("Human", "Ate it"), ("Code", "saved to the day")]
page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>How Chef Mealan is built</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"><style>{CSS}</style></head><body>
<div class="top"><b>Chef Mealan</b><a href="#">Home</a></div>
<main>
<div class="eyebrow">How Chef Mealan is built</div>
<h1>One product manager, one AI, three beta testers</h1>
<p class="lead">Chef Mealan helps people live their nutrition plan: at the shelf, at home, with a coach. Milan Stancevic, a senior product manager with 20 years in B2B software and a certified coach, builds it with Claude as the engineer and tests it with three beta testers, one of them a coach. Every decision is drawn before it is coded, every release is tested before it is promoted, and every AI answer is checked by a human before it counts.</p>
<div class="facts">
<div class="fact"><b>Live</b><span>since 30 September 2026, version 0.3.50 today</span></div>
<div class="fact"><b>229 releases</b><span>since 2 October, about seven a day</span></div>
<div class="fact"><b>531 · 148</b><span>unit tests · browser walkthroughs</span></div>
<div class="fact"><b>90 eval cases</b><span>7 sets, human labels and a judge</span></div>
<div class="fact"><b>3 beta testers</b><span>one of them a coach; more are joining</span></div>
</div>
<div style="display:flex;gap:12px;flex-wrap:wrap"><a class="pill" href="#">Try it: the calculator on the home page</a><a class="pill ghost" href="#">See it work, 90 seconds</a></div>

<h2>The system</h2>
<p class="sub">What runs where. The phone does the arithmetic and keeps the data; the server holds the rules and the key; the model reads and talks; a human checks.</p>
<div class="card graph" style="overflow:hidden;padding:8px"><div style="width:1480px;height:470px;transform:scale(0.648);transform-origin:0 0;margin-bottom:-165px">{genSystem.arch()}</div></div>
<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:nowrap">{"".join(f'<span class="tag" style="background:{c};margin:0">{k}</span>' for k, c in TAGS.items())}</div><p style="font-size:13px;color:#5b6b8a;margin:8px 0 0">Code is deterministic and tested. Rules are the coach's rules written as code. LLM is a Gemini call, checked by evals. Human is a person or the coach: acting, or checking what the machine produced.</p>

<h2>One path, end to end: Photo of my meal</h2>
<p class="sub">Eighteen such paths are drawn, eleven for a person and seven for a coach. This is the one with the most AI in it.</p>
<div class="card">{"".join(chip(k, t) for k, t in P5)}
<p style="font-size:14px;color:#3d4a63;margin:10px 0 0">Nothing the model read counts before the person's tap. The read is measured: foods found, grams within range, kcal within 20 %, on weighed plates. A wrong read becomes a new eval case.</p></div>

<h2>How a change is made</h2>
<p class="sub">The same five steps for every change, big or small. No code before the drawing is approved.</p>
<div class="loop"><span>Brainstorm</span><i>→</i><span>Draw: a board, now and new</span><i>→</i><span>Go: code on a branch</span><i>→</i><span>531 tests, 148 walkthroughs</span><i>→</i><span>Preview, then promote to production</span></div>
<div class="thumbs" style="margin-top:14px">
<div><img src="{b159}" alt=""><small><b>A board.</b> The Plate kept adding foods and resolved nothing. Now and new, screen by screen, drawn before a line of code.</small></div>
<div><img src="{b158}" alt=""><small><b>Another.</b> Cooking by voice existed and nobody found it. The fix is one button in the right place.</small></div>
<div><img src="{kan}" alt=""><small><b>The Kanban.</b> Now, Next, Later; a card moves right only when its step is done. Done is the last seven versions.</small></div>
</div>

<h2>How we know it works</h2>
<div class="grid2">
<div class="card"><table><tr><th>Check</th><th>What</th><th>When</th></tr>
<tr><td><b>Unit tests</b> 531</td><td>the calculator, the rules, the names</td><td>every push</td></tr>
<tr><td><b>Walkthroughs</b> 148</td><td>a real browser drives every story</td><td>every release, kept</td></tr>
<tr><td><b>Foundations</b></td><td>colours, sizes, 44 px targets</td><td>every release</td></tr>
<tr><td><b>Evals</b> 90</td><td>numbers, swaps, photo advice, chat, plate questions, the photo read</td><td>code ones every push; model ones before a release</td></tr>
<tr><td><b>The judge</b></td><td>a second model grades the first; trusted where it agrees with the coach 8 of 10</td><td>per run</td></tr></table></div>
<div class="card"><b>The loop</b><p style="font-size:14px;margin:6px 0 0">A fail gets a name. The prompt or the code is fixed. The fail becomes a case. The run goes again. The method is Product Faculty's AI Build Labs, applied per carrier: the numbers are code and get no judge; the model's words get a human label and a judge.</p>
<p style="font-size:14px;margin:10px 0 0"><b>Open today:</b> model evals on every push, and a trace per AI call to read when a case fails.</p></div>
</div>

<h2>The decisions, in loops</h2>
<p class="sub">Loop 1, July: the capstone, a prototype. Loop 2, August to October: six decisions, Direction to Delta, a real app for real users. Loop 3, October: version 0.2, training and the plan. <b>Loop 4, now:</b> version 0.3, the home page, recipes and cooking, the coach's clients, setup that never locks. Each loop is written out below, with what was decided and what carried forward.</p>
<div class="card" style="color:#5b6b8a;font-size:14px">Loops 1 to 4, as on the page today, folded.</div>

<h2>Who builds Chef Mealan</h2>
<div class="grid3">
<div class="card"><b>Product</b><p style="font-size:14px;margin:4px 0 0">Senior product manager, 20 years of B2B and B2B2C software. Designs and builds Chef Mealan with AI; the first product of his own.</p></div>
<div class="card"><b>Coach</b><p style="font-size:14px;margin:4px 0 0">Certified fitness and nutrition coach. Every rule in the app is one he gives his clients; every number is tried on himself first.</p></div>
<div class="card"><b>Author</b><p style="font-size:14px;margin:4px 0 0">The Worth series: Worth Building, Worth Eating, Worth Living. How to decide what is worth the effort.</p></div>
</div>
<div style="margin-top:14px;display:flex;gap:12px;flex-wrap:wrap;align-items:center"><a class="pill" href="mailto:hello@chefmealan.com?subject=About%20Chef%20Mealan%20and%20building%20with%20AI">Email Milan</a><a class="pill ghost" href="#">Connect on LinkedIn</a></div><p style="font-size:14px;color:#3d4a63;margin-top:10px">The code, the boards and the test runs are shown on request.</p>
<div class="foot">Home · Who's behind it · Impressum · Privacy · Disclaimer · hello@chefmealan.com · © 2026 Milan Stancevic · Version 0.3.50</div>
</main></body></html>'''
open(f"{S}/built-new.html", "w").write(page)
open(f"{S}/sbn.cjs", "w").write('''const { chromium } = require("/home/claude/platemate-scanner/node_modules/playwright");
(async () => { const b = await chromium.launch();
 for (const [w,n] of [[1280,"d"],[390,"m"]]) { const p = await b.newPage({ viewport: { width: w, height: 844 }, deviceScaleFactor: w === 390 ? 2 : 1 });
  await p.goto("file://%s/built-new.html"); await p.waitForTimeout(1200);
  await p.screenshot({ path: "/home/claude/boards/rs/built-new-" + n + ".png", fullPage: true }); console.log(n, await p.evaluate(() => document.documentElement.scrollHeight)); }
 await b.close(); })();''' % S)
subprocess.run(["node", f"{S}/sbn.cjs"], check=True)

W = SX + 3 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "BP1", "/built, for a hiring manager with two minutes", [
  ("Coach Milan, 07:01 to 08:29", "A public page that shows the work to recruiters and hiring managers, so the repo can go private. Draw the new /built. Version 4 (08:29): the blue button is Email Milan (Milan 08:29, the short label), a mailto to hello@chefmealan.com with the subject About Chef Mealan and building with AI; Connect on LinkedIn stays beside it. Version 3 (08:20): Live since 30 September as the first fact, the version under it, for a cold reader; 229 releases is about seven a day; the four tags in one row, the words under them. Version 2: no month in the title (it goes stale); three beta testers, one a coach, more joining; buttons apart; path steps one below the other; promote to production; a stronger call than Milan on LinkedIn; the graph as on the System board."),
  ("What is wrong today", "The page says Version 0.2, 283 unit tests and 82 walkthroughs; it is 0.3.50, 531 and 148. The blueprint is the July system. The loops end at version 0.2. It is long, and the proof of how the work runs is in the repo, not on the page."),
  ("The new page, top to bottom", "1. One line and five facts: version and live since, releases, tests, evals, beta testers; two buttons, try it and see it work. 2. The system: the technical graph from the System board, with the four tags. 3. One path end to end, Photo of my meal, step by step with who does what. 4. How a change is made: the five steps and three boards as pictures. 5. How we know it works: the table and the loop, with what is open. 6. The decisions in four loops, folded. 7. Who builds it, LinkedIn, code on request."),
  ("Where the numbers come from", "BUILT_FACTS in the code, counted at build time, never typed: the version, the unit tests, the walkthroughs, the eval cases, the releases this month."),
  ("Stays", "The 90-second clip, Who builds, the books, the loops (folded). Goes: the July blueprint with its click-through."),
])
HW = (3 * SW + 2 * GAP - 30) // 2
def half(nid, col, y, title, name, status, what):
    bg, fg, label = CHIP[status]; x = B.x(0) + col * (HW + 30)
    im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((HW * 2, int(im.size[1] * HW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=60)
    h = int(im.size[1] / 2)
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{HW}px">'
      f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
      f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span> <span style="font-size:12.5px;color:#172742;margin-left:8px">{what}</span></div>'
      f'<div style="margin-top:8px"><img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{HW}px;border-radius:10px;border:1.5px solid {"#2e7be8" if status == "changed" else "#d1dcf0"};display:block"></div></div>')
    return y + TT + 8 + CH + 8 + h
h = rowEnd(cy, half("BP1a", 0, y, "Now: /built on a computer", "built-now-d", "now", "Version 0.2, 283 tests, the July blueprint, long."),
  half("BP1b", 1, y, "New: /built on a computer", "built-new-d", "changed", "Facts, the system, one path, the process, the checks, who."))
y = h
h = rowEnd(B.screen("BP1c", 0, y, "New: /built on a phone", "built-new-m", "changed", "The same page, one column."))
y = h
board("Stories160.dc.html", "BP1. /built, for a hiring manager with two minutes",
  "2 November 2026 (Coach Milan 07:01 to 08:29). Version 4. Now: 0.3.50, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories159.dc.html")
