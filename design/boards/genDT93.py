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
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.87, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: main 0.2.87 with your plate of 13:47, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT93", "The culinary gate: is this plate food?", [
  ("Your test, 13:47 and 13:58", "A protein bar, active dry yeast and peanut butter, 150 g each; you set the yeast to 10 g. Fit to my target moved the yeast to 158 g, jumped to a second step with the name locked and no way to add a food, turned the readout yellow at the same PD, and Ask Chef Mealan landed on an empty chat."),
  ("Why", "The plate was three lunches, and a plate bigger than the meal goes to the maths, not to Chef Mealan. The maths lifts PD with the densest food, yeast, up to a flat 300 g cap. Nothing knows a bar is 50 g or yeast is a teaspoon. The second step is the quick fit screen from 0.2.7."),
  ("Rule 1, portions", "Every food gets a normal range, by code, in one table with DT91's base ranges: a bar 1 bar, yeast 5 to 10 g, peanut butter 15 to 40 g, chicken 100 to 250 g. A food outside its range gets a red line under it: 150 g is 3 bars. One bar is 50 g. Fit never moves a food past its range."),
  ("Rule 2, the dish", "Chef Mealan reads the plate once it has two foods: do these make a lunch? If not, one line says why and offers: Make it a lunch around the bar (the ideas screen from DT91), Make it a snack, Keep it as it is. One AI call per plate, cached until a food changes."),
  ("Rule 3, size", "A plate far over the meal says so in the readout: 1,528 kcal, about 2 lunches. No jump to the maths."),
  ("Fit in place", "Fit changes amounts on the Plate, with the blue line under the food, as in 0.2.7: Chef Mealan suggests 20 g. Use it. The readout says how far the foods can go within their portions. When they cannot reach the target, three ways: Add foods for a lunch, Swap a food, Ask Chef Mealan. Ask opens the chat with the plate in it and three chips."),
  ("Goes away", "The second step, Chef Mealan's recipe. The yellow not realistic at the same PD."),
])
h = rowEnd(cy,
  B.screen("DT93a", 0, y, "Now: your plate", "dt93NowPlate", "now", "Three foods, 150 g each; yeast at 10 g. Fit to my target."),
  B.screen("DT93b", 1, y, "Now: after Fit", "dt93NowFit", "now", "Yeast moved to 158 g. The name locked, no Add, yellow."),
  B.screen("DT93c", 2, y, "New: the gate", "dt93NewGate", "changed", "Red lines on the bar and the peanut butter; Chef Mealan says it is not a lunch."),
  B.screen("DT93d", 3, y, "New: Fit in place", "dt93NewFit", "changed", "Within the portions, blue suggestions, three ways on."))
y = h
cy = storyCard(B, y, "DT94", "Three phases: Craft, Make, Feedback", [
  ("Your call, 13:58", "Too many steps before the recipe is locked. Finish the recipe first, then make it, then the feedback."),
  ("Craft", "One screen, the Plate: the foods, the amounts, the name, Fit, the gate, and the steps drafted at your amounts. Lock the recipe ends it. From here the name, the foods, the amounts and the steps do not change."),
  ("Make", "One screen: the steps to tick as you go, the photos while it is on the counter, how it went, how much you ate. Nothing here touches the recipe."),
  ("Feedback", "How was it, a line for your coach, Save in My recipes, Share with Coach Milan. No Name it: the name was set in Craft."),
  ("The bar", "Three phases at the top in place of the five steps. Back goes to the phase before."),
  ("A recipe from Recipes", "Make it opens Craft with the recipe's foods; Fit sizes today's plate; Lock the recipe keeps the recipe as it is and the plate as today's. The same three phases."),
  ("Open", "Whether How to make it stays a screen of its own inside Craft for a long recipe, or folds under the foods as drawn."),
])
h = rowEnd(cy,
  B.screen("DT94a", 0, y, "New: end of Craft", "dt94NewCraft", "changed", "The lunch in range, the steps under the foods, Lock the recipe."),
  B.screen("DT94b", 1, y, "New: Make", "dt94NewMake", "changed", "Tick the steps, photos, how it went, how much."),
  B.screen("DT94c", 2, y, "New: Feedback", "dt94NewFeedback", "changed", "How was it, save, share. No Name it."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.88")
cy = storyCard(B, y, "Built, 0.2.88", "DT93 and DT94, on main", [
  ("Your call, 14:09", "Go with the code. We will test it in the real app."),
  ("The gate", "Red lines under the bar and the peanut butter. The readout: not a lunch yet, about 2 lunches. Chef Mealan's card with its three ways. A plate that is food gets one line saying what it is."),
  ("Fit in place", "Fit moves the densest free food within its portion: the yeast stays at 10 g, and the blue line says it asked for 158 g. The foods top out at PD 4.7: Add foods for a lunch, Swap a food, Ask Chef Mealan (the chat opens with the plate in the question). Fit again, Lock the recipe."),
  ("Three phases", "Craft, Make, Feedback in the bar. Lock the recipe ends Craft. Make shows the steps to tick. Feedback shows the name set in Craft, no Name it."),
  ("The steps of a long recipe", "On the Plate, the first three with Show all; the steps screen stays inside Craft, as agreed at 14:09."),
  ("Journeys", "New walkthrough culinary-gate. 14 walkthroughs accept the new button names. Chef Mealan's read of the plate is a stand-in there: the real one is for your preview."),
])
cy = y + int((cy - y) * 0.88)
h = rowEnd(cy,
  B.screen("DT95a", 0, y, "Built: the gate", "dt95BuiltGate", "built", "Red lines, not a lunch yet, Chef Mealan's card."),
  B.screen("DT95b", 1, y, "Built: after Fit", "dt95BuiltFit", "built", "Yeast stays at 10 g; the three ways; Fit again."),
  B.screen("DT95c", 2, y, "Built: a plate that is food", "dt95BuiltCraft", "built", "One line from Chef Mealan; Lock the recipe."),
  B.screen("DT95d", 3, y, "Built: Make", "dt95BuiltMake", "built", "The steps to tick, photos, how it went."))
y = h
h = rowEnd(B.screen("DT95e", 0, y, "Built: Feedback", "dt95BuiltFeedback", "built", "The name from Craft, save, share."))
y = h
board("Stories60.dc.html", "DT93 and DT94. The culinary gate, Fit in place, and three phases",
  "24 October 2026 (Milan 13:47 to 14:01, his first real test of 0.2.87 on the preview). Now: 0.2.87 with his plate: a protein bar, active dry yeast and peanut butter, Maintain at 2,750 kcal, PD 6.5, lunch. New: the same pages with the change drawn in. Approved at 14:09, built in 0.2.88, not released.",
  B, W, y - 100, "Stories59.dc.html")
