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
cy = storyCard(B, y, "DT174", "Cook mode: two doors into Make, one big step at a time", [
  ("Coach Milan, 30 October 16:05 to 16:31", "DT174, draw. Start cooking and Make it may conflict. The Plate is the editor; the recipe is where we read and decide to make it. Two paths: straight from the recipe when it is exactly how we want to cook it, or through the Plate for a little adjustment first. Both land on the Make step."),
  ("Two doors on the recipe", "Cook it as written: straight to Make, with the recipe's amounts, nothing to edit. Change it first: today's Make it, the Plate to edit, then Lock the recipe and Make. Edit recipe stays as it is."),
  ("Start cooking, on Make", "Make already lists the steps to tick. Start cooking sits above them and opens cook mode, full screen: one big step at a time, read aloud by the phone's own voice, big Back, Repeat and Next. Each finished step is ticked on Make; close any time and the ticks stay. The screen stays on."),
  ("What you can say", "Next, back, repeat. How much rice: the amount you cook, read aloud. Timer 6 minutes: a timer named after its step; several run at once, and the phone rings and says which one ended. What's left. Stop."),
  ("The end", "Done goes back to Make with every step ticked. A photo, how it went, how much you ate, Rate it: as today."),
  ("Free to run", "The browser's own speech recognition turns the voice into words, and the phone's own voice reads. Nothing goes to Gemini in DT174, so it costs us nothing. Questions to Chef Mealan while cooking come in DT175."),
  ("Privacy", "Voice is asked for once, with where it goes: Google in Chrome, Apple in Safari. No recordings kept. The privacy notice gets one line. Buttons only works the same, and is kept as your answer."),
  ("Limits we test", "Browsers stop listening after a silence, so the app starts listening again. Firefox has no speech recognition: buttons only there. iPhones listen less reliably than Android. Commands are in English, as the app is. A walkthrough with a stand-in voice checks every command; then Testers 1, 2 and 3 cook one recipe each on their own phones."),
])
h = rowEnd(cy,
  B.screen("DT174a", 0, y, "Now: one way, Make it", "r174a", "now", "Always through the Plate's editing first."),
  B.screen("DT174b", 1, y, "New: two doors", "r174b", "changed", "Cook it as written, or Change it first."),
  B.screen("DT174c", 2, y, "Now: Make, tick the steps", "r174c", "now", "The Plate's middle step, small type."))
y = h
h = rowEnd(y,
  B.screen("DT174d", 0, y, "New: Start cooking on Make", "r174d", "changed", "Both doors land here. Ticks follow cook mode."),
  B.screen("DT174e", 1, y, "New: voice, asked once", "r174e", "changed", "Says where the voice goes. Buttons only works the same."),
  B.screen("DT174f", 2, y, "New: a step, read aloud", "r174f", "changed", "A step that names minutes offers its timer."))
y = h
h = rowEnd(y,
  B.screen("DT174g", 0, y, "New: timers and how much", "r174g", "changed", "Two timers side by side. How much rice: no AI."),
  B.screen("DT174h", 1, y, "New: done", "r174h", "changed", "Back to Make, every step ticked."))
y = h
board("Stories121.dc.html", "DT174. Cook mode: two doors into Make",
  "30 October 2026 (Coach Milan, voice while cooking, the same phone first; the recipe to read and decide, the Plate to edit, Make to cook). Version 2. Now: 0.3.15, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories120.dc.html")
