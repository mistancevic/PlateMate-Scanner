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
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.113, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.108, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT151", "Explorer: not all proteins are equal (the MVP for the pitch, version 3)", [
  ("Coach Milan, 29 October 09:41 to 09:54", "The Explorer from my Claude Design project becomes part of Chef Mealan, built from scratch with the design as design only, on our numbers and goals; its Coach, Goal and profile parts are not needed. For now a super simple version, a link in the Menu below Foods, to show new beta testers. The full Explorer is parked in the backlog."),
  ("Coach Milan, 10:03", "Add the whole spectrum of essential amino acids and their levels, so we see it. And the purpose: when and how to use it best, a valuable insight that already serves a job."),
  ("Coach Milan, 10:10", "Check data and fix AA levels. It is a bit weird that everything is almost 200 %. Soybeans says short on methionine but the picture shows 194 %. Maybe it is better in grams."),
  ("What was wrong", "Two things. First my mistake: the soybean and egg cards had swapped bars and Best use, so soy showed egg's methionine, 194 %. Soy's own is 83 %. Second, the bars were per gram of protein against the minimum need per gram, so complete animal proteins sit near 200 %. True, but it says little."),
  ("Now, checked in 0.2.131", "No Explorer. What makes one protein food different from another lives only in Chef Mealan's lines on a plate and in PD."),
  ("The story", "Menu: Explorer, below Foods. One page, Not all proteins are equal: protein is the surname, whey, egg or lentil the first name, and each behaves differently. Eight protein foods (whey, chicken breast, Greek yogurt, salmon, soybeans, egg, lentils, oats). Each card: protein and kcal per 100 g, and PD in the app's colours against your target; one normal portion with its protein and leucine; the nine essential amino acids in that portion as grams against your whole day, calculated from your weight (for 85 kg: leucine 2.76 of 3.31 g from 150 g chicken). A line marks the day; green means this portion alone covers it. Methionine is shown with cysteine and phenylalanine with tyrosine, as the body uses them. Then Best use, when and how it serves you best (whey after training, Greek yogurt at breakfast or before sleep, chicken as the anchor of a main meal, lentils with rice for a plant lunch, oats as a breakfast carb with dairy); what completes it, read from its lowest bar (lentils with rice, oats with dairy); and one line against your own PD target. Two chips sort the list: By PD, By portion. One line at the end names the sources, says plant protein digests a little less, and that it is educational and approximate. Carbs and Fats come next."),
  ("Not in it", "3D molecules, the other families, links from the Plate and Foods, anything from the design's Coach, Goal or profiles. A public version for people not signed in."),
  ("The numbers, checked", "Amino acids per 100 g from USDA FoodData Central, with cysteine and tyrosine added. Need: WHO, FAO and UNU 2007, adults, mg per kg a day (histidine 10, isoleucine 20, leucine 39, lysine 30, methionine and cysteine 15, phenylalanine and tyrosine 25, threonine 15, tryptophan 4, valine 26). Fixed against the design's data.js: soybeans 18.2 g protein per 100 g, not 16.6; oats lysine 0.64 g, not 0.53; chicken and Greek yogurt to the USDA rows. Whey has no USDA amino acid row, so its cysteine and tyrosine follow a published whey analysis; a brand's label replaces it in the build. DIAAS is out: its published values use a child's pattern, so they told an adult soy is short when it is not. For an adult, all eight are complete per gram of protein; what differs is how much a portion brings."),
])
h = rowEnd(cy,
  B.screen("DT151a", 0, y, "Now: no Explorer", "r151a", "now", "Me, Foods, Share, Support, About."),
  B.screen("DT151b", 1, y, "New: Explorer below Foods", "r151b", "changed", "Not all proteins are equal."))
y = h
h = rowEnd(y + 10,
  B.screen("DT151c", 0, y, "New: sorted by PD", "r151c", "changed", "Whey 24.3 to oats 3.5; amino acids in grams against your day, Best use, what completes it, and you."),
  B.screen("DT151d", 1, y, "New: sorted by portion", "r151d", "changed", "Chicken 33.5 g protein first, oats 6.6 g last. 150 g soybeans equals a scoop of whey."))
y = h
board("Stories103.dc.html", "DT151. Explorer: not all proteins are equal",
  "29 October 2026 (Coach Milan, the Explorer MVP for the pitch), version 3. Now: 0.2.131, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories102.dc.html")
