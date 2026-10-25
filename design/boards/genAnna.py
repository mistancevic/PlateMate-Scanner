# Boards DT87 to DT91 (Milan 24 October 11:37 to 11:49: "Draw it first"): making a dinner with Chef Mealan, from an empty
# Plate to the saved recipe. Shots from shotDT87.cjs. Self-contained: the same look as genRS.py's boards, without its layers.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "Anna, 22 October, 0.2.6x"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: Anna\'s screens of 22 October, as she saw them. New: the mocks in blue. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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

W = SX + 4 * (SW + GAP) - GAP + 70
B = Board(); y = 30
def mock(x, yy, w, title, html, h=None):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{yy}px;width:{w}px;box-sizing:border-box;border:3px solid #2e7be8;border-radius:14px;padding:12px 14px;background:#fff;font-family:Nunito,sans-serif;color:#172742">'
      f'<div style="font-size:12px;font-weight:800;color:#2e7be8;letter-spacing:.05em;margin-bottom:8px">{title.upper()}</div>{html}</div>')
chip = lambda t, on=False: f'<span style="display:inline-block;border:1.5px solid #2e7be8;border-radius:999px;padding:5px 12px;font-size:13px;font-weight:700;margin:0 6px 6px 0;background:{"#2e7be8" if on else "#fff"};color:{"#fff" if on else "#1f5fc7"}">{t}</span>'
cy = storyCard(B, y, "DT117", "Training days are asked, never guessed", [
  ("Anna, both runs", "She said three moderate days; the app put them on Monday, Tuesday and Thursday, evening, from a Training week she never saw. Her Friday session showed as a rest day at 1,900 kcal. Moving two days took 7 to 10 taps and lost the time."),
  ("New", "In setup, right after the count, seven day chips to tap, Monday first, and one time chip row (morning, midday, evening). The count and the chips agree or the step says so. Training week starts from what she tapped. A day moved later keeps its time."),
])
cy2 = storyCard(B, cy + 20, "DT118", "The first screen without the formula block", [
  ("Anna", "2. The formula: Mifflin St Jeor, Katch McArdle, Schofield gives 9 kcal more at rest, the Compendium of Physical Activities. Jargon on her first screen; the section numbers skip (1, then 3)."),
  ("New", "Automatic, and one line: How we calculate › opens the formula names and the choice for the few who care. The sections are numbered as they show. Four numbers says four; pace in one unit; weights named under Moderate; the goal not preselected."),
])
cy3 = storyCard(B, cy2 + 20, "DT119", "The safety question asked in setup, not found later", [
  ("Anna", "The chat said: Answer the question on your profile first, is any of this true for you? No link. The question sat at the bottom of Profile."),
  ("New", "Asked in setup right after I agree, the same card, the same answers (the situations, or None of these applies to me). The chat never waits on it. Where it still can (an older account), the banner is a link that opens the question."),
])
cy4 = storyCard(B, cy3 + 20, "DT120", "One coach, said once", [
  ("Anna", "Coach page: Milan sets your target. Me: My coach, Join with a code. She had just set her own target and wondered whose wins."),
  ("New", "Me shows My coach: Milan, or none. Setup ends with one line: a coach can adjust these numbers later. The second page goes."),
])
cy5 = storyCard(B, cy4 + 20, "DT121", "Today on day one", [
  ("Anna", "Next: lunch 13:45, nothing planned yet, and right under it What's in the plan: nothing planned so far. Earlier shows days before she joined. Tomorrow shows the meals with no numbers. 13:45 though she set no times."),
  ("New", "One empty card, not two: Nothing planned yet for today, with Plan it. Earlier starts on her first day. Tomorrow's meals carry their kcal, protein and PD. A time shows only when she set one."),
])
cy6 = storyCard(B, cy5 + 20, "DT122", "PD named where it first appears, and every number says its day", [
  ("Anna", "Setup says 6.0 PD, Today 5.6 then 6.3, Plan 5.6 under a header saying 6.3, Me 6.0. The maths is right (week average, training day, rest day) but no label says which day a number is for. Nobody defines PD. The header opens an edit form for her targets."),
  ("New", "The first PD in setup gets its one line: PD, protein per 100 kcal, the number that tells a food from a marketing claim. Every target carries its day: 6.3, Friday, training day; 6.0, your week's average. The header opens a read-only view of today, with Change behind it."),
])
cy7 = storyCard(B, cy6 + 20, "DT123", "Where she shops and cooks is part of setup", [
  ("Anna, second run", "Setup never asked where she lives, which kitchens she likes or what she cooks with. She found Where I shop and cook by chance in Me, and the 20 starter foods it added had no list and no link."),
  ("New", "One setup step after the goal: the market, the kitchens, what you cook with. It ends with the starter foods for that market and a link to them in Foods."),
])
cy8 = storyCard(B, cy7 + 20, "DT124", "The small ones, in one release", [
  ("Anna", "A toast that says numbers changed when they did not. 45 to 60 min shown as 55 min. Toasts over the button. Lifestyle named Your everyday in setup. Section numbers. Evals, Metrics and Running costs in a member's menu (local build only; confirmed hidden on accounts)."),
  ("New", "Each fixed as she wrote it: the toast only when a number changed; the range she picked; toasts above the buttons; one name for Lifestyle."),
])
# the mocks: training day chips, the first screen, Today on day one
mock(SX, y, SW + 100, "DT117, new: after the count", '<div style="font-size:14px;font-weight:700;margin-bottom:6px">Which days?</div>' + "".join(chip(d, d in ("Mon", "Wed", "Fri")) for d in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) + '<div style="font-size:14px;font-weight:700;margin:8px 0 6px">When?</div>' + chip("Morning") + chip("Midday") + chip("Evening", True) + '<div style="font-size:12.5px;color:#5b6b8a;margin-top:6px">3 days, as you said. Training week starts from these.</div>')
mock(SX + SW + GAP + 100 + 40, y, SW + 100, "DT118, new: the first screen", '<div style="font-size:14px;font-weight:700">1. You</div><div style="font-size:13px;color:#5b6b8a;margin:4px 0 10px">Sex, birth year, height, weight, activity.</div><div style="font-size:14px;font-weight:700">2. What are you after?</div><div style="font-size:13px;color:#5b6b8a;margin:4px 0 10px">Five goals as cards, none chosen for you.</div><div style="font-size:13px;color:#1f5fc7;font-weight:700">How we calculate ›</div><div style="font-size:12px;color:#5b6b8a;margin-top:4px">Automatic. The formula names live behind this line.</div>')
mock(SX + 2 * (SW + GAP + 100 + 40), y, SW + 100, "DT122, new: the first PD", '<div style="font-size:28px;font-weight:900;color:#1f5fc7">6.0 <span style="font-size:14px;color:#172742">PD, your week\'s average</span></div><div style="font-size:13px;line-height:1.5;margin-top:6px">PD is protein per 100 kcal: the number that tells a food from a marketing claim. Your training days aim at 6.3, your rest days at 5.6; every screen says which day its number is for.</div>')
ymock = y + 230
h = rowEnd(cy8,
  B.screen("A05", 0, ymock, "Now: three moderate days", "an05", "now", "The count, no days. The app picked Monday, Tuesday, Thursday."),
  B.screen("A04", 1, ymock, "Now: the first screen", "an04", "now", "The formula block on her first screen; 1, then 3."),
  B.screen("A28", 2, ymock, "Now: the chat waits on the profile", "an28", "now", "Answer the question on your profile first; no link."),
  B.screen("A17", 3, ymock, "Now: the coach, two ways", "an17", "now", "Coach page and My coach."))
y = h
h = rowEnd(y,
  B.screen("A20b", 0, y, "Now: Today on day one", "an20b", "now", "Empty cards twice, tomorrow without numbers."),
  B.screen("A07", 1, y, "Now: your days, four numbers", "an07", "now", "Five shown; PD unnamed."),
  B.screen("A26b", 2, y, "Now: Me, where she found the market", "an26b", "now", "Where I shop and cook, by chance."))
y = h
board("Stories70.dc.html", "DT117 to DT124. Anna's two blind runs: setup, Today and the names of numbers",
  "25 October 2026 (Milan 09:55: draw Anna's bigger items). Now: Anna's own screens from 22 October (0.2.6x), as she saw them. New: the mocks in blue, drawn for approval. Nothing built. Done since her runs and not here: the day adds up and aims at a range, starters have foods and grams, the shopping list works for starters, the slot PD counts what is left, a planned starter opens its foods.",
  B, W, y - 100, "Stories69.dc.html")
