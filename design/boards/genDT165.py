# Board DT165 (Stories117), Explorer: the five minerals, each its own page; six new foods in the shared table. Milan 29 October. Shots from shotDT165.cjs (the drawn build), data m165.cjs and rows165_E.json.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.6, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.6, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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

W = SX + 7 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT165", "Explorer: the five minerals, each its own page", [
  ("Coach Milan, 29 October", "Should we finish with the rest of micros? Then, after Foods: DT165. Go."),
  ("Now, checked in 0.3.6", "Calcium, iron, magnesium, potassium and zinc are listed under Micros with \"next\": no page. Their numbers are on the food table and show in Foods, the three a food brings most of."),
  ("The story", "Each mineral opens on its own page, the same sections as the vitamins: what it is, what it does (the EU claims, word for word), how much a day for you, as a range, where to find it, what to combine it with, too much. Where to find it: the ten foods on our table with the most in one normal portion, taken from the shared table, so the numbers are the ones in Foods. Six foods are added to the table, read in full, so they are in Foods too: chickpeas, sardines, pumpkin seeds, tofu set with calcium, kale and beef liver. 30 foods."),
  ("What each page says", "Calcium: 950 mg from 25, 1000 mg at 18 to 24, from the year of birth in your profile. Iron: 11 mg for a man, 16 mg for a woman before menopause and 11 mg after; the app doesn't ask, so the page says both. No upper limit: EFSA set a safe level of intake, 40 mg a day. Magnesium: EFSA's upper limit, 250 mg, is for supplements, water and added magnesium only, and sits below your day, so the range says no upper limit for food, and why. Potassium: 3500 mg; no upper limit, not enough data. Zinc: EFSA's value rises with phytate, 9.4 to 16.3 mg for a man; your day is the lowest, and the page says so."),
  ("The numbers, checked", "EU claims, Regulation (EU) No 432/2012: calcium 8, iron 7, magnesium 10, potassium 3, zinc 18, word for word. Label references, Regulation (EU) No 1169/2011: 800, 14, 375, 2000 and 10 mg. EFSA: calcium 2015, iron 2015, magnesium 2015, potassium 2016, zinc 2014; upper limits from EFSA's overview, version 11. The six new USDA SR Legacy rows read on getfoodfacts.com today: chickpeas 173757, sardines 175139, pumpkin seeds 170556, tofu 172475, kale 168421, beef liver 168627. Per 100 g, for example: tofu 683 mg calcium, sardines 382 mg, pumpkin seeds 592 mg magnesium, beef liver 6.17 mg iron."),
  ("Open", "Search in Foods, now 30. A question in the profile on menopause, so iron can be yours. Biotin still has no food table. Wake-up and breakfast timing."),
])
h = rowEnd(cy,
  B.screen("DT165a", 0, y, "New: the minerals open", "r165a", "changed", "Every member now has its own page."),
  B.screen("DT165b", 1, y, "New: Calcium", "r165b", "changed", "950 mg from 25; tofu and sardines lead."),
  B.screen("DT165c", 2, y, "New: Iron", "r165c", "changed", "Men 11, women 16 before menopause. A safe level, 40 mg."),
  B.screen("DT165d", 3, y, "New: Magnesium", "r165d", "changed", "The upper limit is for supplements only, and says so."),
  B.screen("DT165e", 4, y, "New: Zinc", "r165e", "changed", "Your day rises with phytate: the lowest, said."),
  B.screen("DT165f", 5, y, "New: Foods, 30", "r165f", "changed", "Six new foods, full rows."),
  B.screen("DT165g", 6, y, "New: Pumpkin seeds", "r165g", "changed", "One row, every lens."))
y = h
board("Stories117.dc.html", "DT165. Explorer: the minerals",
  "29 October 2026 (Coach Milan, the rest of the micros). Now: 0.3.6, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories116.dc.html")
