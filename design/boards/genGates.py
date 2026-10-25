# Boards DT87 to DT91 (Milan 24 October 11:37 to 11:49: "Draw it first"): making a dinner with Chef Mealan, from an empty
# Plate to the saved recipe. Shots from shotDT87.cjs. Self-contained: the same look as genRS.py's boards, without its layers.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.94, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.94, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "G3", "Three gates, one sweet spot", [
  ("Milan, 01:24", "In the end we have three gates: culinary, nutrition, and lifestyle with the goal. Something can be delicious from the culinary side but wrong on nutrition, and may fit the lifestyle or not; any combination of the three. Three circles with an intersection: the sweet spot, the DaaM Good spot."),
  ("What exists", "Culinary: in code and in the gate (C1 to C48). Nutrition: the PD target, the meal's range, the four letters; the checks in nutrition.md section 7 still to pick. Lifestyle with the goal: the goal, the day type, the moment (before or after training, a meeting, travel), the eating window, where you eat, the week; all in the app as facts that shape numbers and chips, never asked as one question with one answer."),
  ("The three circles", "Each gate answers for itself, in its own words, so the reason stays. A score would average oats with honey before training (culinary yes, nutrition no against PD 6.5, lifestyle yes: the moment asks for carbs) into mush. The intersection is the sweet spot: DaaM Good forecast before eating. The rating after eating (DaaM Good, Good, Not really) is the confirmation. The gap between the two is what the pilot log measures."),
  ("Lifestyle gate, version 1", "The moment and the time of day: before training a carb food passes whatever its PD (N40); after training protein first; a full meal outside the eating window fails; a meeting or travel wants nothing to cook. The week, budget and where you eat wait for version 2."),
  ("The two versions", "A: the three marks on the readout, under the number and the letters, one glance. B: three lines in Chef Mealan's card, each with its sentence and the ways out under the one that fails. Both name the sweet spot only when all three hold."),
], w=350)
# the three circles, drawn
B.html.append(f'<div style="position:absolute;left:20px;top:{cy + 30}px;width:350px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
  '<div style="font-size:15px;font-weight:900;color:#123a7a;margin-bottom:6px">The three circles</div>'
  '<svg viewBox="0 0 320 300" width="318" height="298" style="display:block">'
  '<circle cx="120" cy="110" r="90" fill="#2e7be8" fill-opacity=".18" stroke="#2e7be8" stroke-width="2"/>'
  '<circle cx="200" cy="110" r="90" fill="#1b7f4b" fill-opacity=".18" stroke="#1b7f4b" stroke-width="2"/>'
  '<circle cx="160" cy="180" r="90" fill="#e0a100" fill-opacity=".18" stroke="#e0a100" stroke-width="2"/>'
  '<text x="62" y="70" font-size="14" font-weight="800" fill="#1f5fc7" font-family="Nunito,sans-serif">Culinary</text>'
  '<text x="208" y="70" font-size="14" font-weight="800" fill="#1b7f4b" font-family="Nunito,sans-serif">Nutrition</text>'
  '<text x="112" y="268" font-size="14" font-weight="800" fill="#b07f00" font-family="Nunito,sans-serif">Lifestyle, the goal</text>'
  '<text x="160" y="138" font-size="13" font-weight="900" fill="#172742" text-anchor="middle" font-family="Nunito,sans-serif">DaaM Good</text>'
  '<text x="160" y="154" font-size="13" font-weight="900" fill="#172742" text-anchor="middle" font-family="Nunito,sans-serif">spot</text>'
  '<text x="160" y="92" font-size="10.5" fill="#3d4a63" text-anchor="middle" font-family="Nunito,sans-serif">tasty and right, wrong moment</text>'
  '<text x="92" y="176" font-size="10.5" fill="#3d4a63" text-anchor="middle" font-family="Nunito,sans-serif">fits the day,</text><text x="92" y="189" font-size="10.5" fill="#3d4a63" text-anchor="middle" font-family="Nunito,sans-serif">numbers off</text>'
  '<text x="230" y="176" font-size="10.5" fill="#3d4a63" text-anchor="middle" font-family="Nunito,sans-serif">right numbers,</text><text x="230" y="189" font-size="10.5" fill="#3d4a63" text-anchor="middle" font-family="Nunito,sans-serif">no dish in it</text>'
  '</svg>'
  '<div style="font-size:12.5px;line-height:1.45;color:#172742;margin-top:6px">Every plate lands in one of seven regions. Only the middle is the sweet spot. The other six each have a name and a way out, so the app never says only no.</div></div>')
h = rowEnd(cy + 30 + 420,
  B.screen("G3a", 0, y, "Now: chicken and rice at 23:10", "gatesNow", "now", "PD 10.9, the letters, Chef Mealan's sentence. Nothing about the hour."),
  B.screen("G3b", 1, y, "Version A: three marks on the readout", "gatesA", "changed", "One glance: PD, letters, gates. A cross says why in a few words."),
  B.screen("G3c", 2, y, "Version B: three lines in Chef Mealan's card", "gatesB", "changed", "Each gate a sentence, the ways out under the one that fails."))
y = h
board("Gates3.dc.html", "G3. Three gates, one sweet spot: culinary, nutrition, lifestyle with the goal",
  "25 October 2026 (Milan 01:24 and 01:31). Brainstorm drawn two ways to discuss; nothing decided, nothing built. Now: 0.2.94, untouched.",
  B, W, y - 100, "Stories67.dc.html")
