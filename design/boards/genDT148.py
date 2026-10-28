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
cy = storyCard(B, y, "DT148", "Chef Mealan's idea: read it, change it on the Plate, see it working (version 2)", [
  ("Tester 3, UX2 and Bug 1 (Coach Milan, 28 October 21:57)", "Marko asked for a cheesecake from the box on top of the Plate. The idea had Quark, which he doesn't know. He wanted to swap it for a yogurt: no swipe and no add on the idea, and on the plate the swap offered nothing that made sense. He removed it, and then had to scroll to the bottom to add a food. While Chef Mealan worked, only a line of text showed; nothing said it was working."),
  ("Now, checked in 0.2.127", "The idea lists its foods in one grey line. Chef Mealan's instructions name quark and it is never told where you shop. On the plate, Swap lists Quark again first (Magerquark), then any food sorted by PD: skyr, whey, milk, biscuits, fruit, ice cream. It searches only your foods, in every place. + Add is the Quick picks list at the very bottom."),
  ("The story (version 2)", "The idea is to read: its name, PD, one line on why, the foods as points with their grams, and How to make it in three or four short steps, sent in the same answer. Put it on my plate, and every change happens there. On the plate, + Add a food sits right under the last food and opens the search there: your foods first, then the basic foods sold where you shop. One line under the foods says swipe left to swap, right to remove. Swap lists the same kind of food first (soft dairy for quark), then what is sold where you shop, then PD; a basic food sold there shows even when it is not in your foods yet, and joins them when you pick it. The food you swap away never comes back. Chef Mealan is told where you shop and is no longer pointed at quark. While it works, a card that moves: the hat stirs, the seconds count, and after 20 seconds it says it takes longer than usual. The same card for a recipe read and for the method."),
  ("One word: + Add", "Take it goes from the Plate search and the Foods search. Every food you put on the plate or in your foods is + Add; the line under it says where it comes from (Basic food sold in Limassol; joins your foods)."),
  ("Coach Milan, 28 October 23:10", "Swap on the idea but no remove. The previous version made more sense: Chef Mealan crafts a recipe, the foods with weights as points, a quick how to make it, and from there to the Plate, where all the functions are."),
  ("Rules", "Swap's order is a culinary rule: it moves to the rules module, with its row in culinary.md section 6."),
])
h = rowEnd(cy,
  B.screen("DT148a", 0, y, "Now: the wait is text", "r148a", "now", "Chef Mealan is making an idea for cheesecake. Nothing moves."),
  B.screen("DT148b", 1, y, "Now: the foods in one line", "r148b", "now", "200 g Quark · 30 g Oats ... No swap, no add."))
y = h
h = rowEnd(y + 10,
  B.screen("DT148c", 0, y, "Now: Swap Quark", "r148c", "now", "Quark again first, then any food by PD."),
  B.screen("DT148d", 1, y, "Now: Quark removed", "r148d", "now", "Add is Quick picks, at the bottom."))
y = h
h = rowEnd(y + 10,
  B.screen("DT148e", 0, y, "New: a wait that moves", "r148e", "changed", "The hat stirs, the seconds count."),
  B.screen("DT148f", 1, y, "New: the idea to read", "r148f", "changed", "The foods as points, How to make it, then the Plate."))
y = h
h = rowEnd(y + 10,
  B.screen("DT148g", 0, y, "New: Swap, the same kind first", "r148g", "changed", "Greek yogurt, cottage cheese, then Cypriot anari and sheep's yoghurt."),
  B.screen("DT148h", 1, y, "New: + Add a food under the foods", "r148h", "changed", "The search opens there, all + Add; swipe line under the foods."))
y = h
board("Stories100.dc.html", "DT148. Chef Mealan's idea: change its foods, and see it working",
  "28 October 2026 (Tester 3, UX2 and Bug 1), version 2. Now: 0.2.127, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories99.dc.html")
