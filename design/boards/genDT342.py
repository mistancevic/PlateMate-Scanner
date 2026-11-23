# Board DT342 (23 November 2026; Coach Milan 22 November 22:31 and 22:51): fibre, 0 where it is a fact, and the plate counts
# what is known and says so. Main on top, new below. Pictures from shotDT342.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT342.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT342.json")) if os.path.exists(f"{HERE}/heightsDT342.json") else {}
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.184, not on Preview yet")}
B = Board(); PW = 390; G = 70
W = SX + 3 * PW + 2 * G + 40
parts = [("Ticket", "DT342. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT342, canvas Page 6."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> DT342.1: the Plate as it is in main, 0.3.184, not on Preview yet: chicken, rice, broccoli and olive oil from a pack with no fibre value. DT342.2: the same plate, new. DT342.3: the same plate with a muesli bar whose pack gives no fibre, new, with fi* (Coach Milan 15:45). Every arrow is a tap; a scrolled screen is one tall picture. The word list is in the design details at the bottom."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 22:31: fibre is super important, and fi? shows very often. 22:51: go with the two-part proposal; no made-up numbers as estimates. 23 November 15:33: draw DT342 first. 15:45: in this case fi*, a * like a footnote, approximate, not a question mark."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Open", " ".join(t["open"])), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT342", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "DT342.1 In main, 0.3.184", "not on Preview yet: the Plate, then its numbers", 0, 2)
y += 60
RA = [shot(X(0), y, "1a", PW, "DT342.1a The Plate", "draft", "Olive oil from a pack that gives no fibre. The plate reads fi?. I tap the letters."),
  shot(X(1), y, "1b", PW, "DT342.1b The numbers", "draft", "Fibre ?: the 6 g of the rice and the broccoli are hidden.")]
arrow(X(1) - G + 2, y + 200)
y2 = max(RA) + 70
label(y2, "DT342.2 New", "the same plate: olive oil counts as 0 by nature", 0, 2)
y2 += 60
RB = [shot(X(0), y2, "2a", PW, "DT342.2a The Plate", "changed", "A real fibre letter, fi; the oil's row reads fi-. I tap the letters."),
  shot(X(1), y2, "2b", PW, "DT342.2b The numbers", "changed", "Fibre 6 g; one line says olive oil counts as 0.")]
arrow(X(1) - G + 2, y2 + 200)
y3 = max(RB) + 70
label(y3, "DT342.3 New", "a muesli bar with no fibre value: fi*, at least, and which food", 0, 2)
y3 += 60
RC = [shot(X(0), y3, "3a", PW, "DT342.3a The numbers", "changed", "fi* and 6* g: at least 6 g, 1 food without a value. I tap Muesli bar on the plate."),
  shot(X(1), y3, "3b", PW, "DT342.3b The muesli bar's card", "changed", "No fibre value: add it from the pack in Review the label.")]
arrow(X(1) - G + 2, y3 + 200)
RB = RC
bs = RB
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories285.dc.html", t["boardTitle"], "Drawn 23 November 2026. Ticket DT342, Kanban column Next. Pictures from the real app on a scratch build of main, 0.3.184 and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories284.dc.html")
inner = B.render(W, Hc)
json.dump({"DT342": {"file": "Stories285.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out342.json"), "w"))
print("DT342", W, Hc + 230)
