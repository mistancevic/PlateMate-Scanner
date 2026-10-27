# Boards DT131 (Stories87) and DT132, DT133 (Stories88). Milan 27 October 13:52 and 14:12. Shots from shotDT131.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.112, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
    def render(s, W, H): return f'<div style="position:relative;width:{W}px;height:{H}px">{"".join(s.html)}</div>'

def storyCard(B, y, rid, title, parts, w=350):
    body = "".join(f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>' for h, t in parts)
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
                  f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{rid}</span>{title}</div>{body}</div>')
    return y + 70 + sum(30 + math.ceil(len(re.sub("<[^>]+>|&amp;", "x", t)) / 40) * 21 for _, t in parts)
def rowEnd(*hs): return max(hs) + 140

LEGEND = ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "changed"))
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.108, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT132", "On the edge: a value right at a rule's line", [
  ("Milan, 27 October 13:52 and 14:12", "That is on the edge. Maybe such cases are marked as on the edge of the range, or like between the high end and the low start. Great: draw it."),
  ("Why", "A plate at 51 percent fat fails like a plate at 74, and 50.2 percent read as 50 under More than half. Labels can be off by a fifth and a photo's grams by more, so a point either side of a line is not a verdict."),
  ("The story", "Within 2 points of a line, a rule reads On the edge: amber, a ~, the number and the line, no buttons, with one hint to be clear of it. It passes; the DaaM Good spot waits for a clear pass. The edges: fat 48 to 52 percent (N27); protein from a supplement 48 to 52 percent (N28); carbs before training 8 to 12 percent (N29); before training 570 to 630 kcal; after training 13 to 17 g protein; the plate's size 1.3 to 1.5 portions (C31)."),
  ("The letters (Milan 14:21: not sure how to solve that)", "My suggestion: the quick line of four letters stays clean, no marks; a mark there crowds it and makes every plate look unsure. The edge shows where you read the numbers: in Per 100 kcal, a letter within 5 percent of a band edge (0.6, 0.9, 1.5 times your day) says so in amber words. The letter itself never changes."),
])
h = rowEnd(cy,
  B.screen("DT132a", 0, y, "Now: 51 percent fails", "r132now", "now", "Salmon, rice, avocado: 51.5 percent fat, a plain fail with its ways."),
  B.screen("DT132b", 1, y, "New: on the edge", "r132edge", "changed", "Amber, ~ Nutrition, on the edge: 51 percent, the line is 50. Passes, with a hint."),
  B.screen("DT132c", 2, y, "As today: well over the line", "r132clear", "now", "74 percent stays a plain fail. The edge is narrow on purpose."))
y = h
h = rowEnd(
  B.screen("DT132d", 0, y, "New: a letter at an edge", "r132letters", "changed", "Salmon and rice: F at 1.45 times your day, the edge is 1.5. Said in Per 100 kcal; the quick line stays F."))
y = h
cy = storyCard(B, y, "DT133", "Portions, not lunches: a plate of several meals", [
  ("Milan, 27 October 14:12", "Let's call them portions. Be aware the meal or plate size is three meal portions, of course calculated against their goal. If one meal per day, it may be even below. So we need to take the context into account."),
  ("Why", "The count is energy: the plate's kcal over the meal's share of your day. A 2,314 kcal pasta dish at lunch is about 3 lunches, and the line said eat half, half is a lunch: true only for 2. The card above said three lunches and showed the DaaM Good spot."),
  ("The story", "Words in portions: Be aware: this plate is about 3 portions of your lunch. Eat one portion and keep the rest. Ate one portion logs one portion and keeps the rest on Today; Ate it all; Add a food. The big-plate card says the same: about 3 lunch portions, Make it 3 portions, Shrink it to one portion, Keep it as it is. No DaaM Good spot on a plate over its meal."),
  ("Context", "Already in the count: the portion is the meal's share of what is left of your day, from your goal, your meals a day and what you ate. With 2 meals a day the same plate is about 2 portions. One meal a day is not a choice yet: Lifestyle offers 2 to 5 meals."),
])
h = rowEnd(cy,
  B.screen("DT133a", 0, y, "Now: eat half of three", "r133now", "now", "About 3 lunches; eat half; half is a lunch. The card above: three lunches and the DaaM Good spot."),
  B.screen("DT133b", 1, y, "New: portions", "r133new", "changed", "About 3 portions of your lunch. Eat one portion and keep the rest. Ate one portion first."),
  B.screen("DT133c", 2, y, "The context: 2 meals a day", "r133one", "now", "The same plate, 2 meals a day: the meal ahead is 1,375 kcal, about 2 portions."))
y = h
board("Stories88.dc.html", "DT132 on the edge, DT133 portions",
  "27 October 2026 (Milan 13:52, 14:12 and 14:21). Now: 0.2.112, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories87.dc.html")
