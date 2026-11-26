# Board B164 (26 November 2026; Coach Milan 10:32 to 10:33: Now, draw). Main on top, new below. Pictures from shotB164.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB164.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB164.json")) if os.path.exists(f"{HERE}/heightsB164.json") else {}
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.197")}
B = Board(); PW = 390; G = 90
W = SX + 2 * PW + G + 40
ASSETS = json.load(open(f"{HERE}/assetsB164.json")) if os.path.exists(f"{HERE}/assetsB164.json") else {}
parts = [("Ticket", "B164. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B164, canvas Page 6."),
  ("How to read this board", "<b>As a prototype, left to right; each arrow is a tap.</b> B164.1 as in main, 0.3.197: Recipes, idle, and the list after a tap on the line under my recipes. B164.2 the same, new. A blue outline marks what each note is about; the numbers are measured on the page."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "23 November 19:03: the link below the list that shows more of my recipes is almost invisible. 26 November 10:32: yes, the Recipes batch in Now, B164, DT347, DT346, with the design rules applied. 10:33: yes, draw. 10:43: since we are touching the design on this page, fix the titles too, Made by me, Made by members; now they are so tiny and easy to miss."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B164", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "B164.1 In main, 0.3.197", "Recipes, then the rest of mine", 0, 2)
y += 60
r1 = [shot(X(0), y, "64-1a", PW, "B164.1a Recipes", "draft", "Titles in small type; 3 more of mine ›, a small text link."), shot(X(1), y, "64-1b", PW, "B164.1b Recipes, Made by: me", "draft", "All 5 of mine.")]
arrow(X(0) + PW, y + 560, "→"); B.html.append(f'<div style="position:absolute;left:{X(0) + PW}px;top:{y + 605}px;width:{G}px;text-align:center;font-size:12.5px;font-weight:800;color:#2a72d9">tap<br>3 more<br>of mine</div>')
y = max(r1) + 70
label(y, "B164.2 New", "the same, with a button", 0, 2)
y += 60
r2 = [shot(X(0), y, "64-2a", PW, "B164.2a Recipes", "changed", "Titles as headings; Show all 5 of mine, the outlined button."), shot(X(1), y, "64-2b", PW, "B164.2b Recipes, Made by: me", "same", "All 5 of mine.")]
arrow(X(0) + PW, y + 560, "→"); B.html.append(f'<div style="position:absolute;left:{X(0) + PW}px;top:{y + 605}px;width:{G}px;text-align:center;font-size:12.5px;font-weight:800;color:#2a72d9">tap<br>Show all<br>5 of mine</div>')
RB = r2
bs = RB
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, {**t, "rel": "Proposed; not agreed until Coach Milan says Go"})
Hc = y + HT.get("ac", 900) + 40
board("Stories299.dc.html", t["boardTitle"], "Drawn 26 November 2026, for the Go of Coach Milan. Ticket B164, Kanban column Now. Pictures from the real app: before on main, 0.3.197; new on a scratch build of main with the change. Nothing in the app is changed yet.", B, W, Hc, "Stories298.dc.html")
inner = B.render(W, Hc)
json.dump({"B164": {"file": "Stories299.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outB164.json"), "w"))
print("B164", W, Hc + 230)
