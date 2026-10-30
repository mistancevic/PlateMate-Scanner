# Board DT166 (Stories118): wake-up and bedtime set the first and last meal. Milan 30 October 08:09. Shots from shotDT166.cjs (0.3.7 and the drawn build).
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.7, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.7, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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

W = SX + 6 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT166", "Wake-up and bedtime set your meal times", [
  ("Coach Milan, 30 October", "Asked what is next: wake-up time sets the meal times. DT166. Let's do it. Then, at 08:25: by design almost everything that impacts meal times comes after the meal times are set. At 08:28: one option is to rearrange positions so the sequence is natural towards this outcome. The two rules are ours: ok. Bedtime doesn't stop Chef Mealan suggesting a late meal: no."),
  ("Now, checked in 0.3.7", "Wake-up and Bedtime are asked under Recovery and sent to Chef Mealan, but they move no meal. Without an eating window or fixed work hours, the meals sit at 07:30 to 20:00 for everyone, evenly between. Someone up before 6:00 and in bed before 22:00 gets breakfast at 07:30 and dinner at 20:00."),
  ("The story", "Wake-up sets the first meal: an hour and a half after the start of your wake-up range. Bedtime sets the last: two hours before the start of your bedtime range. The meals between sit evenly, as now. Before 6:00 counts as 5:00, before 22:00 as 21:00. So: before 6:00 gives 06:30, 6:00 to 8:00 gives 07:30, after 8:00 gives 09:30; before 22:00 gives 19:00, 22:00 to midnight gives 20:00, after midnight gives 22:00. The middle answers give today's 07:30 and 20:00, so most people see no change. Varies with shifts: as now."),
  ("Version 2: the order a day runs", "Lifestyle now runs Work and study, then Recovery (wake-up before bedtime), then Meals (meals a day and meal times), then Nutrition (where you eat, what you eat, alcohol). So the answers that set the meal times come first, and the meal times come after them. A time you change there is yours and stays; a line under it says so, with one tap back to the time your answers give. Plan's Slots and times opens Lifestyle at Meals."),
  ("What stays", "A time you set by hand always wins. Fixed work hours still come first, as since 0.2.128, with one change: breakfast is never set before you wake (at most as work starts). An eating window set before still wins. One meal a day stays at 18:00. The Meal times setting says where the times come from; Wake-up and Bedtime say what they set below."),
  ("The numbers", "One and a half hours and two hours are our rule, not a study's: chosen so the middle answers give the times the app has always used. Agreed."),
  ("Open", "Shifts: wake-up and bed by shift, with the shift days."),
])
h = rowEnd(cy,
  B.screen("DT166a", 0, y, "Now: answers, no effect", "r166a", "now", "Up before 6, bed before 22: meals at 07:30 to 20:00."),
  B.screen("DT166b", 1, y, "New: the order a day runs", "r166b", "changed", "Work, sleep, then meals: 06:30, 12:45, 19:00."),
  B.screen("DT166c", 2, y, "New: Plan follows", "r166c", "changed", "The day's meals at the new times."),
  B.screen("DT166d", 3, y, "New: a late riser", "r166d", "changed", "09:30, 15:45, 22:00."),
  B.screen("DT166e", 4, y, "New: your time stays", "r166e", "changed", "Breakfast 07:00 by hand; one tap back to 06:30."),
  B.screen("DT166f", 5, y, "New: with 9 to 5 work", "r166f", "changed", "Work first; breakfast not before you wake."))
y = h
board("Stories118.dc.html", "DT166. Wake-up and bedtime set your meal times",
  "30 October 2026 (Coach Milan, a setting with no effect). Version 2, 08:28: Lifestyle in the order a day runs. Now: 0.3.7, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories117.dc.html")
