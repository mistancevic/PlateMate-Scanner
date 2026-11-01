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
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.37, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.37, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
cy = storyCard(B, y, "DT143 to DT146", "Anna's four, on today's app", [
  ("Coach Milan, 1 November 09:47", "Draw Anna. Her two blind runs were on 22 October. The app changed a lot since, so each of her four points was checked again on 0.3.37, walking her setup: female, 1998, 168 cm, 60 kg, three moderate evenings of 45 to 60 min, Build muscle, each day its own, Munich."),
  ("Fixed since, nothing to build", "PD is explained in setup the first time it shows. The header no longer opens an edit form. Setup says a coach can adjust these numbers later; on an account, Me shows your coach by name (DT145 is done; only the local test build still shows Coach Milan). The toast that said numbers changed when they did not. Section numbers. Lifestyle has one name. A training day edit keeps its time. The first shopping list no longer talks about a last list."),
])
cy = storyCard(B, cy + 20, "DT143", "Today on day one", [
  ("Still true", "Three cards each say nothing: Next, What's in the plan, Today's meals. Earlier shows the two days before she joined."),
  ("New", "While today is empty, one card with three ways: Pick a meal for lunch, Plan the day, Log what you ate. The usual cards come back as soon as something is in them. Earlier starts on her first day."),
])
cy = storyCard(B, cy + 20, "DT144", "Every number says its day", [
  ("Still true", "Setup shows PD 5.9 for the week; Today then says 5.6 and she has not seen 5.6 before. Plan shows 1,850 to 2,250 kcal where Today shows 2,050. Me's Goal row says 1,950 kcal a day, as if every day were the same."),
  ("New", "Setup's table shows each day's PD: 5.6 on training days, 6.2 on the others. Plan says 2,050 kcal today, like Today, and the range in words under it. Me's Goal row says 1,950 kcal on an average day, 115 g protein every day."),
])
cy = storyCard(B, cy + 20, "DT146", "The small ones", [
  ("Still true", "She picked 45 to 60 min; Plan says 55 min. A toast sits over Fill the open slots, the button she taps next."),
  ("New", "Plan says 45 to 60 min. Toasts show at the top, under the title bar, where the next tap rarely is."),
  ("Not in this board", "Anna's second run also found the slot PD, the fit overshooting protein and portions without grams. Those belong to the Plan board and are not checked here."),
])
h = rowEnd(cy,
  B.screen("DT143a", 0, y, "Now: Today on her first day", "r143a", "now", "Three empty cards. Earlier shows two days before she joined."),
  B.screen("DT143b", 1, y, "New: one card for an empty day", "r143b", "changed", "Three ways. No Earlier on day one."),
  B.screen("DT144a", 2, y, "Now: setup, each day its own", "r144a", "now", "kcal per day, PD only as the week's average, 5.9."))
y = h
h = rowEnd(
  B.screen("DT144b", 0, y, "New: each day's PD in the table", "r144b", "changed", "5.6 on training days, 6.2 on the others: the number Today shows."),
  B.screen("DT144c", 1, y, "Now: Plan, today", "r144c", "now", "1,850 to 2,250 kcal; 55 min."),
  B.screen("DT144d", 2, y, "New: Plan says today's target", "r144d", "changed", "2,050 kcal today, the range in words; 45 to 60 min."))
y = h
h = rowEnd(
  B.screen("DT144e", 0, y, "Now: Me", "r144e", "now", "The Goal row says a day, not which day."),
  B.screen("DT144f", 1, y, "New: Me's Goal row", "r144f", "changed", "On an average day; protein every day."),
  B.screen("DT146a", 2, y, "Now: a toast over the button", "r146a", "now", "Over Fill the open slots."))
y = h
h = rowEnd(
  B.screen("DT146b", 0, y, "New: toasts at the top", "r146b", "changed", "Under the title bar."))
y = h
board("Stories146.dc.html", "DT143 to DT146. Anna's four, on today's app",
  "1 November 2026 (Coach Milan 09:47: Draw Anna). Checked again on 0.3.37: what is fixed since, and what is still true. Now: 0.3.37, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories145.dc.html")
