# Board DT158 (Stories110), Explorer Micros. Milan 29 October 16:16 to 17:42. Shots from shotDT158.cjs, data micro158.cjs.
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
cy = storyCard(B, y, "DT158", "Explorer: not all micros are equal, vitamins and minerals against the day", [
  ("Coach Milan, 29 October 16:16 to 17:42", "Should we add vitamins to the Explorer next? EU claims first, then micros. Sub-family members, as with fibre: similar will be with vitamins. Next DT158, draw."),
  ("Now, checked in 0.3.1", "The Explorer has Protein, Fats and Carbs. No vitamins or minerals anywhere."),
  ("The story", "A fourth family chip, Micros: Not all micros are equal. Micronutrients are the family; its members the vitamins, fat-soluble and water-soluble, and the minerals. One change to the template: against the day, not the meal, because vitamins and minerals count per day; so no meal chips here. Eight foods: salmon, egg, spinach, lentils, milk, almonds, red pepper, lean beef. Each card: ONE PORTION; FOR YOUR DAY (the members this portion brings at least a third of the day of, as rows); THE FAMILY MEMBERS in three groups, fat-soluble vitamins A, D, E, K; water-soluble C, B12, folate; minerals calcium, iron, magnesium, potassium, zinc; each row the amount and its share of the EU reference intake on labels, the line at the whole day, green when the portion covers it; one line on what fat-soluble and water-soluble mean; for vitamin D, that the label's reference is 5 µg and EFSA sets 15 µg for adults; WHAT A LABEL COULD SAY (source of with 15 % of the reference per 100 g, high in with twice that); HOW TO USE IT; Source."),
  ("What the numbers show", "Spinach, a big handful: vitamin K for almost four days, more than half the day's folate. Salmon: four times the label's vitamin D, a third more than EFSA's 15 µg, and more than a day of B12. Lentils: almost two days of folate and half the day's iron; a red pepper brings two days of vitamin C, which helps take up that iron. Almonds: two thirds of the day's vitamin E. Beef: more than a day of B12 and most of the day's zinc."),
  ("The numbers, checked", "Per 100 g: USDA rows read on getfoodfacts.com with their FDC ids, SR Legacy; milk is the Foundation row (1 %, vitamins A and D added: the SR row wasn't found); salmon is the cooked SR row (the raw page wouldn't open). Reference intakes: Regulation (EU) No 1169/2011, Annex XIII, Part A: vitamin A 800 µg, D 5 µg, E 12 mg, K 75 µg, C 80 mg, B12 2.5 µg, folic acid 200 µg, calcium 800 mg, iron 14 mg, magnesium 375 mg, potassium 2000 mg, zinc 10 mg; a significant amount is 15 % per 100 g; read in the Irish food authority's copy and the legislation.gov.uk copy (EUR-Lex cut off before the Annex; to read there before the build). Source of and high in: Regulation (EC) No 1924/2006, as the European Commission lists it. Vitamin D 15 µg for adults: EFSA, adequate intake."),
  ("Open", "EFSA's own values per person (sex, iron for women) instead of the label's one number for every adult: a later step. What each member does, from the EU's authorised health claims: to read before it goes on the page."),
])
h = rowEnd(cy,
  B.screen("DT158a", 0, y, "New: Micros, spinach", "r158a", "changed", "Against the day; the members in three groups."),
  B.screen("DT158b", 1, y, "New: salmon", "r158b", "changed", "Vitamin D, the label's 5 µg and EFSA's 15 µg."),
  B.screen("DT158c", 2, y, "New: lentils and red pepper", "r158c", "changed", "Folate and iron; vitamin C for the iron."))
y = h
board("Stories110.dc.html", "DT158. Explorer: not all micros are equal",
  "29 October 2026 (Coach Milan, Micros). Now: 0.3.1, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories109.dc.html")
