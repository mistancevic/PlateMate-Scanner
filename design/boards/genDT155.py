# Board DT155 (Stories107), Explorer Carbs. Milan 29 October 15:30. Shots from shotDT155.cjs, data carb155.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.131, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.131, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT155", "Explorer: not all carbs are equal, the same template as Protein and Fats", [
  ("Coach Milan, 29 October 15:30", "Go with drawing carbs."),
  ("Now, checked in 0.2.135", "Explorer has Protein and Fats; Carbs is a greyed chip, Carbs, next."),
  ("The story", "The Carbs chip opens Not all carbs are equal: carbohydrate is the family, its members starch, sugars and fibre, and they reach your blood at different speeds. Eight foods: oats, white rice, potatoes, wholewheat bread, pasta, lentils, banana, apple. Meal chips as before; the meal's carbs from your day (282 g a day, a lunch about 94 g). Each card, the same six sections: ONE PORTION (portion, per 100 g, PD); CARBS FOR YOUR LUNCH (Carbs, 40.2 of 94 g for 200 g of lentils); FIBRE AND SUGAR (fibre against a lunch's share of 25 g a day, about 8.3 g, green when covered; sugars in grams; one line that the sugar inside whole fruit isn't free sugar); THE FAMILY MEMBERS (starch and other carbs, sugars, fibre in bold; grams on one scale; mostly starch or sugars); QUALITY (GI with its band, 55 or less low, 70 or more high, and the row of the table it comes from; GL for this portion, calculated by the same paper's method); HOW TO USE IT (Best use, Pairs with); Source. Two chips sort: Lowest GI, Most of the meal."),
  ("What the numbers show", "Lentils: GI 32, the steadiest, and 15.8 g of fibre in 200 g, nearly twice a lunch's. Pasta: low GI, 49, but 200 g is two thirds of a lunch's carbs, so its GL, 29, is among the highest here: GL counts the portion. Potatoes 78 and white rice 73: high GI. Wholewheat bread is high GI too, 74: its fibre is the reason to choose it. Rolled oats 55 as porridge; instant oats 79 in the same table."),
  ("The numbers, checked", "Carbs, fibre and sugars per 100 g: USDA SR Legacy rows read on getfoodfacts.com with their FDC ids; starch and other carbs is carbohydrate minus sugars minus fibre, calculated, because SR doesn't report starch for every food. GI: Atkinson, Foster-Powell and Brand-Miller 2008, International Tables of Glycemic Index and Glycemic Load Values, Diabetes Care 31(12), Table 1, the mean of several studies, read in full; GL is GI times the carbs without fibre, divided by 100, the paper's own method. The paper gives low 55 or less and high 70 or more, and no bands for GL, so the page gives none. Fibre at least 25 g a day for adults: WHO 2023 carbohydrate guideline and EFSA 2017 summary. Free sugars under 10 % of energy: WHO 2015 sugars guideline."),
  ("Not in it", "Added sugar per food, resistant starch, cooled potatoes and rice, the 2021 GI tables (not open to read)."),
])
h = rowEnd(cy,
  B.screen("DT155a", 0, y, "New: Carbs, lentils", "r155a", "changed", "Lowest GI first; fibre against your lunch."),
  B.screen("DT155b", 1, y, "New: pasta and potatoes", "r155b", "changed", "Low GI, high portion: GL counts the portion."),
  B.screen("DT155c", 2, y, "New: banana and apple", "r155c", "changed", "Fruit sugar isn't free sugar."))
y = h
board("Stories107.dc.html", "DT155. Explorer: not all carbs are equal",
  "29 October 2026 (Coach Milan, Explorer Carbs). Now: 0.2.135, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories106.dc.html")
