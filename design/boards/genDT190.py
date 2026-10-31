# Boards DT190 to DT194 (Stories139 to Stories143): the four situations still marked later, and Hormones' three waiting members. Milan 31 October 19:20. Panels from shotDT190.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.32, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
def sit(n, sid, fname, title, parts, screens, after, sub):
    B = Board(); y = 30
    cy = storyCard(B, y, sid, title, parts)
    h = rowEnd(cy, *[B.screen(f"{sid}{k}", i, y, t, r, "changed", w) for i, (k, t, r, w) in enumerate(screens[:3])])
    y = h
    if len(screens) > 3:
        h = rowEnd(*[B.screen(f"{sid}{k}", i, y, t, r, "changed", w) for i, (k, t, r, w) in enumerate(screens[3:])]); y = h
    board(fname, f"{sid}. {title}", sub, B, W, y - 100, after)

SUB = "31 October 2026 (Coach Milan 19:20, finish Explorer so the testers can test it). Now: 0.3.32, untouched. Drawn for your approval; nothing built. The papers on the board are checked on PubMed before the build; a number stays only if the paper says it."
sit(190, "DT190", "Stories139.dc.html", "Situations: A late evening after work", [
  ("Coach Milan, 31 October 19:20", "The second of the four situations marked later. A day situation: work ran late, dinner is late, the evening is short. The page reads the calendar's busy block that Plan already asks about (DT179), and gives the same three taps: the 16:00 snack, a quick dinner, dinner at its own time for this date."),
  ("The shape", "Theory first: a late heavy dinner and the night (Crispim 2011; Afaghi 2007: a carb meal four hours before bed brought sleep on faster, so never no carbs at night), the long afternoon as the cause of the big late dinner, the same numbers, the calendar's ask. Then when it helps, when it hurts. Then your case from the calendar, Plan and Lifestyle, with the trend: dinners after 20:30 this week."),
  ("Not in this board", "Reading work hours beyond Lifestyle and the calendar. A new busy-block rule: the page reuses DT179's asks."),
  ("To decide", "Is the trend line (dinners after 20:30 on N evenings) read here or left to the sleep page, which has it too? Drawn: here as well, since the cause is different."),
], [("a", "New: what a late dinner does", "r190a", "Theory with the papers."), ("b", "New: when it helps, when it hurts", "r190b", "The 16:00 snack, a quick dinner, cooked ahead."), ("c", "New: your case from the calendar", "r190c", "The taps Plan already has.")], "Stories138.dc.html", SUB)
sit(191, "DT191", "Stories140.dc.html", "Situations: A party or a dinner out", [
  ("Coach Milan, 31 October 19:20", "A day situation read against the week: one meal does not move the trend (Hall 2012), the drinks (Siler 1999: fat burning down 73 % for the hours after about two drinks; Ebrahim 2013: the second half of the night), the day before the evening (lunch with protein and fibre, never skipped to save room), the morning after (breakfast as usual)."),
  ("Your case", "Days by the plan this week, the 7-day average and the trend, tonight's event from the calendar, lunch planned with its letters. Taps: keep lunch, log the evening as one meal (a photo of the plate at the table, DT127), tomorrow as usual. No trend line: one evening has none."),
  ("Not in this board", "A drinks counter. Any judgment of drinking; a drink is energy, and a habit that worries you is for your doctor."),
  ("To decide", "Does the page read the calendar for the word dinner, party or restaurant to open itself, or stays a page you open? Drawn: you open it; the calendar only fills the case."),
], [("a", "New: what one evening does", "r191a", "The trend, the drinks, the day before, the morning after."), ("b", "New: when it helps, when it hurts", "r191b", "Lunch, water, breakfast, the scale, skipping lunch."), ("c", "New: your case against the week", "r191c", "The days by the plan; the 7-day average.")], "Stories139.dc.html", SUB)
sit(192, "DT192", "Stories141.dc.html", "Situations: A day away, no kitchen", [
  ("Coach Milan, 31 October 19:20", "A day situation that mostly points at what the app already has: the Plate's letters (Fi low and F high on bought food), the photo of the plate at the table (DT127), the snack to carry that the calendar asks for (DT179), Travel mode (DT176). No new paper beyond Ludwig 2002 on fibre."),
  ("Your case", "Out from 8:00 to 19:00 from the calendar, Travel mode on or off, what is planned, the empty snack slot. Taps: a snack to carry, lunch as a photo, Travel mode on for today."),
  ("Not in this board", "Reading location without Travel mode. New food data for canteens."),
  ("To decide", "Travel mode on for one day from a tap here (drawn: yes, today only), or only from Me as today?"),
], [("a", "New: what a day out does", "r192a", "The letters, the photo, the snack to carry, Travel mode."), ("b", "New: when it helps, when it hurts", "r192b", "The snack, the photo, Travel mode, Fi, nothing until the evening."), ("c", "New: your case from the calendar", "r192c", "Doors the app already has.")], "Stories140.dc.html", SUB)
sit(193, "DT193", "Stories142.dc.html", "Situations: A day off training", [
  ("Coach Milan, 31 October 19:20", "A day situation from the training week: building goes on from yesterday's session (Schoenfeld and Aragon 2018, the Muscle page), the carbs' job is gone (Jensen 2011, the Glycogen page), hunger follows the days before (Weigle 2005), a walk is not training. The numbers already move with a rest day; the page explains why and changes nothing."),
  ("Your case", "The training week, yesterday's session, today's rest-day numbers, the planned meals, tomorrow's session. Taps: protein at every meal, a 30 minute walk, tomorrow's carbs before and after."),
  ("Not in this board", "A rest-day numbers change: they already exist in the formula."),
  ("To decide", "Nothing open."),
], [("a", "New: what a rest day does", "r193a", "Building goes on; the carbs' job is gone."), ("b", "New: when it helps, when it hurts", "r193b", "Protein, a walk, carbs at the lower end."), ("c", "New: your case from the training week", "r193c", "Yesterday, today, tomorrow.")], "Stories141.dc.html", SUB)
sit(194, "DT194", "Stories143.dc.html", "Hormones: The cycle, Thyroid, Growth hormone", [
  ("Coach Milan, 31 October 19:20", "The three members of Hormones still marked later, so Explorer closes. The cycle, per month, for everyone who has one: appetite in the second half (Davidsen 2007, a few hundred kcal a day), water and the scale, temperature (Baker and Driver 2007), training (McNulty 2020, 78 studies: a trivial difference), iron (EFSA 2015, the Micros page), enough food (Loucks and Thuma 2003). The app does not ask or store the day of the cycle; the case reads weigh-ins and plates only."),
  ("Thyroid, per month, one screen", "A long deep cut turns the rate down (Rosenbaum and Leibel 2010; Loucks 2003 measured T3 too): cold hands and tiredness on a deep cut, the fix is the range. Iodine 150 µg and selenium 70 µg from food (EFSA 2014); both join Micros in the same build. Sleep. No test, no level, no booster."),
  ("Growth hormone, per day, one screen", "The first deep sleep of the night (Van Cauter, Leproult and Plat 2000), a hard session (Kraemer and Ratamess 2005), fasting (Ho 1988), and what the claims get wrong: boosters do nothing lasting in healthy people."),
  ("The wellness line", "The cycle has the strictest line after The brain: no day asked, no condition, no pain advice, no test, no supplement; a cycle that changes is for your doctor. Thyroid and growth hormone: never a level or a treatment."),
  ("Not in this board", "Cycle tracking. Thyroid conditions, medication. Growth hormone as a treatment."),
  ("To decide", "Does the app ever ask the day of the cycle, to read the case better? Drawn: no; the case reads weigh-ins and plates. Iodine and selenium as Micros members in the same build (drawn: yes)?"),
], [("a", "New: The cycle, what moves across the month", "r194a", "Six lines with their papers."), ("b", "New: The cycle, when it helps, when it hurts", "r194b", "Protein and fibre, training as planned, the scale, a deep cut."), ("c", "New: The cycle, your case", "r194c", "Weigh-ins and plates only; no day asked."), ("d", "New: Thyroid, one screen", "r194d", "A deep cut, iodine, selenium, sleep; no test, no booster."), ("e", "New: Growth hormone, one screen", "r194e", "Deep sleep, a session, fasting, the claims.")], "Stories142.dc.html", SUB)
