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
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.95, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.95, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT115", "Members' foods: one catalogue of every reviewed scan", [
  ("Milan, Friday 19:00 and Sunday 01:47", "A food one tester scanned is not there for the other. Tuna in olive oil added by one; the coach may suggest tuna in water; tuna in Cyprus is not tuna in Belgrade or Munich."),
  ("New", "Every reviewed scan by a member goes to one shared catalogue: name, brand, barcode, the numbers, the source, where it was seen (the member's market from Where I shop). No photo, no name of who scanned it. One entry per barcode; a food without a barcode by name and brand; a second scan of the same barcode updates the numbers, never makes a twin. Reviewed means the member looked at the label check and kept it; a scan left unreviewed never travels."),
  ("Find a food", "A third group between your foods and the product database: Members' foods, your own market first, the rest marked seen in Belgrade, seen in Cyprus. Add to my foods puts a copy with the values in your library; from then on it is yours. The coach's Find a food searches the same catalogue."),
  ("The barcode", "A barcode scan looks in the members' catalogue before Open Food Facts: faster, and the numbers a member already checked. The source line says members' catalogue, checked by a member on 12 October. The label check stays the same."),
  ("Also seen by members", "Under a food of yours, when the catalogue holds the same food in another state (tuna in water under tuna in olive oil; the same stem, DT83): one line, the name, the brand, the energy, a tap to add it. Never more than one line."),
  ("The swap list", "On the Plate the swap list reaches the catalogue after your own foods: the same food in another state leads, with the difference per portion said plainly (95 kcal less per can, the same protein). Only foods seen in your market or in the open database. Taking the swap copies the food into your library."),
  ("Found on the way", "The swap list on the Plate (rankSwaps, src/swaps.ts) does not go through the rules module: it offered active dry yeast as a swap for tuna. It gets fitsPlate like the other lists (C6, C20, C21), and section 6 gets the row. The process rule from Friday caught it on this board."),
  ("Not in this step", "A food you send to another member (step 3). The coach's suggested swap on a shared recipe (its own board, after this one). Photos never travel."),
  ("Data", "One Firestore collection, members-foods, written by the server at review; read by Find a food, the barcode scan, the swap list. The attribution line for Open Food Facts stays on every value that came from it."),
])
h = rowEnd(cy,
  B.screen("DT115a", 0, y, "Now: Find a food, tuna", "mfNow", "now", "Your foods, then the basic foods, then the product database."),
  B.screen("DT115b", 1, y, "New: Members' foods, your market first", "mfNew", "changed", "The third group, and the line under your own tuna."),
  B.screen("DT115c", 2, y, "Now: the swap list for the tuna", "mfSwapNow", "now", "Your own foods only; the yeast offered as a swap."),
  B.screen("DT115d", 3, y, "New: the catalogue in the swap list", "mfSwapNew", "changed", "Tuna in water leads, 95 kcal less per can, seen in Munich."))
y = h
board("Stories68.dc.html", "DT115. Members' foods: one catalogue of every reviewed scan, in Find a food, the barcode scan and the swap list",
  "25 October 2026 (Milan, Friday 19:00 to 19:03 and Sunday 01:47 to 02:05). Now: 0.2.95, untouched. New: the same screens with the change drawn in. Nothing built.",
  B, W, y - 100, "Gates3.dc.html")
