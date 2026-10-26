# Boards DT129 and DT130 (Milan 26 October 12:00). Shots from shotDT129.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.108, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
cy = storyCard(B, y, "DT130", "A photo of a plate from your photos: inside the meal camera, as for labels", [
  ("Milan, 26 October 12:00", "Also upload a photo of the plate, inside the taking of the photo, the same UX as for labels. When I cannot work on the Plate in the moment I take a photo to work on it later; someone shared their meal with me; I found something online."),
  ("Why", "In 0.2.108 Photo of my meal is a plain file field: on a phone it goes straight to the camera, with no frame, no hint, and no way to pick a photo already taken. The label scan has all three. And a photo from earlier, or of someone else's plate, cannot be logged as now."),
  ("Variant A: one camera, a Meal mode, and Your photos", "Photo of my meal opens the same camera as Scan, with Meal as a fourth mode next to Barcode, Label and Group: the round frame, The whole plate, from above, the shutter, and Your photos at the bottom left, as for labels. A photo from Your photos asks one thing before the read: whose plate, and when. The time comes from the photo; a tap changes it. Mine, I ate it at 12:40: Ate it logs it at 12:40, in the meal that time belongs to. Mine, I am eating it now: as from the camera. Not mine: an idea to cook: the same read and gates, and the buttons change to Fit it to my breakfast, Save as an idea (in Mine, the photo as its picture), Put it in my plan. No Ate it."),
  ("Variant B: read it later", "After the shutter, Read now or Keep for later. Kept photos wait on Today as Plates to read with their time; nothing goes to the AI until you tap one; it is logged at the photo's time. Your photos is there as in A. The share from WhatsApp or the browser straight into Chef Mealan comes later still: it needs Chef Mealan installed as an app on the phone, which it is not yet."),
  ("My pick", "A, with B's Keep for later as a second step if you find you take photos and forget them. A covers all three of your cases with one question; B adds a pile to look after."),
  ("Rules", "The same as DT127: C6 with its photo note, C10, C30, C31, N27 to N29, Your day. A plate that is not yours is never logged, and its photo is never shared with members."),
])
h = rowEnd(cy,
  B.screen("DT130a", 0, y, "Now: a plain file field", "r130now", "now", "0.2.108: the button goes to the phone's camera; nothing picks a photo already taken."),
  B.screen("DT130b", 1, y, "A: the meal camera", "r130cam", "changed", "Meal as a fourth mode, the round frame, the hint, Your photos bottom left."),
  B.screen("DT130c", 2, y, "A: whose plate, and when", "r130whose", "changed", "A photo from 12:40: Mine, ate it then; Mine, now; Not mine, an idea."))
y = h
h = rowEnd(
  B.screen("DT130d", 0, y, "A: not mine, an idea", "r130idea", "changed", "The same read and gates; the buttons are for cooking it, not logging it."),
  B.screen("DT130e", 1, y, "B: Plates to read on Today", "r130later", "changed", "Kept photos wait with their time; a tap reads one."))
y = h
board("Stories78.dc.html", "DT130. A photo of a plate from your photos, in the meal camera: whose plate, and when",
  "26 October 2026 (Milan 12:00). Now: 0.2.108, untouched. Two variants drawn; nothing built.",
  B, W, y - 100, "Stories77.dc.html")
