# Boards DT324 and DT325: two lines of words, a board each. Frames from shotDT324.cjs. Helpers from genRead.py.
# Run: shot, gen, measure (HEIGHTS=heightsDT324.json), gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
g = open(f"{HERE}/genRead.py").read(); exec(g[:g.index("def P(pt)")])
BL = {x["id"]: x for x in json.load(open(f"{HERE}/../../docs/backlog.json"))["tickets"]}
HT = json.load(open(f"{HERE}/heightsDT324.json")) if os.path.exists(f"{HERE}/heightsDT324.json") else {}
OUT = {}
EXTRA = {
 "DT324": {"short": "The Plate's screen of a photo: the line under the title says what the read says", "now": "The read says Chef Mealan named it from your photo. The Plate's screen says Read from your photo. Correct an amount if you know better; Chef Mealan says what to do with it below.",
   "proposed": "The Plate's screen says the line of the read, and shows it when the read shows it: while the plate has the name Chef Mealan gave it. The old line leaves the app.",
   "decision": "Coach Milan, 19 November 2026, 09:08: the same line as on the read. No Go yet, so nothing is built.",
   "details": ["Words only. No new line: the line of the read is used.", "The old line goes from the English, Serbian and German files.", "The screen DT324c is what it looks like."]},
 "DT325": {"short": "A plate from an earlier day: the help line says only what is always true", "now": "With a photo the line says: Ate it asks which meal, and saves it there at the photo's time. Without a photo: at the time it was started. The record: a meal on the plate's own day keeps that time; a meal on another day takes the meal's time.",
   "proposed": "The record stays. The first sentence of both lines becomes: Ate it asks which meal, and saves it there. The other sentences stay.",
   "decision": "Coach Milan, 19 November 2026, 09:08: the record stays, and the line says only Ate it asks which meal, and saves it there. No Go yet, so nothing is built.",
   "details": ["Words only, two lines: the plate with a photo and the plate without.", "English, Serbian and German.", "The screens DT325b and DT325d are what it looks like."]}}
def small(k, fname, cols, shots, arrows, after):
    t = {**BL[k], **EXTRA[k], "rel": "The words have Coach Milan's yes of 19 November 09:08; the build waits for his Go on this board"}; o = t["opportunity"]
    B = Board(); W = SX + cols * (SW + GAP) - GAP + 70
    card(B, 20, 30, k, t["short"], [("Ticket", f"{k}. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: {k}, canvas Page 5."),
      ("How to read this board", "<b>This card:</b> the request, then the solution and the decision. <b>The screens</b> on the right: the step before, the screen as it is today, the same screen with the new words. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
      ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
      ("Problem", t["problem"]), ("Story", t["story"]), ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Decision", t["decision"])])
    hs = [B.screen(f"{k}{chr(97 + i)}", i, 30, tt, n, st, wd) for i, (tt, n, st, wd) in enumerate(shots)]
    for i in arrows: B.html.append(f'<div style="position:absolute;left:{B.x(i) - GAP}px;top:{30 + TOP + 120}px;width:{GAP}px;text-align:center;font-size:44px;font-weight:900;color:#2a72d9">→</div>')
    y = max(HT.get(k, {}).get("cards", [1300])[0] + 30, max(hs)) + 80
    acTable(B, y, W - 40, t)
    Hc = y + HT.get(k, {}).get("ac", 600) + 40
    title = f'{k}: {t["short"]}'
    board(fname, title, "19 November 2026. Ticket " + k + ", Kanban column Next. Drawn on the app as built in 0.3.160. Drawn for Coach Milan's Go; nothing is built.", B, W, Hc, after)
    OUT[k] = {"file": fname, "w": W, "h": min(8000, Hc + 230), "title": title, "inner": B.render(W, Hc)}
small("DT324", "Stories264.dc.html", 3, [("The step before: the read", "a_0", "same", "No change. Blue: its line. Amber: the tap on Continue on the Plate."), ("The Plate's screen today", "a_1", "draft", "After Continue on the Plate. Red: the old line."), ("The same line as on the read", "a_2", "changed", "The same screen. Blue: the new line.")], [1, 2], "Stories263.dc.html")
small("DT325", "Stories265.dc.html", 4, [("With a photo, today", "b_1", "draft", "Saturday's plate is on the Plate when I open it on Sunday. Red: the help line."), ("With a photo, new", "b_2", "changed", "The same screen. Blue: the line names no time."), ("Without a photo, today", "c_1", "draft", "The same plate with no photo. Red: the help line."), ("Without a photo, new", "c_2", "changed", "The same screen. Blue: the line names no time.")], [1, 3], "Stories264.dc.html")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out324.json"), "w"))
print(json.dumps({k: [v["file"], v["w"], v["h"]] for k, v in OUT.items()}))
