# Board DT211 version 8 (Stories158; Coach Milan 2 November 12:03 to 12:09), from shotDT211v8.cjs. Earlier: Boards DT211 (Stories158) and DT212 (Stories159), version 2 (Coach Milan 2 November 10:41 to 10:55); DT211 version 3 (11:09) in genDT211v3.py. Panels from shotDT211.cjs and shotDT211v2.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.52, as it is"), "phone": ("#5b6b8a", "#fff", "Your phone, 00:42"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.52, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
cy = storyCard(B, y, "DT211", "Cook and chef, one conversation (v9)", [
  ("Coach Milan, 00:44 to 12:09", "I could not find the voice on the recipe. One Start cooking, after the review. Feedback is in every step: cooking on Make, eating on Eat, and Today 30 minutes later; a conversation between the cook and the chef, his questions in his own lines, later spoken by voice. Photo is the word. Photos belong on the steps. Leaving and coming back must not lose anything."),
  ("Version 9 (12:45)", "Chef Mealan’s bubble is the full width of the block it sits in, as wide as the buttons under it."),
  ("Craft, Make, Eat", "The third step is Eat, everywhere: the step bar, its title Eat: how was it?, Back to making it. Make ends on Cooked. Next: Eat."),
  ("Chef Mealan asks", "Every question he asks is his line, the chat's bubble with his mark: How did the cooking go? Enjoy it. How much did you eat? And how did it taste? About 30 minutes on: how did it carry you? The answers stay as they are; voice will read the same lines later."),
  ("Photos on the steps", "On Make each step has + Photo beside its tick: the prep and the steps, where they happen. Then The meal, the final look: one photo when it is on the plate; Eat shows it. The recipe shows the photos taken while cooking, tap one to change or remove it; no + slots on the recipe."),
  ("Photo, the one word", "No photo yet. Add my photo. Let Chef Mealan draw one. Chef Mealan's drawings today: 0 of 10. A drawing keeps its label, Drawn by Chef Mealan."),
  ("Start cooking", "At the end of the Steps block, with its line. Grey with a note while there are no steps."),
  ("Leave and come back", "Today Make and Eat live only on the screen: the ticks, the photos and the answers are gone if you leave the Plate or the app closes; the foods stay. New: they are kept with the plate, on the phone and in your account, like the foods. Coming back, Chef Mealan asks: You were cooking Protein Pancake: 3 of 5 steps ticked, 2 photos. Go on where you left off? Go on cooking, Save for later, Start over. Eat the same: your answers wait for you."),
])
h = rowEnd(cy,
  B.screen("DT211a", 0, y, "New: Make", "r211m8", "changed", "Craft, Make, Eat; + Photo on each step; Chef Mealan asks."),
  B.screen("DT211b", 1, y, "New: Eat", "r211e4", "changed", "Eat: how was it? His lines; the final photo."),
  B.screen("DT211c", 2, y, "New: Today, 30 minutes on", "r211t1", "changed", "How did it carry you, as his line."))
y = h
h = rowEnd(B.screen("DT211d", 0, y, "New: back in Make", "r211r8", "changed", "Go on where you left off: ticks, photos, answers kept."),
  B.screen("DT211e", 1, y, "Now: the end of Make", "r211m0", "now", "How did it go, How much, Rate it."),
  B.screen("DT211f", 2, y, "Now: Feedback", "r211f0", "now", "Feedback: how was it?"))
y = h
h = rowEnd(B.screen("DT211g", 0, y, "Now: a recipe", "r211a3", "now", "+ Picture cut off; Cook it as written below."),
  B.screen("DT211h", 1, y, "New: a recipe", "r211b8", "changed", "Photo the one word; photos from cooking; Start cooking in the block."),
  B.screen("DT211i", 2, y, "New: a recipe with no steps", "r211e8", "changed", "Start cooking grey, with why."))
y = h
h = rowEnd(B.screen("DT211j", 0, y, "Now: cooking", "r211d", "now", "The voice, Use another screen. Stays."),
  B.screen("DT211k", 1, y, "Now: Today", "r211t0", "now", "How did it carry you?"))
y = h
board("Stories158.dc.html", "DT211. Cook and chef, one conversation (v9)",
  "2 November 2026 (Coach Milan 00:44 to 12:45). Version 9: Chef Mealan’s bubble the full width of its block. Version 8: Craft, Make, Eat first; Chef Mealan's lines; photos on the steps; Photo the one word; nothing lost when you leave. Now: 0.3.52, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories157.dc.html")
