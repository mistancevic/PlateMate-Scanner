# Board DT307, redrawn 19 November 2026 on the app as built in 0.3.162 (Coach Milan 11:16: Add more is a good one; redraw,
# then code). Frames from shotDT307.cjs. Points 2 and 3 are drawn on today's read (since DT318 it holds his checks and the
# field Tell Chef Mealan what to check); points 1, 4 and 5 keep their proposals of 18 November, on today's screens.
# Helpers and the ticket's text from genRead.py and ticketsRead.json; the changes of today are below. Run: shot, gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
g = open(f"{HERE}/genRead.py").read(); exec(g[:g.index("def P(pt)")])
HT = json.load(open(f"{HERE}/heightsDT307.json")) if os.path.exists(f"{HERE}/heightsDT307.json") else {}
OUT = {}
REDRAWN = "Redrawn 19 November 2026 on the app as built in 0.3.162, after DT318 put his checks and the field Tell Chef Mealan what to check on the read."
T["points"]["2"] = [("In Coach Milan's words", "16 November: fewer boxes, and the photo not smaller."),
  ("Now", "A card holds the whole read. Inside it the photo has a box, and since DT318 that box also holds his check and the field Tell Chef Mealan what to check, which has a box of its own. Chef Mealan's word has a box, and What do you do with it? has a box. With the result that is six."),
  ("Proposed", "Only the result keeps its box. Nothing is added and nothing is moved: five borders go. The field keeps its own edge, as every field in the app, and his check keeps its colour, as on the Plate's screen. The photo grows from 318 to 354 wide."),
  ("What changed in the drawing", REDRAWN), ("Decision", "Coach Milan, 18 November 19:13: Go. Redrawn on today's read; waits for his look and Go.")]
T["points"]["3"] = [("Where it comes from", "The board DT308, part 2, shows + Add more on the read. 0.3.157 did not build the read's layout, so it is missing."),
  ("Now", "A food he missed, by hand: Continue on the Plate, scroll to the end of the food list, + Add more to your plate. In words: Tell Chef Mealan what to check."),
  ("Proposed", "The one element: + Add more, a small button left of Continue on the Plate. It opens the Plate with + Add more to your plate already open. Continue on the Plate stays the way to the Plate as it is, and the field stays for words."),
  ("Looked at and not chosen: the add block inside the read", "The search, Photo or scan and Add manually inside the read would make the read a second plate."),
  ("What changed in the drawing", REDRAWN + " The button beside it is now Continue on the Plate."),
  ("Decision", "Coach Milan, 18 November 19:13: Go. 19 November 11:16: Add more is a good one; redraw, then code. Waits for his look and Go.")]
T["points"]["1"] = [x for x in T["points"]["1"] if x[0] != "Decision"] + [("Decision", "Coach Milan, 18 November 19:13: Go. Drawn again on today's screens; the proposal is the one of 18 November.")]
T["points"]["4"] = [((h, t.replace("There is no Cancel: the way out is the X on the meal line.", "There is no Cancel: the way out is the meal line's pencil and the row No meal selected (B150).")) if h == "Now" else (h, t)) for h, t in T["points"]["4"] if h != "Decision"] + [("Decision", "Coach Milan, 18 November 19:13: Go. Drawn again on today's screens, as drawn 18 November 18:46.")]
T["points"]["5"] = [x for x in T["points"]["5"] if x[0] != "Decision"] + [("Decision", "Coach Milan, 18 November 19:13: Go. Drawn again on today's screens; the proposal is the one of 18 November.")]
def P(pt): return [(h, x) for h, x in T["points"][pt]]
A, Bb = T["DT307a"], T["DT307b"]
ac = [dict(x) for x in A["ac"]] + [x for x in Bb["ac"] if x["id"].startswith("5 ")]
for x in ac:
    if x["id"] == "2 AC1": x["text"] = "Given the read of a photo, when I look at it, then only the result has a box, and the photo, its foods, his checks, the field Tell Chef Mealan what to check, Chef Mealan's word and What do you do with it? stand on the page itself."
    if x["id"] == "3 AC1": x["text"] = "Given the read shows chicken and rice and he missed the salad, when I tap + Add more, then the Plate opens with the photo's foods on it and + Add more to your plate already open."
T["DT307"] = {**A, "short": "The read, point by point: five points", "boardTitle": "DT307: the read, point by point. The way back, fewer boxes, + Add more, the tick, the pot",
  "rel": "Go: Coach Milan, 18 November 19:13, all points; points 2 and 3 redrawn 19 November, they wait for his look and Go",
  "ac": ac, "unchanged": [u.replace("Change the foods, and everything on the plate it opens.", "Continue on the Plate, and everything on the Plate it opens.") for u in A["unchanged"]] + ["His checks on the read and the field Tell Chef Mealan what to check, as built in 0.3.160 (DT318).", "A photo of a plate, not a pot: no question about how much."],
  "details": A["details"][:2] + ["Words: Back to the camera is new. Back to the photo exists. English, Serbian, German.", "The pot question keeps its place and its look; only the words and the grams field are new. New words: How much of it do you eat?, A part of it, the grams line.", "The screens named DT307.1c, 1d, 2b, 3b, 4b and 5c are what it looks like."]}
o = A["opportunity"]
HEAD = [("Ticket", "DT307. This board is the ticket. Each row is one point and can get its own Go or No."),
  ("How to read this board", "<b>Each row:</b> the card says the point, then the screens show the app as it is and the same screen with the change. <b>The wide block at the bottom:</b> the agreement, what gets built, point by point."),
  ("Drawn again", "19 November 2026, on the app as built in 0.3.162. Points 2 and 3 are drawn on today's read; points 1, 4 and 5 keep their proposals."),
  ("1. The request", ""),
  ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", A["problem"].replace("A food he missed is three steps away.", "A food he missed is three steps away by hand.")), ("Story", A["story"]),
  ("2. The solution and the decision, point 1", "")]
readBoard("DT307", "Stories253.dc.html", 4, [
  ("DT307.1", "A way back from the photo screen and from the read", HEAD + P("1"), [
    ("The photo screen today", "b_0", "draft", "A photo just taken. Red: the only way out."),
    ("The read today", "b_1", "draft", "The read of that photo. Nothing leads back to the photo screen."),
    ("Back to the camera", "b_2", "changed", "The photo screen with one light row at the top."),
    ("Back to the photo, twice", "b_3", "changed", "The read with the link at the top and once more at the bottom.")], []),
  ("DT307.2", "Fewer boxes, and the photo not smaller", P("2"), [
    ("The read today", "x_0", "draft", "Red: five boxes around and inside the read, beside the result's own."),
    ("One box", "x_1", "changed", "The same read. Only the result keeps its box. The photo is 354 wide, 318 today.")], [1]),
  ("DT307.3", "+ Add more on the read", P("3"), [
    ("The read today", "a_0", "draft", "Under his check and the field there is only Continue on the Plate."),
    ("+ Add more beside it", "a_1", "changed", "The same row with + Add more on its left.")], [1]),
  ("DT307.4", "Save in My recipes as a tick", P("4"), [
    ("The end of the read today", "t_0", "draft", "A meal is set. Red: two buttons side by side."),
    ("A tick, then Cancel and Done", "t_1", "changed", "The tick in a row of its own. Under it Cancel on the left, Done on the right.")], [1]),
  ("DT307.5", "A pot: how much of it do you eat?", P("5"), [
    ("The pot question today", "p_0", "draft", "The first look says pot. Red: the question and its answers."),
    ("After Read the plate, today", "p_1", "draft", "The whole pot, opened as a whole recipe on the plate."),
    ("What do you eat", "p_2", "changed", "The same screen with the question about me, and grams for a part.")], [1]),
], "Stories252.dc.html", "19 November 2026. Drawn again on the app as built in 0.3.162. This board is the ticket. Go: Coach Milan, 18 November 19:13; points 2 and 3 wait for his look at this drawing.")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out307.json"), "w"))
print(json.dumps({k: [v["file"], v["w"], v["h"]] for k, v in OUT.items()}))
