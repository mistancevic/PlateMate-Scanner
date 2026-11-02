# Board DT214 (Stories162; Coach Milan 2 November 12:17 to 12:30), from shotDT214.cjs: the cook. Built on genDT211v8.py. Earlier: Boards DT211 (Stories158) and DT212 (Stories159), version 2 (Coach Milan 2 November 10:41 to 10:55); DT211 version 3 (11:09) in genDT211v3.py. Panels from shotDT211.cjs and shotDT211v2.cjs.
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
cy = storyCard(B, y, "DT214", "The cook: one cooking, from start to how it carried you", [
  ("Coach Milan, 12:17 to 12:30", "Cooking gets interrupted: something new to scan, a food to add. Disconnect the Plate from meal prep. Add the question about 30 minutes later as the last step. Once disconnected, it can be left and continued at any point until the full cycle is done, with all its photos, later videos, and feedback collected."),
  ("Two things, side by side", "The Plate is what you eat now: craft, fit, log; it is always free. A cook is one time you make something: Make, Eat, How it carried you, with everything said and taken on the way. One cook runs at a time; others wait as saved for later."),
  ("A cook and its recipe", "A recipe is the instructions, used many times. A cook is one time you made it, and points to its recipe, which it never changes. Started from the Plate with no recipe, the cook carries a draft; at the end Chef Mealan asks: keep it as a new recipe, update yours, or only this time."),
  ("Kept, and continued", "A cook is saved on the phone and in your account from its first tap. Leave it at any step; the strip on every tab says where it stands and Go on brings you back to the same place. It is the meal card Today already keeps, only started at Start cooking instead of after Feedback."),
  ("The cycle", "Make: the steps with their photos, the final photo, How did the cooking go? Eat: How much did you eat? How did it taste? (a batch: how many, the rest made, 3 left). Then, about 30 minutes on, How did it carry you? The answer closes the cook. A meal with no cooking skips Make: Eat, then How it carried you."),
  ("In the middle of cooking", "The Plate is free. A food scanned asks: use it in the dish you are cooking, or keep it in your foods. Use it: Chef Mealan asks what it replaces or adds, and the steps follow."),
  ("A recipe collects its cooks", "Its cooks' photos, how often it went as the steps said, how it tasted, how it carried you. The best photo of a step can become the step's photo."),
])
# the cycle as a diagram, right of the story card
X = SX; DW = 3 * SW + 2 * GAP
def node(t, s, c): return f'<div style="flex:1;min-width:0;border:2.5px solid {c};border-radius:12px;background:#fff;padding:10px 12px"><b style="font-size:15px;color:{c}">{t}</b><div style="font-size:12.5px;line-height:1.45;color:#172742;margin-top:4px">{s}</div></div>'
arrow = '<div style="flex:none;align-self:center;font-size:22px;color:#172742">→</div>'
B.html.append(f'<div style="position:absolute;left:{X}px;top:{y}px;width:{DW}px"><div style="background:#172742;color:#fff;border-radius:10px;padding:7px 10px;font-size:14px;font-weight:800">The cycle of one cook</div>'
  f'<div style="display:flex;gap:10px;margin-top:12px">{node("Craft, on the Plate", "Foods, amounts, Fit to my target. Or a recipe: Start cooking.", "#2e7be8")}{arrow}{node("Make", "Steps with + Photo, the final photo. Chef Mealan: How did the cooking go?", "#d35400")}{arrow}{node("Eat", "Chef Mealan: How much did you eat? How did it taste?", "#1e8e5a")}{arrow}{node("30 minutes on", "Chef Mealan: How did it carry you? The answer closes the cook.", "#8e44ad")}</div>'
  f'<div style="margin-top:12px;padding:10px 12px;border:1.5px dashed #2e7be8;border-radius:12px;font-size:13px;line-height:1.5;color:#172742"><b>The cook</b> starts at Start cooking and is kept from its first tap, on the phone and in your account. While it runs, the strip on every tab: Cooking now, the dish, the step, Go on. <b>A meal with no cooking</b> skips Make: Craft, Eat, 30 minutes on. <b>Interrupted?</b> Leave at any step; nothing is lost.</div></div>')
h = rowEnd(cy, y + 260)
yy = y + 300
h = rowEnd(cy, B.screen("DT214a", 0, yy, "New: Today, while cooking", "r214a", "changed", "The strip: Cooking now, the dish, the step, Go on."),
  B.screen("DT214b", 1, yy, "New: a scan while cooking", "r214b", "changed", "Use it in the dish, or keep it in your foods."),
  B.screen("DT214c", 2, yy, "New: after eating", "r214c", "changed", "The strip waits for the last question."))
y = h
h = rowEnd(B.screen("DT214d", 0, y, "New: 30 minutes on", "r214d", "changed", "How did it carry you closes the cook."),
  B.screen("DT214e", 1, y, "New: a recipe and its cooks", "r214e", "changed", "Photos and answers from every time you made it."),
  B.screen("DT214f", 2, y, "From DT211 v8: back in Make", "r211r8", "changed", "Go on where you left off."))
y = h
board("Stories162.dc.html", "DT214. The cook: one cooking, from start to how it carried you",
  "2 November 2026 (Coach Milan 12:17 to 12:30). Cooking becomes its own thing beside the Plate. Drawn for your approval; nothing built. The screens of Make and Eat are on DT211 v8.",
  B, W, y - 100, "Stories161.dc.html")
