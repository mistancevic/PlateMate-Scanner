# Board DT156 (Stories108), Explorer: what a label could say, by EU rules. Milan 29 October 16:16 to 16:18. Shots from shotDT156.cjs, data claims156.cjs.
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
cy = storyCard(B, y, "DT156", "Explorer: what a label could say, by EU rules, on every card (version 0.3.0)", [
  ("Coach Milan, 29 October 16:16 to 16:18", "Is there something to read from EU papers? EU claims first, since we are on production already, then micros. And with the Explorer we should have introduced version 0.3.0."),
  ("Now, checked in 0.2.136", "Each card has six sections. None says what a pack of the food may claim; PD and the EU's high protein are not linked anywhere."),
  ("The story", "A seventh section on every card of the three families, before How to use it: WHAT A LABEL COULD SAY. The goal line: By EU rules, a food may only claim these when it meets them per 100 g; this one could say: ... (or none of them). Then one row per claim, the name and Yes or No, and under it the rule and this food's number. Protein: Source of protein (at least 12 % of the energy from protein: PD 3) and High protein (20 %: PD 5). Fats: Low saturated fat, High unsaturated fat, Source of omega-3, High omega-3. Carbs: Source of fibre, High fibre, Low sugars. A source line under the rows: Regulation (EC) No 1924/2006, Annex, as the European Commission lists it."),
  ("What it shows", "Every protein food but oats could say High protein; oats only Source of protein. Walnuts and salmon could say High omega-3; butter and cheddar could claim none of them. An apple could say High fibre: 2.4 g per 100 g is little, but 4.6 g per 100 kcal, and the rule allows either. Pasta and white rice could only say Low sugars."),
  ("The rules, checked", "Quoted from the European Commission's list of nutrition claims, Regulation (EC) No 1924/2006 lastly amended by Regulation (EU) No 1047/2012, read on food.ec.europa.eu: Source of protein, at least 12 % of the energy value from protein; High protein, at least 20 %; Source of fibre, at least 3 g per 100 g or 1.5 g per 100 kcal; High fibre, 6 g or 3 g; Low sugars, at most 5 g per 100 g for solids; Low saturated fat, saturated plus trans at most 1.5 g per 100 g and at most 10 % of energy; High unsaturated fat, at least 70 % of the fatty acids unsaturated and more than 20 % of energy; Source of omega-3, 0.3 g ALA or 40 mg EPA plus DHA per 100 g and per 100 kcal; High omega-3, 0.6 g or 80 mg. PD 5 and PD 3 follow from 4 kcal per gram of protein. ALA is USDA's 18:3, as on the Fats page."),
  ("Version", "With the Explorer complete in three families and the EU claims, this build is 0.3.0 (Milan 16:18). 0.2.133 to 0.2.136 stay as they are in the history."),
  ("Not in it", "Health claims (the other EU list), claims with no added sugars and light, which need what the product is compared with. Micros come next."),
])
h = rowEnd(cy,
  B.screen("DT156a", 0, y, "New: protein claims", "r156a", "changed", "High protein is PD 5; source of protein PD 3."),
  B.screen("DT156b", 1, y, "New: fat claims", "r156b", "changed", "Walnuts: high omega-3; butter: none."),
  B.screen("DT156c", 2, y, "New: carb claims", "r156c", "changed", "Apple: high fibre per 100 kcal."))
y = h
board("Stories108.dc.html", "DT156. Explorer: what a label could say, by EU rules",
  "29 October 2026 (Coach Milan, EU claims; version 0.3.0). Now: 0.2.136, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories107.dc.html")
