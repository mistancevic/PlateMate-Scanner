# Board DT203 release 3 (Stories176; Coach Milan 3 November 23:45 to 23:47, Draw): the Plate in Srpski. From /home/claude/walk/shotDT203r3.cjs. Built on genDT203.py.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.76, as it is"), "phone": ("#5b6b8a", "#fff", "Your phone, 00:42"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
    # a computer screen across the three columns
    def wide(s, nid, y, title, name, status, what):
        bg, fg, label = CHIP[status]; WW = 3 * SW + 2 * GAP
        im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((WW * 2, int(im.size[1] * WW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=74)
        h = int(im.size[1] / 2)
        s.html.append(f'<div style="position:absolute;left:{s.x(0)}px;top:{y}px;width:{WW}px">'
          f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
          f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span> <span style="font-size:12.5px;color:#172742;margin-left:8px">{what}</span></div>'
          f'<div style="margin-top:8px"><img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{WW}px;border-radius:10px;border:1.5px solid {"#2e7be8" if status == "changed" else "#d1dcf0"};display:block"></div></div>')
        return y + TT + 8 + CH + 8 + h
    def render(s, W, H): return f'<div style="position:relative;width:{W}px;height:{H}px">{"".join(s.html)}</div>'

def storyCard(B, y, rid, title, parts, w=350):
    body = "".join(f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>' for h, t in parts)
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
                  f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{rid}</span>{title}</div>{body}</div>')
    return y + 70 + sum(30 + math.ceil(len(re.sub("<[^>]+>|&amp;", "x", t)) / 40) * 21 for _, t in parts)
def rowEnd(*hs): return max(hs) + 140

LEGEND = ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "changed"))
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.76, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
    cj = json.load(open(f"{D}/canvas.json"))





W = SX + 4 * (SW + GAP) - GAP + 70
B = Board(); y = 30
c = storyCard(B, y, "DT203", "Release 3: the Plate in Srpski", [
  ("Coach Milan, 23:45 to 23:47", "The screens in Serbian are still the plan. Draw release 3 first, then build release 2."),
  ("Release 2 first, nothing you can see", "Every word on the screens moves out of the code into one English file. It also lets the 11 waiting lines of Chef Mealan go Serbian. Needs your Go after this board."),
  ("Release 3: the Plate", "With Srpski chosen, the whole Plate is Serbian: the title, the buttons, the questions, the lines under the foods, and the header. Today, Plan, Recipes, cooking and Me stay English until their own release."),
  ("Food names", "Foods from the food table come in Serbian (Jaja, Mleko, Pšenično brašno). Your own names, the names on packs and your recipe names stay as written."),
  ("No word changes its ending", "Serbian changes a word's ending by its place in the sentence. So a food or meal name never sits inside a sentence: it stands after a colon (Pšenično brašno: 40 do 250 g)."),
  ("He or she", "A button or question in the past tense has two forms (Pojeo sam, Pojela sam). The sex in your profile picks one."),
  ("Your table", "A section per area. The Plate's screen words come first. Only ticked lines go into the app; the rest stay English."),
  ("Your call 1: names", "Plate becomes Tanjir, Fit becomes Uklopi. PD, DaaM, Chef Mealan and Explorer stay. Drawn this way."),
  ("Your call 2: numbers", "In Srpski a decimal comma and a thousands point (5,5 and 2.450), on every screen at once with release 2. Drawn this way. Or keep the point everywhere."),
  ("Your call 3: the bar", "The tabs in Serbian with the Plate: Danas, Plan, Tanjir, Recepti, Explorer. Or with the last area."),
])
h1 = B.screen("DT203f", 0, y, "Now: the empty Plate", "r203f", "now", "English, also with Srpski chosen.")
h2 = B.screen("DT203g", 1, y, "New: the empty Plate in Srpski", "r203g", "changed", "Every word Serbian. Packs keep their names. Decimal comma.")
h3 = B.screen("DT203h", 2, y, "Now: a recipe on the Plate", "r203h", "now", "Vanilla protein crepes, in English.")
h4 = B.screen("DT203i", 3, y, "New: the recipe in Srpski", "r203i", "changed", "The recipe's name stays. PD, the letters and Chef Mealan stay.")
y = rowEnd(c, h1, h2, h3, h4)
h5 = B.screen("DT203j", 0, y, "New: the foods and the lines under them", "r203j", "changed", "Table foods in Serbian, your own names as typed. A food's name stands after a colon.")
h6 = B.screen("DT203k", 1, y, "New: a Plate question", "r203k", "changed", "His line and the buttons in Srpski. Pojeo sam follows your profile.")
h7 = B.screen("DT203l", 2, y, "New: your table, the Plate's section", "r203l", "changed", "Screen words to edit and tick. Two forms for he and she. Lines are examples.")
y = rowEnd(h5, h6, h7)
board("Stories176.dc.html", "DT203. Release 3: the Plate in Srpski",
  "3 November 2026 (Coach Milan 23:45 to 23:47, Draw). Drawn for your approval; nothing built. Now: 0.3.76. The Serbian words on these screens are drafts by Claude, to be checked in your table.",
  B, W, y - 100, "Stories175.dc.html")
