# Board DT339 (23 November 2026; Coach Milan 22 November 18:43 to 18:46, Draw 23 November 11:17): a nutrition table printed in
# several languages shows the app's own names. Main on top, new below. Pictures from shotDT339.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT339.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT339.json")) if os.path.exists(f"{HERE}/heightsDT339.json") else {}
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "Before, 0.3.179")}
B = Board(); PW = 390; G = 70
W = SX + 3 * PW + 2 * G + 40
parts = [("Ticket", "DT339. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT339, canvas Page 6."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> DT339.1: as it was in 0.3.179: a pack's card, then a tap on Review the label. DT339.2: the same, new. DT339.3: the new card in Srpski. DT339.4: the open point, option B, the printed name behind a tap. Each screen scrolls, so it is one tall picture. A blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 18:43 to 18:46: a scanned label showed Greek food names; the pack prints each line in Czech, Croatian, Bulgarian and Greek. Yes, a ticket in Next. 23 November 11:17: Draw."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT339", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "DT339.1 Before, 0.3.179", "a pack's card, then Review the label", 0, 2)
y += 60
RA = [shot(X(0), y, "1a", PW, "DT339.1a The pack's card", "draft", "Every line as printed, in four languages. Fat, Carbohydrate and Protein show twice. I tap Review the label."),
  shot(X(1), y, "1b", PW, "DT339.1b Review the label", "draft", "The same long names, the same doubled lines.")]
arrow(X(1) - G + 2, y + 400)
y2 = max(RA) + 70
label(y2, "DT339.2 New", "the app's own names, the printed one small under each", 0, 2)
y2 += 60
RB = [shot(X(0), y2, "2a", PW, "DT339.2a The pack's card", "changed", "Fat, with Tuky/Masti/Мазнини/Λιπαρά under it. Each line once. I tap Review the label."),
  shot(X(1), y2, "2b", PW, "DT339.2b Review the label", "changed", "The same names; the values change as today.")]
arrow(X(1) - G + 2, y2 + 400)
R3 = [shot(X(2), y2, "3a", PW, "DT339.3a The card in Srpski", "changed", "Energija, Masti, Ugljeni hidrati; the printed name under each.")]
# DT339.4 (Coach Milan 23 November 11:41): the open point drawn, option B, the printed name behind a tap
y4 = max(RB + R3) + 70
label(y4, "DT339.4 Option B, behind a tap", "looked at, not chosen (11:52): A is the one", 0, 2)
y4 += 60
R4 = [shot(X(0), y4, "4a", PW, "DT339.4a The pack's card", "changed", "Only the app's names; a › on each line that has a printed name. I tap Fat."),
  shot(X(1), y4, "4b", PW, "DT339.4b Fat opens", "changed", "Its name as printed, under it. A second tap closes it.")]
arrow(X(1) - G + 2, y4 + 400)
bs = RB + R3 + R4
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories280.dc.html", t["boardTitle"], "Drawn 23 November 2026; option A chosen 11:52, Go 11:53, built in 0.3.180. Ticket DT339, Kanban column Done. Pictures from the real app on a scratch build of main, 0.3.179 and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories279.dc.html")
inner = B.render(W, Hc)
json.dump({"DT339": {"file": "Stories280.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out339.json"), "w"))
print("DT339", W, Hc + 230)
