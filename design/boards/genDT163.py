# Board DT163 (Stories115), Micros: the whole B group, all eight with both names. Milan 29 October 21:21 and 21:34. Shots from shotDT163.cjs, data b163.cjs, bcard163.json, bpage163.json.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.4, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.4, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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

W = SX + 7 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT163", "Micros: the whole B group, all eight with both names", [
  ("Coach Milan, 29 October 21:21 and 21:34", "What about the whole group of B vitamins? We need to write both versions of the name. So vitamin B1, thiamine. Also for all other. DT162 Go. Next DT163."),
  ("Now, checked in 0.3.4", "Only B12 (cobalamin) and B9 (folate) are in the Explorer, on the food cards; neither has its own page. B1, B2, B3, B5, B6 and B7 are not there at all."),
  ("The story", "All eight B vitamins join the water-soluble group, in order, each with both names: B1 thiamine, B2 riboflavin, B3 niacin, B5 pantothenic acid, B6 pyridoxine, B7 biotin, B9 folate, B12 cobalamin. Each opens its own page, the same sections as A to K. On every food card the eight sit among the water-soluble rows, against the label's reference. Two are set by how much you eat: EFSA gives B1 and B3 per megajoule, so your day follows today's energy and is marked for you. B3 is counted the EFSA way, niacin equivalents: the niacin plus the tryptophan from protein divided by 60. B9's upper limit is for folic acid added to foods and supplements only. B7: USDA's rows don't report biotin, so its page says so and leaves Where to find it empty. Drawn: the list, a card, B1, B3, B9, B12 and B7; B2, B5 and B6 follow the same page."),
  ("What the numbers show", "For today's 2,600 kcal: B1 1.1 mg, pork tenderloin 150 g brings 130 %; B3 17.4 mg NE, chicken breast 150 g 170 %. B9 330 µg: lentils 200 g and chickpeas 200 g each cover the day. B12 4 µg: clams 100 g and liver 100 g more than twenty days, sardines two; none of the plant foods. Lentils on the card: almost two days of folate."),
  ("The numbers, checked", "Claims: Regulation (EU) No 432/2012, Annex, legislation.gov.uk copy, word for word (B1 four, B2 nine, B3 six, B5 four, B6 ten, B7 seven, B9 eight, B12 eight). Label references: Regulation (EU) No 1169/2011, Annex XIII. EFSA: thiamin 0.1 mg/MJ (2016), riboflavin 1.6 mg (2017), niacin 1.6 mg NE/MJ and 60 mg tryptophan = 1 mg NE (2014), pantothenic acid 5 mg (2014), B6 1.7 mg men, 1.6 women (2016), folate 330 µg DFE (2014), as the Health Council of the Netherlands tabulates them (2018); biotin 40 µg (2014, abstract); B12 4 µg (2015, press release). Upper limits: EFSA overview, version 11: B6 12 mg; folic acid 1000 µg, added forms only; niacin, nicotinic acid 10 mg and nicotinamide 900 mg; none set for B1, B2, B5, B7; B12 no defined adverse effects. Foods: USDA SR Legacy rows on getfoodfacts.com."),
  ("Open", "Biotin: a food table that reports it. Sunflower seeds show the same number for niacin and pantothenic acid, 7.04 mg: left out of B5 until checked. Whey: no USDA row for B vitamins. The Foods chip (Milan 21:37) waits for your word on where it goes."),
])
h = rowEnd(cy,
  B.screen("DT163a", 0, y, "New: the B group", "r163a", "changed", "All eight, both names, in order."),
  B.screen("DT163b", 1, y, "New: on the food card", "r163b", "changed", "Lentils: the eight among the rows."),
  B.screen("DT163c", 2, y, "New: B1, thiamine", "r163c", "changed", "Set by your energy: 1.1 mg today."),
  B.screen("DT163d", 3, y, "New: B3, niacin", "r163d", "changed", "Niacin equivalents, with tryptophan."),
  B.screen("DT163e", 4, y, "New: B9, folate", "r163e", "changed", "The limit is for folic acid only."),
  B.screen("DT163f", 5, y, "New: B12, cobalamin", "r163f", "changed", "Animal foods only, no limit."),
  B.screen("DT163g", 6, y, "New: B7, biotin", "r163g", "changed", "Not on USDA's rows: said, not guessed."))
y = h
board("Stories115.dc.html", "DT163. Micros: the B group",
  "29 October 2026 (Coach Milan, the B vitamins). Now: 0.3.4, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories114.dc.html")
