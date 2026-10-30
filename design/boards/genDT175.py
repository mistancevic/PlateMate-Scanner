# Board DT175 (Stories122): ask Chef while cooking; say what you have on the Plate. Milan 30 October 17:36. Panels from shotDT175.cjs.
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
cy = storyCard(B, y, "DT175", "Ask Chef while cooking; say what you have", [
  ("Coach Milan, 30 October 15:39 and 17:36", "Voice support to make recipes according to the ingredients and the process of preparation. In the meantime, draw the next DT."),
  ("Ask Chef, in cook mode", "Start with Chef, and the question goes to Chef Mealan: Chef, I only have 120 g chicken, what do I change? With it go the recipe, this step, the amounts you cook, your kitchen and tools, your allergies and ticked situations, as with every question to Chef Mealan; never your name or email. The answer shows under the step and is read aloud."),
  ("Without Chef, nothing leaves", "The seven commands stay on the phone, as in 0.3.16. Talk in the kitchen without Chef first is not sent anywhere. With voice off, the same question can be typed under the step."),
  ("It never changes the plate", "An answer is advice. The amounts, the numbers and the steps stay as they are; Change it first is still where the plate changes."),
  ("Say what you have, on the Plate", "A new button under Add a food. Say the foods in any order, with amounts if you know them. Foods you have are taken from your foods; the rest come with typical values, marked typical until you scan the pack. Then Fit to my target: Chef Mealan builds the dinner around them and writes the steps, as today."),
  ("What it costs", "One question or one list of foods is one call to Gemini 3.8 Flash. With about 3,000 tokens in and 200 out, that is $0.0023 + $0.0008, about 0.3 cents. From 1 January 2027 the price doubles: about 0.6 cents. Calculated from Google's paid prices."),
  ("When Chef can't answer", "No connection, or the AI is off: Chef can't answer right now; the steps, the commands and the timers still work."),
  ("Limits we test", "Chef Mealan's answers here are stand-ins written for the board. A walkthrough with stand-in answers checks the path; Testers 1, 2 and 3 ask real questions while cooking."),
])
h = rowEnd(cy,
  B.screen("DT175a", 0, y, "Now: a question, no answer", "r175a", "now", "Seven commands; a question gets: not something I can do yet."),
  B.screen("DT175b", 1, y, "New: Chef, ...", "r175b", "changed", "Asked aloud, answered aloud, about this step."),
  B.screen("DT175c", 2, y, "New: ask by typing", "r175c", "changed", "Voice off, or a quiet place."))
y = h
h = rowEnd(y,
  B.screen("DT175d", 0, y, "Now: an empty Plate", "r175d", "now", "Foods one at a time."),
  B.screen("DT175e", 1, y, "New: Say what you have", "r175e", "changed", "Listens, shows the words as you say them."),
  B.screen("DT175f", 2, y, "New: the foods on the plate", "r175f", "changed", "Yours, or typical values, marked. Then Fit to my target."))
y = h
board("Stories122.dc.html", "DT175. Ask Chef while cooking; say what you have",
  "30 October 2026 (Coach Milan, voice to make recipes from the ingredients and through the preparation). Now: 0.3.16, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories121.dc.html")
