# The read, point by point (DT307 with B145 and DT306), and four small cards beside it (DT315, DT316, DT317, B149).
# Frames from shotRead.cjs, drawn 18 November 2026 on the app as built in 0.3.159. One row per point: the app as it is,
# then the same screen with the change. The agreement, as Given, When, Then rows, stands in the wide block at the bottom.
# Helpers from genDT308d.py (Board, storyCard, board) and genDT313.py (gwt, acTable). Run: shotRead, genRead, measureRead, genRead.
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
T = json.load(open(f"{HERE}/ticketsRead.json"))
HT = json.load(open(f"{HERE}/heightsRead.json")) if os.path.exists(f"{HERE}/heightsRead.json") else {}
OUT = {}
def gwtBold(t): return t.replace("Given ", "<b>Given</b> ", 1).replace(", when ", ", <b>when</b> ", 1).replace(", then ", ", <b>then</b> ", 1)
def card(B, x, y, rid, title, parts, w=350):
    n = len(B.html); storyCard(B, y, rid, title, parts, w)
    B.html[n] = B.html[n].replace("left:20px", f"left:{x}px", 1).replace("<div style=", "<div data-card style=", 1)
def rowAt(B, y, rid, title, parts, shots, arrows):
    card(B, 20, y, rid, title, parts)
    hs = [B.screen(f"{rid}{chr(97 + i)}", i, y, t, n, st, wd) for i, (t, n, st, wd) in enumerate(shots)]
    for i in arrows: B.html.append(f'<div style="position:absolute;left:{B.x(i) - GAP}px;top:{y + TOP + 220}px;width:{GAP}px;text-align:center;font-size:44px;font-weight:900;color:#2a72d9">→</div>')
    return max(hs)
def readBoard(key, fname, cols, rows, after, sub):
    t = T[key]; W = SX + cols * (SW + GAP) - GAP + 70; B = Board(); y = 30; hc = HT.get(key, {}).get("cards", [])
    for k, (rid, title, parts, shots, arrows) in enumerate(rows):
        bottom = rowAt(B, y, rid, title, parts, shots, arrows)
        ch = hc[k] if k < len(hc) else 1500
        y = max(bottom, y + ch) + 110
    acTable(B, y, W - 40, t)
    Hc = y + HT.get(key, {}).get("ac", 900) + 40
    board(fname, t["boardTitle"], sub, B, W, Hc, after)
    OUT[key] = {"file": fname, "w": W, "h": min(8000, Hc + 230), "title": t["boardTitle"], "inner": B.render(W, Hc)}
    print(key, "inner", Hc, "board", Hc + 230)
def P(pt): return [(h, x) for h, x in T["points"][pt]]
SUB = "18 November 2026. Drawn on the app as built in 0.3.159. This board is the ticket. Go: Coach Milan, 18 November 19:13."
A, Bb = T["DT307a"], T["DT307b"]
def sub(pre): return [{**x, "id": x["id"].replace(pre, "")} for x in Bb["ac"] if x["id"].startswith(pre)]
T["DT307"] = {**A, "short": "The read, point by point: five points", "boardTitle": "DT307: the read, point by point. The way back, fewer boxes, + Add more, the tick, the pot",
  "ac": A["ac"] + [x for x in Bb["ac"] if x["id"].startswith("5 ")], "unchanged": A["unchanged"] + ["A photo of a plate, not a pot: no question about how much."],
  "details": A["details"][:3] + ["The pot question keeps its place and its look; only the words and the grams field are new. New words: How much of it do you eat?, A part of it, the grams line.", "The screens named DT307.1c, 1d, 2b, 3b, 4b and 5c are what it looks like."]}
T["B145"] = {"id": "B145", "short": "The read invents ways of cooking", "rel": "Go: Coach Milan, 18 November 19:13", "boardTitle": "B145: the read invents ways of cooking", "ac": sub("B145 "),
  "unchanged": ["With words that name a cooking food, the line shows it, as today.", "The foods that are counted, and their amounts."], "details": ["No new element and no new words.", "The screen named B145b is what it looks like."]}
T["DT306"] = {"id": "DT306", "short": "Chef Mealan's card on the plate of a photo, in the read's shape", "rel": "Go: Coach Milan, 18 November 19:13", "boardTitle": "DT306: Chef Mealan's card on the plate of a photo, in the read's shape", "ac": sub("DT306 "),
  "unchanged": ["What Add a food and Don't count it do.", "The questions behind the pencil of the meal line: since 0.3.157 they are the calendar's rows and choices already, so nothing is proposed there.", "His word above the buttons."], "details": ["The read's block is reused as it is: the same question, choices and Done. No new words.", "The screen named DT306b is what it looks like."]}
T["DT306"]["unchanged"] = ["What Don't count it does, and what Half does.", "+ Add more to your plate, right above the card.", "The questions behind the pencil of the meal line: since 0.3.157 they are the calendar's rows and choices already, so nothing is proposed there.", "His word at the top of the card."]
T["DT306"]["details"] = ["The read's block is reused: the same question and choices, with Don't count it as a fourth choice. No new words.", "The screen named DT306b is what it looks like."]
o = A["opportunity"]
HEAD = [("Ticket", "DT307. This board is the ticket. Each row is one point and can get its own Go or No."),
  ("How to read this board", "<b>Each row:</b> the card says the point, then the screens show the app as it is and the same screen with the change. <b>The wide block at the bottom:</b> the agreement, what gets built, point by point."),
  ("1. The request", ""),
  ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", A["problem"]), ("Story", A["story"]),
  ("2. The solution and the decision, point 1", "")]
def tk(k): return [("Ticket", f"{k}. This board is the ticket: everything about it is here."), ("The request and the solution", "")]
readBoard("DT307", "Stories253.dc.html", 4, [
  ("DT307.1", "A way back from the photo screen and from the read", HEAD + P("1"), [
    ("The photo screen today", "b_0", "draft", "A photo just taken. Red: the only way out."),
    ("The read today", "b_1", "draft", "The read of that photo. Nothing leads back to the photo screen."),
    ("Back to the camera", "b_2", "changed", "The photo screen with one light row at the top."),
    ("Back to the photo, twice", "b_3", "changed", "The read with the link at the top and once more at the bottom.")], []),
  ("DT307.2", "Fewer boxes, and the photo not smaller", P("2"), [
    ("The read today", "x_0", "draft", "Red: four boxes around and inside the read, beside the result's own."),
    ("One box", "x_1", "changed", "The same read. Only the result keeps its box. The photo is 354 wide, 318 today.")], [1]),
  ("DT307.3", "+ Add more on the read", P("3"), [
    ("The read today", "a_0", "draft", "Under the photo's foods there is only Change the foods."),
    ("+ Add more beside it", "a_1", "changed", "The same row with + Add more on its left.")], [1]),
  ("DT307.4", "Save in My recipes as a tick", P("4"), [
    ("The end of the read today", "t_0", "draft", "A meal is set. Red: two buttons side by side."),
    ("A tick, then Cancel and Done", "t_1", "changed", "The tick in a row of its own. Under it Cancel on the left, Done on the right.")], [1]),
  ("DT307.5", "A pot: how much of it do you eat?", P("5"), [
    ("The pot question today", "p_0", "draft", "The first look says pot. Red: the question and its answers."),
    ("After Read the plate, today", "p_1", "draft", "The whole pot, opened as a whole recipe on the plate."),
    ("What do you eat", "p_2", "changed", "The same screen with the question about me, and grams for a part.")], [1]),
], "Stories252.dc.html", SUB)
readBoard("B145", "Stories254.dc.html", 2, [
  ("B145", "The read invents ways of cooking", tk("B145") + P("B145"), [
    ("For cooking, today", "c_0", "draft", "A read with no words from me. Red: the line and its two chips."),
    ("No words, no line", "c_1", "changed", "The same place on the same read.")], [1])], "Stories253.dc.html", SUB)
readBoard("DT306", "Stories255.dc.html", 2, [
  ("DT306", "Chef Mealan's card on the plate of a photo, in the read's shape", tk("DT306") + P("DT306"), [
    ("His card today", "d_0", "draft", "A photo's plate after Change the foods, dinner set. Red: four buttons in a row."),
    ("A question, four answers, one button", "d_1", "changed", "The same card. Blue: + Add more to your plate above it, and the new block.")], [1])], "Stories254.dc.html", SUB)
# ---- four small tickets, a board each, with their screens
def smallBoard(k, fname, cols, shots, arrows, after, wide=None):
    B = Board(); W = SX + cols * (SW + GAP) - GAP + 70; c = T[k]
    card(B, 20, 30, k, c["short"], [("Ticket", f"{k}. This board is the ticket: everything about it is here."), ("How to read this board", "<b>This card:</b> the request and the solution. <b>The screens</b> on the right: the design. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."), ("Where it comes from", c["from"]), ("Problem", c["problem"]), ("Proposed", c["proposed"]), ("Decision", "Coach Milan, 18 November 19:13: Go.")])
    hs = [B.screen(f"{k}{chr(97 + i)}", i, 30, t, n, st, wd) for i, (t, n, st, wd) in enumerate(shots)]
    if wide: hs.append(B.wide(f"{k}a", 30, *wide))
    for i in arrows: B.html.append(f'<div style="position:absolute;left:{B.x(i) - GAP}px;top:{30 + TOP + 120}px;width:{GAP}px;text-align:center;font-size:44px;font-weight:900;color:#2a72d9">→</div>')
    y = max(HT.get(k, {}).get("cards", [1000])[0] + 30, max(hs)) + 80
    acTable(B, y, W - 40, c)
    Hc = y + HT.get(k, {}).get("ac", 600) + 40
    board(fname, f'{k}: {c["short"]}', SUB, B, W, Hc, after)
    OUT[k] = {"file": fname, "w": W, "h": min(8000, Hc + 230), "title": f'{k}: {c["short"]}', "inner": B.render(W, Hc)}
smallBoard("DT315", "Stories256.dc.html", 2, [("How to, step 4 today", "h_0", "draft", "Menu, How to, I ate something: log it with a photo. Red: step 4."), ("Step 4, and a step 5", "h_1", "changed", "The same page with the steps as the app goes now.")], [1], "Stories255.dc.html")
smallBoard("DT316", "Stories257.dc.html", 3, [], [], "Stories256.dc.html", wide=("The five certain lines", "u_0", "changed", "No screen shows these lines, so this table is the design: these go, with every other line proven unused."))
smallBoard("DT317", "Stories258.dc.html", 2, [("Before you cook, today", "k_0", "draft", "Saturday's plate is on the Plate and I tapped Start cooking on a recipe. Amber: the tap."), ("Ate it asks the meal", "k_1", "changed", "The same question with the calendar under its buttons.")], [1], "Stories257.dc.html")
smallBoard("B149", "Stories259.dc.html", 4, [("The pot question today", "w_0", "draft", "The photo screen. Red: the chosen answer."), ("One tick", "w_1", "changed", "The same answer."), ("Good for, today", "w_2", "draft", "A recipe's page in Recipes. Red: the chosen meals."), ("One tick each", "w_3", "changed", "The same choices.")], [1, 3], "Stories258.dc.html")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outRead.json"), "w"))
print(json.dumps({k: [v["file"], v["w"], v["h"], v["title"]] for k, v in OUT.items()}))
