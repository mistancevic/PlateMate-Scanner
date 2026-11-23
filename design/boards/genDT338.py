# Board DT338 (23 November 2026; Coach Milan 22 November 17:57 to 18:01, Draw 23 November 09:00): what the PD colours mean, one
# scale on the Goal page and behind the PD number on the Plate. Main on top, new below. Pictures from shotDT338.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT338.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT338.json")) if os.path.exists(f"{HERE}/heightsDT338.json") else {}
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.178")}
B = Board(); PW = 390; G = 70
W = SX + 3 * PW + 2 * G + 40
parts = [("Ticket", "DT338. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT338, canvas Page 6."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> DT338.1: as it is in main, 0.3.178, not on Preview yet: the Goal page, then the Plate. DT338.2: the same, new: the scale on the Goal page, and on the Plate behind a tap on the PD number. A screen that stays is marked No change; a blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 17:57: add the ranges and their colours where users see them, so they know what the colour of their numbers means. 18:01: both places."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Open", "<br>".join(t["open"])), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT338", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "DT338.1 In main, 0.3.178", "not on Preview yet: the Goal page, then the Plate", 0, 3)
y += 60
RA = [shot(X(0), y, "1a", PW, "DT338.1a Me, Goal", "draft", "The PD target; nothing on the colours."),
  shot(X(1), y, "1b", PW, "DT338.1b The Plate", "draft", "PD 8.4 in High; a tap does nothing.")]
arrow(X(1) - G + 2, y + 540)
y2 = max(RA) + 70
label(y2, "DT338.2 New", "the scale on the Goal page, and behind the PD number")
y2 += 60
RB = [shot(X(0), y2, "2a", PW, "DT338.2a Me, Goal", "changed", "The scale under the target."),
  shot(X(1), y2, "2b", PW, "DT338.2b The Plate", "same", "PD 8.4 in High. I tap the number."),
  shot(X(2), y2, "2c", PW, "DT338.2c The scale opens", "changed", "A mark where this plate sits: High.")]
for i in range(1, 3): arrow(X(i) - G + 2, y2 + 540)
bs = RB
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories279.dc.html", t["boardTitle"], "Drawn 23 November 2026. Ticket DT338, Kanban column Next. Pictures from the real app on a scratch build of main, 0.3.178 and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories278.dc.html")
inner = B.render(W, Hc)
json.dump({"DT338": {"file": "Stories279.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out338.json"), "w"))
print("DT338", W, Hc + 230)
