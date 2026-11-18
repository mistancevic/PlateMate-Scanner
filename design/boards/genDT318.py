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
readBoard("DT318", "Stories262.dc.html", 7, [
 ("DT318", "Your steps after the read, as the app is today", head, [
  ("1. The read", "t_1", "draft", "Red: the chip says Yogurt, not which. Amber: the tap on Change the foods."),
  ("2. The question, on another screen", "t_2", "draft", "After Change the foods. Amber: the tap on ~200 g."),
  ("3. The food list", "t_3", "draft", "Lower on that screen. Red: Yogurt, 10% fat. Then a swipe left on its row."),
  ("4. The swap list", "t_4", "draft", "After the swipe. The list offers foods from my own list. There is no 0.2% yogurt. I tap Cancel, then the link Wrong foods? Help Chef Mealan read it."),
  ("5. Telling Chef Mealan", "t_5", "draft", "The form behind the link. Amber: the tap on Read it again with this."),
  ("6. He asks again", "t_6", "draft", "After the second read. Red: the chicken is asked again, and my 200 g is gone.")], [1, 2, 3, 4, 5]),
 ("DT318.1", "The new flow, whole: his checks, my words, by hand on the Plate", [("2. The solution and the decision", ""), ("In Coach Milan's words", t["words2"]), ("Proposed", t["proposed"]), ("What this changes", t["more_change"]), ("Open, for your word", t["open"]), ("Decision", "Open. Drawn for Coach Milan's look on 18 November 2026. No Go, so nothing is built."), ("3. The agreement", "In the wide block at the bottom of this board.")], [
  ("1. The read, and his checks", "n_1", "changed", "Changed: full names on the chips; his checks stand on the read, each with a way to the Plate. Amber: the tap on ~200 g."),
  ("2. The check about the kind", "n_2", "changed", "The first check is answered. Amber: the tap on 0.2% fat."),
  ("3. My words", "n_3", "changed", "New: one field for what he could not see. Amber: the tap on Send to Chef Mealan."),
  ("4. He answered", "n_4", "changed", "New: one line says what he did; what I set stays. Amber: the tap on Edit on the Plate."),
  ("5. By hand, on the Plate", "n_5", "changed", "No change to this screen: the food list you know.")], [1, 2, 3, 4]),
 ("DT318.2", "The branch from step 1: none of his answers is right", [("The branch", "It starts on the read of step 1. When neither amount is right, or the food is another one, the check itself leads to the Plate's food list. Nothing is edited on the read.")], [
  ("1. The read, and his checks", "b_1", "changed", "The same screen as step 1. Amber: the tap on Not right? Edit it on the Plate."),
  ("2. The Plate, on that food", "b_2", "changed", "No change to this screen, only where it opens: that food's row, its amount ready to type.")], [1])],
  "Stories261.dc.html", "18 November 2026 (Coach Milan 19:26, and 21:44 to 23:56 with a screenshot of a tester's read). Replayed on the app as built in 0.3.159. Drawn for approval; no Go.")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outRead.json"), "w"))
print(json.dumps({k: [v["file"], v["w"], v["h"]] for k, v in OUT.items()}))
