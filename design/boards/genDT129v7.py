# Board DT129 v7 (Milan 26 October 14:29). Shots from shotDT129v7.cjs.
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
cy = storyCard(B, y, "DT129 v7", "Right of PD: the plate against the planned meal, right aligned, units by the room there is; no arrows", [
  ("Milan, 14:29", "Arrows are not needed: it is already compared in numbers. Align the numbers right of PD to the right, as in the table, and write units; the planned number can go without its unit if there is no room. Only calories reach four digits: if 9999 kcal of 9999 kcal fits in one row, units on both; if not, only on the measured one."),
  ("The small table right of PD", "Four columns: the plate's number, right aligned on its last digit (852, 470, 29); its unit (kcal, g, g protein); of; the planned number, right aligned. The protein row says what it is through its unit. No arrows anywhere, here or in the table below. Milan 14:38: the numbers right aligned, not the number and its unit together."),
  ("Units by the room", "The planned numbers carry their units when every row fits inside the block; otherwise they drop theirs on every row together, so the column keeps one shape, and the plate's numbers keep theirs. Measured on a 390 px phone the protein row already takes the room, so there the planned numbers go without units. Only the widest case, 9999 kcal of 9999, needs one step more: protein shortens to g prot. Four-digit kcal show without a thousands separator, 1650, to keep the column narrow."),
  ("When PD does not fit", "As today: amber or red, and the status says by how much. The numbers beside it are the same in every colour."),
  ("The table", "As in v6, without arrows: g, kcal, % plate, % day; Total under a heavy rule."),
  ("No meal planned", "Another story: until then the plate's numbers without the planned column."),
])
h = rowEnd(cy,
  B.screen("DT129v7a", 0, y, "A lunch that fits", "r129v7fit", "changed", "847, 608, 79 right aligned; units after them; of 917, 640, 80."),
  B.screen("DT129v7b", 1, y, "PD under", "r129v7pdunder", "changed", "Red, 3.1 under your 6.5; 852 kcal of 917, 29 g protein of 80."),
  B.screen("DT129v7c", 2, y, "Four digits", "r129v7over", "changed", "1650 kcal of 917, still right aligned."))
y = h
h = rowEnd(
  B.screen("DT129v7d", 0, y, "The widest case", "r129v7widest", "changed", "9999 kcal of 9999: protein shortens to g prot. so the rows fit."),
  B.screen("DT129v7e", 1, y, "The table", "r129v7open", "changed", "No arrows; g, kcal, % plate, % day; Total."))
y = h
board("Stories84.dc.html", "DT129 v7. The plate against the planned meal right of PD, right aligned, units by the room there is; no arrows",
  "26 October 2026 (Milan 14:29). Now: 0.2.108, untouched. Replaces Stories83. Nothing built.",
  B, W, y - 100, "Stories83.dc.html")
