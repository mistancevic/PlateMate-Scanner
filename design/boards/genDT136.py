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
cy = storyCard(B, y, "DT136", "Foods by place: what you see is where you shop", [
  ("Milan, 27 October 18:23 and 20:03", "Marko started testing with foods from Belgrade. When we added Limassol he added its food list, but when he searches in Limassol the Belgrade list still shows up. Chips that add a place's foods and can also take them out; also helpful for travelling."),
  ("Why, from the code", "Two things bring Belgrade into his search. Members' foods come from every place: Limassol's first, then all the others, each row saying seen in Belgrade. And a basic food keeps the name of the place it was added in: Pileća prsa, sirova, taken while his place was Belgrade. Not the cause: the starter set is twenty general foods, and the product database already searches Cyprus."),
  ("The story, part 1: the search", "Chips under Find a food: Foods from Limassol (your place, on), Belgrade (each other place a member's food was seen in), All places. Members' foods follow the chip; a line says how many wait behind another place. Your own foods always show. A basic food shows its name for where you are now, with the others below (Chicken breast, raw; also Pileća prsa, sirova)."),
])
h = rowEnd(cy,
  B.screen("DT136a", 0, y, "Now: Belgrade in a Limassol search", "r136a", "now", "Members' foods seen in Belgrade, and a basic food with its Serbian name."),
  B.screen("DT136b", 1, y, "New: Foods from, by place", "r136b", "changed", "Limassol on; Belgrade's three behind their chip; the name of where you are."))
y = h
cy = storyCard(B, y, "DT136", "Part 2: a place's foods, in and out", [
  ("The story, part 2: Where I shop", "Foods by place: a chip per place. On adds its foods (the twenty common ones and the place's own, fifty in Limassol). Off takes out the ones you never touched; a food you ate, put in a recipe, edited or scanned yourself is yours and stays, and the line names it. Nothing you logged changes."),
  ("Travelling", "When you set where you travel to, that place is on for the trip, in the search and in your foods, and goes off when you are back. The foods you used there stay."),
  ("For Marko", "Belgrade off: his untouched Belgrade foods go; Pileća prsa, sirova stays if he ate it, and reads Chicken breast, raw in Limassol."),
  ("Found while drawing", "A food's place is not stored today. For foods already in a library, the place is read from the name: a basic food named in Serbian came from Belgrade or Serbia; a member's copy says where it was seen. Your own scans have no place and always stay."),
])
h = rowEnd(cy,
  B.screen("DT136c", 0, y, "Now: one place, add only", "r136c", "now", "Add starter foods for Limassol; Belgrade's stay, and only Remove on each food takes them out."),
  B.screen("DT136d", 1, y, "New: Foods by place", "r136d", "changed", "Limassol on, Belgrade off: two unused out, the one he ate stays."))
y = h
board("Stories93.dc.html", "DT136. Foods by place",
  "27 October 2026 (Milan 18:23, 20:03; Tester 3). Now: 0.2.118, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories92.dc.html")
