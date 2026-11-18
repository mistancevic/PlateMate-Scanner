# Board DT318: correcting what Chef Mealan read. Frames from shotDT318.cjs. Helpers from genRead.py. Run: shot, gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
g = open(f"{HERE}/genRead.py").read(); exec(g[:g.index("def P(pt)")])
T = {"DT318": json.load(open(f"{HERE}/ticketDT318.json"))}
HT = json.load(open(f"{HERE}/heightsDT318.json")) if os.path.exists(f"{HERE}/heightsDT318.json") else {}
OUT = {}
t = T["DT318"]; o = t["opportunity"]
head = [("Ticket", "DT318. This board is the ticket: everything about it is here."),
  ("How to read this board", "<b>First row:</b> the steps you took after the read, in order, as the app is today. <b>Second row:</b> the new flow, whole, on the same case; each frame says what changed. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
  ("The case on this board", t["days"]),
  ("1. The request", ""),
  ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", t["words"]), ("What happened", t["cause"])]
readBoard("DT318", "Stories262.dc.html", 8, [
 ("DT318", "Your steps after the read, as the app is today", head, [
  ("1. The read", "t_1", "draft", "Red: the chip says Yogurt, not which. Amber: the tap on Change the foods."),
  ("2. The question, on another screen", "t_2", "draft", "After Change the foods. Amber: the tap on ~200 g."),
  ("3. The food list", "t_3", "draft", "Lower on that screen. Red: Yogurt, 10% fat. Then a swipe left on its row."),
  ("4. The swap list", "t_4", "draft", "After the swipe. The list offers foods from my own list. There is no 0.2% yogurt. I tap Cancel, then the link Wrong foods? Help Chef Mealan read it."),
  ("5. Telling Chef Mealan", "t_5", "draft", "The form behind the link. Amber: the tap on Read it again with this."),
  ("6. He asks again", "t_6", "draft", "After the second read. Red: the chicken is asked again, and my 200 g is gone.")], [1, 2, 3, 4, 5]),
 ("DT318.1", "The new flow, whole: one edit mode for the foods", [("2. The solution and the decision", ""), ("In Coach Milan's words", t["words2"]), ("Proposed", t["proposed"]), ("What this changes", t["more_change"]), ("Open, for your word", t["open"]), ("Decision", "Open. Drawn for Coach Milan's look on 18 November 2026. No Go, so nothing is built."), ("3. The agreement", "In the wide block at the bottom of this board.")], [
  ("1. The read", "n_1", "changed", "Changed: the foods have a title and a pencil, full names on the chips, the question on the read. Amber: the tap on ~200 g."),
  ("2. Answered", "n_2", "changed", "New: the chip shows my amount. Amber: the tap on the pencil."),
  ("3. Edit mode", "n_3", "changed", "New. In place, under the photo. Words on top, a row for each food."),
  ("4. By words", "n_4", "changed", "New place for the form that worked. Amber: the tap on Read again."),
  ("5. He read again", "n_5", "changed", "New: what I set stays, and one line says what he changed. Then the X."),
  ("6. Closed", "n_6", "changed", "The chips, corrected. The rest of the read is as today."),
  ("Neither", "n_7", "changed", "New. Not a step of this flow: the third answer to his question opens edit mode on that food.")], [1, 2, 3, 4, 5])],
  "Stories261.dc.html", "18 November 2026 (Coach Milan 19:26, and 21:44 to 21:51 with a screenshot of a tester's read). Replayed on the app as built in 0.3.159. Drawn for approval; no Go.")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outRead.json"), "w"))
print(json.dumps({k: [v["file"], v["w"], v["h"]] for k, v in OUT.items()}))
