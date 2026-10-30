# Board DT179 (Stories127): calendar in, busy times and moves in Google. Milan 31 October 00:08. Panels from shotDT179.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.21, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.21, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
cy = storyCard(B, y, "DT179", "From your calendar to the app", [
  ("From the plan of 30 October", "The second calendar part. DT178 sends your plan out to Google Calendar. DT179 reads two things back: when you are busy, and events of Chef Mealan's own calendar you moved there."),
  ("The switch", "Google Calendar page: Read when I'm busy, off at first. On asks Google for one more right, calendar.freebusy: busy and free times only. Never titles, people or places."),
  ("What Plan does with busy times", "A meal in a meeting: before, after, or keep. A late evening: a quick dinner, or cook the day before. A full day: a lunch to carry. Training in a busy block: move it, a rest day, or keep it."),
  ("Suggest, never overwrite", "Your times change only when you tap. A tap moves the meal for that date, as a hand-set time does, with Back to 13:15. The calendar is one more setting after work and study."),
  ("Moved in Google comes back", "Drag Friday's dinner from 20:00 to 21:00 in Google Calendar: Chef Mealan reads its own calendar and Friday's dinner is at 21:00 here, with Back to 20:00."),
  ("Where it runs", "On your phone, when the app opens and on Plan, with the same hour as DT178: after it, one tap on Update Google Calendar reads and writes. Busy times are not stored on our server, not shared with your coach, not sent to the AI."),
  ("What you do", "Add the second right to the sign-in screen settings and to the review. Nothing else."),
  ("Not in DT179", "Reading the titles of your events, such as a gym class. Apple and Outlook calendars."),
])
h = rowEnd(cy,
  B.screen("DT179a", 0, y, "Now: nothing comes back", "r179a", "now", "Lunch sits in a meeting; Plan does not know."),
  B.screen("DT179b", 1, y, "New: Read when I'm busy", "r179b", "changed", "Off at first; busy times only, on the phone."),
  B.screen("DT179c", 2, y, "New: a meal in a meeting", "r179c", "changed", "Before, after, or keep. One tap, this date."))
y = h
h = rowEnd(y,
  B.screen("DT179d", 0, y, "New: a late evening", "r179d", "changed", "A quick dinner, or cook the day before."),
  B.screen("DT179e", 1, y, "New: a full day", "r179e", "changed", "A lunch to carry; training asks once."),
  B.screen("DT179f", 2, y, "New: moved in Google", "r179f", "changed", "Friday's dinner at 21:00 here too, Back to 20:00."))
y = h
board("Stories127.dc.html", "DT179. From your calendar to the app",
  "31 October 2026 (Coach Milan, the calendar part of the calendar and voice plan: from the calendar to the app). Now: 0.3.21, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories126.dc.html")
