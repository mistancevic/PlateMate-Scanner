# Board DT162 (Stories114), Micros: Vitamin A, E and K pages; both names for every vitamin. Milan 29 October 21:21. Shots from shotDT162.cjs, data aek162.cjs and foods162.json.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.3, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.3, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT162", "Micros: Vitamin A, E and K, and both names for every vitamin", [
  ("Coach Milan, 29 October 21:18 and 21:21", "Should we finish with the rest of micros? Yes. DT162. DEK. What about the whole group of B vitamins? We need to write both versions of the name, so vitamin B1, thiamine. Also for all other."),
  ("Now, checked in 0.3.3", "By member lists twelve; only Vitamin D and Vitamin C open a page, the rest say next. Each vitamin has one name. Folate has no B number."),
  ("The story", "DEK read as the fat-soluble group: D is built, so A, E and K get their pages, the same sections as D and C. Every vitamin gets both its names, under the name: in the member list, on the food cards and on its page. Vitamin A, retinol and beta-carotene from plants; D, D3 cholecalciferol and D2 ergocalciferol; E, tocopherol; K, K1 phylloquinone and K2 menaquinone; C, ascorbic acid; B12, cobalamin; Folate becomes Vitamin B9, folate. The whole B group, all eight with both names, is DT163; the minerals DT164."),
  ("What the numbers show", "Vitamin A against 750 µg: beef liver 100 g brings 7761 µg, ten times the day and more retinol than the upper limit of 3000 µg, so the page says once in a while; a carrot 178 %, a handful of spinach 75 %, a red pepper 50 %. Vitamin E against 13 mg: no single portion covers the day; sunflower seeds and almonds, a handful, about 60 %. Vitamin K against 70 µg: spinach 414 %, kale 279 %, broccoli and Brussels sprouts about 200 %; cheddar brings some K2, which EFSA's value doesn't count."),
  ("The numbers, checked", "Claims: Regulation (EU) No 432/2012, Annex: A, six claims (legislation.gov.uk copy and the EUR-Lex consolidated text agree); E, one; K, two (copy of OJ L 136 of 25 May 2012). EFSA: A 750 µg RE men, 650 women (2015); preformed A upper limit 3000 µg RE, retinol only, no limit for beta-carotene (2024); E 13 mg men, 11 women as alpha-tocopherol (2015), upper limit 300 mg (2024); K 70 µg as K1 (2017), no upper limit (EFSA overview of upper limits, version 11). Vitamin A counted the EFSA way, 1 µg RE = 1 µg retinol, 6 µg beta-carotene, 12 µg other carotenoids, from USDA's retinol and carotene rows. Foods: USDA SR Legacy rows read on getfoodfacts.com with FDC ids. Fat and beta-carotene: Brown 2004 (7 people); fat and K1: Gijsbers 1996 (5 people), abstracts on PubMed."),
  ("One fix for the build", "The food cards count vitamin A as USDA does (RAE, beta-carotene at 12 to 1); the page counts it as EFSA does (RE, 6 to 1), so spinach would read 281 µg on its card and 563 µg on the page. The build moves the cards to EFSA's way too, the same as EU labels, so a food has one number everywhere."),
  ("Open", "Sweet potato: its USDA row couldn't be read, so it's left out. Natto's K2 isn't on its USDA row. K and blood thinners: the page stays with food and points to the doctor, as the safety rules say."),
])
h = rowEnd(cy,
  B.screen("DT162a", 0, y, "New: both names", "r162a", "changed", "A, E and K open; Folate is B9."),
  B.screen("DT162b", 1, y, "New: Vitamin A, the top", "r162b", "changed", "Six EU claims; 750 to 3000 µg."),
  B.screen("DT162c", 2, y, "New: Vitamin A, the rest", "r162c", "changed", "Liver over the limit, said plainly."),
  B.screen("DT162d", 3, y, "New: Vitamin E", "r162d", "changed", "One claim; food never near 300 mg."),
  B.screen("DT162e", 4, y, "New: Vitamin K", "r162e", "changed", "K1 and K2; no upper limit."))
y = h
board("Stories114.dc.html", "DT162. Micros: Vitamin A, E and K",
  "29 October 2026 (Coach Milan, the rest of micros). Now: 0.3.3, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories113.dc.html")
