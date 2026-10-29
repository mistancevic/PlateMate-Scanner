# Board DT157 (Stories109), fibre in two kinds. Milan 29 October 16:29 to 16:34. Shots from shotDT157.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.131, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.131, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT157", "Explorer Carbs: fibre in two kinds, soluble and insoluble", [
  ("Coach Milan, 29 October 16:29 and 16:34", "What about sub-family members for fibre? We have soluble and insoluble fibre; similar with vitamins. If you don't find an official source we can make a note for fibre. It is important to have, as it makes a difference in food and meal planning."),
  ("Now, checked in 0.3.0", "The Carbs page shows fibre as one number. Nothing says which kind it is."),
  ("The story", "On every Carbs card, under Fibre in THE FAMILY MEMBERS, two rows the way omega-3 sits under polyunsaturated: of it, soluble; of it, insoluble, in grams. The section's goal line says what the two kinds do: soluble fibre forms a gel and slows digestion, so the sugar comes later; insoluble fibre adds bulk and keeps digestion moving; then this portion's share (lentils 8 % soluble, apple about a third, potatoes about half, white rice none found). Dry oats: no split we can use, and the card says so in that row. Their EU health claim goes in WHAT A LABEL COULD SAY as a row of its own: oat beta-glucan contributes to normal blood cholesterol; it needs at least 1 g of beta-glucan from oats per portion, with 3 g a day on the label; our food table has no beta-glucan figure, so it says Not on our table. The card's source line adds where the split comes from."),
  ("The numbers, checked", "The split: Li, Andrews and Pehrsson 2002 (USDA), Individual sugars, soluble and insoluble dietary fiber contents of 70 high consumption foods, Journal of Food Composition and Analysis 15:715, Table 1, AOAC 991.43, read in full; it covers 7 of our 8 foods, not dry oats. Its totals differ from the USDA rows on the cards, so the page takes its share of soluble fibre and applies it to the card's fibre, and says so. White rice: soluble not detected in that table (the paper writes F; read as none found). The beta-glucan claim: Regulation (EU) No 432/2012, Annex, read in the European Commission's register and a copy of the Annex; to check against EUR-Lex before the build. Finland's 2026 analysis has raw oat flakes, but by a newer method that counts more; not mixed in."),
  ("Not in it", "Resistant starch, the other approved fibre claims, a soluble fibre target (there is no official one)."),
])
h = rowEnd(cy,
  B.screen("DT157a", 0, y, "New: lentils and apple", "r157a", "changed", "Lentils almost all insoluble; apple a third soluble."),
  B.screen("DT157b", 1, y, "New: oats and potatoes", "r157b", "changed", "Oats: no split we can use, the beta-glucan claim; potatoes about half soluble."))
y = h
board("Stories109.dc.html", "DT157. Explorer Carbs: fibre in two kinds",
  "29 October 2026 (Coach Milan, soluble and insoluble fibre). Now: 0.3.0, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories108.dc.html")
