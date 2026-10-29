# Board DT153 (Stories105). Milan 29 October 10:22. Shots from shotDT152.cjs.
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
cy = storyCard(B, y, "DT153", "On plate looks like a button: a plain tick with Undo, and the way back always at hand", [
  ("Coach Milan, 29 October 10:22, from Tester 3 Marko's testing", "There was a list of foods to add to the Plate, and that worked. Then the button turned into On plate or similar, with no action. It says the food is on the Plate, but it looks like a button you could tap to go back to the Plate. To close the chat we need to scroll all the way to the top."),
  ("Coach Milan, 10:32, with Tester 3 Marko's screen", "Here. In the plan was actually the message, but not the button."),
  ("Coach Milan, 10:38 and 10:39", "Should we add Undo for the case it was added by mistake? Yes. Add."),
  ("Now, checked in 0.2.131", "After + Add the row shows On plate in a pill, the same shape as a button, and it does nothing. Back to the plate sits under the rows in grey, easy to miss. Close is at the top of the chat and scrolls away with it."),
  ("The story", "After + Add the row shows a plain green ✓ On the plate: text with a tick, no pill, so it doesn't look tappable. The same for Take it out (✓ Out), Swap (✓ Swapped) and Put them in the plan (✓ In the plan). Next to each tick a small Undo link, plain text, not a pill: ✓ On the plate · Undo takes that food off the plate; ✓ Out · Undo puts it back at its old amount; ✓ Swapped · Undo brings back the meal that was there; ✓ In the plan · Undo empties the slots it filled (the fill only uses open slots, so nothing else changes). Undo shows while the chat is open; when you leave and come back, only the tick, because the plate or plan may have changed since. After the first Add, Back to the plate under the rows becomes the main button. The chat's head stays at the top while you scroll: Chef Mealan and where you came from: Back to the plate, Back to the plan, otherwise Close. After Put them in the plan, Back to the plan sits next to the tick as the main button."),
  ("Checked in the build", "A walkthrough per Undo: the food off and back, the meal swapped back, the filled slots empty again and the day's numbers as before."),
  ("Not in it", "Taking you back to the Plate by itself after an Add: you may want to add two foods. Undo after you left the chat: that is the Plate's and the Plan's own editing."),
])
h = rowEnd(cy,
  B.screen("DT153a", 0, y, "Now: On plate, a dead pill", "r153a", "now", "Close is far up."),
  B.screen("DT153b", 1, y, "New: a tick, the way back", "r153b", "changed", "✓ On the plate · Undo; Back to the plate primary and in the head."))
y = h
h = rowEnd(y + 10,
  B.screen("DT153c", 0, y, "Now: In the plan, Marko's screen", "r153c", "now", "A message shaped like a button."),
  B.screen("DT153d", 1, y, "New: ✓ In the plan, Back to the plan", "r153d", "changed", "✓ In the plan · Undo; the head says Back to the plan."))
y = h
board("Stories105.dc.html", "DT153. On plate looks like a button",
  "29 October 2026 (Coach Milan, from Tester 3 Marko's testing). Now: 0.2.131, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories104.dc.html")
