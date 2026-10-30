# Board DT175a (Stories123): pictures for each step, Beta. Milan 30 October 18:09 to 18:14. Panels from shotDT175a.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.16, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.16, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT175a", "Pictures for each step, Watch the steps, step buttons", [
  ("Coach Milan, 30 October 18:09 to 19:23", "Add the pictures with a Beta label; craft and check one picture at a time. Mind the sizes of buttons and where labels sit over photos. Where can the video go? Make the steps on the blue bar clickable, not only back and forth. Redraw DT175a."),
  ("Sizes and labels", "Labels sit under a picture, never on it. Nothing smaller than 12 px. Every button 44 px high or more, the size Apple recommends for touch."),
  ("Step buttons", "The 5 px bar in cook mode becomes six numbered buttons. Done steps show a tick, the current one is blue. Tap a number, or say go to step 4, and the step shows and is read aloud. Jumping ahead ticks nothing; only Next ticks."),
  ("Watch the steps", "On top of the recipe, where you read and decide: the step pictures play one after another, about 5 seconds each, with each step's words and timer under the picture. The numbers jump; Pause; Cook it as written goes straight to Make. Made on the phone from the pictures: no video file, nothing to pay. Shown only when every step has a picture."),
  ("Pictures for steps", "One per step, small beside it, labelled under it. Added from the camera or the gallery, for example a picture made in ChatGPT or Gemini with the Step Picture Checks prompts. Who made it is asked; the checks show before Keep it. In cook mode the picture sits on top of the step: Picture drawn by AI, Beta, or Your photo."),
  ("Where they live", "With the recipe, as image files only you can open, like your other photos. Not shared with members in Beta. Deleted with the recipe or the account; in Export my data."),
  ("Not in DT175a", "Drawing pictures inside the app, an automatic check of a picture, a filmed video. They wait for your real session photos."),
])
h = rowEnd(cy,
  B.screen("DT175Aa", 0, y, "Now: words, a thin bar", "r175Aa", "now", "A 5 px bar you can't tap."),
  B.screen("DT175Ab", 1, y, "New: Watch the steps", "r175Ab", "changed", "On top of the recipe; a picture beside each step."),
  B.screen("DT175Ac", 2, y, "New: the steps playing", "r175Ac", "changed", "Words under the picture; numbers jump; big controls."))
y = h
h = rowEnd(y,
  B.screen("DT175Ad", 0, y, "New: add, then check", "r175Ad", "changed", "Camera or gallery; who made it; the checks; 44 px buttons."),
  B.screen("DT175Ae", 1, y, "New: step buttons", "r175Ae", "changed", "Tap a number to jump; label under the picture."),
  B.screen("DT175Af", 2, y, "New: back to step 2", "r175Af", "changed", "Ticks stay; Your photo under the picture."))
y = h
board("Stories123.dc.html", "DT175a. Pictures for each step, Watch the steps, step buttons",
  "30 October 2026 (Coach Milan, pictures with a Beta label, where the video goes, steps you can tap). Version 2. Now: 0.3.16, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories122.dc.html")
