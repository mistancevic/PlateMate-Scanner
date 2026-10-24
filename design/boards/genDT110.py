# Boards DT87 to DT91 (Milan 24 October 11:37 to 11:49: "Draw it first"): making a dinner with Chef Mealan, from an empty
# Plate to the saved recipe. Shots from shotDT87.cjs. Self-contained: the same look as genRS.py's boards, without its layers.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.93, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.93, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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

W = SX + 4 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT110", "A plate bigger than its meal never goes to the ideas", [
  ("Your finding, 00:25", "Make it a breakfast around the quark, a wait, then three ideas and none of value: 1,555, 1,419, 1,536 kcal, all over the 619 to 757 kcal of this meal."),
  ("Why", "The plate was already 1,232 kcal, about two breakfasts, before anything was added. No idea can land in the range when the foods that stay are over it. Rule C31 knows this (the readout says not a breakfast yet past 1.4 times the meal), but the gate still offered the ideas and Chef Mealan was asked a question with no answer."),
  ("New", "A plate over its meal never goes to the ideas: no wait, no failures. The gate says it, by code: Your plate is already about two breakfasts, 1,232 kcal of 619 to 757. Three ways. Make it two breakfasts: saved as a recipe that makes 2, one portion now, the other on Plan for tomorrow. Shrink it to one breakfast: every amount scaled down into the range, each food within its portion (C10); a counted food lands on a whole piece. Keep it as it is: the plate as it stands, and Today says what it was. The failed-ideas page keeps its job for a plate that fits the meal and still gets no idea."),
  ("Rules", "C31 applied in the gate, not only the readout; section 6 gets the row."),
])
cy2 = storyCard(B, cy + 20, "DT111", "The wait shows the real steps", [
  ("Your finding", "The thinking took longer, and three dots say nothing about what is going on."),
  ("New", "Under the dots, the steps as they happen, ticked when done: Read your plate (code, at once); Asked Chef Mealan for three breakfasts from your kitchens (the model, 10 to 20 seconds); Checking his ideas against 619 to 757 kcal and PD 6.5 (code); Asking again for an idea that missed (the model, when it happens). The lines are the code's own stages, so they are true, never decoration. The chat's wait gets its two: Asked Chef Mealan; Matching the foods he names to yours."),
])
cy3 = storyCard(B, cy2 + 20, "DT112", "One tap empties a text field", [
  ("Your finding", "To type peanut and then look for something else, the letters go one by one."),
  ("New", "An ✕ at the right of a text field while it has text: the search on the Plate, Find a food, the chat's field. One tap empties it and the list is back. An empty field shows none."),
])
cy4 = storyCard(B, cy3 + 20, "DT113", "The four letters on the recipe page", [
  ("Your finding", "The recipe page shows the PD and the table, no letters."),
  ("New", "F C Fi P under the PD of the recipe's readout, as on the Plate, for what the readout shows (all of it or one portion; the letters are the same, they are rates). A tap opens the line per letter against your day. The tiles in Recipes get them later, small, after the PD."),
])
h = rowEnd(cy4,
  B.screen("DT110a", 0, y, "Now: two breakfasts on the plate", "dt110Now", "now", "1,188 kcal at breakfast; the gate offers Make it a breakfast around the quark."),
  B.screen("DT110b", 1, y, "New: the gate says what it is", "dt110New", "changed", "Already about two breakfasts; Make it two, Shrink it to one, Keep it."),
  B.screen("DT111a", 2, y, "Now: the wait", "dt111Now", "now", "Three dots."),
  B.screen("DT111b", 3, y, "New: the steps under the dots", "dt111New", "changed", "Read, asked, checking, asking again; ticked as they pass."))
y = h
h = rowEnd(y,
  B.screen("DT112a", 0, y, "Now: peanut typed", "dt112Now", "now", "The field, no way to empty it but the keyboard."),
  B.screen("DT112b", 1, y, "New: the ✕", "dt112New", "changed", "One tap empties the field."),
  B.screen("DT113a", 2, y, "Now: the recipe page", "dt113Now", "now", "PD 6.7 and the table, no letters."),
  B.screen("DT113b", 3, y, "New: F C Fi P under the PD", "dt113New", "changed", "The same four letters as on the Plate."))
y = h
board("Stories67.dc.html", "DT110 to DT113. A big plate never goes to the ideas, the wait shows its steps, one tap empties a field, the letters on the recipe page",
  "25 October 2026 (Milan 00:25 to 00:36, testing 0.2.93 on the preview). Now: 0.2.93 with his breakfast plate, untouched. New: the same screens with the change drawn in. Nothing built.",
  B, W, y - 100, "Stories66.dc.html")
