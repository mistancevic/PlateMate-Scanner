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
SUB = "18 November 2026. The read, point by point, as Coach Milan asked on 16 November: each point on one board, resolved one at a time. Drawn on the app as built in 0.3.159. Drawn for approval; no Go."
o = T["DT307a"]["opportunity"]
HEAD = [("Ticket", "DT307, with B145 and DT306. These two boards are the ticket. Each row is one point and can get its own Go or No."),
  ("How to read this board", "<b>Each row:</b> the card says the point, then the screens show the app as it is and the same screen with the change. <b>The wide block at the bottom:</b> the agreement, what gets built, point by point."),
  ("1. The request", ""),
  ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", T["DT307a"]["problem"]), ("Story", T["DT307a"]["story"]),
  ("2. The solution and the decision, point 1", "")]
readBoard("DT307a", "Stories253.dc.html", 4, [
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
    ("A tick, and one button", "t_1", "changed", "Save in My recipes is a tick. Done is the button.")], [1]),
], "Stories252.dc.html", SUB)
readBoard("DT307b", "Stories254.dc.html", 3, [
  ("DT307.5", "A pot: how much of it do you eat?", [("Ticket", "DT307, point 5. The second of the two boards of the read."), ("2. The solution and the decision, point 5", "")] + P("5"), [
    ("The pot question today", "p_0", "draft", "The first look says pot. Red: the question and its answers."),
    ("After Read the plate, today", "p_1", "draft", "The whole pot, opened as a whole recipe on the plate."),
    ("What do you eat", "p_2", "changed", "The same screen with the question about me, and grams for a part.")], [1]),
  ("B145", "The read invents ways of cooking", P("B145"), [
    ("For cooking, today", "c_0", "draft", "A read with no words from me. Red: the line and its two chips."),
    ("No words, no line", "c_1", "changed", "The same place on the same read.")], [1]),
  ("DT306", "Chef Mealan's card on the plate of a photo, in the read's shape", P("DT306"), [
    ("His card today", "d_0", "draft", "A photo's plate after Change the foods, dinner set. Red: four buttons in a row."),
    ("A question, its answers, then the buttons", "d_1", "changed", "The same card with the read's own block.")], [1]),
], "Stories253.dc.html", SUB)
# ---- the four small cards, side by side
B = Board(); xs = [20, 400, 780, 1160]; W = 1160 + 350 + 20
for x, k in zip(xs, ["DT315", "DT316", "DT317", "B149"]):
    c = T[k]; card(B, x, 30, k, c["short"], [("Where it comes from", c["from"]), ("Problem", c["problem"]), ("Proposed", c["proposed"])] + [(f'{a["id"]}: {a["title"]}', gwtBold(a["text"])) for a in c["ac"]] + [("Must not change", c["unchanged"]), ("Decision", "Open. No Go, so nothing is built.")])
Hc = max(HT.get("small", {}).get("cards", [1300])) + 60
board("Stories255.dc.html", "Small cards beside the read: DT315, DT316, DT317, B149", "18 November 2026. Four small tickets found while 0.3.157 to 0.3.159 were built. Each card is its ticket. Drawn for approval; no Go.", B, W, Hc, "Stories254.dc.html")
OUT["small"] = {"file": "Stories255.dc.html", "w": W, "h": min(8000, Hc + 230), "title": "Small cards beside the read: DT315, DT316, DT317, B149", "inner": B.render(W, Hc)}
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outRead.json"), "w"))
