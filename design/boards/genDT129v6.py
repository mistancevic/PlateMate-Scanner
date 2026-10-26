# Board DT129 v6 (Milan 26 October 14:17). Shots from shotDT129v6.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.108, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
cy = storyCard(B, y, "DT129 v6", "The plate against the planned meal: kcal, grams and protein; how a number that does not fit shows", [
  ("Milan, 14:17", "Protein against planned protein too: weight and calories are compared, so protein should be. Draw the cases where PD does not fit the day, and how the other macros, the weight or the energy show when they do not fit."),
  ("Right of the PD number", "The status as now, then three lines, each the plate against the meal planned for this slot: 852 of 917 kcal, 470 of 640 g, 29 of 80 g protein."),
  ("When a number does not fit", "Within 10 percent of the plan (the meal's range, C31) a line is plain. Outside it, an arrow between the number and its plan says which way: 470 ↓ of 640 g, 1,650 ↑ of 917 kcal. The number says how much. No colour on the line: the block's colour already belongs to PD, and a second colour would argue with it."),
  ("When PD does not fit", "As today: the block turns amber (close) or red (under) and the status says by how much, 3.1 under your 6.5. The four letters say which macro drives it (p- on the pasta). PD and the amount are read apart: a plate can be red with the size right (the pasta), blue with every line down (the quark bowl), amber with energy up and protein down at once (the schnitzel)."),
  ("The table", "The same arrow on a g or kcal cell more than 10 percent off the planned meal's grams of that macro, or its kcal and weight in the Total row: fat 35 ↑, protein 29 ↓, total 470 ↓. The columns stay g, kcal, % plate, % day; the footnote says what the arrow means."),
  ("No meal planned", "Another story, as you said: until then the slot shows the plate's numbers without the of-lines."),
])
h = rowEnd(cy,
  B.screen("DT129v6a", 0, y, "Everything fits", "r129v6fit", "changed", "847 of 917 kcal, 608 of 640 g, 79 of 80 g protein: three plain lines."),
  B.screen("DT129v6b", 1, y, "PD under, the size a lunch", "r129v6pdunder", "changed", "Red, 3.1 under your 6.5; 852 of 917 kcal plain; grams and protein ↓."),
  B.screen("DT129v6c", 2, y, "PD fits, the amount does not", "r129v6small", "changed", "Blue; every line ↓: the right food, half of it."))
y = h
h = rowEnd(
  B.screen("DT129v6d", 0, y, "Too big and short of protein", "r129v6over", "changed", "Amber; 1,650 ↑ kcal, 550 ↓ g, 69 ↓ g protein."),
  B.screen("DT129v6e", 1, y, "The table for the pasta", "r129v6open", "changed", "Fat 35 ↑, fibre 5 ↓, protein 29 ↓, total 470 ↓ against the planned lunch."))
y = h
board("Stories83.dc.html", "DT129 v6. Kcal, grams and protein against the planned meal; an arrow when a number is off; PD's colour as today",
  "26 October 2026 (Milan 14:17). Now: 0.2.108, untouched. Replaces Stories82. Nothing built.",
  B, W, y - 100, "Stories82.dc.html")
