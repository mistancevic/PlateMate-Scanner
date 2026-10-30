# Board DT174 (Stories121): cook mode on the same phone. Milan 30 October 16:05. Panels from shotDT174.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.15, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.15, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT174", "Cook mode: one big step at a time, by voice or by tap", [
  ("Coach Milan, 30 October 15:39 and 16:05", "Voice support to make recipes, on the same phone first. Yes, let's start with new DTs. DT174, draw."),
  ("What it does", "Start cooking opens the steps one at a time, in big type, read aloud by the phone's own voice. Back, Repeat and Next are big buttons for wet hands. The bar on top shows where you are. The screen stays on until you close it."),
  ("What you can say", "Next, back, repeat. How much rice: the amount from the recipe, read aloud. Timer 6 minutes: a timer named after its step; several run at once, and the phone rings and says which one ended. What's left: how many steps, and the next one. Stop: leaves cook mode."),
  ("Where", "On every recipe with steps, under Steps, with the amounts on the page: when Cook it makes a bigger batch, the steps say the bigger amounts. On Plate, under the plate's steps, with the plate's amounts. The end goes back where you started."),
  ("Free to run", "The browser's own speech recognition turns the voice into words, and the phone's own voice reads. Nothing goes to Gemini in DT174, so it costs us nothing. Questions to Chef Mealan while cooking come in DT175."),
  ("Privacy", "Voice is asked for once, with where it goes: Google in Chrome, Apple in Safari. No recordings kept. The privacy notice gets one line. Buttons only works the same, and is kept as your answer."),
  ("Limits we test", "Browsers stop listening after a silence, so the app starts listening again. Firefox has no speech recognition: buttons only there. iPhones listen less reliably than Android. Commands are in English, as the app is. A walkthrough with a stand-in voice checks every command; then Testers 1, 2 and 3 cook one recipe each on their own phones."),
])
h = rowEnd(cy,
  B.screen("DT174a", 0, y, "Now: steps as a list", "r174a", "now", "Small type, scroll with wet hands, the screen sleeps."),
  B.screen("DT174b", 1, y, "New: Start cooking", "r174b", "changed", "On every recipe with steps, and on Plate."),
  B.screen("DT174c", 2, y, "New: voice, asked once", "r174c", "changed", "Says where the voice goes. Buttons only works the same."))
y = h
h = rowEnd(y + 200,
  B.screen("DT174d", 0, y, "New: a step, read aloud", "r174d", "changed", "A step that names minutes offers its timer."),
  B.screen("DT174e", 1, y, "New: timers and how much", "r174e", "changed", "Two timers side by side. How much rice, from the recipe: no AI."),
  B.screen("DT174f", 2, y, "New: done", "r174f", "changed", "Voice stops, the screen may sleep. Back where you started."))
y = h
board("Stories121.dc.html", "DT174. Cook mode on the same phone",
  "30 October 2026 (Coach Milan, voice support while cooking, the same phone first). Now: 0.3.15, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories120.dc.html")
