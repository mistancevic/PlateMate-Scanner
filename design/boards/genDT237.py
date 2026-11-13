# Board DT237 (Stories178; Coach Milan 4 November 18:49 to 18:50, Draw both): the coach copy of Your summary, in which language. From shotDT237.cjs. Built on genDT236.py.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.87, as it is"), "phone": ("#5b6b8a", "#fff", "Your phone, 00:42"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.87, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
c = storyCard(B, y, "DT237", "Your summary for the coach: the coach's language (v2)", [
  ("Coach Milan, 18:49 to 19:12", "Way 2, the long-term way. You and Tester 2 keep your apps in English, also with clients from Serbia. v2: a button to see a client's card as the client sees it."),
  ("Now", "Nina's phone writes the copy her coach reads, row by row, in English. A row whose words change shows as a change in the coach's list."),
  ("The coach's language", "Nina's phone sends her answers in both languages. The coach's app shows the one the coach picked in Settings. One coach reads every client the same way."),
  ("What stays as written", "Words a client types: In your own words, a note on a meal. Only the app's own rows follow the coach."),
  ("One line for a switch", "The list compares Nina's answers, not the words. Switching the language is one line: Nina switched to Srpski. It does not show every row as changed, and the coach knows which language to write the notes in."),
  ("A line for the client", "Under the languages on Nina's Language page: her coach reads her summary in the coach's own language. Nothing to choose."),
  ("The button (v2)", "On a client's profile card, only when the client's language is not the coach's: See it in Srpski, as Nina does. A tap shows her rows in her language, the rest of the page stays the coach's. Back to English puts it back. Nothing is kept: the next visit opens in the coach's language. 44 px."),
  ("Way 1, left out", "The client's language for the coach's copy. A coach who can't read the client's language could not read it."),
  ("Your call", "The words of the button and the lines. The Serbian words are drafts by Claude."),
])
h1 = B.screen("DT237a", 0, y, "Now: what changed, on Nina's page", "r237a", "now", "Each change to Nina's profile is a line with its date.")
h2 = B.screen("DT237b", 1, y, "Now: Nina's profile, on Goal", "r237b", "now", "The copy her phone sends, in English.")
y = rowEnd(c, h1, h2)
h3 = B.screen("DT237f", 0, y, "New: Nina's Language page", "r237f", "changed", "One line: her coach reads it in the coach's own language.")
h4 = B.screen("DT237g", 1, y, "New: a coach in English, the list", "r237g", "changed", "Nina's profile stays English. One line says she switched.")
h5 = B.screen("DT237i", 2, y, "New (v2): the button on the card", "r237i", "changed", "Only when Nina's language is not the coach's.")
y = rowEnd(h3, h4, h5)
h6 = B.screen("DT237j", 0, y, "New (v2): after the tap", "r237j", "changed", "Nina's rows in Srpski. Back to English puts it back.")
h7 = B.screen("DT237h", 1, y, "New: a coach in Srpski", "r237h", "changed", "The page and Nina's rows in Srpski. No button: same language.")
y = rowEnd(h6, h7)
board("Stories178.dc.html", "DT237. Your summary for the coach: the coach's language (v2)",
  "4 November 2026 (Coach Milan 18:49 and 18:50, Draw both; 19:09 the long-term way, way 2; 19:12 v2 with the button). Drawn for your approval; nothing built. Now: 0.3.87. The Serbian words are drafts by Claude.",
  B, W, y - 100, "Stories177.dc.html")
