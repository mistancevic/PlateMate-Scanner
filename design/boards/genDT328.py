# Board DT328: label and group come back on the home page (Coach Milan 19 November 2026, 16:40). Pictures of the section
# Start from anything from the real page: today's 0.3.164 (main) and a scratch build with the four ways (not committed),
# taken by /home/claude/work/shotDT328.cjs into BOARDS_SHOTS as now_phone, b_phone, a_phone, now_wide, new_wide.
# Helpers from genDT308d.py (Board, storyCard, board) and genDT313.py (acTable). Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT328.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT328.json")) if os.path.exists(f"{HERE}/heightsDT328.json") else {}
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
B = Board(); PW = 390; G = 40; WW = 900
W = SX + 3 * PW + 2 * G + 60 + WW + 40
parts = [("Ticket", "DT328. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT328, canvas Page 5."),
  ("How to read this board", "<b>Top right:</b> the lines, now and new. <b>Then, on a phone:</b> the section today, B (proposed, two by two) and A (one below another, for comparison). <b>On the right:</b> the same section on a computer, today and new. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", "19 November 16:40: Should label and group come back on the home page, as their own ticket? Yes."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT328", "Label and group come back on the home page", parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
th = "padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742"
td = "padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0"
rows = "".join(f'<tr><td style="{td};font-weight:700">{where}</td><td style="{td};background:#fdf0f0">{old or "<i>none</i>"}</td><td style="{td};background:#eaf1fd;font-weight:700">{new}</td><td style="{td};color:#3d4a63">{why}</td></tr>' for _k, where, old, new, why in t["text"])
TW = W - SX - 40
B.html.append(f'<div data-tbl style="position:absolute;left:{SX}px;top:30px;width:{TW}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
  f'<div style="font-size:19px;font-weight:900;color:#123a7a">The lines of Start from anything, now and new</div>'
  f'<div style="font-size:13.5px;color:#3d4a63;margin-top:4px">English here; Serbian and German go in with them. The title of the section and A photo of your meal keep their words.</div>'
  f'<table style="margin-top:10px;width:100%;border-collapse:collapse;table-layout:fixed"><colgroup><col style="width:17%"><col style="width:29%"><col style="width:31%"><col></colgroup>'
  f'<tr><th style="{th};border-radius:8px 0 0 0">Where</th><th style="{th}">Now</th><th style="{th}">New</th><th style="{th};border-radius:0 8px 0 0">Why</th></tr>{rows}</table></div>')
y = 30 + HT.get("tbl", 520) + 70
b1 = shot(SX, y, "now_phone", PW, "On a phone, today", "draft", "Two ways in. 1,382 px tall.")
b2 = shot(SX + PW + G, y, "b_phone", PW, "B, proposed: two by two", "changed", "Four ways in. 1,227 px tall. Each video 172 px wide.")
b3 = shot(SX + 2 * (PW + G), y, "a_phone", PW, "A, for comparison: one below another", "changed", "Four ways in. 2,531 px tall, nearly twice today's.")
xw = SX + 3 * PW + 2 * G + 60
w1 = shot(xw, y, "now_wide", WW, "On a computer, today", "draft", "Two ways in, side by side.")
w2 = shot(xw, w1 + 40, "new_wide", WW, "On a computer, new", "changed", "Four ways in, one row.")
y = max(b1, b2, b3, w2, 30 + HT.get("card", 1500)) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories267.dc.html", t["boardTitle"], "19 November 2026. Ticket DT328, Kanban column Next. Pictures from the real page: 0.3.164 today, and a scratch build of it with four ways in. Drawn for Coach Milan's choice and Go; nothing on the home page is changed.", B, W, Hc, "Stories266.dc.html")
inner = B.render(W, Hc)
json.dump({"DT328": {"file": "Stories267.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out328.json"), "w"))
print("DT328", W, Hc + 230)
