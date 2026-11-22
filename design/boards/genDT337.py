# Board DT337 (22 November 2026, Coach Milan 17:41 to 17:47, Draw 22:29): Fit to my target lands in the target's range and
# adds what the meal is missing. Two whole flows like a prototype, main on top, new below. Pictures from shotDT337.cjs. Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT337.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT337.json")) if os.path.exists(f"{HERE}/heightsDT337.json") else {}
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.175")}
B = Board(); PW = 390; G = 70
W = SX + 4 * PW + 3 * G + 40
parts = [("Ticket", "DT337. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT337, canvas Page 6."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> DT337.1: the flow as it is in main, 0.3.175, not on Preview yet: three eggs, Fit to my target, more protein. DT337.2: the same flow, new: the ideas land in the range, an idea above it is a miss. A screen that stays is marked No change; a blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 17:47: Follow the range of the user's target, no new formula. Take the food preferences into account and add what is missing to balance it, with several options, as in the chat: eggs with toast, fruit. Carbs when the diet has them; a keto-like diet would add fat instead."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Open", "<br>".join(t["open"])), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT337", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "DT337.1 In main, 0.3.175, not on Preview yet", "three eggs for breakfast, target 5.3, Fit to my target", 0, 3)
y += 60
RA = [shot(X(0), y, "1a", PW, "DT337.1a The Plate", "draft", "Three eggs, PD 8.4, above the range."),
  shot(X(1), y, "1b", PW, "DT337.1b Chef Mealan's ideas", "draft", "Whey, cottage cheese, quark: PD 8.8 to 10.1."),
  shot(X(2), y, "1c", PW, "DT337.1c On the plate", "draft", "PD 10.1, and it says fits your plan.")]
for i in range(1, 3): arrow(X(i) - G + 2, y + 540)
y2 = max(RA) + 70
label(y2, "DT337.2 New", "the same plate: ideas in the range, what the meal is missing")
y2 += 60
bs = [shot(X(0), y2, "2a", PW, "DT337.2a The Plate", "same", "Three eggs, PD 8.4. I tap Fit to my target."),
  shot(X(1), y2, "2b", PW, "DT337.2b Chef Mealan's ideas", "changed", "Toast, porridge: each in the range."),
  shot(X(2), y2, "2c", PW, "DT337.2c An idea above the range", "changed", "Refused, with why, shown as a miss."),
  shot(X(3), y2, "2d", PW, "DT337.2d On the plate", "changed", "PD 6.4, in the range.")]
for i in range(1, 4): arrow(X(i) - G + 2, y2 + 540)
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories277.dc.html", t["boardTitle"], "Drawn 22 November 2026. Ticket DT337, Kanban column Next. Pictures from the real app on a scratch build of main, 0.3.175 and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories276.dc.html")
inner = B.render(W, Hc)
json.dump({"DT337": {"file": "Stories277.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out337.json"), "w"))
print("DT337", W, Hc + 230)
