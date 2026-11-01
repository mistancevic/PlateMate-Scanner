# Board DT195 (Stories144): a reaction on every claim in Explorer. Milan 31 October 20:37 to 20:49. Panels from shotDT195.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.45, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.45, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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


W = SX + 3 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "HP5", "The button on the first screen, over your own food", [
  ("Coach Milan, 1 November 15:38 to 15:48", "Put the call to action above the fold, over a top image, as other sites do; a photo in the middle on a phone, full width on a computer. Your own photos (nine sent); make two or three versions."),
  ("1a. One photo", "The curry with rice, full width. The words and the button on a dark fade, in white."),
  ("1b. A strip of four", "Curry, meatballs, quesadilla, the chocolate squares: four across on a computer, two by two on a phone. Your real week, at a glance."),
  ("1c. One photo with a card", "The meatballs pan, full width; the words and the button on a white card over it. No fade."),
  ("1d. 1a, as a carousel (Milan 16:38)", "1a's look, with the photo changing by itself every 5 to 6 seconds, a slow crossfade through five of your dishes: curry, meatballs, quesadilla, waffle, chocolate squares. The words and the button stay still. Small dots show which; a tap on a dot shows that dish; no arrows. A phone set to reduce motion sees the first photo only. Only the first photo loads with the page; the others after."),
  ("The same in all four", "The button, the spots left and the commitment are on the first screen. The paragraph is shorter, to fit over a photo. A small line says it is your own cooking, at home. The calculator follows right under the photo, with its line Try the calculator."),
  ("The photos", "Your photos are portrait phone shots, 1500 px wide. Full width on a computer, one photo (1a, 1c) is zoomed in and a little soft; four side by side (1b) keep their own shape and stay sharp. On a phone all three look sharp."),
  ("Not in this board", "Which other photos to use in the strip; any of the nine can go in."),
])
h = rowEnd(cy,
  B.screen("HP5a", 0, y, "Now: the first screen on a phone", "hp5p-now", "now", "No photo; the button is one screen down."),
  B.screen("HP5b", 1, y, "1a on a phone", "hp5p-1a", "changed", "The curry, words on a fade."),
  B.screen("HP5c", 2, y, "1b on a phone", "hp5p-1b", "changed", "Four dishes, two by two."))
y = h
h = rowEnd(B.screen("HP5d", 0, y, "1c on a phone", "hp5p-1c", "changed", "The meatballs, words on a card."),
  B.screen("HP5h", 1, y, "1d on a phone, photo 1 of 5", "hp5p-1d-1", "changed", "The curry; the dots top right."),
  B.screen("HP5i", 2, y, "1d on a phone, photo 2 of 5", "hp5p-1d-2", "changed", "The meatballs, a few seconds later."))
y = h
h = rowEnd(B.screen("HP5j", 0, y, "1d on a phone, photo 4 of 5", "hp5p-1d-4", "changed", "The waffle."))
y = h
y = B.wide("HP5e", y, "1a on a computer", "hp5d-1a", "changed", "One photo, full width: zoomed in.") + 140
y = B.wide("HP5f", y, "1b on a computer", "hp5d-1b", "changed", "Four across, each sharp.") + 140
y = B.wide("HP5g", y, "1c on a computer", "hp5d-1c", "changed", "One photo with the card.") + 140
y = B.wide("HP5k", y, "1d on a computer, photo 1 of 5", "hp5d-1d-1", "changed", "The curry; the dots bottom right.") + 140
y = B.wide("HP5l", y, "1d on a computer, photo 2 of 5", "hp5d-1d-2", "changed", "The meatballs: zoomed in, like 1a.") + 140
board("Stories149.dc.html", "HP5. The button on the first screen, over your own food",
  "1 November 2026 (Coach Milan 15:38, 15:48 and 16:38). Version 2: 1d added, 1a as a carousel. Pick 1a, 1b, 1c or 1d. Now: 0.3.45, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories148.dc.html")
