# Board DT329: How to, watch it, the bar's icons, and a scan from any screen (Coach Milan 19 November 2026, 17:31 to 17:43).
# Pictures from the real app: 0.3.165 today and a scratch build (not committed), taken by shotDT329.cjs into BOARDS_SHOTS.
# Helpers from genDT308d.py (Board, storyCard, board) and genDT313.py (acTable). Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT329.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT329.json")) if os.path.exists(f"{HERE}/heightsDT329.json") else {}
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
W = SX + 9 * PW + 8 * G + 40
parts = [("Ticket", "DT329. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT329, canvas Page 5."),
  ("How to read this board", "<b>Top right:</b> the lines, now and new, and the icons, now and new. <b>Then:</b> How to today, the list and one situation; then new: the list, a situation with Watch it, the video playing, the new situation, How did it go?, after Send, and the long press it teaches. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", "19 November 18:17: It is not about trying. It is doing it. Also, what about giving some feedback. Some scale and plus free text. 18:08: New on the top right side of the block. 17:31: does it make sense to add these videos inside the app, in the section for beta testing happy paths? Can we reuse home page videos? 17:43: DT329, draw. Plan one scenario with the long press on the Plate icon. Icons for the scenarios to look alike our icons on the bottom menu."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT329", "How to: do it, watch it, say how it went, the bar's icons, a scan from any screen", parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
th = "padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742"
td = "padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0"
rows = "".join(f'<tr><td style="{td};font-weight:700">{where}</td><td style="{td};background:#fdf0f0">{old or "<i>none</i>"}</td><td style="{td};background:#eaf1fd;font-weight:700">{new}</td><td style="{td};color:#3d4a63">{why}</td></tr>' for _k, where, old, new, why in t["text"])
TW = 2300
SVG = json.load(open(f"{HERE}/iconsDT329.json"))
tile = lambda i: f'<span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:#e3edfb;vertical-align:middle;margin-right:10px">{SVG[i]}</span>'
ic = "".join(f'<tr><td style="{td};font-weight:700">{n}</td><td style="{td};background:#fdf0f0;font-size:20px">{e}</td><td style="{td};background:#eaf1fd;font-weight:700">{tile(i)}{i}</td></tr>' for n, e, i in t["icons"])
B.html.append(f'<div data-tbl style="position:absolute;left:{SX}px;top:30px;width:{TW}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
  f'<div style="font-size:19px;font-weight:900;color:#123a7a">The new lines</div>'
  f'<div style="font-size:13.5px;color:#3d4a63;margin-top:4px">English here; Serbian and German go in with them. Every other line of How to keeps its words.</div>'
  f'<table style="margin-top:10px;width:100%;border-collapse:collapse;table-layout:fixed"><colgroup><col style="width:17%"><col style="width:14%"><col style="width:25%"><col style="width:29%"><col></colgroup>'
  f'<tr><th style="{th};border-radius:8px 0 0 0">Line</th><th style="{th}">Where</th><th style="{th}">Now</th><th style="{th}">New</th><th style="{th};border-radius:0 8px 0 0">Why</th></tr>'
  + "".join(f'<tr><td style="{td};font-weight:700">{k}</td><td style="{td}">{where}</td><td style="{td};background:#fdf0f0">{old or "<i>none</i>"}</td><td style="{td};background:#eaf1fd;font-weight:700">{new}</td><td style="{td};color:#3d4a63">{why}</td></tr>' for k, where, old, new, why in t["text"]) + '</table></div>')
XI = SX + TW + 40
B.html.append(f'<div data-ic style="position:absolute;left:{XI}px;top:30px;width:{W - XI - 40}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
  f'<div style="font-size:19px;font-weight:900;color:#123a7a">The icons, now and new, and the faces</div>'
  f'<div style="font-size:13.5px;color:#3d4a63;margin-top:4px">From the same set of line icons as the bar (Today, Plan, Recipes, Explorer), on the tint of the bar\'s chosen tab.</div>'
  f'<table style="margin-top:10px;width:100%;border-collapse:collapse;table-layout:fixed"><colgroup><col style="width:52%"><col style="width:14%"><col></colgroup>'
  f'<tr><th style="{th};border-radius:8px 0 0 0">Situation</th><th style="{th}">Now</th><th style="{th};border-radius:0 8px 0 0">New icon</th></tr>{ic}</table></div>')
y = 30 + max(HT.get("tbl", 600), HT.get("ic", 600)) + 70
X = lambda i: SX + i * (PW + G)
bs = [shot(X(0), y, "now_list", PW, "How to, today", "draft", "Eight situations, emoji icons, no video."),
  shot(X(1), y, "now_one", PW, "One situation, today", "draft", "Steps in words only."),
  shot(X(2), y, "new_list_tried", PW, "How to, new", "changed", "Nine situations, line icons, Video on three. New at the top right, Tried under it."),
  shot(X(3), y, "new_one", PW, "One situation, new", "changed", "Watch it under the steps."),
  shot(X(4), y, "new_watch", PW, "After Watch it", "changed", "The home page's meal video, steps 1 to 3."),
  shot(X(5), y, "new_scan", PW, "The new situation", "changed", "Scan a pack from any screen: four steps, Watch it, Try it."),
  shot(X(6), y, "new_rate", PW, "After I did it", "changed", "How did it go? 1 hard to 5 easy, and a line of your own."),
  shot(X(7), y, "new_done", PW, "After Send", "changed", "I did it on, and what you said under it."),
  shot(X(8), y, "hold_camera", PW, "What it teaches", "same", "Plate held in the bar: the camera's modes (DT309, as it is). Its video is recorded with the Go.")]
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories268.dc.html", t["boardTitle"], "19 November 2026. Ticket DT329, Kanban column Next. Pictures from the real app: 0.3.165 today, and a scratch build of it. Drawn for Coach Milan's Go; nothing in the app is changed.", B, W, Hc, "Stories267.dc.html")
inner = B.render(W, Hc)
json.dump({"DT329": {"file": "Stories268.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out329.json"), "w"))
print("DT329", W, Hc + 230)
