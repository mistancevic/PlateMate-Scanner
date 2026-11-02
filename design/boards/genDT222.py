# Boards DT222 to DT224 on one board (Stories165; Coach Milan 2 November 18:30 to 19:00), from /home/claude/walk/shotDT222.cjs: the done screen, a photo of each step, the Plate's start screen. Built on genDT218.py.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.58, as it is"), "phone": ("#5b6b8a", "#fff", "Your phone, 00:42"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.58, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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





W = SX + 3 * (SW + GAP) - GAP + 70
B = Board(); y = 30
c = storyCard(B, y, "DT222", "Done is the start of Eat", [
  ("Coach Milan, 18:30", "I finished with cooking, but this screen looks like a wall, not motivation for the next step."),
  ("Now", "Done. Enjoy your meal. Then Back to Make, a paragraph on what to do there, and Back to the last step."),
  ("New: the card", "Done. Enjoy your meal. How long it took: 4 steps, 38 minutes. Now a photo of your plate, then eat."),
  ("New: the next step", "Photo of your meal, big, with the camera. It goes on the meal's card and the recipe. Then one button: Cooked. Next: Eat ›, which opens Eat with the photo on the meal."),
  ("Small links", "‹ Last step, and Make: step photos and notes ›. The paragraph goes."),
])
h1 = B.screen("DT222a", 0, y, "Now: done", "r222a", "now", "A paragraph on what to do on Make; Back to Make is the button.")
h2 = B.screen("DT222b", 1, y, "New: done, then the photo", "r222b", "changed", "Photo of your meal, big; Cooked. Next: Eat ›; Make is a small link.")
h3 = B.screen("DT222c", 2, y, "New: with the photo", "r222c", "changed", "The photo shown, Take it again under it; then Eat.")
y = rowEnd(c, h1, h2, h3)
c = storyCard(B, y, "DT223", "A photo of each step, while you cook", [
  ("Coach Milan, 18:30 and 19:00", "Photo of each step alongside the steps for cooking. Start with 1: a small button on each step."),
  ("Now", "Cook mode shows a step's picture only when the recipe has one, from Make. Your Sarma had none, and there is no way to add one in cook mode."),
  ("New: the button", "Under the step text: 📷 Add a photo of this step, 44 px. The camera opens; the step, the timers and the voice wait."),
  ("New: the photo", "It sits on top of its step: Your photo · kept with the recipe, with Take it again. It is the recipe's step picture, the same as one added on Make, so it shows the next time you cook it."),
  ("Later, on a tap", "Chef Mealan draws the steps you have no photo of (option 2, a few cents a recipe). Not in this board."),
])
h1 = B.screen("DT223a", 0, y, "Now: a step without a picture", "r223a", "now", "Text only; no way to add a photo here.")
h2 = B.screen("DT223b", 1, y, "New: Add a photo of this step", "r223b", "changed", "A small button under the step text.")
h3 = B.screen("DT223c", 2, y, "New: the step's photo", "r223c", "changed", "On top of its step, kept with the recipe; Take it again.")
y = rowEnd(c, h1, h2, h3)
c = storyCard(B, y, "DT224", "The Plate starts with what you crave", [
  ("Coach Milan, 18:30", "The Plate and What are you craving? seem like a screen for itself. Craft, Make, Eat maybe activates once we know what we are crafting."),
  ("Now", "An empty Plate shows Craft, Make, Eat above What are you craving?"),
  ("New: empty", "What are you craving? alone, as the start screen. No Craft, Make, Eat."),
  ("New: once it holds something", "A food, a recipe or a photo on the Plate: Craft, Make, Eat appears above its name, Craft on. From there on as today."),
])
h1 = B.screen("DT224a", 0, y, "Now: an empty Plate", "r224a", "now", "Craft, Make, Eat before anything is on it.")
h2 = B.screen("DT224b", 1, y, "New: an empty Plate", "r224b", "changed", "What are you craving?, alone.")
h3 = B.screen("DT224c", 2, y, "New: two foods on it", "r224c", "changed", "Now Craft, Make, Eat appears: you are crafting.")
y = rowEnd(c, h1, h2, h3)
board("Stories165.dc.html", "DT222 to DT224. Done leads to Eat, a photo of each step, the Plate's start",
  "2 November 2026 (Coach Milan 18:30 to 19:00). Drawn for your approval; nothing built. Now: 0.3.58, untouched. The cook strip on Today and the Plate only is built (0.3.59), not drawn here.",
  B, W, y - 100, "Stories164.dc.html")
