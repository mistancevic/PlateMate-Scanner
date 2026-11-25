# Board B169 (25 November 2026; Coach Milan 15:55 to 15:59, option A). Main on top, new below. Pictures from shotB169.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB169.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB169.json")) if os.path.exists(f"{HERE}/heightsB169.json") else {}
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.193")}
B = Board(); PW = 390; G = 90
W = SX + 2 * PW + G + 40
ASSETS = json.load(open(f"{HERE}/assetsB169.json")) if os.path.exists(f"{HERE}/assetsB169.json") else {}
parts = [("Ticket", "B169. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B169, canvas Page 6."),
  ("How to read this board", "<b>As a prototype, left to right; each arrow is a tap.</b> B169.1: a recipe with the starter chicken as in main, 0.3.193: its steps, then Edit recipe. B169.2: the same, new. A blue outline marks what each note is about."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "25 November 15:55: yes, its own ticket; should we do it the first thing next? 15:56: yes, draw. 15:59: A, the app: a starter food counts as a basic food. 16:04: Go."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B169", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "B169.1 In main, 0.3.193", "the steps, then Edit recipe", 0, 2)
y += 60
r1 = [shot(X(0), y, "69-1a", PW, "B169.1a Recipe page, Steps", "draft", "Fold in 100 g Chicken breast."), shot(X(1), y, "69-1b", PW, "B169.1b Edit recipe, Steps", "draft", "The same: Chicken breast.")]
arrow(X(0) + PW, y + 260, "→"); B.html.append(f'<div style="position:absolute;left:{X(0) + PW}px;top:{y + 305}px;width:{G}px;text-align:center;font-size:12.5px;font-weight:800;color:#2a72d9">tap<br>Edit recipe</div>')
y = max(r1) + 70
label(y, "B169.2 New", "the same steps", 0, 2)
y += 60
r2 = [shot(X(0), y, "69-2a", PW, "B169.2a Recipe page, Steps", "changed", "Fold in 100 g chicken breast."), shot(X(1), y, "69-2b", PW, "B169.2b Edit recipe, Steps", "changed", "The same: chicken breast.")]
arrow(X(0) + PW, y + 260, "→"); B.html.append(f'<div style="position:absolute;left:{X(0) + PW}px;top:{y + 305}px;width:{G}px;text-align:center;font-size:12.5px;font-weight:800;color:#2a72d9">tap<br>Edit recipe</div>')
RB = r2
bs = RB
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, {**t, "rel": "Go 25 November 2026, 16:04; built in 0.3.194"})
Hc = y + HT.get("ac", 900) + 40
board("Stories295.dc.html", t["boardTitle"], "Drawn 25 November 2026; Go 16:04, built in 0.3.194. Ticket B169, Kanban column Done. Pictures from the real app: before on main, 0.3.193; new on a scratch build of main with the change. Nothing in the app is changed yet.", B, W, Hc, "Stories294.dc.html")
inner = B.render(W, Hc)
json.dump({"B169": {"file": "Stories295.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outB169.json"), "w"))
print("B169", W, Hc + 230)
