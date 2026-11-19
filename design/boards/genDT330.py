# Board DT330: How to feedback that needs you waits at the top of Clients (Coach Milan 19 November 2026, 20:30). Pictures
# from the coach demo: 0.3.166 and a scratch build (not committed), taken by shotDT330.cjs into BOARDS_SHOTS.
# Helpers from genDT308d.py (Board, storyCard, board) and genDT313.py (acTable). Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT330.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT330.json")) if os.path.exists(f"{HERE}/heightsDT330.json") else {}
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB"); h = round(im.size[1] * w / im.size[0]); im = im.resize((w, h), Image.LANCZOS)
    bb = io.BytesIO(); im.save(bb, "WEBP", quality=80)
    return h, f'<img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{w}px;height:{h}px;border-radius:12px;border:2px solid {border};display:block">'
def shot(x, y, name, w, title, status, note):
    bg, fg, label = CHIP[status]; h, im = pic(name, w, "#2a72d9" if status == "changed" else "#d1dcf0")
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px">'
      f'<div style="font-size:18px;font-weight:900;color:#123a7a">{title}</div>'
      f'<div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:{bg};color:{fg};font-size:12.5px;font-weight:800">{label}</div>'
      f'<div style="margin-top:6px;font-size:13.5px;line-height:1.4;color:#3d4a63;min-height:38px">{note}</div>'
      f'<div style="margin-top:8px">{im}</div></div>')
    return y + 110 + h
B = Board(); PW = 390; G = 40
W = SX + 4 * PW + 3 * G + 40
parts = [("Ticket", "DT330. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT330, canvas Page 5."),
  ("How to read this board", "<b>Top right:</b> the new lines. <b>Then:</b> Clients today, Clients new with the rows of feedback (the first screen and the whole page), the tester opened from a row, and Clients after: the row gone, the counts one less. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", "19 November 20:26: Can the feedback given from a beta tester trigger some notification, just like we have on the clients page when check in is needed or there is new beta tester application waiting for me to approve? 20:30: Yes, draw it."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT330", "How to feedback that needs you waits at the top of Clients", parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
th = "padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742"
td = "padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0"
rows = "".join(f'<tr><td style="{td};font-weight:700">{where}</td><td style="{td};background:#fdf0f0">{old or "<i>none</i>"}</td><td style="{td};background:#eaf1fd;font-weight:700">{new}</td><td style="{td};color:#3d4a63">{why}</td></tr>' for _k, where, old, new, why in t["text"])
TW = W - SX - 40
B.html.append(f'<div data-tbl style="position:absolute;left:{SX}px;top:30px;width:{TW}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
  f'<div style="font-size:19px;font-weight:900;color:#123a7a">The new lines</div>'
  f'<div style="font-size:13.5px;color:#3d4a63;margin-top:4px">English here; Serbian and German go in with them. A row also uses lines that are there: the situation\'s title, Didn\'t work, Done, n of 5.</div>'
  f'<table style="margin-top:10px;width:100%;border-collapse:collapse;table-layout:fixed"><colgroup><col style="width:20%"><col style="width:30%"><col style="width:25%"><col></colgroup>'
  f'<tr><th style="{th};border-radius:8px 0 0 0">Line</th><th style="{th}">Where</th><th style="{th}">New</th><th style="{th};border-radius:0 8px 0 0">Why</th></tr>'
  + "".join(f'<tr><td style="{td};font-weight:700">{k}</td><td style="{td}">{where}</td><td style="{td};background:#eaf1fd;font-weight:700">{new}</td><td style="{td};color:#3d4a63">{why}</td></tr>' for k, where, old, new, why in t["text"]) + '</table></div>')
y = 30 + HT.get("tbl", 300) + 70
X = lambda i: SX + i * (PW + G)
bs = [shot(X(0), y, "now_clients", PW, "Clients, today", "draft", "Waiting for you: the application, then what clients sent. No feedback."),
  shot(X(1), y, "new_full", PW, "Clients, new, the whole page", "changed", "After the application, three rows of How to feedback. Bo's 4 of 5 is there for his words; his plain 4 of 5 on What should I eat now is not."),
  shot(X(2), y, "new_tester", PW, "A tap on Ana's first row", "changed", "Her How to on its own: every situation, the day, the face, her line. ‹ Clients goes back."),
  shot(X(3), y, "new_after", PW, "Back on Clients", "changed", "That row is gone: Waiting for you 10, the badge 10.")]
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories269.dc.html", t["boardTitle"], "19 November 2026. Ticket DT330, Kanban column Next. Pictures from the coach demo: 0.3.166 today, and a scratch build of it; Ana and Bo are made up. Drawn for Coach Milan's Go; nothing in the app is changed.", B, W, Hc, "Stories268.dc.html")
inner = B.render(W, Hc)
json.dump({"DT330": {"file": "Stories269.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out330.json"), "w"))
print("DT330", W, Hc + 230)
