# Board DT323: a plate I only look at. Don't count it on the read, and the kept plate starts as Mine.
# Frames from shotDT323.cjs. Helpers from genRead.py (card, rowAt, readBoard), taken as they are. Run: shot, gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
g = open(f"{HERE}/genRead.py").read(); exec(g[:g.index("def P(pt)")])
T = {"DT323": json.load(open(f"{HERE}/ticketDT323.json"))}
HT = json.load(open(f"{HERE}/heightsDT323.json")) if os.path.exists(f"{HERE}/heightsDT323.json") else {}
OUT = {}
t = T["DT323"]; o = t["opportunity"]
head = [("Ticket", "DT323. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT323, canvas Page 5."),
  ("How to read this board", "<b>First row:</b> the way to keep a plate without counting it, step by step, as the app is today. <b>Second row:</b> the new flow, whole, on the same photo; each frame says what changed on it and what did not. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
  ("The case on this board", t["days"]),
  ("1. The request", ""),
  ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", t["words"]), ("What happens today", t["cause"])]
sol = [("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at and not chosen", t["not_chosen"]),
  ("Words for a kept plate", t["point3"]), ("Open, for your word", t["open"][0]), ("Decision", t["decision"]),
  ("3. The agreement", "In the wide block at the bottom of this board.")]
readBoard("DT323", "Stories263.dc.html", 4, [
 ("DT323", "Keeping a plate without counting it, as the app is today", head, [
  ("1. The photo, on the Plate", "t_1", "draft", "Taken with the camera. No meal is selected. Amber: the tap on Read the plate."),
  ("2. The read", "t_2", "draft", "After Read the plate. Red: three answers, none keeps the plate without counting it. Amber: the tap on Continue on the Plate."),
  ("3. The Plate, at the bottom", "t_3", "draft", "After Continue on the Plate, below the food list. Amber: the tap on Don't count it."),
  ("4. The plate is kept", "t_4", "draft", "After Don't count it. Red: Someone else's is picked, and Main is picked by hand.")], [1, 2, 3]),
 ("DT323.1", "The new flow, whole: Don't count it on the read", sol, [
  ("1. The photo, on the Plate", "n_1", "same", "No change to this screen. Amber: the tap on Read the plate."),
  ("2. The read", "n_2", "changed", "Changed: one more answer under the three, Don't count it, as a quiet link. Amber: the tap on it."),
  ("3. The plate is kept", "n_3", "changed", "After Don't count it. The screen is the one of today. Changed: Mine is picked, and Main is filled by Chef Mealan.")], [1, 2])],
  "Stories262.dc.html", "19 November 2026. Ticket DT323, Kanban column Next. From the check of 0.3.160; Coach Milan 07:41 draw, 07:47 yes to the proposal. Replayed on the app as built in 0.3.160. Drawn for his Go; nothing is built.")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outRead.json"), "w"))
print(json.dumps({k: [v["file"], v["w"], v["h"]] for k, v in OUT.items()}))
