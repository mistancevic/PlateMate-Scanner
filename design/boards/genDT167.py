# Board DT167 (Stories119): Your summary at the end of Me, the settings map, sharing with the coach part by part. Milan 30 October 08:47 to 09:03. Shots from shotDT167.cjs (0.3.8 with the new screens drawn in).
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.8, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.8, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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

W = SX + 8 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT167", "Your summary: every answer in one place, what it does, shared with your coach part by part", [
  ("Coach Milan, 30 October 08:47 to 09:03", "Should we craft a summary at the end of setting up My profile in Me steps, and suggest a CTA such as go to Plate and craft the first meal, or go to Plan and plan your week? Also, how to be sure all the settings are considered by the code and Chef Mealan? DT167. Draw. Consider it also as material to share with the coach: the coach has the profile in one place as a readable document. If some part must not be shared, for personal preference or GDPR, let me know."),
  ("Now, checked in 0.3.8", "Me is six steps, Profile to My coach, and the last ends with nothing after it. What the person told the app is spread over six pages. Two answers never reach Chef Mealan: Where you eat and Work travel only order the moments. Today the coach sees the goal and numbers, the week, weigh-ins, shared cards, and which health situations were ticked and when, never the words; never the body data."),
  ("The story", "Your summary is the last row of Me and where the steps end. Every answer once, by step, each with what it does and whether Chef Mealan reads it. At the end: Plan your week, or Craft your first meal on Plate for the next meal by the clock. Then choose what your coach sees, or Save as PDF."),
  ("Coach Milan, 09:53: Taste", "I just saw the taste block is sitting alone here. Taste moves from the bottom of Me, under Account, into Lifestyle, under Nutrition, after What you eat, as it is. Me becomes the steps only, then Account. The summary lists it under How you eat."),
  ("Behind it: the settings map", "One file in the code lists every setting with its effect: the numbers, the meal times, what Chef Mealan reads, or the order of moments. The summary is built from it. A unit test fails when a setting has no line, one walkthrough per setting changes it and checks the effect, and a test checks that what is marked Chef reads is in every request to Chef Mealan. Where you eat and Work travel are added to what Chef Mealan reads."),
  ("Coach Milan, 09:14 to 09:15", "The question is how to enable the client to share with their coach when something changes. The coach should have the initial summary, but how to resolve the next updates and changes? That covers the second question too. Redraw DT167."),
  ("Sharing with the coach, version 2", "Choose once, part by part, what your coach sees; the choice stays. No frozen copy: the coach sees the shared parts as they are today, the same summary the person sees. On top, what changed since the coach last looked, dated; the same list starts the weekly check-in, and the Clients list marks a client with changes. A change to a part not shared never shows, not even that it changed. Switching a part off: the coach stops seeing it at once, its past changes too, and sees only that it stopped. Save as PDF prints the day, for the coach's own notes. Leaving the coach or deleting the account ends it all."),
  ("What stays private unless switched on (GDPR)", "Health data, Art. 9: body data (until now the coach never sees it) and allergies. Off until the person switches them on; switching on is their consent, dated, withdrawable. The health questions stay as today: which and when, never the words. What you eat: a diet can reveal beliefs or health (No pork, Vegan, Other in your words), so off until switched on. Alcohol: off until switched on. The privacy notice gets the summary under The coach link. I am not a lawyer: worth one check."),
  ("Open", "Taste on Me also has In your own words: free text, so off for the coach until switched on, like Other under What you eat."),
])
h = rowEnd(cy,
  B.screen("DT167a", 0, y, "Now: Me ends at Coach", "r167a", "now", "Six steps, nothing after the last."),
  B.screen("DT167b", 1, y, "New: Your summary in Me", "r167b", "changed", "The seventh row, where the steps end."),
  B.screen("DT167c", 2, y, "New: Your summary", "r167c", "changed", "Every answer, what it does, Chef reads."),
  B.screen("DT167d", 3, y, "New: what's next", "r167d", "changed", "Plan your week. Craft your first meal. Share."),
  B.screen("DT167e", 4, y, "New: what your coach sees", "r167e", "changed", "Choose once; kept up to date. Health data off."),
  B.screen("DT167f", 5, y, "New: the coach reads it", "r167f", "changed", "As it is today; what changed, on top."),
  B.screen("DT167g", 6, y, "New: Clients marks changes", "r167g", "changed", "Never ask, never send again."),
  B.screen("DT167h", 7, y, "New: Taste in Lifestyle", "r167h", "changed", "Under Nutrition, after What you eat."))
y = h
board("Stories119.dc.html", "DT167. Your summary, and what your coach sees",
  "30 October 2026 (Coach Milan, the end of the Me steps; a profile the coach can read). Version 2, 09:15: shared once, kept up to date, with what changed; 09:53: Taste into Lifestyle. Now: 0.3.8, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories118.dc.html")
