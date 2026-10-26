# Board DT129 v9 (Milan 26 October 14:55). Shots from shotDT129v9.cjs.
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
cy = storyCard(B, y, "DT129 v9", "Right of PD the plate's three numbers; the plate against the planned meal moves to the table", [
  ("Milan, 14:55 and 14:59", "Remove everything after the number for the meal; against the day moves to the table below. PD and the three rows, calories, weight and protein, stay right of the PD number; of 917 kcal is cut and moved to the expandable table. Bring back Energy, Weight, Protein: only of 917 kcal goes."),
  ("The block", "Lunch and PD at the top. The PD number; beside it the status as today (fits your plan; 3.1 under your 6.5; not a lunch yet), then three rows, Energy, Weight, Protein, with the plate's numbers right aligned on their last digit and their units: Energy 852 kcal, Weight 470 g, Protein 29 g. Then the four letters, and › to open the table."),
  ("The table, part one: the plate and your plan", "Titled with the meal, Lunch, the plate and your plan. Rows Energy, Weight, Protein; columns Plate, Planned, %: 852 kcal, 917 kcal, 93%; 470 g, 640 g, 73%; 29 g, 80 g, 36%. The planned numbers are the meal in this slot on Plan; % is the plate's share of the plan."),
  ("The table, part two: what is in it", "As before: Fat, Carbs, Fibre, Protein with g, kcal, % plate, % day, and a Total under a heavy rule. One line under both says what each % means; Per 100 kcal › keeps the four sentences."),
  ("When PD does not fit", "As today: amber or red, and the status says by how much. The numbers beside it are the same in every colour."),
  ("No meal planned", "Another story: until then part one is left out."),
])
h = rowEnd(cy,
  B.screen("DT129v9a", 0, y, "A lunch", "r129v9fit", "changed", "9.4, fits your plan; Energy 847 kcal, Weight 608 g, Protein 79 g."),
  B.screen("DT129v9b", 1, y, "PD under", "r129v9pdunder", "changed", "Red, 3.1 under your 6.5; Energy 852 kcal, Weight 470 g, Protein 29 g."),
  B.screen("DT129v9c", 2, y, "Four digits", "r129v9over", "changed", "1,650 kcal still right aligned."))
y = h
h = rowEnd(
  B.screen("DT129v9d", 0, y, "The table: plate and plan, then what is in it", "r129v9open", "changed", "Energy 852 of 917 kcal, 93%; Weight 73%; Protein 36%; then the macros."),
  B.screen("DT129v9e", 1, y, "The table for a lunch that fits", "r129v9open2", "changed", "Energy 92%, Weight 95%, Protein 99%."))
y = h
board("Stories86.dc.html", "DT129 v9. Right of PD the plate's numbers; the plate against the planned meal in the table",
  "26 October 2026 (Milan 14:55). Now: 0.2.108, untouched. Replaces Stories85. Nothing built.",
  B, W, y - 100, "Stories85.dc.html")
