# Board DT164 (Stories116), Explorer: Foods, one food through every lens against your goal. Milan 29 October 21:37 to 21:59. Shots from shotDT164.cjs, data foods164.json.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.5, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.5, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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

W = SX + 5 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT164", "Explorer: Foods, one food through every lens, against your goal", [
  ("Coach Milan, 29 October 21:37 to 21:59", "I am thinking about taking the Food list from Micros to be a top level selection, just like protein, fats, carbs, micros. That is better insight. It can be expanded and compared against the goal, what that food can be used for. What is your suggestion? DT164. Foods. Draw."),
  ("Now, checked in 0.3.5", "Each family keeps its own foods: 8 on Protein, 8 on Fats, 8 on Carbs, 8 on Micros, 24 different foods in all, most of them in only one family. Two foods carry different USDA rows in different families: salmon is raw on Protein and Fats, cooked on Micros; chicken is raw on Protein, roasted on the B pages."),
  ("The story", "Foods is the fifth chip. The list: every food the Explorer knows, once, A to Z or by PD, each with its portion and PD. Tap one, and it opens on its own page: One portion; For your goal, marked for you, what this portion does for your lunch and your day, from the numbers, the strongest first (a tick when it covers the need, a half when it brings part); then each family in two or three rows (Protein, Fats, Carbs, Vitamins and minerals) with Open in Protein and the like into the full card; What a label could say, every claim together; the source. What isn't on our table is said: whey has no USDA row, so its fats, carbs, vitamins and minerals point to the brand's label. Micros opens straight on its members: By food moves up into Foods."),
  ("For the build", "One shared food table: each food is one USDA row, read in full once, and every family and every vitamin page takes it from there. So all 24 foods get every lens. Two rows change to the food as eaten: salmon becomes the cooked row (protein per portion 30.6 to 33.2 g), chicken the roasted row. New foods for the mineral pages (DT165) go into the same table."),
  ("What the numbers show", "Lentils, 200 g: almost twice your lunch's fibre, 181 % of the day's folate, a third of the lunch's protein at PD 7.8, slow carbs (GI 32), almost no fat. Salmon, 150 g cooked: about thirteen days of EPA and DHA, 63 % of the lunch's protein with enough leucine for muscle building, vitamin D four times the label's. Whey: half the lunch's protein, enough leucine on its own."),
  ("The numbers, checked", "Every number is the family cards' own calculation for this profile (lunch 53 g protein, 28 g fat, 101 g carbs, 8.3 g fibre; PD target as the app sets it). Salmon cooked, USDA SR Legacy FDC 175168, read on getfoodfacts.com today: protein 22.1 g, fat 12.3 g, saturated 2.40 g, EPA 0.69 g, DHA 1.46 g, leucine 1.80 g per 100 g; lentils' fats from FDC 172421. EPA and DHA 250 mg a day: EFSA."),
  ("Open", "The order of the For your goal lines by goal: Build muscle puts protein and leucine first, Performance carbs, Lose fat PD. Search in the list once it grows."),
])
h = rowEnd(cy,
  B.screen("DT164a", 0, y, "New: Foods, the list", "r164a", "changed", "Every food once, A to Z."),
  B.screen("DT164b", 1, y, "New: Lentils, opened", "r164b", "changed", "For your goal, then every lens."),
  B.screen("DT164c", 2, y, "New: Salmon, one row", "r164c", "changed", "Cooked, the same row everywhere."),
  B.screen("DT164d", 3, y, "New: Whey, the gaps said", "r164d", "changed", "No USDA row: the label has it."),
  B.screen("DT164e", 4, y, "New: Micros, members only", "r164e", "changed", "By food moved up into Foods."))
y = h
board("Stories116.dc.html", "DT164. Explorer: Foods",
  "29 October 2026 (Coach Milan, Foods as a top chip). Now: 0.3.5, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories115.dc.html")
