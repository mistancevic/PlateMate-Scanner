# Board B151: an action that looks like a chosen choice (Ate it and Plan it while their calendar is open).
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
g = open(f"{HERE}/genRead.py").read(); exec(g[:g.index("def P(pt)")])
t = json.load(open(f"{HERE}/ticketB151.json")); T = {"B151": t}
HT = json.load(open(f"{HERE}/heightsB151.json")) if os.path.exists(f"{HERE}/heightsB151.json") else {}
OUT = {}
parts = [("Ticket", "B151. This board is the ticket: everything about it is here."),
  ("How to read this board", "<b>This card:</b> the request and the solution. <b>The screens</b> on the right: the app as it is, then the same screen with the change. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
  ("Where it comes from", t["from"]), ("In Coach Milan's words", t["words"]), ("Problem", t["problem"]), ("The rule", t["rule"]), ("Proposed", t["proposed"]),
  ("Decision", "Open. Drawn for Coach Milan's look on 18 November 2026. No Go, so nothing is built.")]
readBoard("B151", "Stories261.dc.html", 2, [("B151", t["short"], parts, [
  ("Ate it, tapped, today", "q_0", "draft", "The end of a plate with no meal set. Red: the button after the tap."),
  ("An action stays white", "q_1", "changed", "The same moment. Blue outline: the button, white.")], [1])],
  "Stories260.dc.html", "18 November 2026 (Coach Milan 19:51). Drawn on the app as built in 0.3.159. Drawn for approval; no Go.")
json.dump(OUT, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outRead.json"), "w"))
print(json.dumps({k: [v["file"], v["w"], v["h"]] for k, v in OUT.items()}))
