# Board B170 (25 November 2026; Coach Milan 19:37 to 19:44: A, then draw). Main on top, new below. Pictures from shotB170.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB170.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB170.json")) if os.path.exists(f"{HERE}/heightsB170.json") else {}
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB")
    h = round(im.size[1] * w / im.size[0]); im = im.resize((w, h), Image.LANCZOS)
    # media go in as canvas assets (ticket form, rule 6); the webp is written next to the shots
    os.makedirs(f"{R}/web", exist_ok=True); im2 = im.resize((w * 2, h * 2), Image.LANCZOS) if False else Image.open(f"{R}/{name}.png").convert("RGB"); im2.save(f"{R}/web/{name}.webp", "WEBP", quality=72)
    srcu = ASSETS.get(name) or "data:image/webp;base64," + base64.b64encode(open(f"{R}/web/{name}.webp", "rb").read()).decode()
    return h, f'<img src="{srcu}" style="width:{w}px;height:{h}px;border-radius:12px;border:2px solid {border};display:block">'
def shot(x, y, name, w, title, status, note):
    bg, fg, label = CHIP[status]; h, im = pic(name, w, "#2a72d9" if status == "changed" else "#d1dcf0")
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px">'
      f'<div style="font-size:18px;font-weight:900;color:#123a7a">{title}</div>'
      f'<div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:{bg};color:{fg};font-size:12.5px;font-weight:800">{label}</div>'
      f'<div style="margin-top:6px;font-size:13.5px;line-height:1.4;color:#3d4a63;min-height:38px">{note}</div>'
      f'<div style="margin-top:8px">{im}</div></div>')
    return y + 110 + h
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.195")}
B = Board(); PW = 390; G = 90
W = SX + 3 * PW + 2 * G + 40
ASSETS = json.load(open(f"{HERE}/assetsB170.json")) if os.path.exists(f"{HERE}/assetsB170.json") else {}
parts = [("Ticket", "B170. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B170, canvas Page 6."),
  ("How to read this board", "<b>As a prototype, left to right; each arrow is a tap.</b> Two phones: Sam (an invented name) shares Lazy Burek; I open it in Members and save it. B170.1 as in main, 0.3.195; B170.2 new. A blue outline marks what each note is about."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "25 November 16:57: ok, its own ticket. 18:37: yes (brainstorm B170). 19:36: what is your take? 19:37: yes, A. 19:39: are we talking about the recipe once it is touched or moved? 19:42: what is the final scope now? 19:44: draw, I still don't get it. 20:01: Go."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B170", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→", tap=""):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
    if tap: B.html.append(f'<div style="position:absolute;left:{x}px;top:{y + 45}px;width:{G}px;text-align:center;font-size:12.5px;font-weight:800;color:#2a72d9">{tap}</div>')
def row(y, n, st, notes):
    r = [shot(X(i), y, f"70-{n}{c}", PW, f"B170.{n}{c} {ttl}", s, nt) for i, (c, ttl, s, nt) in enumerate(zip("abc", ["Sam's phone: Sam's recipe", "My phone: Members, Sam's recipe", "My phone: my copy in My recipes"], st, notes))]
    arrow(X(0) + PW, y + 300, "→", "Sam taps<br>Share with<br>members"); arrow(X(1) + PW, y + 300, "→", "I tap<br>Save to My<br>recipes")
    return r
label(y, "B170.1 In main, 0.3.195", "Sam shares, I save", 0, 3)
y += 60
r1 = row(y, 1, ["draft", "draft", "draft"], ["The packs as printed.", "The packs in small letters; 2,194 kcal.", "My own pack took Sam's place: 1,932 kcal."])
y = max(r1) + 70
label(y, "B170.2 New", "the same two phones", 0, 3)
y += 60
r2 = row(y, 2, ["same", "changed", "changed"], ["No change.", "The packs as printed; 2,194 kcal.", "Sam's packs, as printed; 2,194 kcal."])
y2 = max(r2) + 30
B.html.append(f'<div style="position:absolute;left:{X(0)}px;top:{y2}px;width:{3 * PW + 2 * G}px;outline:3px solid #2a72d9;outline-offset:3px;border-radius:12px;background:#fff8d6;padding:14px 16px;font-size:15px;line-height:1.5;color:#172742;box-sizing:border-box">'
  '<b>B170.2d Recipes shared before the update (nothing to see, so no picture).</b> Today the app sends a shared recipe again whenever what it sends changes: that is how an edit reaches members (CO4b). '
  'After the update, what it sends holds the new fields, so the first time Sam opens Recipes, Lazy Burek goes once more, by itself: nobody edits or moves it. Its place in Members stays (it goes by the day it was first shared). '
  'Members see B170.2b the next time they open Members. A copy someone saved before stays as it was: it is their own recipe now.</div>')
RB = r2 + [y2 + 170]

bs = RB
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, {**t, "rel": "Go 25 November 2026, 20:01; built in 0.3.196"})
Hc = y + HT.get("ac", 900) + 40
board("Stories297.dc.html", t["boardTitle"], "Drawn 25 November 2026; Go 20:01, built in 0.3.196. Ticket B170, Kanban column Done. Pictures from the real app: before on main, 0.3.195; new on a scratch build of main with the change. Nothing in the app is changed yet.", B, W, Hc, "Stories296.dc.html")
inner = B.render(W, Hc)
json.dump({"B170": {"file": "Stories297.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outB170.json"), "w"))
print("B170", W, Hc + 230)
