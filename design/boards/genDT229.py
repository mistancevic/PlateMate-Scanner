# Boards DT228 v2 and DT229 (Stories168 v2; Coach Milan 2 November 19:50 to 21:31), from shotDT228.cjs and shotDT229.cjs. Built on genDT228.py.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.62, as it is"), "phone": ("#5b6b8a", "#fff", "Your phone, 00:42"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
    # a computer screen across the three columns
    def wide(s, nid, y, title, name, status, what):
        bg, fg, label = CHIP[status]; WW = 3 * SW + 2 * GAP
        im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((WW * 2, int(im.size[1] * WW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=74)
        h = int(im.size[1] / 2)
        s.html.append(f'<div style="position:absolute;left:{s.x(0)}px;top:{y}px;width:{WW}px">'
          f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
          f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span> <span style="font-size:12.5px;color:#172742;margin-left:8px">{what}</span></div>'
          f'<div style="margin-top:8px"><img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{WW}px;border-radius:10px;border:1.5px solid {"#2e7be8" if status == "changed" else "#d1dcf0"};display:block"></div></div>')
        return y + TT + 8 + CH + 8 + h
    def render(s, W, H): return f'<div style="position:relative;width:{W}px;height:{H}px">{"".join(s.html)}</div>'

def storyCard(B, y, rid, title, parts, w=350):
    body = "".join(f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>' for h, t in parts)
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
                  f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{rid}</span>{title}</div>{body}</div>')
    return y + 70 + sum(30 + math.ceil(len(re.sub("<[^>]+>|&amp;", "x", t)) / 40) * 21 for _, t in parts)
def rowEnd(*hs): return max(hs) + 140

LEGEND = ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "changed"))
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.62, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
    cj = json.load(open(f"{D}/canvas.json"))









W = SX + 4 * (SW + GAP) - GAP + 70
B = Board(); y = 30
c = storyCard(B, y, "DT228", "Help the photo read (v2)", [
  ("Coach Milan, 19:50, 21:00, 21:31", "The same photo read as fish, then pork schnitzel. Add details so cooked meals, or meals with hidden foods, read better. Draw 1 and 2. And more photos of a meal, like a pack's front and back, for richer reads."),
  ("Now", "A wrong read has one way out: Read the photo again, from the same photo. In Meal, the shutter reads at once: one photo per read."),
  ("New 1: more photos, in the camera", "In Meal the shutter stages the photo, as for a pack's sides: 2 photos of this meal, each with its ✕. The line says: The whole plate, from above. Then the inside, another side, or the menu. Read 2 photos reads them together. One photo is one tap more than today."),
  ("New 2: more photos and your words, on the Plate", "Under the photo: Help Chef Mealan read it. The photos as thumbnails with ＋ Photo, and a line: Tell Chef Mealan what it is, typed or said. Read it again with 2 photos and this sends them all; the new read replaces the foods and your corrections, as today. A photo from Your photos has the line before the read too."),
  ("New 3: he asks what a food is", "When the read is unsure what a food is, he asks once, as for a weight: under the breading, is it pork, veal, chicken or fish? One tap changes the food; its grams stay. Skip keeps the read."),
  ("Cost", "Each extra photo is one more image in the same read, a fraction of a cent. Words and the question cost nothing extra."),
])
h1 = B.screen("DT228a", 0, y, "Now: a wrong read", "r228a", "now", "Read the photo again guesses again from the same photo.")
h2 = B.screen("DT228e", 1, y, "Now: Meal reads at once", "r228e", "now", "One photo per read.")
h3 = B.screen("DT228f", 2, y, "New: photos staged", "r228f", "changed", "2 photos of this meal; Read 2 photos.")
h4 = B.screen("DT228g", 3, y, "New: on the Plate", "r228g", "changed", "＋ Photo and your words; Read it again with all.")
y = rowEnd(c, h1, h2, h3, h4)
h1 = B.screen("DT228c", 0, y, "New: before the read", "r228c", "changed", "A photo from Your photos: the line under the chips.")
h2 = B.screen("DT228d", 1, y, "New: he asks what it is", "r228d", "changed", "Pork, veal, chicken or fish? One tap; the grams stay.")
y = rowEnd(h1, h2)
c = storyCard(B, y, "DT229", "The steady ring, easy to see", [
  ("Coach Milan, 21:31", "The coloured ring that fills the circle is blue and barely visible. It should be more prominent."),
  ("Now", "While the camera holds steady for Label, Group or a barcode's pack photos, a ring fills: blue, 5 px, on the shutter's white rim."),
  ("New", "Outside the shutter, 8 px, bright green, on a dark track, so the part still to fill shows too. It fills the same way and the photo is taken when it closes."),
])
h1 = B.screen("DT229a", 0, y, "Now: the ring at 60%", "r229a", "now", "Blue on the white rim.")
h2 = B.screen("DT229b", 1, y, "New: the ring at 60%", "r229b", "changed", "Green, outside the shutter, on a dark track.")
y = rowEnd(c, h1, h2)
board("Stories168.dc.html", "DT228 v2 and DT229. Help the photo read, and the steady ring",
  "2 November 2026 (Coach Milan 19:50 to 21:31). Version 2: more than one photo of a meal; DT229 the ring. Drawn for your approval; nothing built. Now: 0.3.62.",
  B, W, y - 100, "Stories167.dc.html")
