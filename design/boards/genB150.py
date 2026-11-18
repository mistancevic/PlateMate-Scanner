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
readBoard("B150", "Stories260.dc.html", 10, [
 ("B150", "The step we are on: the read, and what happened after it", head, [
  ("1. The photo, on the Plate", "f_1", "draft", "A photo picked from Your photos, taken yesterday."),
  ("2. The read", "f_2", "draft", "Right after Read the plate. No meal is set. Amber: the tap."),
  ("3. A first try: today's lunch", "f_3", "draft", "Lunch of today is set. Amber: the X that takes it off again."),
  ("4. The pencil opens on today", "n_0", "draft", "After the X, a tap on the pencil. Red: the day it opens on. Amber: the tap on Dinner."),
  ("5. Dinner is set: today's", "f_5", "draft", "Red: the day and the time in the line."),
  ("6. All of it, then Done", "f_6", "draft", "Lower on the same screen. Amber: the tap that logs the meal. The app then opens the Plan by itself."),
  ("7. Saturday in the Plan: two dinners", "n_1", "draft", "After a tap on Sat 14. The record as it is on your phone. Red: the dinner I ate, and the planned one still asking.")], [1, 2, 3, 4, 5, 6]),
 ("B150.1", "The new flow, whole: every step, also the ones that do not change", [("2. The solution and the decision", ""), ("In Coach Milan's words", t["words2"]), ("Proposed", t["proposed"]), ("What this changes", t["more_change"]), ("Open, for your word", t["open"]), ("Your phone", t["repair"]), ("Decision", "Open. Drawn for Coach Milan's look on 18 November 2026. No Go, so nothing is built."), ("3. The agreement", "In the wide block at the bottom of this board.")], [
  ("1. The photo, on the Plate", "h_1", "changed", "Changed: the name says Untitled plate; the meal line has a title and says No meal selected. Amber: the tap on Read the plate."),
  ("2. The read", "h_2", "changed", "After Read the plate. Changed: the line under the title, and the meal line. Amber: the tap on the pencil."),
  ("3. Edit mode", "h_3", "changed", "New. The X closes it. It opens on the photo's day. No meal selected is marked."),
  ("4. Dinner, and its time", "h_4", "changed", "New. Dinner is set, saved at once. Its time in the calendar is a field, set to 19:30."),
  ("5. Closed: the page as it was", "h_5", "changed", "Changed: only the meal line. The page still ends with What do you do with it?. Amber: the tap on Ate it."),
  ("6. Ate it asks how much", "h_6", "changed", "New: no calendar, the meal is set. Grey: the row as DT307 has it. Amber: the tap on Done."),
  ("7. Logged, still on the Plate", "h_7", "changed", "New: no jump to the Plan. Ate it is blue with a tick, and one line says where it went."),
  ("The way back", "h_8", "changed", "New. Not a step of this flow: from a set meal back to No meal selected, in edit mode."),
  ("A photo with no time of its own", "h_9", "changed", "New. Not a step of this flow: the reference line when only the time it was saved is known."),
  ("The proof: Saturday in the Plan", "h_p", "changed", "Not a step. No change to the screen. What it shows is right: one dinner, at the time I set.")], [1, 2, 3, 4, 5, 6])],
  "Stories259.dc.html", "18 November 2026 (Coach Milan 19:21 to 22:32, with a screenshot of his Plan). A bug in the step after the read. Reproduced on the app as built in 0.3.159. Drawn for approval; no Go.")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outRead.json"), "w"))
print(json.dumps({k: [v["file"], v["w"], v["h"]] for k, v in OUT.items()}))
