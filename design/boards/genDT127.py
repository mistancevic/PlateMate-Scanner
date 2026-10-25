# Board DT127 (Milan 25 October 14:26: "snapping photo of a meal to check what to do about it. Is that good addon to work
# next?"; 15:14: "Draw DT127"). Shots from shotDT127.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.106, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.106, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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

W = SX + 2 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT127", "A photo of the meal in front of you: read, the three gates, one line what to do", [
  ("Milan, 14:26", "Let's prepare the story and implementation for snapping a photo of a meal to check what to do about it."),
  ("Why", "At a table, as a guest or in a restaurant, the plate is given. Today the photo goes into the I'm out chat and comes back as words and picks; the gates live on the Plate. The person wants one thing in a few seconds: is this plate right for me now, and if not, what do I do with it. No typing."),
  ("What exists", "I'm out already reads a plate, a menu or a shelf (/api/out: recognised foods with values and typical grams, picks, skip). The Plate has the three gates and the sweet spot (0.2.98), the size line (C31), the ingredient line (C6), pieces and servings, Ate it on Today. DT106 turns named foods into rows. This story wires them into one path."),
  ("New: one tap", "Photo of my meal, a card on Today and a button on the Plate. The camera opens, one photo. The read lands on the Plate: each food a row at its estimated grams, marked ~, a tap to correct. A line on top says read from your photo at 13:05 and that the amounts are estimates. A food the read names that is not in your library comes in through the one food list (DT125): a basic food when there is one, else an estimate with its values."),
  ("New: the gates answer at once, then one line", "The gate card reads the plate as any plate: culinary, nutrition, your day. Under it one line from Chef Mealan, by code from the gates, in bands, not decimals: eat it as it is; eat half and take the rest home; add a protein side; this is a snack, not your lunch. Then the buttons, the advice first: Ate it (logs it now, at this moment), Ate half (logs half, keeps the other half on Today as a prepared card), Add a food, Not mine (clears the plate)."),
  ("New: the honest numbers", "A photo gives foods well and amounts badly, 30 percent either way is normal. The numbers show as a range (about 620 to 760 kcal) until you correct one amount; then they tighten. At most one question, only when the read is unsure about the food that moves the numbers most: two chips with the amounts, and Skip. Never a form."),
  ("Rules it goes through", "C6 (the ingredient line), C10 and C31 (portions, the size line), C30 (Chef Mealan's read of the dish), N27 to N29 (the nutrition gate), Your day v1. One row in culinary.md section 6 and one walkthrough per rule touched. The estimate stays marked in the log (source: photo), so the week's numbers know what was measured and what was guessed."),
  ("Found on the way", "On the drawn plate the 8 g of olive oil got the ingredient line, Take the olive oil out. A photo of a dressed salad has its oil in it: a food that came from a photo read is part of the dish, so C6 does not fire on it. The same holds for butter in a sauce or flour on a schnitzel. The rule gets a note: an ingredient read from a photo is not an ingredient on the plate."),
  ("Not in this step", "Barcodes in the photo (the scan does that). A menu photo (stays in I'm out). Several plates in one shot. A photo later in the day (a photo is now, at the table; Today's Log a meal covers later). Saving the plate as a recipe (it is a meal, not a recipe; Keep it as a recipe can come after)."),
])
h = rowEnd(cy,
  B.screen("DT127a", 0, y, "Now: Today", "r127nowToday", "now", "No way in from a photo here; Log a meal and the Plate are the two doors."),
  B.screen("DT127b", 1, y, "New: Photo of my meal on Today", "r127today", "changed", "One card, one tap, the camera. The same button on the Plate next to Scan."))
y = h
h = rowEnd(
  B.screen("DT127c", 0, y, "New: the Plate after the read", "r127plate", "changed", "Foods at estimated grams with ~, the line on top, the gates, Chef Mealan's line, the buttons."),
  B.screen("DT127d", 1, y, "New: one question when unsure", "r127ask", "changed", "One breast or two, two chips and Skip. Never a form."))
y = h
h = rowEnd(
  B.screen("DT127e", 0, y, "New: the restaurant plate, eat half", "r127big", "changed", "The size line and the nutrition gate fire; the line says eat half; Ate half is the first button."),
  B.screen("DT127f", 1, y, "New: the button on the Plate", "r127plateBtn", "changed", "Photo of my meal next to Manual and Scan (Milan 15:51: it was on Today only; a miss in the drawing)."))
y = h
board("Stories75.dc.html", "DT127. A photo of the meal at the table: read as estimates, the three gates, one line what to do",
  "25 October 2026 (Milan 14:26, 15:14 and 15:51). Now: 0.2.106, untouched. New: drawn in. Nothing built. Goes after 0.2.106 ships.",
  B, W, y - 100, "Stories74.dc.html")
