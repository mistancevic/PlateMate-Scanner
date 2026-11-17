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



start(5)
row("icon", "DT309: the Plate icon in the bottom bar. Four versions side by side, not steps", [
  ("Why", "Coach Milan 17 November 09:25 to 09:28: a long press on Plate in the bottom bar as a quick way to the camera. The icon can mix the camera with the cutlery, or be a camera and a plate as one icon."),
  ("Now", "The cutlery."),
  ("Version 1", "The cutlery with a small camera."),
  ("Version 2", "A plate with a camera on it."),
  ("Chosen", "A plate that is also a shutter: a circle in a circle with a small dot, in the way of a camera app's icon. A fork on its left and a knife on its right, each with a small space to the plate (Coach Milan 09:50, 09:59). The word under the icon stays Plate."),
], [("Now", "i_now", "now", "Version now."), ("Cutlery with a camera", "i_a", "changed", "Version 1."), ("A plate with a camera", "i_b", "changed", "Version 2."), ("With fork and knife", "i_c", "changed", "Version 3, chosen.")], nid="DT309.0", arrows=False)
row("hold", "A long press on Plate opens a small menu with the camera's modes", [
  ("The steps", "On any screen you press and hold Plate in the bottom bar, about half a second. A small menu opens above the icon: Group, Barcode, Label, Meal, from left to right, and an X (Coach Milan 13:07). Group is four squares, Barcode is lines, Label is a simplified food label, a tall box divided in blocks, Meal is a fork and a knife. You tap a mode, and the camera opens in that mode. Here: Meal, the shutter, Use this photo, and the photo waits on the photo screen of the Plate."),
  ("Why a menu", "Coach Milan 12:42: you choose the mode yourself, and the menu is the step in between, so a long press by accident opens nothing."),
  ("The order", "By how often a mode is used and how close it is to the thumb, not by habit: the app has few users yet, so there is no habit to protect. The most used, Meal, is on the right; the least used, Group, on the left (Coach Milan 14:06). The camera's own row of modes takes the same order, so there is one order in both places."),
  ("A short tap", "It opens the Plate, as always."),
  ("So people find it", "One line in How to, and a hint the first time. To be worded."),
  ("To test on a phone", "The browser's own long-press menu has to stay away from the bar. That needs your phone; it cannot be tested in the workspace."),
], [("Today", "i_hold", "changed", "Where you are: Today."), ("The menu", "i_menu", "changed", "Press and hold: Plate."), ("The camera", "i_cam", "changed", "Tap: Meal."), ("The camera, one photo taken", "i_cu", "changed", "Tap: the shutter."), ("The photo screen", "n_n", "same", "Tap: Use this photo.")], nid="DT309.1")
row("close", "A long press by accident", [
  ("The steps", "You press and hold Plate without meaning to. The menu opens. You tap the X, or anywhere outside the menu. The menu closes and you are where you were."),
], [("Today", "i_hold", "changed", "Where you are: Today."), ("The menu", "i_menux", "changed", "Press and hold: Plate."), ("Today", "i_back", "changed", "Tap: X.")], nid="DT309.2")
board("Stories239.dc.html", "DT309: a long press on Plate opens the camera's modes",
  "17 November 2026 (Coach Milan 09:25 to 12:43: let's try it; a small menu with the camera's modes and an X). Its own small card, apart from DT308. Drawn for approval; no Go.",
  B, W, y - 100, "Stories238.dc.html")
