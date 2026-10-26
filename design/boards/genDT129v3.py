# Board DT129 v3 (Milan 26 October 13:20 and 13:27). Shots from shotDT129v3.cjs.
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
cy = storyCard(B, y, "DT129 v3", "The meal check as the heading, with a colourful icon; the four letters as the line", [
  ("Milan, 13:20 and 13:27", "The percentage, the meal and the fit check take half of the row. As the meal check it can be the heading; low, high, just right as an icon. No E, because we have PD; energy is not a row of the macro table, it heads the EU label. Your icons are better than mine; make them colourful."),
  ("The heading", "The PD block's top left, As it stands until now, is the meal check: Lunch · 103%, the plate's share of what lunch has left of your day (the number the size line C31 and Fit use). Its icon, in a small white round so it reads on blue, green, amber or red: amber arrow down, under (below 90 percent); green check, fits (90 to 110); red arrow up, over (above 110); green double thumbs when the plate is the DaaM Good spot, a dish, the numbers and your day, all three. PD stays at the right."),
  ("The line", "Only the four letters, f | c | fi- | P, wider apart, and › to open the table. The big number, PD, is the energy reading: no E."),
  ("The tap: Against your planned day", "Energy heads the table, as on a pack: kcal on the plate, the share of lunch, the share of the day, over a heavy rule. Then one row per macro in the label order: the letter, the grams, the share of lunch, the share of the day. Under it one line on what the letters and the percentages are, and Per 100 kcal ›."),
  ("A snack, a dessert, no meal", "The heading reads against the day, Snack · 6% of your day, with no icon."),
  ("Where", "The readout on the Plate, the food card (the heading reads the food's portion against the meal ahead), the recipe page (one portion against the meal it is sized for). The 0.2.107 cells go."),
])
h = rowEnd(cy,
  B.screen("DT129v3a", 0, y, "The DaaM Good spot", "r129v3daam", "changed", "Lunch · 103% with the green double thumbs; the four letters under the number."),
  B.screen("DT129v3b", 1, y, "Fits, not the sweet spot", "r129v3fits", "changed", "Lunch · 103%, the green check."),
  B.screen("DT129v3c", 2, y, "Under", "r129v3under", "changed", "Lunch · 53%, the amber arrow down: the right food, not enough of it."))
y = h
h = rowEnd(
  B.screen("DT129v3d", 0, y, "Over", "r129v3over", "changed", "Lunch · 180%, the red arrow up."),
  B.screen("DT129v3e", 1, y, "The tap: Against your planned day", "r129v3open", "changed", "Energy heads the table; four rows, letter, grams, lunch, day."),
  B.screen("DT129v3f", 2, y, "A snack", "r129v3snack", "changed", "Snack · 6% of your day, no icon."))
y = h
board("Stories80.dc.html", "DT129 v3. The meal check as the heading with a colourful icon; the four letters as the line; energy heads the table",
  "26 October 2026 (Milan 13:20 and 13:27). Now: 0.2.108, untouched. Replaces Stories79. Nothing built.",
  B, W, y - 100, "Stories79.dc.html")
