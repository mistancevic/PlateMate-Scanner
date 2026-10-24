import json, os
D = "/home/claude/canvas/project"
def page(title, h, body, bg="#eef3fc"):
    return f'''<!doctype html>
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
<div style="width: 390px; height: {h}px; box-sizing: border-box; padding: 14px 18px; background: {bg}; color: #172742; font-family: 'Nunito', ui-sans-serif, system-ui, sans-serif; font-size: 15px; display: flex; flex-direction: column; gap: 16px; overflow: hidden">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":390,"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{}};
  }}
}}
</script>
</body>
</html>
'''
H1 = lambda t: f'<b style="font-size: 24px; font-weight: 900; line-height: 1.2">{t}</b>'
H2 = lambda t: f'<b style="font-size: 22px; font-weight: 900">{t}</b>'
P = lambda t: f'<span style="font-size: 15px; color: #3d4a63; font-weight: 600; line-height: 1.45">{t}</span>'
SUB = lambda t: f'<span style="font-size: 13px; color: #5b6b8a; font-weight: 600; line-height: 1.4">{t}</span>'
NOTE = lambda t: f'<small style="font-size: 12px; color: #5b6b8a; font-weight: 700; padding: 8px 10px; border: 1.5px dashed #d1dcf0; border-radius: 12px; line-height: 1.4">{t}</small>'
DEC = lambda t: f'<small style="font-size: 12.5px; color: #8a4b00; font-weight: 700; padding: 10px 12px; background: #fff4e0; border: 1.5px solid #f2c27a; border-radius: 12px; line-height: 1.4"><b>Your decision.</b> {t}</small>'
ACT = lambda t: f'<span style="height: 50px; border-radius: 14px; background: #2e7be8; color: #fff; font-size: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(46,123,232,.3)">{t}</span>'
LINK = lambda t: f'<span style="text-align: center; color: #1f5fc7; font-size: 14px; font-weight: 800">{t}</span>'
LINE = '<span style="height: 1px; background: #b9cdf1"></span>'
BRAND = '<b style="font-size: 15px; font-weight: 900; color: #1f5fc7">Chef Mealan</b>'
def field(label, val, ph=False, w=1):
    col = "#9aa7bf" if ph else "#172742"
    return f'<div style="flex: {w}; display: flex; flex-direction: column; gap: 4px"><small style="font-size: 12.5px; font-weight: 800">{label}</small><span style="height: 48px; border-radius: 12px; background: #fff; border: 1.5px solid #d1dcf0; font-size: 18px; font-weight: 800; color: {col}; display: flex; align-items: center; padding: 0 12px">{val}</span></div>'
def dob(d, m, y, dph=False, mph=False, yph=False):
    return f'<div style="display: flex; gap: 10px">{field("Day", d, dph)}{field("Month", m, mph)}{field("Year", y, yph, 1.6)}</div>'
def card(inner, bg="#fff"):
    return f'<div style="background: {bg}; border: 1.5px solid #d1dcf0; border-radius: 18px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px">{inner}</div>'
def row(t, s):
    return f'<div style="display: flex; flex-direction: column; gap: 3px; padding: 8px 0; border-bottom: 1px solid #d1dcf0"><b style="font-size: 14px">{t}</b><span style="font-size: 12.5px; color: #5b6b8a; font-weight: 600; line-height: 1.4">{s}</span></div>'
def was(t):
    return f'<div style="display: flex; flex-direction: column; gap: 4px"><small style="font-size: 11px; font-weight: 900; letter-spacing: .06em; color: #a33">NOW</small><span style="font-size: 13px; color: #8b93a5; font-weight: 600; line-height: 1.4; text-decoration: line-through">{t}</span></div>'
def new(t):
    return f'<div style="display: flex; flex-direction: column; gap: 4px"><small style="font-size: 11px; font-weight: 900; letter-spacing: .06em; color: #1b7a3a">NEW</small><span style="font-size: 13.5px; color: #172742; font-weight: 700; line-height: 1.4">{t}</span></div>'


def chip(t, on=False):
    if on: return f'<span style="height: 34px; padding: 0 12px; border-radius: 17px; background: #cfe0fb; border: 1.5px solid #2e7be8; color: #123a7a; font-size: 13.5px; font-weight: 800; display: inline-flex; align-items: center; white-space: nowrap"><span style="font-weight: 900; margin-right: 4px">✓</span>{t}</span>'
    return f'<span style="height: 34px; padding: 0 12px; border-radius: 17px; background: #fff; border: 1.5px solid #d1dcf0; color: #172742; font-size: 13.5px; font-weight: 600; display: inline-flex; align-items: center; white-space: nowrap">{t}</span>'
def opt(t, h, on=False):
    st = "background: #cfe0fb; border: 1.5px solid #2e7be8; color: #123a7a" if on else "background: #fff; border: 1.5px solid #d1dcf0; color: #172742"
    tick = '<span style="font-weight: 900; margin-right: 4px">✓</span>' if on else ''
    return f'<span style="border-radius: 14px; padding: 8px 10px; {st}; display: flex; flex-direction: column; gap: 2px"><b style="font-size: 13.5px; font-weight: 800">{tick}{t}</b><small style="font-size: 11.5px; font-weight: 600; color: #5b6b8a">{h}</small></span>'
def setting(name, inner, hint=""):
    h = f'<small style="font-size: 11.5px; color: #5b6b8a; font-weight: 600; line-height: 1.35">{hint}</small>' if hint else ""
    return f'<div style="display: flex; flex-direction: column; gap: 6px"><small style="font-size: 12.5px; font-weight: 800; color: #172742">{name}</small>{inner}{h}</div>'
chips = lambda *xs: '<div style="display: flex; flex-wrap: wrap; gap: 8px">' + "".join(xs) + '</div>'
grid = lambda *xs: '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">' + "".join(xs) + '</div>'
def seg(title, why, inner):
    return f'<div style="display: flex; flex-direction: column; gap: 6px"><b style="font-size: 17px; font-weight: 900">{title}</b><small style="font-size: 12.5px; color: #5b6b8a; font-weight: 600">{why}</small><div style="background: #fff; border: 1.5px solid #d1dcf0; border-radius: 18px; padding: 12px 14px; display: flex; flex-direction: column; gap: 14px">{inner}</div></div>'
sub = lambda t: f'<small style="font-size: 11px; font-weight: 900; letter-spacing: .06em; color: #1f5fc7; padding-top: 4px; border-top: 1px solid #e3eaf7">{t}</small>'



boards = {}
def stepper(n, minus=True, plus=True):
    b = lambda t, on: f'<span style="width: 42px; height: 42px; border-radius: 21px; border: 1.5px solid #d1dcf0; background: #fff; color: {"#1f5fc7" if on else "#c3cde0"}; font-size: 20px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center">{t}</span>'
    return f'<span style="display: inline-flex; align-items: center; gap: 12px">{b("−", minus)}<b style="width: 14px; text-align: center; font-size: 16px">{n}</b>{b("+", plus)}</span>'
def zl(z, feel, ex):
    return f'<span style="display: flex; flex-direction: column; gap: 1px"><small style="font-size: 12.5px; color: #172742; font-weight: 800">{z} <span style="font-weight: 600; color: #3d4a63">· {feel}</span></small><small style="font-size: 12px; color: #5b6b8a; font-weight: 600; line-height: 1.35">{ex}</small></span>'
def trow(name, zones, n, length=None, minus=True, plus=True):
    top = f'<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px"><span style="display: flex; flex-direction: column; gap: 5px"><b style="font-size: 14.5px">{name}</b>{"".join(zl(*z) for z in zones)}</span>{stepper(n, minus, plus)}</div>'
    if length:
        top += '<div style="display: flex; flex-direction: column; gap: 6px; padding: 8px 0 2px 10px; border-left: 2px solid #dae6fb; margin-left: 2px"><small style="font-size: 12px; font-weight: 800">How long, usually</small><div style="display: flex; flex-wrap: wrap; gap: 6px">' + "".join(chip(x, x == length) for x in ["15–30 min", "30–45 min", "45–60 min", "60–90 min", "90+ min"]) + '</div></div>'
    return f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 10px 0; border-bottom: 1px solid #e3eaf7">{top}</div>'
rest = lambda n: f'<div style="display: flex; justify-content: space-between; align-items: center; background: #eef3fc; border-radius: 12px; padding: 10px 12px"><span style="display: flex; flex-direction: column"><b style="font-size: 14.5px">Rest days</b><small style="font-size: 12.5px; color: #5b6b8a; font-weight: 600">no training; your walking still counts</small></span><b style="font-size: 18px; font-weight: 900">{n}</b></div>'

def ztable():
    rows = [("Zone 1", "50–60 %", "very easy, you breathe calmly", "Light"),
            ("Zone 2", "60–70 %", "easy, full sentences", "Moderate"),
            ("Zone 3", "70–80 %", "steady, short sentences", "Moderate"),
            ("Zone 4", "80–90 %", "hard, a few words", "Hard"),
            ("Zone 5", "90–100 %", "all out, no words", "Hard")]
    td = 'style="padding: 5px 6px; border-bottom: 1px solid #e3eaf7; font-size: 12px; font-weight: 600; color: #3d4a63; vertical-align: top"'
    th = 'style="padding: 5px 6px; border-bottom: 1.5px solid #d1dcf0; font-size: 11px; font-weight: 900; color: #5b6b8a; text-align: left"'
    body = "".join(f'<tr><td {td}><b style="color: #172742; white-space: nowrap">{z}</b></td><td {td}>{p}</td><td {td}>{f}</td><td {td}>{k}</td></tr>' for z, p, f, k in rows)
    return f'<table style="border-collapse: collapse; width: 100%; margin-top: -8px"><tr><th {th}>Zone</th><th {th}>of max heart rate</th><th {th}>How it feels</th><th {th}>Row</th></tr>{body}</table>'
boards["TrainScope.dc.html"] = ("T0. What changes (explanation)", 1440, page("T0. Your training week", 1440, "\n".join([
 H2("Your training week"),
 SUB("In the goal setup, Calculate for me. Fixes the week getting stuck at 7 rest days, and puts the length of a session where you count the days."),
 row("Rest is what's left", "Only training days have − and +. A + takes a day from Rest; a − gives it back. Rest shows how many days are left, and + stops when Rest reaches 0. The week always adds up to 7, so the line “7 of 7 days” goes."),
 row("The length sits with its days", "Light, Moderate and Hard each get “How long, usually”, shown as soon as that kind has at least one day. The two separate minute fields go."),
 row("Ranges, from 15 minutes", "15–30, 30–45, 45–60, 60–90 and 90+ minutes, so a 20-minute HIIT session fits. Counted as the middle of the range: 25, 40, 55, 75 and 100 minutes."),
 row("Each zone says what it is", "Every row names its zones, how each one feels and what usually falls in it. People with a watch pick by zone; everyone else by the feel and the examples."),
 ztable(),
 row("Rest means no training, not no moving", "A rest day is a day off training. You still walk, so walking is its own setting under the week, and it counts on all 7 days. The 7 days still add up: training days plus rest days."),
 row("Walking, every day", "Steps on a usual day: under 5,000, 5,000–8,000, 8,000–12,000, 12,000+. Your work setting already covers about 5,000. Steps above that add to every day: about 10 minutes of walking per 1,000 steps. At 96 kg, 8,000–12,000 steps adds about 200 kcal to every day, rest days included."),
 row("Light is a session, not your walking", "Light means a planned easy session: yoga, mobility, stretching, an easy bike ride. Everyday walking moves to its own setting, so it isn't counted twice."),
 row("Starting choices", "Light 30–45, Moderate 45–60, Hard 60–90. Close to today's 45, 60 and 75 minutes."),
 row("The Weekly plan", "Starts from these counts and lengths, as today. Each day there keeps its own length."),
 DEC("A: build T1 only; the day settings stay as in T2. B: build T1 and T3, so both use Light, Moderate and Hard with zones, and the same ranges."),
]), bg="#fff"))

boards["TrainWeek.dc.html"] = ("T1. Your training week, proposed", 1220, page("T1. Your training week", 1220, "\n".join([
 '<b style="font-size: 15px">Your training week</b>',
 SUB("Tap + for each kind of training you do in a normal week. The rest are rest days."),
 card("".join([
   trow("Light", [("Zone 1", "very easy, you breathe calmly", "yoga, mobility, stretching, an easy bike ride")], 1, "30–45 min"),
   trow("Moderate", [("Zone 2", "easy, you can talk in full sentences", "easy jog, cycling, swimming, hiking"),
                     ("Zone 3", "steady, you talk in short sentences", "tempo run, spin class, strength training, team practice")], 2, "45–60 min"),
   trow("Hard", [("Zone 4", "hard, only a few words at a time", "intervals, HIIT, a football match"),
                 ("Zone 5", "all out, no words", "sprints, the last minutes of a race")], 1, "15–30 min"),
   rest(3),
 ])),
 card(setting("Walking, every day", chips(*[chip(x, x == "8,000–12,000") for x in ["Under 5,000", "5,000–8,000", "8,000–12,000", "12,000+"]]),
   "Steps on a usual day, training days and rest days alike: to work, shopping, the dog. Your phone or watch counts them. Not sure? 30 minutes of walking is about 3,000 steps.")),
])))

def dayhead():
    return '<div style="display: flex; flex-direction: column; gap: 2px"><b style="font-size: 17px; font-weight: 900">Tuesday</b><small style="font-size: 12.5px; color: #5b6b8a; font-weight: 600">Weekly plan · one day</small></div>'
def act(new=False):
    if new: return setting("Activity", chips(*[chip(x, x == "Strength") for x in ["No training", "Strength", "Cardio", "HIIT", "Mobility", "Stretching", "Yoga", "Team sport"]]), "Strength: weights, machines, bodyweight. Walking isn't here: it's in your steps, on every day.")
    return setting("Activity", chips(*[chip(x, x == "Strength") for x in ["Rest", "Strength", "Cardio", "HIIT", "Mobility", "Stretching", "Yoga", "Walk", "Team sport"]]), "Strength: weights, machines, bodyweight.")
def hardopt(name, zones, on=False):
    st = "background: #cfe0fb; border: 1.5px solid #2e7be8" if on else "background: #fff; border: 1.5px solid #d1dcf0"
    tick = '<span style="font-weight: 900; margin-right: 4px">✓</span>' if on else ''
    return f'<span style="border-radius: 14px; padding: 8px 12px; {st}; display: flex; flex-direction: column; gap: 4px"><b style="font-size: 14px; font-weight: 800; color: #123a7a">{tick}{name}</b>{"".join(zl(*z) for z in zones)}</span>'
ZL = [("Zone 1", "very easy, you breathe calmly", "yoga, mobility, stretching, an easy bike ride")]
ZM = [("Zone 2", "easy, you can talk in full sentences", "easy jog, cycling, swimming, hiking"), ("Zone 3", "steady, you talk in short sentences", "tempo run, spin class, strength training, team practice")]
ZH = [("Zone 4", "hard, only a few words at a time", "intervals, HIIT, a football match"), ("Zone 5", "all out, no words", "sprints, the last minutes of a race")]
boards["PlanNow.dc.html"] = ("T2. Day settings as they are today (for comparison, not built)", 750, page("T2. Weekly plan today", 750, "\n".join([
 '<small style="font-size: 11px; font-weight: 900; letter-spacing: .06em; color: #a33">TODAY</small>',
 card("".join([dayhead(), act(),
   setting("How hard", chips(chip("Easy"), chip("Moderate", True), chip("Hard")), "Easy means you could chat while doing it. Hard means you couldn't."),
   setting("When", chips(chip("Morning"), chip("During the day"), chip("Evening", True), chip("Late night"))),
   setting("How long", chips(*[chip(f"{m} min", m == 60) for m in [30, 45, 60, 75, 90]])),
 ])),
 NOTE("“Easy” here, “Light” in the goal setup: two words for the same thing. No zones. Lengths start at 30 minutes. Rest says: “Nothing planned. A walk or yoga is an activity; pick it instead.”"),
])))
boards["PlanNew.dc.html"] = ("T3. Day settings, proposed: same words, zones and ranges as T1", 1000, page("T3. Weekly plan, new", 1000, "\n".join([
 '<small style="font-size: 11px; font-weight: 900; letter-spacing: .06em; color: #1b7a3a">NEW</small>',
 card("".join([dayhead(), act(True),
   setting("How hard", '<div style="display: flex; flex-direction: column; gap: 8px">' + hardopt("Light", [("Zone 1", "very easy, you breathe calmly", "yoga, mobility, stretching, easy cycling")]) + hardopt("Moderate", ZM, True) + hardopt("Hard", ZH) + '</div>'),
   setting("When", chips(chip("Morning"), chip("During the day"), chip("Evening", True), chip("Late night"))),
   setting("How long", chips(*[chip(x, x == "45–60 min") for x in ["15–30 min", "30–45 min", "45–60 min", "60–90 min", "90+ min"]])),
 ])),
 NOTE("Days already planned move to the range they end in: 30 min to 15–30, 45 to 30–45, 60 to 45–60, 75 and 90 to 60–90."),
])))
# ---- coach version: everyday first, then training; no rest row ----
def sect(title, why):
    return f'<div style="display: flex; flex-direction: column; gap: 2px; padding-top: 4px"><b style="font-size: 17px; font-weight: 900">{title}</b><small style="font-size: 12.5px; color: #5b6b8a; font-weight: 600">{why}</small></div>'
def works():
    xs = [("9 to 5 at a desk", "sitting most of the day", True), ("Shift work", "some standing and walking", False), ("On my feet", "shop, care, teaching", False), ("Physical work", "building, farming, carrying", False)]
    return setting("Your work", grid(*[opt(a, b, on) for a, b, on in xs]))
def steps():
    return setting("Steps on a usual day", chips(*[chip(x, x == "8,000–12,000") for x in ["Under 5,000", "5,000–8,000", "8,000–12,000", "12,000+"]]),
      "All your walking goes here: to work, shopping, the dog, a walk in the park. Your phone or watch counts them.")
tally = lambda t, r: f'<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 2px 0"><small style="font-size: 13px; font-weight: 800">{t} training days</small><small style="font-size: 13px; color: #5b6b8a; font-weight: 700">{r} days without training</small></div>'
ZL1 = [("Zone 1", "very easy, you breathe calmly", "yoga, mobility, stretching, easy cycling. Walking goes in steps.")]
boards["TrainWeek.dc.html"] = ("T1. Calculate for me: your everyday and your training, proposed", 1380, page("T1. Calculate for me", 1380, "\n".join([
 sect("Your everyday", "Every day, with or without training."),
 card(works() + steps()),
 sect("Your training", "Only the days you train. Tap + for each."),
 card("".join([
   trow("Light", ZL1, 1, "30–45 min"),
   trow("Moderate", ZM, 2, "45–60 min"),
   trow("Hard", ZH, 1, "15–30 min"),
   tally(4, 3),
 ])),
])))
boards["TrainScope.dc.html"] = ("T0. What changes (explanation)", 1100, page("T0. What changes", 1100, "\n".join([
 H2("How a coach asks"),
 SUB("Two questions, in this order. Your everyday: how much you move on any day. Your training: what you do on the days you train."),
 row("Your everyday: work and steps", "Your work, as today, and new: steps on a usual day. These count on all 7 days, training or not. Steps add only above what your work already covers, so a shop assistant's steps at work aren't counted twice."),
 row("Why walking is in steps, not in Zone 1", "By effort, walking is Zone 1. But it happens every day, spread across the day, and your phone already counts it. Asked as steps, all of it is counted once. If a walk were also a Light session, it would count twice."),
 row("Your training: days, not rest", "Light, Moderate and Hard each have − and +. There's no Rest row: the days left simply have no training, shown as one line, “3 days without training”. + stops at 7 training days. This fixes the week stuck at 7 rest days."),
 row("The length sits with its days", "Each kind gets “How long, usually” once it has a day: 15–30, 30–45, 45–60, 60–90, 90+ min. Counted as the middle: 25, 40, 55, 75, 100. The two minute fields go."),
 row("Each zone says what it is", "Every row names its zones, how each feels and what usually falls in it."),
 ztable(),
 row("Starting choices", "Light 30–45, Moderate 45–60, Hard 60–90."),
 DEC("A: build T1 only. B: build T1 and T3, so the day settings use the same words, zones and ranges; there “Rest” becomes “No training”, and “Walk” goes, because walking is in steps."),
]), bg="#fff"))

cj = json.load(open(f"{D}/canvas.json"))
x = 0
for i, (fn, (title, h, html)) in enumerate(boards.items()):
    open(f"{D}/{fn}", "w").write(html)
    cj["boards"][fn] = {"x": x, "y": 13800, "w": 390, "h": h, "title": title}
    if fn not in cj["order"]: cj["order"].append(fn)
    x += 470
cj["notes"]["t11"] = {"x": 0, "y": 13500, "text": "Calculate for me: your everyday, then your training", "kind": "title1", "maxW": 860}
json.dump(cj, open(f"{D}/canvas.json", "w"))
print("ok")
