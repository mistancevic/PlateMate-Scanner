# The one board after the test of 0.3.151 (from shotFinal.cjs and shotOrder.cjs; Coach Milan 16 November 17:04). Template from B144.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"same": ("#8a97b0", "#fff", "No change"), "now": ("#5b6b8a", "#fff", "Your phone"), "draft": ("#53627f", "#fff", "As it is today"), "changed": ("#2a72d9", "#fff", "New, drawn for your approval")}
MARK = ""

def ih(name): w, h = Image.open(f"{R}/{name}.png").size; return int(h * SW / w)
def img(name, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((SW * 2, int(im.size[1] * SW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=74)
    return f'<img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{SW}px;border-radius:10px;border:1.5px solid {border};display:block">'

class Board:
    def __init__(s): s.html = []
    def x(s, col): return SX + col * (SW + GAP)
    def screen(s, nid, col, y, title, name, status, what):
        bg, fg, label = CHIP[status]
        s.html.append(f'<div style="position:absolute;left:{s.x(col)}px;top:{y}px;width:{SW}px">'
          f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
          f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span></div>'
          f'<div style="height:{DH}px;margin-top:8px;font-size:12.5px;line-height:1.42;color:#172742;overflow:hidden">{what}</div>'
          f'<div style="margin-top:8px">{img(name, "#2a72d9" if status == "changed" else "#d1dcf0")}</div></div>')
        return y + TOP + ih(name)
    # a computer screen across the three columns
    def wide(s, nid, y, title, name, status, what):
        bg, fg, label = CHIP[status]; WW = 3 * SW + 2 * GAP
        im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((WW * 2, int(im.size[1] * WW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=74)
        h = int(im.size[1] / 2)
        s.html.append(f'<div style="position:absolute;left:{s.x(0)}px;top:{y}px;width:{WW}px">'
          f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
          f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span> <span style="font-size:12.5px;color:#172742;margin-left:8px">{what}</span></div>'
          f'<div style="margin-top:8px"><img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{WW}px;border-radius:10px;border:1.5px solid {"#2a72d9" if status == "changed" else "#d1dcf0"};display:block"></div></div>')
        return y + TT + 8 + CH + 8 + h
    def render(s, W, H): return f'<div style="position:relative;width:{W}px;height:{H}px">{"".join(s.html)}</div>'

def storyCard(B, y, rid, title, parts, w=350):
    body = "".join(f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>' for h, t in parts)
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
                  f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{rid}</span>{title}</div>{body}</div>')
    return y + 70 + sum(30 + math.ceil(len(re.sub("<[^>]+>|&amp;", "x", t)) / 40) * 21 for _, t in parts)
def rowEnd(*hs): return max(hs) + 140

LEGEND = ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("draft", "same", "changed"))
  + '<span style="color:#172742">Left: the story, one item per row. Right: the app as it is, then the same page with the change drawn in, blue outline and yellow note. Drawn in English; every release ships in Srpski and German too.</span></div>')

def board(fname, title, sub, B, W, Hc, after):
    H = min(8000, Hc + 230)
    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&amp;display=swap">
<style>
body{{margin:0}}
a{{color:#1f5fc7}}a:hover{{color:#2e7be8}}
</style>
</helmet>
<div style="width: {W}px; height: {H}px; box-sizing: border-box; padding: 14px 18px; background: #fff; color: #172742; font-family: 'Nunito', ui-sans-serif, system-ui, sans-serif; font-size: 15px; display: flex; flex-direction: column; gap: 16px; overflow: hidden">
<b style="font-size: 22px; font-weight: 900">{title}</b>
<span style="font-size: 14px; color: #3d4a63; font-weight: 600; line-height: 1.45">{sub}</span>
{LEGEND}
{B.render(W, Hc)}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{W},"height":{H}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{}};
  }}
}}
</script>
</body>
</html>
'''
    open(f"{D}/{fname}", "w").write(page)
    if not os.path.exists(f"{D}/canvas.json"): print(fname, W, H, Hc, len(page) // 1024, "KB"); return
    cj = json.load(open(f"{D}/canvas.json"))
    if fname not in cj["order"]: cj["order"].append(fname)
    a = cj["boards"][after]
    cj["boards"][fname] = {"x": 0, "y": a["y"] + a["h"] + 120, "w": W, "h": H, "title": title, "page": a["page"]}
    json.dump(cj, open(f"{D}/canvas.json", "w")); print(fname, W, H, Hc, len(page) // 1024, "KB")
    cj = json.load(open(f"{D}/canvas.json"))




def start(cols):
    global W, B, y
    W = SX + cols * (SW + GAP) - GAP + 70; B = Board(); y = 30
def row(rid, title, parts, shots, nid=None, at=0, arrows=True):
    global y
    c = storyCard(B, y, rid, title, parts)
    hs = [B.screen(f"{nid or rid}{chr(97 + at + i)}", i, y, t, n, st, wd) for i, (t, n, st, wd) in enumerate(shots)]
    if arrows:
        for i in range(1, len(shots)): B.html.append(f'<div style="position:absolute;left:{B.x(i) - GAP}px;top:{y + TOP + 220}px;width:{GAP}px;text-align:center;font-size:44px;font-weight:900;color:#2a72d9">→</div>')
    y = rowEnd(c, *hs)

start(4)
PL, CAM = ("The Plate", "y_a", "same", "You open Plate."), ("The camera", "y_b", "same", "Tap: Photo of my meal.")
row("now", "B147: the meal line of a photo from between meals, in 0.3.152", [
  ("Path", "Plate. Photo of my meal. Your photos, a photo from yesterday, 15:57. The photo screen. Read the plate. The read."),
  ("What goes wrong", "15:57 is between that day's meals (breakfast, lunch, dinner). The line falls back to the clock and says Dinner, 20:00 by the clock, on the photo screen and on the read. Reproduced. Red: the meal line. With a snack in your day, as on your phone, it says Snack."),
], [PL, CAM, ("The photo screen", "w_c", "now", "Tap: Your photos, the photo."), ("The read", "w_d", "now", "Tap: Read the plate.")], nid="B147.0")
row("new 1", "The same steps, fixed. Case 1: yesterday's lunch is not eaten yet", [
  ("The rule", "The photo's time is checked against that day's meals and against what you already ate that day."),
  ("This case", "15:57 is after lunch's time and before dinner's, and lunch is still open on that day. The photo is that lunch, later than planned: Lunch, yesterday at 15:57, later than planned."),
  ("The read", "It carries the same line, and its score says Lunch."),
  ("The pencil", "It changes the day and the meal, as today."),
  ("Languages", "One new line (later than planned), in English, Serbian and German."),
], [PL, CAM, ("The photo screen", "w1c", "changed", "Tap: Your photos, the photo."), ("The read", "w1d", "changed", "Tap: Read the plate.")], nid="B147.1")
row("new 2", "The same steps, fixed. Case 2: yesterday's lunch is already eaten", [
  ("This case", "The same photo, but lunch is already eaten on that day. Then the photo is a snack: Snack, yesterday at 15:57."),
  ("The read", "It carries the same line, and its score says Snack."),
], [PL, CAM, ("The photo screen", "w2c", "changed", "Tap: Your photos, the photo."), ("The read", "w2d", "changed", "Tap: Read the plate.")], nid="B147.2")
row("new 3", "Case 3: the photo's time is inside a meal's time", [
  ("This case", "A photo from yesterday, 19:40. That is dinner's time, so the line says Dinner, yesterday at 19:40. No change: it is so in 0.3.152."),
], [PL, CAM, ("The photo screen", "w3c", "same", "Tap: Your photos, the photo.")], nid="B147.3")
board("Stories236.dc.html", "B147: the meal line of a photo from between meals",
  "16 November 2026 (Coach Milan 17:39: the meal line bug is unrelated to B146, its own card, to be discussed separately; every step connected to the next). One row is one case, from the Plate to the read. The rule is a proposal. Drawn for approval; no Go.",
  B, W, y - 100, "Stories235.dc.html")
