# Board DT160 (Stories112), Explorer ranges per family and Calculated for you. Milan 29 October 18:02 to 18:22. Shots from shotDT160.cjs.
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
cy = storyCard(B, y, "DT160", "Explorer: your range for every family, and numbers calculated for you", [
  ("Coach Milan, 29 October 18:02 and 18:03", "Should we add upper and bottom limits, say ranges for every family against the goal, like what we already have for the protein range. Should we note somewhere in the Explorer that ranges and some numbers are based on selected goals and calculated against personal setup?"),
  ("Now, checked in 0.3.1", "The Explorer shows a meal's amount, from your day, without saying where it comes from. Ranges exist only for protein, on Plan: of 100 to 135 g protein. Fats and carbs show one number."),
  ("The story", "A line at the top of the Explorer: Calculated for you. It names your goal and setup (Maintain, 85 kg, 2,300 kcal a day, three meals), says the numbers marked for you change with them, and links to Change them. Each family opens with YOUR DAY, marked for you: the range for your goal, a green band, with your number as a mark in it. Protein: 1.2 to 1.6 g per kg, or 1.6 to 2.2 when you train, the app's own range. Fat: 20 to 35 % of your energy, in grams, and saturated fat under 10 %. Carbs: 45 to 60 % of your energy, fibre at least 25 g, free sugars under 10 %. A meal's amount also carries for you. On a member's page, How much a day becomes a range from your day to the upper limit; with no upper limit, the range has no end."),
  ("What the numbers show", "For the tester profile (man, 85 kg, no training, Maintain, 2,300 kcal): protein 100 to 135 g, yours 120 g; fat 51 to 89 g, yours 77 g, 30 %; saturated fat under 26 g; carbs 259 to 345 g, yours 282 g, 49 %; free sugars under 58 g. Vitamin D: 15 to 100 µg."),
  ("The numbers, checked", "Fat 20 to 35 %, carbohydrate 45 to 60 %, fibre 25 g a day: EFSA's press release of 26 March 2010 on its dietary reference values, read today, and the 2017 summary report. Fat 20 to 35 % also in the AND, DC and ACSM joint position 2016, which the app already cites. Saturated fat under 10 %: WHO 2023. Free sugars under 10 %: WHO 2015. Protein per kg: ISSN position stand 2017, as the app already uses. EFSA set no upper limit for sugars. Vitamin D 15 and 100 µg, vitamin C 110 mg for men and 95 mg for women: EFSA."),
  ("Open", "When your carbs fall outside 45 to 60 %, because protein and fat come first, the mark turns orange and one line says why. Own numbers you typed in are marked yours instead of calculated."),
])
h = rowEnd(cy,
  B.screen("DT160a", 0, y, "New: Calculated for you, Protein", "r160a", "changed", "The top line; your protein range."),
  B.screen("DT160b", 1, y, "New: Fats, your day", "r160b", "changed", "20 to 35 % of energy; saturated under 10 %."),
  B.screen("DT160c", 2, y, "New: Carbs, your day", "r160c", "changed", "45 to 60 %; fibre at least; free sugars under."),
  B.screen("DT160d", 3, y, "New: Vitamin D, a range", "r160d", "changed", "From your day to the upper limit."))
y = h
board("Stories112.dc.html", "DT160. Explorer: your range for every family",
  "29 October 2026 (Coach Milan, ranges and Calculated for you). Now: 0.3.1, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories111.dc.html")
