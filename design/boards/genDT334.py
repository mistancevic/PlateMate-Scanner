# Board DT334 (23 November 2026; Coach Milan 22 November 15:35 to 15:43, Draw 23 November 00:28): up to 3 kitchens you cook, and a
# chip for trying new kitchens, taken out 23 November 00:56: limit to 3. Main on top, new below. Pictures from shotDT334.cjs. Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT334.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT334.json")) if os.path.exists(f"{HERE}/heightsDT334.json") else {}
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB")
    h = round(im.size[1] * w / im.size[0]); im = im.resize((w, h), Image.LANCZOS)
    bb = io.BytesIO(); im.save(bb, "WEBP", quality=80)
    return h, f'<img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{w}px;height:{h}px;border-radius:12px;border:2px solid {border};display:block">'
def shot(x, y, name, w, title, status, note):
    bg, fg, label = CHIP[status]; h, im = pic(name, w, "#2a72d9" if status == "changed" else "#d1dcf0")
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px">'
      f'<div style="font-size:18px;font-weight:900;color:#123a7a">{title}</div>'
      f'<div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:{bg};color:{fg};font-size:12.5px;font-weight:800">{label}</div>'
      f'<div style="margin-top:6px;font-size:13.5px;line-height:1.4;color:#3d4a63;min-height:38px">{note}</div>'
      f'<div style="margin-top:8px">{im}</div></div>')
    return y + 110 + h
# Coach Milan 22 November 2026, 21:56: "today" on a board meant main, which he had not seen on Preview; the label says so
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.177")}
B = Board(); PW = 390; G = 70
W = SX + 2 * PW + G + 40
parts = [("Ticket", "DT334. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT334, canvas Page 6."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> DT334.1: the flow as it is in main, 0.3.177, not on Preview yet: setup's kitchens, any number. DT334.2: the same step, new: up to 3. A screen that stays is marked No change; a blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 15:41: limit the kitchens you cook to 3. The testers who already have more than 3 he asks himself. 23 November 00:34: Trying new kitchens would possibly give some ideas from random kitchens that no one asked about. That is wrong. 00:56: Limit to 3."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT334", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "DT334.1 In main, 0.3.177", "not on Preview yet: setup, the kitchens you cook, any number", 0, 2)
y += 60
RA = [shot(X(0), y, "1a", PW, "DT334.1a Setup, step 5", "draft", "Pick one or more."),
  shot(X(1), y, "1b", PW, "DT334.1b Ten kitchens picked", "draft", "A block for each; Chef Mealan gets 8.")]
arrow(X(1) - G + 2, y + 540)
y2 = max(RA) + 70
label(y2, "DT334.2 New", "the same step: up to 3", 0, 2)
y2 += 60
RB = [shot(X(0), y2, "2a", PW, "DT334.2a Setup, step 5", "changed", "The line says Pick up to 3."),
  shot(X(1), y2, "2b", PW, "DT334.2b A fourth tapped", "changed", "Not picked: Up to 3. Tap one off first.")]
arrow(X(1) - G + 2, y2 + 540)
bs = RB
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories278.dc.html", t["boardTitle"], "Drawn 23 November 2026. Ticket DT334, Kanban column Next. Pictures from the real app on a scratch build of main, 0.3.177 and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories277.dc.html")
inner = B.render(W, Hc)
json.dump({"DT334": {"file": "Stories278.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out334.json"), "w"))
print("DT334", W, Hc + 230)
