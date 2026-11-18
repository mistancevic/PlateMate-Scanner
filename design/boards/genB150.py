# Board B150: a photo from another day, logged under a meal of today, leaves two dinners on its day.
# Frames from shotB150.cjs. Helpers from genRead.py (card, rowAt, readBoard), taken as they are. Run: shot, gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
g = open(f"{HERE}/genRead.py").read(); exec(g[:g.index("def P(pt)")])
T = {"B150": json.load(open(f"{HERE}/ticketB150.json"))}
HT = json.load(open(f"{HERE}/heightsB150.json")) if os.path.exists(f"{HERE}/heightsB150.json") else {}
OUT = {}
t = T["B150"]; o = t["opportunity"]
parts = [("Ticket", "B150. This board is the ticket: everything about it is here."),
  ("How to read this board", "<b>This card:</b> the request, then the solution and the decision. <b>The screens</b> on the right: the app as it is, then the same screens with the change. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
  ("1. The request", ""),
  ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", t["words"]),
  ("2. The solution and the decision", ""), ("What happened", t["cause"]), ("Proposed", t["proposed"]), ("Your phone", t["repair"]),
  ("Decision", "Open. Drawn for Coach Milan's look on 18 November 2026. No Go, so nothing is built."), ("3. The agreement", "In the wide block at the bottom of this board.")]
readBoard("B150", "Stories260.dc.html", 4, [("B150", t["short"], parts, [
  ("The pencil on the read, today", "n_0", "draft", "Sunday 18:00. The photo is from Saturday 15:57. Red: the day the calendar opens on. Amber: the tap."),
  ("Saturday in the Plan, today", "n_1", "draft", "The record as it is on your phone, shown on this board's days. Red: the two dinners."),
  ("The pencil opens on the photo's day", "n_2", "changed", "The same read. Blue: the reason, and the day."),
  ("One dinner", "n_3", "changed", "Saturday in the Plan after a tap on Dinner, All of it and Done.")], [1, 3])],
  "Stories259.dc.html", "18 November 2026 (Coach Milan 19:21, with a screenshot of his Plan). A bug, reproduced on the app as built in 0.3.159. Drawn for approval; no Go.")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outRead.json"), "w"))
print(json.dumps({k: [v["file"], v["w"], v["h"]] for k, v in OUT.items()}))
