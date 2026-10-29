# Board DT161 (Stories113), how you eat: Carbs and fat in the goal setup; Paleo, Meat only and Other. Milan 29 October 19:11 to 19:15. Shots from shotDT161.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.2, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.2, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT161", "How you eat: carbs and fat as your choice, and the diets people follow", [
  ("Coach Milan, 29 October 19:11 and 19:15", "Do we need somewhere upfront, during profile setup, their beliefs around macros, or a selection of chips? Some believe carbs support their fitness goals, some believe in fats. I need that in the app: it is easier to discuss when they see it there. What about Paleo, or meat only? What if someone has a diet that is not listed?"),
  ("Now, checked in 0.3.2", "Fat is fixed at 30 % of the week's energy (25 % for Performance); carbs take the rest. Nobody can choose. What you eat has Everything, Vegetarian, Vegan, Pescatarian and No pork, and the choice only moves protein (plant protein goes to the top of the range). Chef Mealan never sees it: the Lifestyle page says Chef Mealan suggests from here first, but the choice doesn't reach it."),
  ("The story", "The goal setup gets a step, 3. Carbs and fat, after the protein card. Four chips: Balanced (fat 30 %, today's rule, the default), More carbs (25 %), More fat (35 %), Very low carb (you type your carbs; fat takes the rest). The Performance goal starts on More carbs, as its 25 % is today. A card like the protein card shows your fat in the 20 to 35 % range and what carbs get, and names the days carbs sit below 45 %. Very low carb says where it sits against both ranges, and never tells you to change. The day table follows the chip. Protein stays set by the goal. We ask how you like to eat, not what you believe: the app records a preference, never a health claim. What you eat gets Paleo (no grains, legumes or dairy), Meat only (meat, fish and eggs; it says carbs come close to zero and links to the Carbs and fat step) and Other, a line in your words. Chef Mealan reads what you eat, the Other line and the Carbs and fat chip with every plate and recipe it suggests. The Explorer's Calculated for you line names the chip."),
  ("What the numbers show", "The same training profile as DT160 (week average 2,500 kcal, protein 160 g). Balanced: fat 83 g, carbs 228 to 366 g. More carbs: fat 69 g, carbs 260 to 397 g. More fat: fat 97 g, carbs 197 to 334 g, below 45 % on every day but Monday. Very low carb with 50 g typed: fat 162 to 223 g, 63 to 70 % of the energy."),
  ("The numbers, checked", "25, 30 and 35 % all sit inside the 20 to 35 % fat range (EFSA 2010; AND, DC and ACSM 2016). Very low carb has no number of ours: the person types it. Every day number is the app's own calculation for this profile, with the chip's fat share."),
  ("Open, for the beta testers", "Which chip each tester picks, and whether they'd change it later. Whether Very low carb should be a chip or only a typed own number. Whether Meat only should set Very low carb by itself or only suggest it, as drawn."),
])
h = rowEnd(cy,
  B.screen("DT161a", 0, y, "New: Carbs and fat, Balanced", "r161a", "changed", "A step in the goal setup; Balanced is today's rule."),
  B.screen("DT161b", 1, y, "New: More fat", "r161b", "changed", "Fat at 35 %; the days below 45 % carbs named."),
  B.screen("DT161c", 2, y, "New: Very low carb", "r161c", "changed", "You type carbs; fat takes the rest."),
  B.screen("DT161d", 3, y, "New: Meat only", "r161d", "changed", "Paleo, Meat only, Other; Chef Mealan reads it."),
  B.screen("DT161e", 4, y, "New: Other, in your words", "r161e", "changed", "A diet we don't list."))
y = h
board("Stories113.dc.html", "DT161. How you eat",
  "29 October 2026 (Coach Milan, carbs and fat, diets). Now: 0.3.2, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories112.dc.html")
