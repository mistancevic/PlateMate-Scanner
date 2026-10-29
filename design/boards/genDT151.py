# Board DT135 (Stories92), portions grow with the meal. Milan 27 October 13:52 and 14:12. Shots from shotDT135.cjs.
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
cy = storyCard(B, y, "DT151", "Explorer: not all proteins are equal (the MVP for the pitch, version 4: one portion against one meal)", [
  ("Coach Milan, 29 October 09:41 to 10:10", "The Explorer becomes part of Chef Mealan, built from scratch, the design as design only; a link in the Menu below Foods, to show new beta testers. Add the whole spectrum of essential amino acids and their levels, and when and how to use each food best. Check the data: everything was almost 200 %. Maybe grams are better."),
  ("Coach Milan, 11:23", "The nine as a 3 by 3 matrix is not the best design. One below another, or rising bars, so we see the levels. Numbers are also OK."),
  ("Coach Milan, 10:55 and 11:02", "Against my day it is wrong: one scoop of whey looks like almost the whole day. Against one meal: the projected meal portion, and every food against that, to show how one food can close the meal. No one eats the same food across the day. Use the page to promote Worthy Numbers, and bring back what people know: one or two other metrics, DIAAS."),
  ("What was wrong in version 3", "The day's need was WHO's minimum, set at 0.66 g of protein per kg for an inactive adult. Your target is about twice that, so one scoop looked like most of a day."),
  ("Now, checked in 0.2.131", "No Explorer. What makes one protein food different from another lives only in Chef Mealan's lines on a plate and in PD."),
  ("The story", "Menu: Explorer, below Foods. One page, Not all proteins are equal, eight protein foods. At the top, the meal: Breakfast, Lunch, Dinner, Snack, the next meal picked; its protein from your own day (for 120 g a day and three meals, a lunch is about 40 g; a snack half a meal). Each card: PD in the app's colours, per 100 g, DIAAS as published; one normal portion; three bars: Closes N % of your lunch's protein (27 of 40 g for a scoop of whey); Leucine against the 2.5 g a meal needs for muscle repair; Essential amino acids against about 10 g a meal. Green when the portion alone covers it. Then the nine in grams, one below another, each a bar on the same scale for every food (0 to 3.5 g), so the levels compare across cards; when one only just covers the need per gram, it is marked amber, its lowest (lentils: methionine and cysteine; oats: lysine), and that is what a partner tops up. Then Best use, what completes it, and one line against your PD target. Two chips sort: By PD, Most of the meal. At the end: The why behind these numbers, Worthy Numbers, the free book, with Read the book; visits from here count as their own source, Explorer, in Metrics. One line names the sources and says what DIAAS as published means."),
  ("Not in it", "3D molecules, the other families, links from the Plate and Foods, the design's Coach, Goal or profiles. A public version for people not signed in."),
  ("The numbers, checked", "Amino acids per 100 g from USDA FoodData Central, cysteine and tyrosine added; fixed against the design's data.js: soybeans 18.2 g protein, not 16.6; oats lysine 0.64 g, not 0.53; chicken and Greek yogurt to the USDA rows. Whey has no USDA amino acid row: a published whey analysis, a brand's label in the build. Need per gram of protein: WHO, FAO and UNU 2007, adults; for an adult all eight cover it. 2.5 g of leucine and about 10 g of essential amino acids a meal: the amounts research most often cites for muscle repair. DIAAS as published uses a young child's needs and counts digestion, so plant foods score lower than they would for an adult; the page says so."),
])
h = rowEnd(cy,
  B.screen("DT151a", 0, y, "Now: no Explorer", "r151a", "now", "Me, Foods, Share, Support, About."),
  B.screen("DT151b", 1, y, "New: Explorer below Foods", "r151b", "changed", "Not all proteins are equal."))
y = h
h = rowEnd(y + 10,
  B.screen("DT151c", 0, y, "New: your lunch, by PD", "r151c", "changed", "Whey closes 68 % of a 40 g lunch; leucine and the nine against a meal."),
  B.screen("DT151d", 1, y, "New: Most of the meal", "r151d", "changed", "Chicken 84 %, whey 68 %, two eggs 31 %."),
  B.screen("DT151e", 2, y, "New: Worthy Numbers at the end", "r151e", "changed", "Read the book; visits count as Explorer."))
y = h
board("Stories103.dc.html", "DT151. Explorer: not all proteins are equal",
  "29 October 2026 (Coach Milan, the Explorer MVP for the pitch), version 4. Now: 0.2.131, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories102.dc.html")
