# Boards DT205, DT206, DT207 (Stories152 to Stories154): Coach Milan 1 November 19:42 findings, 19:54 Go. Panels from shotDT205.cjs, now 0.3.47 and new 0.3.48.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.47, as it is"), "changed": ("#2e7be8", "#fff", "New, built in 0.3.48")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.47, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
def go(fname, rid, title, sub, parts, rows, after):
    B = Board(); y = 30
    cy = storyCard(B, y, rid, title, parts)
    first = True
    for row in rows:
        hs = [B.screen(nid, col, y, t, n, st, w) for col, (nid, t, n, st, w) in enumerate(row)]
        y = rowEnd(*(hs + ([cy] if first else []))); first = False
    board(fname, f"{rid}. {title}", sub, B, W, y - 100, after)

SUB = "1 November 2026 (Coach Milan 19:42 findings, 19:54 Go before drawing). Built in 0.3.48 and drawn from the builds. Version 2 (20:51): the Now screens are 0.3.47 again; version 1 had taken them from 0.3.48 by mistake."
go("Stories152.dc.html", "DT205", "Profile kept as you go, and Next as the main button", SUB, [
  ("Coach Milan, 19:42", "Save is in the middle of the scroll, so people think that is the end, while the next section follows. Save has nothing to save, since everything is saved when it is selected. Goal as the call to action is not prominent."),
  ("New", "No Save button. A choice is kept when you tap it; a typed number a moment after you stop typing, and when you leave the page. A number that cannot be right yet (a birth year of two digits) waits, and the line under the card says which. The line otherwise says Kept as you go. Nothing to save."),
  ("Every step", "Each step of Me ends on a main button, Next: Goal, Next: Lifestyle, Next: Training week and so on, with its line under it."),
], [[("DT205a", "Now: Profile", "r205a", "now", "Save at the end of the card, the way to Goal a row below."),
     ("DT205b", "New: Profile", "r205b", "changed", "Kept as you go; Next: Goal as the main button.")]], "Stories151.dc.html")
go("Stories153.dc.html", "DT206", "A food for an older plate asks first; a drink goes with the meal", SUB, [
  ("Coach Milan, 19:42", "A plate from the photo of a protein pancake still waited hours later. A scanned Augustiner went onto it with no warning and no question, and a recipe was kept with everything, around the beer."),
  ("Asks first", "A food added to a plate started more than three hours ago, or on another day, asks: Start a new plate, or Add to my plate. From Foods, a scan, a search or by hand, the same question the photo, a recipe and the plan already ask."),
  ("A drink", "A drink counts in the meal. Chef Mealan never builds a meal around it or names the dish after it: a plate of only a drink offers no meal ideas. Saving a recipe asks about the drink: Leave it out (the default) or Keep it in."),
], [[("DT206a", "Now: Skyr at 19:40 onto lunch's plate", "r206a", "now", "It joins without a word."),
     ("DT206b", "New: the question first", "r206b", "changed", "Start a new plate, or Add to my plate.")]], "Stories152.dc.html")
go("Stories154.dc.html", "DT207", "Five small fixes", SUB, [
  ("a. Metrics", "Today, and since the first day is the first card, above the weeks, in every view."),
  ("b. Shopping lists", "The button on Plan says Shopping lists once a list is kept. The earlier lists come first; New shopping list is its own button. After Finish with Carry them, the form for the next list opens straight away."),
  ("c. My clients", "Waiting for you, today's check-ins, To approve, then the clients with the week's dots, then waiting recipes. Codes and sign-ups go below, under one label: invites, access requests, the waiting list, book sign-ups."),
  ("d. Travel mode", "The question is Where do you stay? The three choices wrap inside the phone."),
  ("e. Your summary", "Plan your week and Craft your first meal open Plan and the Plate; Back comes back to Your summary. A tab tapped in the bar still goes back as before."),
], [[("DT207a", "Now: Shopping lists, no list open", "r207a", "now", "The form for list 2 first; the earlier list under it."),
     ("DT207b", "New: Shopping lists", "r207b", "changed", "The earlier list first, then New shopping list.")],
    [("DT207c", "Now: Travel mode", "r207c", "now", "What do you have there? The choices run off the side."),
     ("DT207d", "New: Travel mode", "r207d", "changed", "Where do you stay? The choices wrap.")]], "Stories153.dc.html")
