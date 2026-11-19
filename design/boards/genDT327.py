# Board DT327: the home page videos and their lines (Coach Milan 19 November 2026, 14:26). Stills from the videos of
# public/landing (old) and of the scratch recording on 0.3.163 (new), taken with ffmpeg into BOARDS_SHOTS as
# <video>_<old|new>_<1|2|3>.png. Two videos a row; each: three stills as it is, three stills new. The lines as a table.
# Helpers from genDT308d.py (Board, storyCard, board) and genDT313.py (acTable). Run: stills, gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SW, GAP, SX = 150, 46, 400
K = SW / 390
TT, CH, DH = 44, 24, 58
TOP = TT + 8 + CH + 8 + DH + 8
t = json.load(open(f"{HERE}/ticketDT327.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT327.json")) if os.path.exists(f"{HERE}/heightsDT327.json") else {}
V = [("barcode", "A barcode", "The pack's code read from the camera, the food on the plate."),
     ("label", "A label", "The label read from a photo, checked, the food on the plate."),
     ("group", "A group of packs", "New: one photo of three made-up packs (made with AI). Each pack is named from its front; with no table in the photo, each row asks Enter label."),
     ("meal", "A photo of your meal", "New: the photo screen, Read the plate, and the read with the foods named."),
     ("plate", "One plate", "PD, the letters and the numbers behind them, on today's Plate."),
     ("recipes", "Recipes for your day", "Recipes, sorted for what is left of the day."),
     ("shop", "Your shopping list", "The planned week's foods, ticked."),
     ("cook", "Cook it, hands free", "New: Get it ready by voice, then step 1 and its timer."),
     ("situation", "A late evening after work", "The situation page in Explorer."),
     ("explorer", "Explorer, the body", "The body, then Glycogen."),
     ("coach", "My clients", "Waiting for you at the top."),
     ("languages", "Three languages", "English, Serbian and German, one after another.")]
CLIPS = {"old": os.environ.get("CLIPS_OLD", f"{HERE}/../../public/landing"), "new": os.environ.get("CLIPS_NEW", "/home/claude/boards/clips327")}
PW = 200; PH = round(PW * 844 / 390)
B = Board(); cols = 13; W = SX + cols * (SW + GAP) + 40
def video(col0, y, n, name, what):
    hs = []
    for i, (side, st) in enumerate((("old", "draft"), ("new", "changed"))):
        for k in (1, 2, 3):
            c = col0 + i * 3 + (k - 1) + (0.4 if i else 0)
            hs.append(B.screen(f"{n}{'ab'[i]}{k}", c, y, ("Today" if i == 0 else "New") + f", {['early', 'middle', 'end'][k - 1]}", f"{n}_{side}_{k}", st, (what if (i and k == 1) else "As on the home page now." if k == 1 else "")))
    B.html.append(f'<div style="position:absolute;left:{B.x(col0 + 3) - GAP + 2}px;top:{y + TOP + 120}px;width:{GAP + 0.4 * (SW + GAP)}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">→</div>')
    B.html.append(f'<div style="position:absolute;left:{B.x(col0)}px;top:{y - 34}px;font-size:17px;font-weight:900;color:#123a7a">{name}</div>')
    # Coach Milan 19 November 14:55: stills are random frames; he needs each video from its first to its last frame.
    top = max(hs) + 24
    for i, side in enumerate(("old", "new")):
        left = B.x(col0 + i * 3 + (0.4 if i else 0)); span = 3 * SW + 2 * GAP
        b64 = base64.b64encode(open(f"{CLIPS[side]}/way-{n}.mp4", "rb").read()).decode()
        B.html.append(f'<div style="position:absolute;left:{left}px;top:{top}px;width:{span}px;text-align:center">'
          f'<div style="font-size:14px;font-weight:800;color:{"#3d4a63" if i == 0 else "#2a72d9"};margin-bottom:6px">{"The video on the home page now" if i == 0 else "The video recorded on 0.3.163"}, start to end</div>'
          f'<video src="data:video/mp4;base64,{b64}" controls muted loop playsinline autoplay preload="auto" style="width:{PW}px;height:{PH}px;border-radius:12px;border:1.5px solid {"#d1dcf0" if i == 0 else "#2a72d9"};background:#000;display:block;margin:0 auto"></video></div>')
    return top + 26 + PH
# row 0: the ticket card, and the lines as a table
parts = [("Ticket", "DT327. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT327, canvas Page 5."),
  ("How to read this board", "<b>Top right:</b> the three lines that no longer match the app, now and new. <b>Then two videos a row:</b> three stills of the video on the home page now, an arrow, three stills of the same video recorded on 0.3.163. Under the stills, both videos play from start to end: tap one to stop it, or to see it big. <b>The wide block at the bottom:</b> the agreement, as Given, When, Then rows."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", "19 November 11:09: is it good moment to update home page and videos? 14:23: what is your take here? 14:26: yes."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT327", "The home page videos and their lines", parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
th = "padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742"
td = "padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0"
rows = "".join(f'<tr><td style="{td};font-weight:700">{where}</td><td style="{td};background:#fdf0f0">{old}</td><td style="{td};background:#eaf1fd;font-weight:700">{new}</td><td style="{td};color:#3d4a63">{why}</td></tr>' for _k, where, old, new, why in t["text"])
TW = W - SX - 40
B.html.append(f'<div data-tbl style="position:absolute;left:{SX}px;top:30px;width:{TW}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
  f'<div style="font-size:19px;font-weight:900;color:#123a7a">The lines on the home page that no longer match the app</div>'
  f'<div style="font-size:13.5px;color:#3d4a63;margin-top:4px">Checked against 0.3.163, line by line. Every other line of the page still says what the app does. New words in English here; Serbian and German go in with them.</div>'
  f'<table style="margin-top:10px;width:100%;border-collapse:collapse;table-layout:fixed"><colgroup><col style="width:17%"><col style="width:27%"><col style="width:29%"><col></colgroup>'
  f'<tr><th style="{th};border-radius:8px 0 0 0">Where</th><th style="{th}">Now</th><th style="{th}">New</th><th style="{th};border-radius:0 8px 0 0">Why</th></tr>{rows}</table></div>')
y = 30 + HT.get("tbl", 420) + 110
y0 = y
for r in range(6):
    a, b = V[2 * r], V[2 * r + 1]
    bottom = max(video(0, y, a[0], a[1], a[2]), video(6.8, y, b[0], b[1], b[2]))
    y = bottom + 120
y = max(y, 30 + HT.get("card", 1500) + 80)
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories266.dc.html", t["boardTitle"], "19 November 2026. Ticket DT327, Kanban column Next. Old stills and videos from the home page now; new stills and videos from the twelve recorded on 0.3.163 into a scratch folder. Drawn for Coach Milan's Go; nothing on the home page is changed.", B, W, Hc, "Stories265.dc.html")
inner = B.render(W, Hc)
json.dump({"DT327": {"file": "Stories266.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out327.json"), "w"))
print("DT327", W, Hc + 230, "videos from", y0)
