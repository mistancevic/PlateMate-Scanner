# Board B156 (23 November 2026; Coach Milan 22 November 15:23 to 15:35, Draw 23 November 11:53): Clients keeps the names it
# knew when the invites do not load. Main on top, new below. Pictures from shotB156.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB156.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB156.json")) if os.path.exists(f"{HERE}/heightsB156.json") else {}
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "Before, 0.3.180")}
B = Board(); PW = 390; G = 70
W = SX + 3 * PW + 2 * G + 40
parts = [("Ticket", "B156. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B156, canvas Page 6."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> B156.1: as it was before 0.3.181: Clients when the invites load, and when they do not. B156.2: the same, new. Nothing here is a tap: each screen is Clients in a different moment, so there are no arrows. A blue outline marks the card that matters."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 15:23: a client showed as No on Clients. 15:28: after reopening Clients the name was back; a promote ran at the same time, and the other names were right. 15:35: yes, a ticket in Next. 23 November 11:53: Next drawing."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B156", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def moment(x, y, text):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:13px;font-weight:800;color:#3d4a63;line-height:1.3">{text}</div>')
label(y, "B156.1 Before, 0.3.180", "Clients, two moments", 0, 2)
y += 60
RA = [shot(X(0), y, "1a", PW, "B156.1a The invites load", "draft", "Sara, from her invite, with her email."),
  shot(X(1), y, "1b", PW, "B156.1b The invites do not load", "draft", "The same client shows as No.")]
y2 = max(RA) + 70
label(y2, "B156.2 New", "the last good answer kept, one more try, the whole line")
y2 += 60
RB = [shot(X(0), y2, "2a", PW, "B156.2a The invites do not load", "changed", "The kept answer: Sara, as before."),
  shot(X(1), y2, "2b", PW, "B156.2b Never seen, not loaded", "changed", "The whole line: No name yet."),
  shot(X(2), y2, "2c", PW, "B156.2c A moment later", "changed", "The second try answers: Sara.")]
moment(X(2) - G + 2, y2 + 520, "about<br>3 s<br>later,<br>no tap")
bs = RB
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories281.dc.html", t["boardTitle"], "Drawn 23 November 2026; Go 12:43, built in 0.3.181. Ticket B156, Kanban column Done. Pictures from the real app on a scratch build of main, 0.3.179 and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories280.dc.html")
inner = B.render(W, Hc)
json.dump({"B156": {"file": "Stories281.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out156.json"), "w"))
print("B156", W, Hc + 230)
