# Board DT347 (26 November 2026; Coach Milan 10:43 and 11:26: draw). Main on top, new below. Pictures from shotDT347.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT347.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT347.json")) if os.path.exists(f"{HERE}/heightsDT347.json") else {}
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.198")}
B = Board(); PW = 390; G = 90
W = SX + 4 * PW + 3 * G + 40
ASSETS = json.load(open(f"{HERE}/assetsDT347.json")) if os.path.exists(f"{HERE}/assetsDT347.json") else {}
parts = [("Ticket", "DT347. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT347, canvas Page 6."),
  ("How to read this board", "<b>As a prototype, left to right; each arrow is a tap.</b> DT347.1 as in main, 0.3.198: the Recipes bar at rest, Kitchen open, the sort. DT347.2 new, redrawn 12:25: the bar at rest, the sort open, the Filters panel with two chosen, the panel closed. A blue outline marks what each note is about; the numbers are measured on the page."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "23 November 19:03: sort the recipes newest first by default; the filter section is a big block, maybe chips or another way to show and hide it. 26 November 10:43: Sort, these should be chips as well? I would put Newest as the first one and as default. Do you have some design proposal for them instead of text, or better keep text for now? Any idea how to solve the tension from so many chips displayed at once. 11:26: DT347, draw. 11:46: sort based on the time stamp seems like the starting one; second Made by, and already preselected; filter is the only one for several options to select, maybe that can be a longer scroll at once. 11:58: Made by should already have a default selection; let's draw it. 12:12: I think it is not scroll sideways but vertically, so there is a third chip, a drop-down filter with all the options, and at the bottom close; is that better? I find such filters in many places on the internet. 12:16: draw. 12:29: 2c has to continue the same way; why did you break the pattern at the bottom? 12:35: there is no need for More, it has to be some filter option with selections within; also Moment is not our word but Meal. 12:40: the heading of the block should be more prominent. 12:41: can we add the PD filter by ranges? 12:52: Go."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT347", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, tap):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">→</div>')
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y + 45}px;width:{G}px;text-align:center;font-size:12.5px;font-weight:800;color:#2a72d9">{tap}</div>')
label(y, "DT347.1 In main, 0.3.198", "twelve things to tap at rest", 0, 3)
y += 60
r1 = [shot(X(0), y, "47-1a", PW, "DT347.1a Recipes, the bar", "draft", "Twelve things to tap; the sort as text."), shot(X(1), y, "47-1b", PW, "DT347.1b Kitchen open", "draft", "Its list under the chips."), shot(X(2), y, "47-1c", PW, "DT347.1c The sort", "draft", "Six text links, For your day chosen.")]
arrow(X(0) + PW, y + 160, "tap<br>Kitchen ▾"); arrow(X(1) + PW, y + 160, "tap<br>Kitchen ▾<br>again")
y = max(r1) + 70
label(y, "DT347.2 New, redrawn 26 November 12:25", "Newest, Made by, Filters; Filters opens a panel", 0, 4)
y += 60
r2 = [shot(X(0), y, "47-2a", PW, "DT347.2a Recipes, the bar", "changed", "Newest, Made by: All, Filters."), shot(X(1), y, "47-2b", PW, "DT347.2b The sort open", "changed", "Six chips, Newest first."), shot(X(2), y, "47-2c", PW, "DT347.2c The Filters panel", "changed", "The same rows to the end; Show 6 recipes."), shot(X(3), y, "47-2d", PW, "DT347.2d The panel closed", "changed", "Filters · 2.")]
arrow(X(0) + PW, y + 160, "tap<br>Newest ▾"); arrow(X(1) + PW, y + 160, "tap Newest,<br>then<br>Filters ▾,<br>No cooking,<br>With my<br>foods"); arrow(X(2) + PW, y + 160, "tap Show<br>6 recipes")
RB = r2
bs = RB
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, {**t, "rel": "Go 26 November 2026, 12:52; built in 0.3.199"})
Hc = y + HT.get("ac", 900) + 40
board("Stories300.dc.html", t["boardTitle"], "Drawn 26 November 2026, redrawn 12:10 to 13:00; Go 12:52, built in 0.3.199. Ticket DT347, Kanban column Done. Pictures from the real app: before on main, 0.3.198; new on a scratch build of main with the change. Nothing in the app is changed yet.", B, W, Hc, "Stories299.dc.html")
inner = B.render(W, Hc)
json.dump({"DT347": {"file": "Stories300.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outDT347.json"), "w"))
print("DT347", W, Hc + 230)
