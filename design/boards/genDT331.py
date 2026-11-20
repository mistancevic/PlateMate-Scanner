# Board DT331 (from the DT330 script): How to feedback that needs you waits at the top of Clients (Coach Milan 19 November 2026, 20:30). Pictures
# from the coach demo: 0.3.166 and a scratch build (not committed), taken by shotDT330.cjs into BOARDS_SHOTS.
# Helpers from genDT308d.py (Board, storyCard, board) and genDT313.py (acTable). Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT331.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT331.json")) if os.path.exists(f"{HERE}/heightsDT331.json") else {}
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
B = Board(); PW = 390; G = 70
W = SX + 4 * PW + 3 * G + 40
parts = [("Ticket", "DT331. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT331, canvas Page 5."),
  ("How to read this board", "<b>Left to right:</b> the bottom of the Menu today and About today, an arrow, then the bottom of the Menu new, with the version line above Sign out, and About new, without it. The changes have a blue outline and a yellow note. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", "20 November 10:19: I propose to move the version of the app to be in Menu on the bottom. Currently it is one more click away and not in the best place, in About. I would put it in the space between Sign out and the menu block."),
  ("Redraw, in Coach Milan's words", "20 November 11:01: the request was to move the version from About to under the Menu block, not to have it in two places. Add a new About screen where it is visible that the version is not there anymore."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT331", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
th = "padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742"
td = "padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0"
rows = "".join(f'<tr><td style="{td};font-weight:700">{where}</td><td style="{td};background:#fdf0f0">{old or "<i>none</i>"}</td><td style="{td};background:#eaf1fd;font-weight:700">{new}</td><td style="{td};color:#3d4a63">{why}</td></tr>' for _k, where, old, new, why in t.get("text", []))
y = 30
X = lambda i: SX + i * (PW + G)
bs = [shot(X(0), y, "now_menu", PW, "The bottom of the Menu, today", "draft", "The links, then Sign out. No version."),
  shot(X(1), y, "now_about", PW, "About, today", "draft", "The version is its last line."),
  shot(X(2), y, "new_menu", PW, "The bottom of the Menu, new", "changed", "Under the links: Version 0.3.167 · d1b274d, then Sign out."),
  shot(X(3), y, "new_about", PW, "About, new", "changed", "The version line is gone. About ends with the links.")]
# Now leads to New: an arrow from the two screens of today to the two new ones
B.html.append(f'<div style="position:absolute;left:{X(2) - G + 2}px;top:{y + 360}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">→</div>')
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories270.dc.html", t["boardTitle"], "20 November 2026, redrawn 11:01. Ticket DT331, Kanban column Now. Pictures from the real app: 0.3.167 today, and a scratch build of it. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories269.dc.html")
inner = B.render(W, Hc)
json.dump({"DT331": {"file": "Stories270.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out331.json"), "w"))
print("DT331", W, Hc + 230)
