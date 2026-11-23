# Board B160 (23 November 2026; Coach Milan 19:03 to 19:35): a recipe changed after a meal was logged from it. Main on top,
# new below. Pictures from shotB160.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB160.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB160.json")) if os.path.exists(f"{HERE}/heightsB160.json") else {}
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.186, not on Preview yet")}
B = Board(); PW = 390; G = 70
W = SX + 3 * PW + 2 * G + 40
parts = [("Ticket", "B160. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B160, canvas Page 6."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> B160.1: the recipe page as it is in main, 0.3.186, not on Preview yet: Cheese pie, eaten tonight at 18:00, fixed, then its meal. B160.2: the same, new. B160.3: eaten on Friday, new. Every arrow is a tap; a scrolled screen is one tall picture. A blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "23 November 19:03: I see that PD was not updated in the end; you see the first value of 6.2. 19:11: if the recipe changes, that should trigger the question for the meal, or a warning; maybe it changes again; what to do with so many variations of the recipe. 19:12: makes sense. 19:35: draw it."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Open", " ".join(t["open"])), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B160", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "B160.1 In main, 0.3.186", "not on Preview yet: Edit recipe, Save changes, then the meal", 0, 2)
y += 60
RA = [shot(X(0), y, "1a", PW, "B160.1a Edit recipe", "draft", "Eaten tonight at 18:00. I fix the cream cheese, 500 g to 250 g, and tap Save changes. Then I open tonight's meal."),
  shot(X(1), y, "1b", PW, "B160.1b Tonight's dinner", "draft", "Still 125 g of cream cheese and the old numbers; nothing asked.")]
arrow(X(1) - G + 2, y + 300)
y2 = max(RA) + 70
label(y2, "B160.2 New", "eaten today: asked once")
y2 += 60
RB = [shot(X(0), y2, "2a", PW, "B160.2a Save changes asks", "changed", "Was it made this way? I tap Update it."),
  shot(X(1), y2, "2b", PW, "B160.2b The recipe", "changed", "One line: Your Monday dinner follows the change. I open the meal."),
  shot(X(2), y2, "2c", PW, "B160.2c Tonight's dinner", "changed", "A quarter of the new recipe: 63 g of cream cheese, new numbers.")]
for i in range(1, 3): arrow(X(i) - G + 2, y2 + 300)
y3 = max(RB) + 70
label(y3, "B160.3 New", "eaten on Friday: not asked", 0, 2)
y3 += 60
RC = [shot(X(0), y3, "3a", PW, "B160.3a Edit recipe", "changed", "Save as a new recipe beside Save changes. I tap Save changes."),
  shot(X(1), y3, "3b", PW, "B160.3b The recipe", "changed", "Not asked; one line: 1 meal eaten before keeps its foods.")]
arrow(X(1) - G + 2, y3 + 300)
RB = RC
bs = RB
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories287.dc.html", t["boardTitle"], "Drawn 23 November 2026. Ticket B160, Kanban column Next. Pictures from the real app on a scratch build of main, 0.3.186 and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories286.dc.html")
inner = B.render(W, Hc)
json.dump({"B160": {"file": "Stories287.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out160.json"), "w"))
print("B160", W, Hc + 230)
