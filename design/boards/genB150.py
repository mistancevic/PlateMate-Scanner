# Board B150: a photo from another day, logged under a meal of today, leaves two dinners on its day.
# Frames from shotB150.cjs. Helpers from genRead.py (card, rowAt, readBoard), taken as they are. Run: shot, gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
g = open(f"{HERE}/genRead.py").read(); exec(g[:g.index("def P(pt)")])
T = {"B150": json.load(open(f"{HERE}/ticketB150.json"))}
HT = json.load(open(f"{HERE}/heightsB150.json")) if os.path.exists(f"{HERE}/heightsB150.json") else {}
OUT = {}
t = T["B150"]; o = t["opportunity"]
t = T["B150"]; o = t["opportunity"]
head = [("Ticket", "B150. This board is the ticket: everything about it is here."),
  ("How to read this board", "<b>First row:</b> the steps you took after the read, in order, as the app is today. <b>Second and third row:</b> the same screens with the change. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
  ("The days on this board", t["days"]),
  ("1. The request", ""),
  ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", t["words"]), ("What happened", t["cause"])]
readBoard("B150", "Stories260.dc.html", 6, [
 ("B150", "The step we are on: the read, and what happened after it", head, [
  ("1. The photo, on the Plate", "f_1", "draft", "A photo picked from Your photos, taken yesterday."),
  ("2. The read", "f_2", "draft", "Right after Read the plate. No meal is set. Amber: the tap."),
  ("3. A first try: today's lunch", "f_3", "draft", "Lunch of today is set. Amber: the X that takes it off again."),
  ("4. The pencil opens on today", "n_0", "draft", "After the X, a tap on the pencil. Red: the day it opens on. Amber: the tap on Dinner."),
  ("5. Dinner is set: today's", "f_5", "draft", "Red: the day and the time in the line. Then All of it and Done."),
  ("6. Saturday in the Plan: two dinners", "n_1", "draft", "The record as it is on your phone. Red: the dinner I ate, and the planned one still asking.")], [1, 2, 3, 4, 5]),
 ("B150.1", "One dinner: the pencil opens on the photo's day", [("2. The solution and the decision", ""), ("Proposed", t["proposed"]), ("Your phone", t["repair"]), ("Decision", "Open.")], [
  ("Step 4, changed", "n_2", "changed", "The pencil on the read. Blue: the photo's time as a reference, and the day."),
  ("Step 6, changed", "n_3", "changed", "Saturday in the Plan after a tap on Dinner, All of it and Done.")], [1]),
 ("B150.2", "Edit mode: the pencil opens it, the X closes it, the meal's time is set there", [("In Coach Milan's words", t["words2"]), ("Now", t["time_now"]), ("Proposed", t["time_proposed"]), ("What this changes", t["more_change"]), ("Decision", "Open. Drawn for Coach Milan's look on 18 November 2026. No Go, so nothing is built."), ("3. The agreement", "In the wide block at the bottom of this board.")], [
  ("Step 5, today", "n_4", "draft", "The read with a dinner set. Red: the time as words, and the X as the only button."),
  ("One icon: the pencil", "n_5", "changed", "The same line. The pencil is there with a meal set."),
  ("Edit mode", "n_6", "changed", "After a tap on the pencil. Blue: the X that closes, the photo's time as a reference, the meal's time as a field.")], [1, 2])],
  "Stories259.dc.html", "18 November 2026 (Coach Milan 19:21 to 19:58, with a screenshot of his Plan). A bug in the step after the read. Reproduced on the app as built in 0.3.159. Drawn for approval; no Go.")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outRead.json"), "w"))
print(json.dumps({k: [v["file"], v["w"], v["h"]] for k, v in OUT.items()}))
