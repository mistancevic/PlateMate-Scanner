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
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.35, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.30, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
cy = storyCard(B, y, "DT195", "A reaction on every claim in Explorer", [
  ("Coach Milan, 31 October 20:37 to 21:04", "One small icon at the end of each line, nothing else. It opens a small sheet: Agree, I think different, The source. After Agree the icon goes and the line gets a thin blue edge; after I think different, an amber edge; never red."),
  ("I think different", "One line, the person's own words, no chips. It goes into the private part of the record, to Chef Mealan as context (like the eating habits since DT161), and to the coach if there is one. Chef Mealan meets it with the paper and the plan; the plan does not move."),
  ("The source", "The paper under the line: who, where, what it found, when it was read again. A paper is one study; the page says what it found, not more."),
  ("The coach", "Two more rows in the sheet: Note for my clients (under the line, for that coach's clients only; the claim is never hidden or rewritten) and Check this source (one line to Milan)."),
  ("Milan", "Metrics: Agree and I think different per line, no names, most doubted first. Admin: the sources coaches asked to check, Keep and answer or Change the line; a changed line says so on the page."),
  ("The visitor", "Sees the icon. The tap asks to sign in, so the reaction is kept and the app goes on from there."),
  ("Not in this board", "The icon on the Nutrients tables. Replies between clients. A count shown to the person."),
])
h = rowEnd(cy,
  B.screen("DT195a", 0, y, "Now: a claim with its paper, nothing to say to it", "r195a", "now", "No agree, no doubt, no way to the paper."),
  B.screen("DT195b", 1, y, "New: one icon; blue after Agree, amber after I think different", "r195b", "changed", "Nothing else on the line."),
  B.screen("DT195c", 2, y, "New: the sheet", "r195c", "changed", "Agree, I think different, The source."))
y = h
h = rowEnd(
  B.screen("DT195d", 0, y, "New: I think different, one line", "r195d", "changed", "To Chef Mealan and the coach."),
  B.screen("DT195e", 1, y, "New: The source", "r195e", "changed", "The paper under the line."),
  B.screen("DT195f", 2, y, "New: the coach's note; the coach's sheet", "r195f", "changed", "Note for my clients; Check this source."))
y = h
h = rowEnd(
  B.screen("DT195g", 0, y, "New: Chef Mealan has the line", "r195g", "changed", "The plan does not move."),
  B.screen("DT195h", 1, y, "New: Metrics and Admin for Milan", "r195h", "changed", "Counts per line; sources to check."))
y = h
board("Stories144.dc.html", "DT195. A reaction on every claim in Explorer",
  "31 October 2026 (Coach Milan 20:37 to 21:04: one icon, not buttons; blue and amber edges). Now: 0.3.35, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories143.dc.html")
