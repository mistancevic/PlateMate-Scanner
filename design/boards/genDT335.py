# Board DT335 (23 November 2026; Coach Milan 22 November 15:48 to 16:19, limits 23 November 13:47): Gain healthy weight,
# goals greyed when they do not fit, a target body weight. Main on top, new below. Pictures from shotDT335.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT335.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT335.json")) if os.path.exists(f"{HERE}/heightsDT335.json") else {}
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "Before, 0.3.183")}
B = Board(); PW = 390; G = 70
W = SX + 3 * PW + 2 * G + 40
parts = [("Ticket", "DT335. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT335, canvas Page 6."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> DT335.1: the goal step as it was in 0.3.183, for a woman of 28, 48 kg at 168 cm. DT335.2: the same, new. DT335.3: the heavy side, a woman of 36, 82 kg, body fat 38 %. Every arrow is a tap; a scrolled screen is one tall picture. The sources of the limits are in the design details at the bottom."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 15:48: a tester who is a bit underweight wants to gain, muscle and some fat, plus 7 kg. 15:54: no BMI as a number; keep the whole list, a goal that does not fit cannot be picked and a tap says why. 16:12: add Gain healthy weight; the target is a body weight, 48 to 55 kg, roughly 1 kg a month. 16:19: a target weight for Gain healthy weight and Lose fat. 23 November 13:47: limits from official guidelines, as a note."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Open", " ".join(t["open"])), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT335", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "DT335.1 Before, 0.3.183", "48 kg at 168 cm, 28", 0, 1)
label(y, "DT335.2 New", "the same woman", 1, 2)
y += 60
RA = [shot(X(0), y, "1a", PW, "DT335.1a The goal step", "draft", "Every goal can be picked; nothing for healthy weight gain.")]
R2 = [shot(X(1), y, "2a", PW, "DT335.2a The goal step", "changed", "Gain healthy weight; two goals greyed. I tap Lose fat.")]
R2b = shot(X(2), y, "2b", PW, "DT335.2b The reason, in place", "changed", "From her numbers; not picked.")
arrow(X(2) - G + 2, y + 300)
y2 = R2b + 40
arrow(X(2) + PW // 2 - G // 2, y2 - 40, "↓")
R2c = shot(X(2), y2, "2c", PW, "DT335.2c Gain healthy weight, 55 kg", "changed", "I tap the goal and type 55. Then Apply from today.")
y3 = R2c + 40
arrow(X(2) + PW // 2 - G // 2, y3 - 40, "↓")
R2d = shot(X(2), y3, "2d", PW, "DT335.2d Me, Goal", "changed", "The target and how far she has come.")
yh = max(RA + R2 + [R2d]) + 70
label(yh, "DT335.3 New, the heavy side", "82 kg at 168 cm, 36, body fat 38 %", 0, 2)
yh += 60
R3 = [shot(X(0), yh, "3a", PW, "DT335.3a The goal step", "changed", "Gain healthy weight and Build muscle greyed; the reason open."),
  shot(X(1), yh, "3b", PW, "DT335.3b Lose fat, 72 kg", "changed", "I tap Lose fat and type 72.")]
arrow(X(1) - G + 2, yh + 300)
bs = R3 + [R2d]
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories284.dc.html", t["boardTitle"], "Drawn 23 November 2026; Go 14:13, built in 0.3.184. Ticket DT335, Kanban column Done. Pictures from the real app on a scratch build of main, 0.3.182 and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories283.dc.html")
inner = B.render(W, Hc)
json.dump({"DT335": {"file": "Stories284.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out335.json"), "w"))
print("DT335", W, Hc + 230)
