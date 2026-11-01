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
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.38, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.38, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
cy = storyCard(B, y, "HP3", "The home page, for individuals and coaches", [
  ("Coach Milan, 1 November 10:48 to 11:23", "The page targets coaches and individuals. Beta testers get free access, spots are limited, and testing asks for commitment. Real users will pay; they form a waiting list, separate from the beta."),
  ("The top", "The promise and the crave calculator stay. The top bar gets For coaches. The box under the calculator: Join the beta, free; the spots left, from the number you set under Coach; the commitment: use it most days for four weeks, and tell us what breaks; a link to the waiting list."),
  ("For the individual", "The day in order. Start from anything: two clips, not four. One plate. Plan and shop. New: Cook it, hands free. New: Your day as it really goes (situations, calendar, Travel mode). New: Explorer, know why, not only what."),
  ("For the coach", "A section of its own, at For coaches: one account, two views; suggest, the client accepts; answer or react on shared meals; Waiting for you; the client decides what you see. Its own button: Get a coach code."),
  ("Trust", "Two lines more: papers read again before each release; an account nobody opens for 12 months is deleted."),
  ("Two forms", "Join the beta, free: as today, with the spots and the commitment. The waiting list: email, Which fits you?, a tick to be written to when it opens. When the spots reach 0, the waiting list becomes the main button. The book page's round-is-full line points to it."),
  ("The stills", "The new sections show the app as it is in 0.3.38, with made-up names. Clips come after this board is approved, recorded by rules HC1 to HC10."),
  ("Not in this board", "Prices. The launch email and its double opt-in (an EU mail tool, at launch). The rulebook (DT197)."),
])
h = rowEnd(cy,
  B.screen("HP3a", 0, y, "Now: the home page, top half", "hp3a1", "now", "For people with a plan. One button, Try Chef Mealan."),
  B.screen("HP3b", 1, y, "Now: the home page, bottom half", "hp3a2", "now", "The coach has one paragraph. One form."),
  B.screen("HP3c", 2, y, "New: the top, the beta box, Start from anything", "hp3b1", "changed", "For coaches in the top bar; spots, commitment, waiting list link; two clips."))
y = h
h = rowEnd(
  B.screen("HP3d", 0, y, "New: one plate, plan, shop, Cook it", "hp3b2", "changed", "Cook it, hands free, is new."),
  B.screen("HP3e", 1, y, "New: your day as it goes, Explorer, for coaches", "hp3b3", "changed", "Three new sections; the coach's has its own button."),
  B.screen("HP3f", 2, y, "New: Milan, trust, the book, two forms", "hp3b4", "changed", "Beta and waiting list, separate."))
y = h
board("Stories147.dc.html", "HP3. The home page, for individuals and coaches",
  "1 November 2026 (Coach Milan 10:48 to 11:23: coaches and individuals; beta free with commitment, spots limited; the waiting list separate). Read each column top to bottom: the page is cut into parts. Now: 0.3.38, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories146.dc.html")
