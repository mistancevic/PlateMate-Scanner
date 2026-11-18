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
  ("How to read this board", "<b>First row:</b> the steps you took after the read, in order, as the app is today. <b>Second row:</b> the new flow, whole, on the same steps; each frame says what changed on it and what did not. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
  ("The days on this board", t["days"]),
  ("1. The request", ""),
  ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", t["words"]), ("What happened", t["cause"])]
readBoard("B150", "Stories260.dc.html", 7, [
 ("B150", "The step we are on: the read, and what happened after it", head, [
  ("1. The photo, on the Plate", "f_1", "draft", "A photo picked from Your photos, taken yesterday."),
  ("2. The read", "f_2", "draft", "Right after Read the plate. No meal is set. Amber: the tap."),
  ("3. A first try: today's lunch", "f_3", "draft", "Lunch of today is set. Amber: the X that takes it off again."),
  ("4. The pencil opens on today", "n_0", "draft", "After the X, a tap on the pencil. Red: the day it opens on. Amber: the tap on Dinner."),
  ("5. Dinner is set: today's", "f_5", "draft", "Red: the day and the time in the line. Then All of it and Done."),
  ("6. Saturday in the Plan: two dinners", "n_1", "draft", "The record as it is on your phone. Red: the dinner I ate, and the planned one still asking.")], [1, 2, 3, 4, 5]),
 ("B150.1", "The new flow, whole: every step, also the ones that hardly change", [("2. The solution and the decision", ""), ("In Coach Milan's words", t["words2"]), ("Proposed", t["proposed"]), ("What this changes", t["more_change"]), ("Your phone", t["repair"]), ("Decision", "Open. Drawn for Coach Milan's look on 18 November 2026. No Go, so nothing is built."), ("3. The agreement", "In the wide block at the bottom of this board.")], [
  ("1. The photo, on the Plate", "g_1", "changed", "No change but one line: the meal line says Just looking."),
  ("2. The read", "g_2", "changed", "No change but that line. Amber: the tap on the pencil."),
  ("3. Edit mode", "g_3", "changed", "New. The pencil is the X that closes. It opens on the photo's day. Just looking is marked."),
  ("4. Dinner, and its time", "g_4", "changed", "New. Dinner is picked, saved at once. Its time in the calendar is a field, set to 19:30."),
  ("5. Closed: the read", "g_5", "changed", "No change but the line: the meal with its time, and the pencil. Then All of it and Done, as today."),
  ("6. Saturday in the Plan: one dinner", "g_6", "changed", "No change to the screen. What it shows is right: one dinner, at the time I set."),
  ("Back to Just looking", "g_7", "changed", "New. Not a step of this flow: the way back from a picked meal, in edit mode.")], [1, 2, 3, 4, 5])],
  "Stories259.dc.html", "18 November 2026 (Coach Milan 19:21 to 20:12, with a screenshot of his Plan). A bug in the step after the read. Reproduced on the app as built in 0.3.159. Drawn for approval; no Go.")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outRead.json"), "w"))
print(json.dumps({k: [v["file"], v["w"], v["h"]] for k, v in OUT.items()}))
