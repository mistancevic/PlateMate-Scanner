# Board DT154 (Stories106), Explorer Fats. Milan 29 October 14:47 and 14:48. Shots from shotDT154.cjs, data fat154.cjs.
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
cy = storyCard(B, y, "DT154", "Explorer: not all fats are equal, the same template as Protein", [
  ("Coach Milan, 29 October 14:47 and 14:48", "So it seems we have a kind of template we can apply to carbs and fats. Fats first."),
  ("Now, checked in 0.2.134", "Explorer has one page, Protein. No fats."),
  ("The story", "Explorer opens on family chips at the top: Protein, Fats, Carbs next. Not all fats are equal: fat is the family, its members saturated, monounsaturated and polyunsaturated, and among the polyunsaturated the omega-6 and omega-3 the body can't make. Eight foods: olive oil, butter, salmon, walnuts, avocado, egg, cheddar, almonds. Meal chips as on Protein; the meal's fat from your day (77 g a day, a lunch about 26 g). Each card, the same six sections, each a heading, its goal and this portion's result, then the details, every measure in the same row: ONE PORTION (portion, per 100 g, PD); FAT FOR YOUR LUNCH (Fat, 14 of 26 g for a tablespoon of olive oil); HEART HEALTH (Saturated fat against a meal's share of 10 % of energy, 8.5 g a lunch, red when a portion goes over; Omega-3 EPA + DHA against 250 mg a day, green when covered); THE FAMILY MEMBERS (saturated, monounsaturated, polyunsaturated, of them omega-6, of them omega-3 in bold, trans; grams on one scale; this portion is mostly ...); QUALITY (two ratios calculated from the food table: unsaturated to saturated, the higher the better; omega-6 to omega-3, the lower the more omega-3); HOW TO USE IT (Best use, Pairs with); Source. Two chips sort: Best fat quality, Most of the meal."),
  ("What the numbers show", "Salmon: 2,940 mg of EPA and DHA in 150 g, more than a week of them; a newer USDA row for farmed salmon has less than half, it depends on the feed, and the card says so. Walnuts: the plant omega-3, 2.7 g in a handful, but no EPA or DHA. Olive oil and avocado: mostly monounsaturated. Butter and cheddar: mostly saturated; 30 g of cheddar uses two thirds of a lunch's saturated share."),
  ("The numbers, checked", "Fats per 100 g: USDA SR Legacy rows, read on getfoodfacts.com with their FDC ids, salmon SR 15236 via bodbot and recipal, olive oil via nutritiondatahub; triagemethod was dropped because it mixes Australian, Foundation and SR values. Omega-3 is 18:3 as USDA reports it, plus EPA, DPA and DHA; omega-6 is linoleic acid, cis where USDA gives it. Trans not reported for olive oil and walnuts: the row says so. Saturated under 10 % of energy: WHO 2023 guideline. EPA and DHA 250 mg a day for adults: EFSA, quoted in its 2017 summary report (the 2010 opinion itself would not open; to read in the build)."),
  ("Not in it", "Carbs (next), cooking temperatures and smoke points, fish oil supplements."),
  ("To check first", "The protein page used triagemethod for soybeans, lentils, egg, oats and Greek yogurt. Those rows are rechecked against the SR rows before this is built."),
])
h = rowEnd(cy,
  B.screen("DT154a", 0, y, "New: Fats, olive oil", "r154a", "changed", "Family chips; one portion against your lunch."),
  B.screen("DT154b", 1, y, "New: salmon and walnuts", "r154b", "changed", "Omega-3: EPA and DHA from fish, ALA from nuts."),
  B.screen("DT154c", 2, y, "New: butter and cheddar", "r154c", "changed", "Saturated fat against the meal's share."))
y = h
board("Stories106.dc.html", "DT154. Explorer: not all fats are equal",
  "29 October 2026 (Coach Milan, Explorer Fats). Now: 0.2.134, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories105.dc.html")
