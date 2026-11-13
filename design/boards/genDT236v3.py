# Board DT236 v3 (Stories180; Coach Milan 5 November 11:26): the home page in Srpski and Deutsch, DE in the choice, clips stay English. From shotDT236.cjs (v2) and shotDT236v3.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.91, as it is"), "draft": ("#7a5a12", "#fff", "German drafts, as they stand"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
MARK = ""

def ih(name): w, h = Image.open(f"{R}/{name}.png").size; return int(h * SW / w)
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
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "draft", "changed"))
  + '<span style="color:#172742">Left: the story. Right: the screens at phone height. Now: chefmealan.com as it is. German drafts: the German words drawn onto the page as v2 drew it. New: the same page with the change drawn in, blue outline and yellow note.</span></div>')

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
c = storyCard(B, y, "DT236", "The home page in Srpski and Deutsch (v3)", [
  ("Coach Milan, 11:26", "Make the German home page too, and add DE to the choice. The clips stay in English on every page until this phase of languages is done."),
  ("Three addresses", "chefmealan.com stays English for everyone. chefmealan.com/sr in Srpski, chefmealan.com/de in German. A link can open in either, and search engines show each to its language."),
  ("The suggestion, once", "A phone in Serbian, Croatian, Bosnian or Montenegrin gets Na srpskom. A phone in German, from Germany, Austria or Switzerland, gets Auf Deutsch. Both offer Continue in English. The answer is kept and the box does not come back."),
  ("The switch", "It shows the language that is on: EN, SR or DE. A tap opens all three, the one on ticked. On a phone the header gets smaller gaps and the name a little smaller, and the arrow goes, so Anmelden fits."),
  ("One choice", "The page and the app share the choice. Deutsch on the page opens the app in Deutsch (Beta), as on board DT238."),
  ("The clips", "Recorded in English, they stay English on /sr and /de. The words around them change."),
  ("Your tables", "The home page gets its own area in both tables, about 150 lines each, with the page title and the line search engines show. Srpski: you confirm as before. Deutsch: the drafts show, as in the app."),
  ("Stays English", "The legal pages, Explorer and the book page."),
  ("From v2, as it was", "Not by location. Opening the app from an invite shows the same box once, on Welcome."),
  ("Your call", "The words of the German box. DE in the switch says Deutsch, or Deutsch (Beta) as in the app."),
])
h1 = B.screen("DT236a", 0, y, "Now: chefmealan.com", "r236a", "now", "English for everyone, no switch.")
h2 = B.screen("DT236g", 1, y, "New: a phone in German", "r236g", "changed", "The box above the English page, once.")
h3 = B.screen("DT236i", 2, y, "New: the switch, three languages", "r236i", "changed", "EN, SR, DE. The one on is ticked.")
y = rowEnd(c, h1, h2, h3)
h4 = B.screen("DT236h", 0, y, "German: the header as in v2", "r236h", "draft", "Anmelden runs past the edge of the phone.")
h5 = B.screen("DT236j", 1, y, "New: chefmealan.com/de", "r236j", "changed", "The header fitted. The words are drafts by Claude.")
h6 = B.screen("DT236c", 2, y, "New (v2): chefmealan.com/sr", "r236c", "changed", "As drawn in v2. Its header gets the same fit.")
y = rowEnd(h4, h5, h6)
board("Stories180.dc.html", "DT236. The home page in Srpski and Deutsch, and the suggestion (v3)",
  "5 November 2026 (Coach Milan 11:26: the German home page, DE in the choice, clips stay English). Drawn for your approval; nothing built. The Serbian and German words on these screens are drafts by Claude.",
  B, W, y - 100, "Stories179.dc.html")
