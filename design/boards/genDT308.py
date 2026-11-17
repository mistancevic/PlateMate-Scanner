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
    c = storyCard(B, y, rid, title, parts)
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
flowmap()
row("compare", "Adding to an empty plate: now, drawn last night, and chosen. Three versions of one screen, side by side, not steps", [
  ("Why", "Coach Milan 17 November 09:11: what is the better UX for the camera and upload buttons, and for the empty plate, now against new."),
  ("Now", "Tiles: found at a glance, easy to hit, four ways in little height. The plate drawing does nothing, but it says what the page is."),
  ("Drawn last night", "Better words and grouping. But every way is a title, a sentence and a wide white bar; you have to read to find the camera; the page starts like a form."),
  ("Chosen", "The order and words of last night in the tile format of now. A small empty plate with Nothing on your plate yet, as the picture of the state; the foods or the photo take its place. Add to your plate. Three tiles: Recipe photo, Recipe link (a tap opens the field for the link), and Photo or scan on the right. Then From the list. The camera is not on the plate itself: once a photo fills that place, a second photo would need another way in (09:25)."),
], [("Now, 0.3.152", "cmp_a", "now", "Version 1."), ("Drawn last night", "cmp_b", "changed", "Version 2."), ("Release 1 and 2 · Chosen", "cmp_c", "changed", "Version 3, chosen.")], nid="DT308.0", arrows=False)
T = ("Today", "f_t", "same", "Where you are: Today.")
row("flow 1", "The empty Plate; you set a meal first, and clear it again", [
  ("The title", "On top the meal's title, as a placeholder in grey: Meal title, with a pencil, in the same pattern as the meal line (02:49). Chef Mealan fills it when he reads or builds the plate, or you type it. What are you craving? and its text are gone (Coach Milan 02:15 to 02:32)."),
  ("The meal line", "Under the title, in the same look: Meal and day not set, in grey, with the pencil. A tap opens your calendar. Once set it is filled in dark: the meal, the day and time, with an X in the place of the pencil, which clears it."),
  ("The calendar", "The days on top; that day's meals under them, with their time and state. One tap on a meal sets the meal and the day together and closes it."),
  ("Add to your plate", "One card. On top a small empty plate with Nothing on your plate yet: the picture of the state, not a button; the foods or the photo take its place. One title, Add to your plate. Three tiles in one row, each an icon and a short name: Recipe photo, Recipe link (a tap opens the field for the link), and Photo or scan on the right, where the thumb is. Then From the list: the search, three foods for each macro, See all foods, + Add manually. Chosen over the long list with a title, a line and a wide bar for each way (Coach Milan 17 November 09:11 to 09:28; see DT308.0)."),
  ("Chef Mealan", "His field and Find ideas are gone from the page. His round icon is the one place to ask him: see DT308.3."),
  ("Gone from the empty plate", "The tiles Scan, Photo of my meal, Say what you have and Manual; Fit to my target."),
], [T, ("Release 1 and 2 · The Plate", "n_1", "changed", "Tap: Plate, in the bar at the bottom."), ("Release 2 · Today's meals", "n_2", "changed", "Tap: the pencil."), ("Release 2 · Monday's meals", "n_3", "changed", "Tap: Mon 16."), ("Release 2 · The Plate, a meal set", "n_4", "changed", "Tap: Lunch."), ("Release 2 · The Plate, cleared", "n_5", "changed", "Tap: X.")], nid="DT308.1")
row("flow 2", "A photo you take now, with no meal set", [
  ("The steps", "On the Plate you tap Photo or scan. In the camera you tap the shutter, then Use this photo. On the photo screen you tap Read the plate."),
  ("The meal line", "It stays Meal and day not set all the way. The app does not guess a meal when something lands."),
  ("The read's end", "Because no meal is set, the read ends with one question: What do you do with it? Save it, Plan it, Ate it. It continues in part 2."),
  ("The photo screen", "Shown as one card with the photo on top, from the earlier drawing."),
], [T, ("Release 1 and 2 · The Plate", "n_a", "changed", "Tap: Plate, in the bar at the bottom."), ("The camera", "f_cs", "same", "Tap: Photo or scan."), ("The camera, one photo taken", "f_cu", "same", "Tap: the shutter."), ("Release 2 · The photo screen", "n_n", "changed", "Tap: Use this photo."), ("Release 2 · The read", "n_r1", "changed", "Tap: Read the plate.")], nid="DT308.2")
row("flow 3", "You ask Chef Mealan, through his icon", [
  ("One place", "His round icon is the one way to ask him, on this page as on the others. The field on the page is gone, so the page has more room."),
  ("The chat", "It opens over the Plate. One field for what you ask, typed or spoken."),
  ("The answer", "It stays in the chat. Each idea is a small card, like a food in the list: a small photo of the dish (the small plate until there is one), the title on up to two lines, the kcal and the PD, and the button + Add, the same words as in the list. A long title wraps beside the photo. A tap on + Add closes the chat and the foods are on your plate (Coach Milan 09:46 to 09:50)."),
  ("Later", "The chat stays behind his icon: open it again to take another idea or to ask more."),
  ("Where it lands", "On the one landing, the Plate with foods, as in DT308.7: what is on your plate, the result, + Add more to your plate, and the end."),
], [T, ("Release 1 and 2 · The Plate", "c_1", "changed", "Tap: Plate, in the bar at the bottom."), ("Release 1 · Chef Mealan's chat", "c_2", "changed", "Tap: his icon."), ("Release 1 · His answer", "c_3", "changed", "You type what you crave, and send."), ("Release 2 · The landing", "c_4", "changed", "Tap: + Add.")], nid="DT308.3")
board("Stories236.dc.html", "DT308 (1 of 3): the flow as a map; the empty Plate; a photo; Chef Mealan",
  "17 November 2026 (Coach Milan 00:22 to 01:02). DT308 holds the meal line bug (B147) and the UX of this flow. The model: a plate starts with no meal set, and nothing changes in your plan or your numbers; the app asks what you do with the plate at the end of the read, and guesses a meal only then. On top the map. Then one row per flow: every row starts one step before the Plate, on Today; every frame shows what was tapped (orange outline), and the next frame is what that tap did. Blue outline and yellow note: what is new. Part 2 has the end of the read and the older photo; part 3 the landing. Drawn for approval; no Go. Marked on every frame: Release 1 is the title with its pencil, the card Add to your plate with its tiles and the list, and Chef Mealan through his icon; in Release 1 the meal line stays as in 0.3.152. Release 2 is the meal line (not set, the calendar, the X), no guessed meal, the end of the read, and the landing. A frame marked Release 1 and 2 shows parts of both. Frames without a mark do not change.",
  B, W, y - 100, "Stories235.dc.html")
