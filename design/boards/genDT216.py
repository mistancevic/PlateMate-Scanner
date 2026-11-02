# Boards DT216 and DT217 on one board (Stories163; Coach Milan 2 November 15:54 to 16:13), from shotDT216.cjs: cooked plates, and cooking move by move. Built on genDT214.py. Built on genDT211v8.py. Earlier: Boards DT211 (Stories158) and DT212 (Stories159), version 2 (Coach Milan 2 November 10:41 to 10:55); DT211 version 3 (11:09) in genDT211v3.py. Panels from shotDT211.cjs and shotDT211v2.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.55, as it is"), "phone": ("#5b6b8a", "#fff", "Your phone, 00:42"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
MARK = ""

def ih(name): return int(Image.open(f"{R}/{name}.png").size[1] / 2 * K)
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
          f'<div style="margin-top:8px">{img(name, "#2e7be8" if status == "changed" else "#d1dcf0")}</div></div>')
        return y + TOP + ih(name)
    # a computer screen across the three columns
    def wide(s, nid, y, title, name, status, what):
        bg, fg, label = CHIP[status]; WW = 3 * SW + 2 * GAP
        im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((WW * 2, int(im.size[1] * WW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=74)
        h = int(im.size[1] / 2)
        s.html.append(f'<div style="position:absolute;left:{s.x(0)}px;top:{y}px;width:{WW}px">'
          f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
          f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span> <span style="font-size:12.5px;color:#172742;margin-left:8px">{what}</span></div>'
          f'<div style="margin-top:8px"><img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{WW}px;border-radius:10px;border:1.5px solid {"#2e7be8" if status == "changed" else "#d1dcf0"};display:block"></div></div>')
        return y + TT + 8 + CH + 8 + h
    def render(s, W, H): return f'<div style="position:relative;width:{W}px;height:{H}px">{"".join(s.html)}</div>'

def storyCard(B, y, rid, title, parts, w=350):
    body = "".join(f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>' for h, t in parts)
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
                  f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{rid}</span>{title}</div>{body}</div>')
    return y + 70 + sum(30 + math.ceil(len(re.sub("<[^>]+>|&amp;", "x", t)) / 40) * 21 for _, t in parts)
def rowEnd(*hs): return max(hs) + 140

LEGEND = ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "changed"))
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.55, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
    cj = json.load(open(f"{D}/canvas.json"))
    if fname not in cj["order"]: cj["order"].append(fname)
    a = cj["boards"][after]
    cj["boards"][fname] = {"x": 0, "y": a["y"] + a["h"] + 120, "w": W, "h": H, "title": title, "page": "page-vd6nie"}
    json.dump(cj, open(f"{D}/canvas.json", "w")); print(fname, W, H, Hc, len(page) // 1024, "KB")
    cj = json.load(open(f"{D}/canvas.json"))



W = SX + 3 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT216", "Cooked plates get cooking steps", [
  ("Coach Milan, 15:54", "Your crêpes: step 2 is everything combined; very hard to work with the voice, and it burns tokens and time."),
  ("Why", "The steps were not Chef Mealan's. They are the app's pattern for a bowl you don't cook (put the base in a bowl, add the rest, stir), kept with the recipe when it was saved. The app counts a plate as cooked only when a food's name says raw, dry or uncooked; Eggs and Wheat flour, white don't."),
  ("New: when a plate is cooked", "Flour, a raw egg, raw meat or fish, or a batter (flour with egg or milk). One culinary rule in one place, with its test."),
  ("New: its steps", "A cooked plate never gets the bowl pattern. It gets Chef Mealan's steps, 3 to 8, every food in one, at your amounts; or Write my own. A recipe that kept the bowl steps gets the new steps the next time it is made, and Lock the recipe keeps them."),
])
cy2 = storyCard(B, cy + 30, "DT217", "Cooking move by move", [
  ("Coach Milan, 16:09", "A different process for voice: the recipe stays as it is, cooking goes food by food, step by step."),
  ("New: moves", "The recipe keeps its steps as written, to read and decide. Cook mode reads a step one move at a time: one food, or one action. Step 2 of the crêpes as they are now: Add 2 eggs, 104 g. Add 100 g milk. Add 35 g wheat flour. Add 180 g quark. Add 1 banana, 81 g. Add 15 g chocolate chips. Stir until it's one colour."),
  ("On the screen", "STEP 2 · 3 OF 7, the move in big letters, a dot per move, Next: and the next move under it. The number buttons stay the written steps. Next, Back and Repeat work on moves; go to step 3 jumps to a written step."),
  ("Timers and ticks", "A timer belongs to the move that names the minutes. The last move of a step is its action; Next on it ticks the step on Make, as today. A step's photo stays on top through its moves."),
  ("Who makes the moves", "Chef Mealan drafts them with the steps, once per recipe, kept with it and checked like steps (one food a move, every food in, the amounts from the recipe): a fraction of a cent once, then cooking costs nothing. A recipe without moves gets them in code: each food it names becomes Add, then its own words as the action."),
  ("Voice", "One short line at a time: Next, Back and Stop cut in sooner, and a paid voice (VO1) costs less per cook."),
])
yy = y
h1 = B.screen("DT216a", 0, yy, "Now: How to make it, your crêpes", "r216a", "now", "The bowl steps, kept with the recipe: no pan, no heat, six foods in step 2.")
h2 = B.screen("DT216b", 1, yy, "New: a cooked plate", "r216b", "changed", "Chef Mealan's steps, one or two foods at a time, at your amounts.")
h3 = B.screen("DT217a", 2, yy, "Now: cooking step 2", "r217a", "now", "Six foods read in one go before you can do anything.")
y = rowEnd(h1, h2, h3)
h1 = B.screen("DT217b", 0, y, "New: one move at a time", "r217b", "changed", "STEP 2 · 3 OF 7: Add 35 g wheat flour. The dots; Next: add 180 g quark.")
h2 = B.screen("DT217c", 1, y, "New: the step's action", "r217c", "changed", "The last move is the action; Next on it ticks step 2.")
y = rowEnd(h1, h2, cy2)
board("Stories163.dc.html", "DT216 and DT217. Cooked plates, and cooking move by move",
  "2 November 2026 (Coach Milan 15:54 to 16:13). Drawn for your approval; nothing built. Now: 0.3.55, untouched.",
  B, W, y - 100, "Stories162.dc.html")
