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
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.89, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.88, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
W = SX + 4 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT97", "One place for Chef Mealan: nothing jumps", [
  ("Your finding, 18:55", "While Chef Mealan read the plate and Fit ran, the line and his block jumped around."),
  ("Why", "His card appears only when his answer comes, a second or two after the second food, so everything under it drops by a card. Fit swaps the line under the buttons and adds a second card, so the buttons move too."),
  ("New", "One Chef Mealan place above the buttons, there from the second food on. First: Reading your plate. Then his verdict, in the same place. Fit's result goes into it as one line under the verdict, with Undo. No second card. The buttons never move after the first food."),
  ("Stays", "The tip card under the buttons, the red portion lines, the three ways when the foods top out (they go into the same place)."),
])
h = rowEnd(cy,
  B.screen("DT97a", 0, y, "Now: second food on, no answer yet", "dt97NowWait", "now", "Nothing where the card will be."),
  B.screen("DT97b", 1, y, "Now: the answer", "dt97NowCard", "now", "A line drops in; everything under it moves."),
  B.screen("DT97c", 2, y, "New: reading", "dt97NewWait", "changed", "The place is there while he reads."),
  B.screen("DT97d", 3, y, "New: after Fit", "dt97NewFit", "changed", "Fit's line in the same place; nothing moved."))
y = h
cy = storyCard(B, y, "DT98", "For cooking: he suggests, you decide", [
  ("Your finding, 18:55", "The recipe got lemon zest, which was never on the food list."),
  ("Why", "DT91: Chef Mealan names the herbs and spices a dish uses, they sit under For cooking, not counted, and the steps may use them. The line was on the plate, but nothing asked you."),
  ("New", "The For cooking line is chips with an x. Take out what you do not have or do not want before Lock the recipe; the steps are drafted without it. Taken out stays out for this recipe. The recipe page shows only what stayed."),
])
h = rowEnd(cy,
  B.screen("DT98a", 0, y, "Now: the line", "dt98NowLine", "now", "For cooking, not counted: ground cinnamon, lemon zest. No way to say no."),
  B.screen("DT98b", 1, y, "New: chips", "dt98NewChips", "changed", "x takes one out before you lock."))
y = h
cy = storyCard(B, y, "DT99", "The button on Make says what you did", [
  ("Your finding, 18:55 and 19:27", "On to How was it? is not helpful; no on to; and Done cooking is a status, not a call to action. A button says what the tap does."),
  ("New", "Make ends with Rate it: the tap opens How was it. Craft keeps Lock the recipe, Feedback keeps Save: both say what the tap does."),
])
h = rowEnd(cy,
  B.screen("DT99a", 0, y, "Now: Make", "dt99NowMake", "now", "On to How was it?"),
  B.screen("DT99b", 1, y, "New: Make", "dt99NewMake", "changed", "Rate it."))
y = h
cy = storyCard(B, y, "DT100", "A title as a cook says it", [
  ("Seen on your screenshot", "Balkan Low-Fat Quark Toast Plate: a capital on every word, Low-Fat from a label, Plate at the end. The prompt asks for the dish's name as a cook would say it; the model ignores it."),
  ("New", "Code cleans every title Chef Mealan gives: sentence case, Plate and Bowl of dropped at the end, Low-Fat and High-Protein dropped from the start. The prompt gets two examples: Quark toast with apple; Chicken with ajvar and potatoes. A name you type is never touched."),
])
h = rowEnd(cy,
  B.screen("DT100a", 0, y, "Now: the recipe page", "dt100NowTitle", "now", "Balkan Low-Fat Quark Toast Plate."),
  B.screen("DT100b", 1, y, "New: the recipe page", "dt100NewTitle", "changed", "Quark toast with apple."))
y = h
board("Stories62.dc.html", "DT97 to DT100. Nothing jumps, you decide the herbs, Done cooking, a cook's title",
  "24 October 2026 (Milan 18:55 to 19:03, testing 0.2.89 on the preview with his quark plate). Now: 0.2.89, untouched, Chef Mealan's verdict as a stand-in. New: the same pages with the change drawn in. Nothing built.",
  B, W, y - 100, "Stories61.dc.html")
