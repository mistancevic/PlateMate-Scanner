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
W = SX + 5 * PW + 4 * G + 40
parts = [("Ticket", "DT337. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT337, canvas Page 6."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> DT337.1 and DT337.2: the flows as they are in main, 0.3.175, not on Preview yet: with no meal set the quick fit adds whey; with a meal set Chef Mealan adds protein. DT337.3: new, Fit asks which meal, and only ideas in the range are shown. DT337.4: new, the quick fit with the AI off adds a base. A screen that stays is marked No change; a blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 23:40: We need weight next to kcal and PDs on the line with the kitchen country. 23:10: The app should show correct suggestions. Because it was asked very precisely. 22:46: Interesting feature. I like it. How to make it more often available? 22:51: Redraw. 17:47: Follow the range of the user's target, no new formula. Take the food preferences into account and add what is missing to balance it, with several options, as in the chat: eggs with toast, fruit. Carbs when the diet has them; a keto-like diet would add fat instead."),
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
label(y, "DT337.1 In main, 0.3.175, not on Preview yet", "no meal set: the quick fit, the path the tester took", 0, 2)
y += 60
RA = [shot(X(0), y, "1a", PW, "DT337.1a The Plate", "draft", "One egg, no meal set, PD 8.4."),
  shot(X(1), y, "1b", PW, "DT337.1b The quick fit", "draft", "It adds whey: PD 17.0, as in the test.")]
arrow(X(1) - G + 2, y + 540)
y2 = max(RA) + 70
label(y2, "DT337.2 In main, 0.3.175, not on Preview yet", "a meal set: Chef Mealan's ideas add protein", 0, 3)
y2 += 60
RB = [shot(X(0), y2, "2a", PW, "DT337.2a The Plate", "draft", "Breakfast set, one egg, PD 8.4."),
  shot(X(1), y2, "2b", PW, "DT337.2b Chef Mealan's ideas", "draft", "Whey, cottage cheese, quark: PD 8.6 to 9.4."),
  shot(X(2), y2, "2c", PW, "DT337.2c On the plate", "draft", "PD 8.9, and it says fits your plan.")]
for i in range(1, 3): arrow(X(i) - G + 2, y2 + 540)
y3 = max(RB) + 70
label(y3, "DT337.3 New", "no meal set: Fit asks which meal, then ideas in the range")
y3 += 60
RC = [shot(X(0), y3, "3a", PW, "DT337.3a The Plate", "same", "One egg, no meal set. I tap Fit."),
  shot(X(1), y3, "3b", PW, "DT337.3b Which meal is it?", "changed", "The meal line opens: one tap."),
  shot(X(2), y3, "3c", PW, "DT337.3c Chef Mealan's ideas", "changed", "Three ideas in the range, each with its weight."),
  shot(X(3), y3, "3d", PW, "DT337.3d On the plate", "changed", "PD 6.3, in the range.")]
for i in range(1, 4): arrow(X(i) - G + 2, y3 + 540)
y4 = max(RC) + 70
label(y4, "DT337.4 New", "the AI off: the quick fit adds a base, never protein", 0, 2)
y4 += 60
bs = [shot(X(0), y4, "4a", PW, "DT337.4a The Plate", "same", "AI off. Breakfast, one egg, PD 8.4."),
  shot(X(1), y4, "4b", PW, "DT337.4b The quick fit", "changed", "It adds bread: PD 5.3, in the range.")]
arrow(X(1) - G + 2, y4 + 540)
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories277.dc.html", t["boardTitle"], "Drawn 22 November 2026. Ticket DT337, Kanban column Done, v0.3.176. Pictures from the real app on a scratch build of main, 0.3.175 and new. Go 22 November 23:44; built in 0.3.176.", B, W, Hc, "Stories276.dc.html")
inner = B.render(W, Hc)
json.dump({"DT337": {"file": "Stories277.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out337.json"), "w"))
print("DT337", W, Hc + 230)
