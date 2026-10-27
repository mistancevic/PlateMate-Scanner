# Board DT131 to DT134 built rows (Stories91), the screens of 0.2.113 as they render. From genDT127.py: # Board DT127 (Milan 25 October 14:26: "snapping photo of a meal to check what to do about it. Is that good addon to work
# next?"; 15:14: "Draw DT127"). Shots from shotDT127.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.106, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
MARK = ""
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.113")

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
    def render(s, W, H): return f'<div style="position:relative;width:{W}px;height:{H}px">{"".join(s.html)}</div>'

def storyCard(B, y, rid, title, parts, w=350):
    body = "".join(f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>' for h, t in parts)
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
                  f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{rid}</span>{title}</div>{body}</div>')
    return y + 70 + sum(30 + math.ceil(len(re.sub("<[^>]+>|&amp;", "x", t)) / 40) * 21 for _, t in parts)
def rowEnd(*hs): return max(hs) + 140

LEGEND = ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "changed", "built"))
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.112, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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

W = SX + 3 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT131 to DT134", "Built in 0.2.113", [
  ("DT131", "A photo onto a plate with chicken and rice: the card names both, Add to my plate first. After Add: five foods, the photo's three marked ~. A recipe or a slot asks too, Start a new plate first; never on an empty plate or when the plate already is that meal."),
  ("DT132", "Salmon bowl at 51 percent fat: ~ Nutrition, on the edge, amber, with the hint; no DaaM Good spot. In Per 100 kcal: F at 1.45 times your day, on the edge of high."),
  ("DT133", "A 2,314 kcal pasta photo at lunch: about 3 portions of your lunch, Eat one portion; Ate one portion, Ate it all. The card above: about 3 lunch portions, Make it 3 portions."),
  ("DT134", "Meals a day 1: Your meal at 18:00, the window to 19:00; Plan holds one slot, Meal."),
  ("Found", "On a big photo plate the card above and Chef Mealan's line say the size twice. Worth one place, in a later story."),
])
h = rowEnd(cy,
  B.screen("B131a", 0, y, "Built: the Plate asks", "b131ask", "built", "Your plate already has 2 foods; the photo read 3. Add to my plate, Start a new plate."),
  B.screen("B131b", 1, y, "Built: after Add", "b131added", "built", "Chicken and rice plus the photo's foods, marked ~."),
  B.screen("B132a", 2, y, "Built: on the edge", "b132edge", "built", "~ Nutrition, on the edge: 51 percent, the line is 50."))
y = h
h = rowEnd(
  B.screen("B132b", 0, y, "Built: a letter at an edge", "b132letters", "built", "Per 100 kcal: F on the edge of high, 1.45 times your day."),
  B.screen("B133", 1, y, "Built: portions", "b133portions", "built", "About 3 portions of your lunch; Ate one portion first."),
  B.screen("B134a", 2, y, "Built: one meal a day", "b134life", "built", "1 on; Your meal at 18:00; the window an hour from it."))
y = h
h = rowEnd(
  B.screen("B134b", 0, y, "Built: Plan with one meal", "b134plan", "built", "One slot a day: Meal, 18:00."))
y = h
board("Stories91.dc.html", "DT131 to DT134, built: as 0.2.113 renders them",
  "27 October 2026. The screens of 0.2.113, green chips; the stories and drawings are on Stories87 to Stories89. The stand-in photo is the test camera's green.",
  B, W, y - 100, "Stories90.dc.html")
