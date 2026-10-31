# Board DT180 (Stories129): Explorer, Situations: a bad night's sleep. Milan 31 October 11:46. Panels from shotDT180.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.24, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.24, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
cy = storyCard(B, y, "DT180", "Explorer, Situations: a bad night's sleep", [
  ("Coach Milan, 31 October 11:16 to 11:46", "A page that starts from the situation you are in, not from a nutrient. Theory first, as the macro and micro pages: what it does, what causes it. Then your case, in Milan's five parts."),
  ("Where", "Explorer gets two parts, Nutrients and Situations. The first situation: a bad night's sleep. Others are named on the list as later, each its own board."),
  ("Theory, with sources", "What it does to the day: about 385 kcal more eaten (Al Khatib 2017), sweet and salty look better (Greer 2013), training feels harder (Fullagar 2015). What causes it: coffee after 14:00 (Drake 2013), a drink in the evening (Ebrahim 2013), a late heavy dinner (Crispim 2011), a hard session late (Stutz 2019). The loop. Your numbers do not change."),
  ("Your case: five parts", "1 Before, your usual: bed, wake-up, dinner time, coffee from your plates, your training. 2 The path here: this week's dinners, snacks and coffee from the record. 3 Now: a short night; today's plan. 4 The path on: three taps, breakfast and lunch with more protein and fibre, a planned snack, today's training easy; no coffee after 14:00. 5 The goal: tonight at the usual time; the goal band and check-in stay."),
  ("Trend against trajectory", "The trend from before to now, carried on: dinner 50 minutes later a week, 22:30 by Friday. The trajectory: what the goal needs, bed by 23:00. The gap in plain words, and the one change that closes it. Nothing changes unless you tap."),
  ("Horizons", "Each situation reads one horizon: the day (Today), the week (Plan), the month (Goal, the check-in), the meal (Plate). A bad night is a day. The third short night in a week is a week question: the page says so and points up to Plan, where the same five parts read the week."),
  ("The chat", "The round chef button on this page starts with three chips: Why am I hungrier today, What do I eat tonight, Should I train today. Chef Mealan answers from the page and the day, food, training and timing only."),
  ("The wellness line", "Never a condition, a diagnosis or a treatment. With sleep that stays bad, the page says: see your doctor."),
  ("Not in DT180", "A morning question on Today. A sleep tracker. The other situations. The week and month pages of the frame, beyond the pointer."),
])
h = rowEnd(cy,
  B.screen("DT180a", 0, y, "Now: nutrients only", "r180a", "now", "Five families; no page starts from a situation."),
  B.screen("DT180b", 1, y, "New: Situations", "r180b", "changed", "A second part; the first situation, others later."),
  B.screen("DT180c", 2, y, "New: theory first", "r180c", "changed", "What it does, what causes it, each with its paper."))
y = h
h = rowEnd(y,
  B.screen("DT180d", 0, y, "New: your case, five parts", "r180d", "changed", "Before, the path here, now, the path on, the goal."),
  B.screen("DT180e", 1, y, "New: the chat", "r180e", "changed", "Three chips the page raises."),
  B.screen("DT180f", 2, y, "New: it points up", "r180f", "changed", "The third short night is a week question."))
y = h
board("Stories129.dc.html", "DT180. Explorer, Situations: a bad night's sleep",
  "31 October 2026 (Coach Milan, Explorer brainstorm: situations as the starting point, theory then your case in five parts). Now: 0.3.24, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories128.dc.html")
