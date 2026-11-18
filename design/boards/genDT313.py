# Boards DT313, DT314 and B148: the prep for 0.3.158, "the meal model, closed" (frames from shotDT313.cjs, drawn
# 18 November 2026 on the app as built in 0.3.157). Each board is its ticket, in the form of claude/chef-mealan-ticket-form:
# the request, the solution and the decision, the screens, then the agreement as Given, When, Then rows.
# The helpers (Board, storyCard, row, board) are the ones of genDT308d.py, taken as they are.
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read()
exec(src[:src.index("\nstart(4)")])
TICKETS = json.load(open(f"{HERE}/tickets158.json"))
def gwt(t):
    m = re.match(r"Given (.*), when (.*), then (.*)$", t); assert m, t; return [x[0].upper() + x[1:] for x in m.groups()]
def acTable(B, y, w, t):
    th = "padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742"
    td = "padding:10px 12px;font-size:13.5px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0"
    hd = "font-size:12px;font-weight:900;letter-spacing:.05em;color:#5b6b8a"
    rows = ""
    for a in t["ac"]:
        g, wh, th2 = gwt(a["text"].rstrip("."))
        rows += f'<tr><td style="{td};font-weight:800;color:#123a7a;white-space:nowrap">{a["id"]}</td><td style="{td};font-weight:700">{a["title"]}</td><td style="{td}">{g}</td><td style="{td}">{wh}</td><td style="{td}">{th2}</td></tr>'
    li = lambda x: f'<div style="font-size:13.5px;line-height:1.45;color:#172742;margin-top:4px">{x}</div>'
    B.html.append(f'<div data-ac style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
      f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{t["id"]}</span>3. The agreement: what gets built</div>'
      f'<div style="margin-top:6px;font-size:13.5px;color:#172742">{t["short"]}. {t.get("rel", "Proposed; not agreed until Coach Milan says Go")}. A walkthrough check names its criterion, for example {t["id"]} AC1.</div>'
      f'<div style="{hd};margin-top:14px">ACCEPTANCE CRITERIA, WHAT IS NEW</div>'
      f'<table style="margin-top:6px;width:100%;border-collapse:collapse;table-layout:fixed"><colgroup><col style="width:58px"><col style="width:20%"><col style="width:24%"><col style="width:22%"><col></colgroup>'
      f'<tr><th style="{th};border-radius:8px 0 0 0">#</th><th style="{th}">Scenario</th><th style="{th}">Given</th><th style="{th}">When</th><th style="{th};border-radius:0 8px 0 0">Then</th></tr>{rows}</table>'
      f'<div style="display:flex;gap:40px;margin-top:16px"><div style="flex:1.4"><div style="{hd}">ALREADY WORKS, MUST NOT CHANGE</div>' + "".join(li(x) for x in t["unchanged"])
      + f'</div><div style="flex:1"><div style="{hd}">DESIGN DETAILS FOR THE BUILD</div>' + "".join(li(x) for x in t["details"]) + '</div></div></div>')
def parts(t):
    o = t["opportunity"]
    p = [("Ticket", f'{t["id"]}. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: {t["id"]}, canvas Page 5.'),
      ("How to read this board", "<b>This card, top to bottom:</b> the request, then the solution and the decision. <b>The screens</b> on the right: the design. <b>The wide block at the bottom:</b> the agreement, what gets built."),
      ("1. The request", ""),
      ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
      ("Problem", t["problem"]), ("Story", t["story"]),
      ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"])]
    p += [(h, x) for h, x in t.get("more", [])]
    p += [("Decision", t.get("decision", "Open. Drawn for Coach Milan's look on 18 November 2026. No Go, so nothing is built.")), ("3. The agreement", "In the wide block at the bottom of this board.")]
    return p
# card heights and the place of the agreement are measured in a browser (measure158.cjs writes heights158.json)
HT = json.load(open(f"{HERE}/heights158.json")) if os.path.exists(f"{HERE}/heights158.json") else {}
OUT = {}
def make(tid, fname, cols, shots, after, sub):
    t = TICKETS[tid]; start(cols)
    g = globals()
    row(tid.lower(), t["short"], parts(t), shots, nid=tid, arrows=t.get("arrows", True))
    B, W = g["B"], g["W"]
    h = HT.get(tid, {"card": 2400, "ac": 700})
    top = max(h["card"], max(TOP + ih(n) for _, n, _, _ in shots) + 30) + 60
    acTable(B, top, W - 40, t)
    Hc = top + h["ac"] + 40
    board(fname, f'{tid}: {t["title"]}', sub, B, W, Hc, after)
    OUT[tid] = {"file": fname, "w": W, "h": min(8000, Hc + 230), "title": f'{tid}: {t["title"]}', "inner": g["B"].render(W, Hc)}
SUB = "18 November 2026. The meal model, closed. Drawn on the app as built in 0.3.157. Go: 18 November 15:56. Built in 0.3.159."
make("DT313", "Stories250.dc.html", 6, [
  ("From Recipes: Change it first", "r_0", "draft", "A recipe's page in Recipes, with skyr, oats and a banana on the Plate. Amber: the tap."),
  ("The question today", "r_1", "draft", "The old look. Red: what differs from the screen a photo gets. The old plate is thrown away."),
  ("One food onto Saturday's plate", "s_3", "draft", "A banana added on Sunday to a plate from Saturday. Red: the old question again."),
  ("A photo's question, as built", "r_2", "same", "DT308.12f in 0.3.157. This is the screen to reuse. Nothing on it changes."),
  ("The same screen for a recipe", "r_3", "changed", "The recipe from Recipes on that screen. Blue: Back, and Chef Mealan's line with where it comes from."),
  ("After Start a new plate", "r_4", "changed", "Only the recipe is on the plate. The old plate is in My recipes, with Undo."),
], "Stories249.dc.html", SUB)
make("DT314", "Stories251.dc.html", 4, [
  ("A plate from earlier", "o_0", "draft", "Sunday 18:00. The plate is from Saturday 19:10. Amber: the tap."),
  ("After Ate it, today", "o_1", "draft", "Logged at once, to a meal the app picked. The message names no meal."),
  ("Ate it asks the meal", "o_2", "changed", "The calendar opens on Saturday with Dinner marked. Drawn on the plate's own Ate it: the same calendar opens under the question's buttons."),
  ("After a tap on Dinner", "o_3", "changed", "Saturday in the Plan, with the line that names the day and the meal. As the calendar does today."),
], "Stories250.dc.html", SUB)
make("B148", "Stories252.dc.html", 2, [
  ("Under Ate it, a tap on Sat 14", "o_b", "draft", "0.3.157. The calendar stays on Sun 15, today. Amber: the tap that does nothing."),
  ("What the tap should open", "o_c", "changed", "Saturday's meals, as the calendar behind the pencil already does."),
], "Stories251.dc.html", "18 November 2026. A bug found in 0.3.157 while drawing the board DT314. Go 15:45; built in 0.3.158.")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out158.json"), "w"))
