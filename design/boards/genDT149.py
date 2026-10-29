# Board DT135 (Stories92), portions grow with the meal. Milan 27 October 13:52 and 14:12. Shots from shotDT135.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.113, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.108, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT149", "The past records, the future plans, the moment is what you eat", [
  ("Tester 3, UX4 (Coach Milan, 29 October 00:10)", "Planning a meal for later, on paper as it were, still went through the steps that prepare it, and a rating. Planning should be planning."),
  ("Coach Milan, 00:14", "The past is recording what I ate. The future is planning what I will eat. In the moment is what I eat."),
  ("Coach Milan, 00:56 to 00:58", "Record it is not the best wording: Add what you ate. Which day? sits behind the pencil. The Plate takes the date and the day from Plan, not only the meal."),
  ("Now, checked in 0.2.129", "A recipe planned for Friday, opened from Plan, has Make it as its main button: the Plate to cook now, the steps, then How was it? with a rating. A new meal for Friday from Plan has Put it in Friday's dinner, but the bar says Craft, Make, Feedback and Fit again leads. A day before today shows what was logged and nothing else: Nothing was logged on this day, with no way to record what you ate. The Plate on its own only knows today's meals."),
  ("The story", "The day decides. Today, around the meal's time, is the moment: Craft, Make, Feedback, as now. A day after today, or a meal later today opened from Plan, is planning: the bar says Planning Friday's dinner, no Make and no Feedback, the one main button is Put it in Friday's dinner, before Fit and after it; a recipe's steps are there to read; nothing asks for a rating. On the day, the meal comes up on Today, where Make it and I ate it live, and a rating if you want one. A day before today is what you ate: on Plan each meal of that day can be added; a planned one is one tap, I ate it, at its time; I ate something else or Add what you ate opens the Plate, Adding Wednesday's dinner, with no Fit (the amounts are what you ate) and one button, Put it in Wednesday's dinner, eaten. A recipe opened from a later day says Change it on the Plate. The Plate on its own asks Which day?, behind the pencil on its line: yesterday adds what you ate, tomorrow plans. The line always says the day and the mode: Friday's dinner, 20:00 · Planning; Wednesday's dinner, 20:00 · Eaten. The Plate takes the date, the meal, its time and that day's numbers from Plan; the share of the day after Fit is counted against that day too (it used today's)."),
])
h = rowEnd(cy,
  B.screen("DT149a", 0, y, "Now: Friday's recipe says Make it", "r149a", "now", "Make it: cook now, the steps, a rating."),
  B.screen("DT149a2", 1, y, "Now: a new meal for Friday", "r149a2", "now", "Craft, Make, Feedback; Fit again leads."))
y = h
h = rowEnd(y + 10,
  B.screen("DT149b", 0, y, "Now: yesterday, nothing to record", "r149b", "now", "Nothing was logged on this day."),
  B.screen("DT149c", 1, y, "New: planning Friday's dinner", "r149c", "changed", "Put it in Friday's dinner; no Make, no rating."))
y = h
h = rowEnd(y + 10,
  B.screen("DT149d", 0, y, "New: recording yesterday", "r149d", "changed", "I ate it, at its time; Add what you ate for the rest."),
  B.screen("DT149e", 1, y, "New: adding what you ate", "r149e", "changed", "No Fit; Put it in Wednesday's dinner, eaten."))
y = h
h = rowEnd(y + 10,
  B.screen("DT149f", 0, y, "New: Which day? on the Plate", "r149f", "changed", "Yesterday records, tomorrow plans."),
  B.screen("DT149g", 1, y, "New: Change it on the Plate", "r149g", "changed", "A recipe for Friday is a plan; Make it comes on Friday."))
y = h
board("Stories101.dc.html", "DT149. The past records, the future plans, the moment is what you eat",
  "29 October 2026 (Tester 3, UX4), version 2. Now: 0.2.129, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories100.dc.html")
