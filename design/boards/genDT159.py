# Board DT159 (Stories111), Explorer Micros by member: Vitamin D and Vitamin C. Milan 29 October 17:58 to 18:02. Shots from shotDT159.cjs, data member159.cjs.
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

W = SX + 4 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT159", "Explorer: a member's own page, Vitamin D and Vitamin C", [
  ("Coach Milan, 29 October 17:58 and 18:02", "How to make it like I want to see what Vitamin C is and where to find it. Or what to combine with for specific purposes. Or Vitamin D in form of D2 and D3, and that requires K2 and fats. OK. Let's do it that way."),
  ("Now, after DT158 (drawn)", "Micros starts from a food: one portion and the members it brings. There is no way to start from a vitamin or a mineral."),
  ("The story", "Micros gets two chips: By food (DT158) and By member. By member lists the twelve in their three groups; a tap opens the member's page. Each page has the same sections, each a heading, a line on what it is for, then the details. WHAT IT IS. WHAT IT DOES: the EU's authorised health claims, word for word. HOW MUCH A DAY: your day from EFSA, the label's reference, the upper limit. WHERE TO FIND IT: one normal portion of each food against your day, the line at the whole day, green when one portion covers it; for vitamin D, the form, D2 or D3. COMBINE IT WITH: what helps your body use it, and why. TOO MUCH. Sources. Food first: supplements appear only in the combine line and the upper limit. Vitamin D and Vitamin C first; the other ten follow the same page."),
  ("What the numbers show", "Vitamin D: 100 g of UV-exposed mushrooms bring 175 % of your 15 µg, 150 g of salmon 131 %, a can of sardines 29 %, a glass of milk 19 %, two eggs 13 %. Vitamin C: a red pepper brings 155 % of your 110 mg; broccoli 81 %, strawberries 80 %, a kiwi and an orange 63 % each."),
  ("The numbers, checked", "Foods: USDA rows with their FDC ids, SR Legacy, milk and red pepper the Foundation rows. EFSA: vitamin D 15 µg for adults (adequate intake) and an upper limit of 100 µg; vitamin C 110 mg for men and 95 mg for women, no upper limit set. Label references: Regulation (EU) No 1169/2011, Annex XIII: D 5 µg, C 80 mg. Claims: Regulation (EU) No 432/2012, Annex; the vitamin C rows from the legislation.gov.uk copy, the vitamin D rows from a copy of the register; to read on EUR-Lex before the build. D3 and D2: Tripkovic 2012, Am J Clin Nutr, a review of trials. Vitamin K: Kuang 2020 (a review, bone density) and Witham 2020 (a trial, people with kidney disease); not settled, and the EU has no claim. Iron over months: Nyakundi 2026, Am J Clin Nutr."),
  ("Open", "The other ten members. Your day for women and other ages: EFSA's values per person. Ranges against your goal for every family, and the note that numbers are calculated for you: DT160, next."),
])
h = rowEnd(cy,
  B.screen("DT159a", 0, y, "New: Micros, By member", "r159a", "changed", "The twelve in three groups; a tap opens the page."),
  B.screen("DT159b", 1, y, "New: Vitamin D, the top", "r159b", "changed", "What it is, what it does, how much a day."),
  B.screen("DT159c", 2, y, "New: Vitamin D, the rest", "r159c", "changed", "Where to find it, combine it with, too much."),
  B.screen("DT159d", 3, y, "New: Vitamin C", "r159d", "changed", "The same sections; plant iron in the combine line."))
y = h
board("Stories111.dc.html", "DT159. Explorer: a member's own page",
  "29 October 2026 (Coach Milan, Vitamin D and C). Now: 0.3.1, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories110.dc.html")
