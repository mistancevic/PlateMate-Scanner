# Board DT238 (Stories179; Coach Milan 5 November 10:54 to 10:59): Deutsch (Beta) for testers in Munich, and where German breaks the screens. From shotDT238.cjs. Built on genDT237.py.
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
  + '<span style="color:#172742">Left: the story. Right: the screens at phone height. Now: 0.3.91, untouched. German drafts: a scratch copy of 0.3.91 with the German drafts in, never merged. New: the same pages with the fix drawn in, blue outline and yellow note. Toasts and the round chef button are left out.</span></div>')

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
c = storyCard(B, y, "DT238", "Deutsch (Beta) for testers in Munich", [
  ("Coach Milan, 10:54 to 10:59", "German now, with the process we have. A new tester in Munich, Croatian, good German, uses the app as a plain user and tells you what does not make sense. More people in Munich later. Nothing changes for anyone else. The pitch: a multilingual app, and the next language is easy to add."),
  ("In Settings", "Deutsch (Beta) under Language. Anyone can pick it. English and Srpski stay as they are."),
  ("The drafts show", "Claude drafted all 2,818 lines: 2,784 on the screens, 28 of Chef Mealan, 6 safety lines. In Deutsch a line shows without a Confirm, because a tester can't confirm."),
  ("Safety first", "The six safety answers stay in English until a German reader confirms them."),
  ("Your table", "Chef Mealan Deutsch, like the Srpski one, with the button Confirm. Your edits and confirms go in at each release."),
])
h1 = B.screen("DT238a", 0, y, "Now: Settings, Language", "r238a", "now", "Deutsch is coming soon and can't be picked.")
h2 = B.screen("DT238b", 1, y, "New: Deutsch (Beta)", "r238b", "changed", "One more choice. The line says what testers get.")
y = rowEnd(c, h1, h2)
c = storyCard(B, y, "", "Where German breaks", [
  ("How", "Every screen in German at phone width, 390 px and a smaller 360 px, against the same screens in English. Only what breaks in German counts."),
  ("Found", "Four places. Today: the three buttons wrap to 3 and 4 lines. The Plate: An mein Ziel anpassen is cut. On a 360 px phone: the wide button on Plan is cut, and a long title cuts the goal line."),
  ("Capitals", "German nouns start with a capital. The code makes meal names lower case inside sentences: mittagessen, frühstück."),
  ("Fine as it is", "Cards that only grow taller: the Lifestyle choices take 3 or 4 lines, chips take another row. The bar fits: Heute, Plan, Teller, Rezepte, Entdecken."),
  ("The fix", "In the layout, not in shorter German: a row of buttons wraps, a wide button may take two lines, the goal line goes under a long title. It works for every next language. In English nothing moves."),
])
h1 = B.screen("DT238c", 0, y, "German: Today, three buttons", "r238c", "draft", "They wrap to 3 and 4 lines. The meal is lower case.")
h2 = B.screen("DT238d", 1, y, "New: Today, the row wraps", "r238d", "changed", "The main button takes the row, the other two the next. Each on one line.")
y = rowEnd(c, h1, h2)
c = storyCard(B, y, "", "What the build needs", [
  ("Words", "src/i18n/de.json with the drafts, and Deutsch in the language list. Counts have two forms in German: 1 Lebensmittel, 2 Lebensmittel. Lines that are he|she in Srpski need one form."),
  ("Numbers and dates", "2.450 and 5,5, as in Srpski. Dates and day names in German: today the code names the Serbian date style in about 20 places; one helper picks it by language."),
  ("Chef Mealan", "His answers in German: the instruction to the AI names the language. Cook mode hears weiter, zurück, nochmal, stopp and speaks with a German voice."),
  ("Food names", "In German from the food table, where it has them."),
  ("Tests", "The language walkthrough in Deutsch, and the German sweep at 390 and 360 px on every release, so a new line that breaks shows before you see it."),
])
h1 = B.screen("DT238e", 0, y, "German: the Plate, Fit and Prepare", "r238e", "draft", "An mein Ziel anpassen is cut at the edge.")
h2 = B.screen("DT238f", 1, y, "New: one under the other", "r238f", "changed", "When the two don't fit side by side. In English they stay side by side.")
y = rowEnd(c, h1, h2)
c = storyCard(B, y, "", "Stays English for now", [
  ("Pages", "Explorer, the legal pages, the home page, as in Srpski."),
  ("Lines still in the code", "The same as in Srpski: the chat's quick lines, Favourite, the PD chips Low and High, some choices (None, Occasionally, A lot), the lines on a recipe's page. They go when Srpski gets them, and German gets them the same day."),
  ("Your call", "The words of the Deutsch (Beta) line. Gegessenes eintragen for the third button on Today. Whether to show Deutsch (Beta) to everyone or only to people with a link."),
])
h1 = B.screen("DT238g", 0, y, "German, 360 px: Plan", "r238g", "draft", "The wide button's words run past its edge.")
h2 = B.screen("DT238h", 1, y, "New: two lines", "r238h", "changed", "A wide button may take two lines. Never cut.")
y = rowEnd(c, h1, h2)
h3 = B.screen("DT238i", 0, y, "German, 360 px: the head", "r238i", "draft", "Lebensmittel cuts the goal line to three dots.")
h4 = B.screen("DT238j", 1, y, "New: the goal line under it", "r238j", "changed", "Only when the title is long. Short titles stay as they are.")
y = rowEnd(h3, h4)
board("Stories179.dc.html", "DT238. Deutsch (Beta) for testers in Munich, and where German breaks",
  "5 November 2026 (Coach Milan 10:54 and 10:59). Drawn for your approval; nothing built. Now: 0.3.91. The German words are drafts by Claude.",
  B, W, y - 100, "Stories178.dc.html")
