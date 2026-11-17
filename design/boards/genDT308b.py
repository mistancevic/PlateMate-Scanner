# The one board after the test of 0.3.151 (from shotFinal.cjs and shotOrder.cjs; Coach Milan 16 November 17:04). Template from B144.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"same": ("#8a97b0", "#fff", "No change"), "now": ("#5b6b8a", "#fff", "Your phone"), "draft": ("#53627f", "#fff", "As it is today"), "changed": ("#2a72d9", "#fff", "New, drawn for your approval")}
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
          f'<div style="margin-top:8px">{img(name, "#2a72d9" if status == "changed" else "#d1dcf0")}</div></div>')
        return y + TOP + ih(name)
    # a computer screen across the three columns
    def wide(s, nid, y, title, name, status, what):
        bg, fg, label = CHIP[status]; WW = 3 * SW + 2 * GAP
        im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((WW * 2, int(im.size[1] * WW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=74)
        h = int(im.size[1] / 2)
        s.html.append(f'<div style="position:absolute;left:{s.x(0)}px;top:{y}px;width:{WW}px">'
          f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
          f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span> <span style="font-size:12.5px;color:#172742;margin-left:8px">{what}</span></div>'
          f'<div style="margin-top:8px"><img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{WW}px;border-radius:10px;border:1.5px solid {"#2a72d9" if status == "changed" else "#d1dcf0"};display:block"></div></div>')
        return y + TT + 8 + CH + 8 + h
    def render(s, W, H): return f'<div style="position:relative;width:{W}px;height:{H}px">{"".join(s.html)}</div>'

def storyCard(B, y, rid, title, parts, w=350):
    body = "".join(f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>' for h, t in parts)
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
                  f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{rid}</span>{title}</div>{body}</div>')
    return y + 70 + sum(30 + math.ceil(len(re.sub("<[^>]+>|&amp;", "x", t)) / 40) * 21 for _, t in parts)
def rowEnd(*hs): return max(hs) + 140

LEGEND = ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("draft", "same", "changed"))
  + '<span style="color:#172742">Left: the story, one item per row. Right: the app as it is, then the same page with the change drawn in, blue outline and yellow note. Drawn in English; every release ships in Srpski and German too.</span></div>')

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
    if not os.path.exists(f"{D}/canvas.json"): print(fname, W, H, Hc, len(page) // 1024, "KB"); return
    cj = json.load(open(f"{D}/canvas.json"))
    if fname not in cj["order"]: cj["order"].append(fname)
    a = cj["boards"][after]
    cj["boards"][fname] = {"x": 0, "y": a["y"] + a["h"] + 120, "w": W, "h": H, "title": title, "page": a["page"]}
    json.dump(cj, open(f"{D}/canvas.json", "w")); print(fname, W, H, Hc, len(page) // 1024, "KB")
    cj = json.load(open(f"{D}/canvas.json"))




def start(cols):
    global W, B, y
    W = SX + cols * (SW + GAP) - GAP + 70; B = Board(); y = 30
def row(rid, title, parts, shots, nid=None, at=0, arrows=True):
    global y
    c = storyCard(B, y, (nid or rid), title, parts)
    hs = [B.screen(f"{nid or rid}{chr(97 + at + i)}", i, y, t, n, st, wd) for i, (t, n, st, wd) in enumerate(shots)]
    if arrows:
        for i in range(1, len(shots)): B.html.append(f'<div style="position:absolute;left:{B.x(i) - GAP}px;top:{y + TOP + 220}px;width:{GAP}px;text-align:center;font-size:44px;font-weight:900;color:#2a72d9">→</div>')
    y = rowEnd(c, *hs)


def flowmap():
    global y
    X0 = 40; H = 1010
    out = [f'<div style="position:absolute;left:{X0}px;top:{y}px;width:2190px;height:{H}px;background:#fff;border:2px solid #c9d6ee;border-radius:24px;font-family:Nunito,system-ui,sans-serif;color:#172742">']
    out.append('<div style="position:absolute;left:30px;top:18px;font-size:30px;font-weight:900">DT308, the flow: what comes from what, and where it lands</div>')
    cols = [(30, 250, "1. Your Plate"), (330, 280, "2. What comes"), (660, 300, "3. A plate with foods"), (1010, 330, "4. The header says"), (1390, 300, "5. At the end of the read"), (1740, 420, "6. Where it lands")]
    for x, w, t in cols: out.append(f'<div style="position:absolute;left:{x}px;top:78px;width:{w}px;font-size:19px;font-weight:900;color:#2a72d9">{t}</div>')
    def box(x, yy, w, h, title, sub="", kind=""):
        bg, bd = {"": ("#f3f7ff", "#9db7e6"), "warn": ("#fff4de", "#f0c36d"), "land": ("#e9f7ee", "#7cc79a"), "head": ("#ffffff", "#2a72d9"), "soft": ("#fafbfe", "#c9d6ee")}[kind]
        out.append(f'<div style="position:absolute;left:{x}px;top:{yy}px;width:{w}px;height:{h}px;box-sizing:border-box;padding:10px 14px;border-radius:16px;background:{bg};border:2px {"dashed" if kind == "soft" else "solid"} {bd}"><div style="font-size:19px;font-weight:800;line-height:1.25">{title}</div><div style="font-size:16px;line-height:1.35;color:#3a4a66;margin-top:3px">{sub}</div></div>')
    R = {1: 125, 2: 290, 3: 455, 4: 620, 5: 815}; BH = 130
    box(30, R[1], 250, R[3] + BH - R[1], "Empty", "Nothing on it yet.")
    box(30, R[4], 250, 325, "Has foods", "A plate you started before: it has its own header already.")
    box(330, R[1], 280, BH, "A photo you take now", "Or one from the last half hour.")
    box(330, R[2], 280, BH, "An older photo", "From Your photos: it carries its own day and time.")
    box(330, R[3], 280, BH, "No photo", "Typed, said, scanned, an idea, or a meal opened from your plan.", "soft")
    box(330, R[4], 280, BH, "A photo, new or older", "Onto the plate that is there.")
    box(660, R[4], 300, BH, "Before the read: a warning", "Your plate is not empty. After the read you choose.", "warn")
    box(660, R[5], 300, 130, "After the read: you decide", "Add to my plate, or Start a new plate.", "warn")
    box(1010, R[1], 330, BH, "Meal and day not set", "In grey, with the pencil. Nothing changes in your plan or your numbers. The app does not guess a meal.", "head")
    box(1010, R[2], 330, BH, "Meal and day not set", "The same for an older photo: the app does not decide what the photo is for.", "head")
    box(1010, R[3], 330, BH, "Dinner<br><span style='font-weight:600'>Sunday, 15 November, 20:00</span>", "A meal you set, or one opened from your plan. X clears it: not set again.", "head")
    box(1010, R[5], 330, 130, "The header stays as it is", "Add to my plate: the foods join the plate that is there, with its meal or with none.", "head")
    box(1390, R[1], 300, BH, "Ate it, today", "The calendar opens with the guess marked: based on the current time.")
    box(1390, R[2], 300, BH, "Ate it, on a day before", "For an older photo the guess is the photo's day and time.")
    box(1390, R[3], 300, BH, "Plan it", "The calendar opens: pick the day and the meal.")
    box(1390, R[4], 300, BH, "Save it", "No meal. It is kept.")
    box(1740, R[1], 420, BH, "Today", "Counted when you say you ate it.", "land")
    box(1740, R[2], 420, BH, "That day, as eaten then", "Logged for the past day, after the read.", "land")
    box(1740, R[3], 420, BH, "The plan, on that day", "Planned, not counted yet.", "land")
    box(1740, R[4], 420, BH, "Recipes, under Served", "Nothing is counted.", "land")
    box(1390, R[5], 770, 130, "With a meal already set", "The read does not ask What do you do with it?. It ends as in 0.3.152: Did you eat it?, Done.", "soft")
    A = []
    def arrow(x1, y1, x2, y2, label="", lx=0, ly=0):
        A.append(f'<path d="M{x1},{y1} L{x2},{y2}" stroke="#2a72d9" stroke-width="3" fill="none" marker-end="url(#ah)"/>')
        if label: A.append(f'<text x="{(x1 + x2) / 2 + lx}" y="{(y1 + y2) / 2 - 8 + ly}" text-anchor="middle" font-size="15" font-weight="700" fill="#1f4fa3">{label}</text>')
    m = lambda r: R[r] + BH // 2
    arrow(280, m(1), 330, m(1)); arrow(280, m(2), 330, m(2)); arrow(280, m(3), 330, m(3))
    arrow(280, m(4), 330, m(4)); arrow(610, m(4), 660, m(4)); arrow(810, R[4] + BH, 810, R[5])
    arrow(610, m(1), 1010, m(1)); arrow(610, m(2), 1010, m(2)); arrow(610, m(3), 1010, m(3))
    arrow(960, R[5] + 65, 1010, R[5] + 65, "Add")
    A.append(f'<path d="M960,{R[5] + 25} L985,{R[5] + 25} L985,{m(2) + 35} L1008,{m(2) + 35}" stroke="#2a72d9" stroke-width="3" fill="none" marker-end="url(#ah)"/>')
    A.append(f'<text transform="translate(978,{R[5] - 10}) rotate(-90)" font-size="15" font-weight="700" fill="#1f4fa3">Start a new plate: no meal set, as for an empty plate</text>')
    A.append(f'<path d="M1365,{m(1)} L1365,{m(4)}" stroke="#2a72d9" stroke-width="3" fill="none"/>')
    for r in (1, 2, 3): A.append(f'<path d="M1340,{m(r)} L1365,{m(r)}" stroke="#2a72d9" stroke-width="3" fill="none"/>')
    for r in (1, 2, 3, 4): arrow(1365, m(r), 1390, m(r))
    for r in (1, 2, 3, 4): arrow(1690, m(r), 1740, m(r))
    out.append(f'<svg width="2190" height="{H}" style="position:absolute;left:0;top:0;pointer-events:none"><defs><marker id="ah" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto"><path d="M0,0 L16,8 L0,16 z" fill="#2a72d9"/></marker></defs>{"".join(A)}</svg>')
    out.append('<div style="position:absolute;left:1010px;top:958px;width:1150px;font-size:16px;color:#3a4a66">With no meal set, nothing changes in your plan or your numbers. The app guesses a meal only when you say Ate it, and shows why. Blue frame: the header. Amber: a warning or a decision. Green: where the plate lands.</div>')
    out.append('</div>')
    B.html.append("".join(out)); y += H + 60

start(6)
R1 = ("Release 2 · The read", "n_r1", "changed", "From DT308.2f: the read of a photo you took now.")
row("flow 3", "The end of the read: Ate it (continues DT308.2)", [
  ("The steps", "On the read you tap Ate it. Your calendar opens right there, under the button. The app marks its guess and says why: based on the current time, 18:00, so dinner. You tap Dinner."),
  ("After that", "The meal is set, in the header, with the X. The read goes on as in 0.3.152: Did you eat it? All of it, Half, Part of it, then Done."),
  ("Save it", "It keeps the read and counts nothing in your plan. Where it is kept (Recipes) is as today."),
], [R1, ("Release 2 · The read, the calendar open", "n_r2", "changed", "Tap: Ate it."), ("Release 2 · The read, the meal set", "n_r3", "changed", "Tap: Dinner.")], nid="DT308.4")
T = ("Today", "f_t", "same", "Where you are: Today.")
A = ("Release 1 and 2 · The Plate", "n_a", "changed", "Tap: Plate, in the bar at the bottom.")
CG = ("The camera", "f_cg", "same", "Tap: Photo or scan.")
row("flow 4", "An older photo that you ate then", [
  ("The steps", "On the Plate you tap Photo or scan. In the camera you tap Your photos and pick a photo from Saturday, 15:57. On the photo screen you tap Read the plate. On the read you tap Ate it, then Lunch."),
  ("The bug, solved here", "No meal is claimed until you say you ate it. Then the calendar opens on the photo's day, not on today's clock, with the guess marked: lunch not eaten that day, so Lunch; with lunch eaten, Snack."),
], [T, A, CG, ("Release 2 · The photo screen", "n_o", "changed", "Tap: Your photos, the photo."), ("Release 2 · The read", "n_o1", "changed", "Tap: Read the plate."), ("Release 2 · The read, the calendar open", "n_o2", "changed", "Tap: Ate it."), ("Release 2 · The read, the meal set", "n_o3", "changed", "Tap: Lunch.")], nid="DT308.5")
O1 = ("Release 2 · The read", "n_p1", "changed", "The same read as DT308.5e.")
row("flow 5", "An older photo as an inspiration: Plan it (continues from the read of DT308.5)", [
  ("The steps", "On the read you tap Plan it. The calendar opens on tomorrow, with nothing marked. You tap Lunch."),
  ("After that", "The header says Lunch, Monday, 16 November, 13:00. Goes into your plan. Nothing is counted yet."),
], [O1, ("Release 2 · The read, the calendar open", "n_p2", "changed", "Tap: Plan it."), ("Release 2 · The read, planned", "n_p3", "changed", "Tap: Lunch.")], nid="DT308.6")
board("Stories237.dc.html", "DT308 (2 of 3): the end of the read; an older photo",
  "17 November 2026. The second part of DT308, by the same rules as part 1. Not drawn again here: a plate that has foods (the warning and the decision of 0.3.152 stay; Add to my plate keeps the header as it is, Start a new plate starts with no meal set), and where the camera is reached from on a plate with foods. Drawn for approval; no Go. Marked on every frame: Release 1 is the title with its pencil, the card Add to your plate with its tiles and the list, and Chef Mealan through his icon; in Release 1 the meal line stays as in 0.3.152. Release 2 is the meal line (not set, the calendar, the X), no guessed meal, the end of the read, and the landing. A frame marked Release 1 and 2 shows parts of both. Frames without a mark do not change.",
  B, W, y - 100, "Stories236.dc.html")
