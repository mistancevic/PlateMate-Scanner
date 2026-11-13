# Board DT268 (Stories201; Coach Milan 9 November 21:46 to 22:36): Served, plates scanned to explore kept in Recipes. From shotDT268.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "Your phone"), "draft": ("#53627f", "#fff", "0.3.117, as it is"), "changed": ("#2a72d9", "#fff", "New, drawn for your approval")}
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
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "draft", "changed"))
  + '<span style="color:#172742">Left: the story, one item per row. Right: the app as it is (0.3.117), then the same page with the change drawn in, blue outline and yellow note. Drawn in English; every release ships in Srpski and German too.</span></div>')

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
    cj["boards"][fname] = {"x": 0, "y": a["y"] + a["h"] + 120, "w": W, "h": H, "title": title, "page": a["page"]}
    json.dump(cj, open(f"{D}/canvas.json", "w")); print(fname, W, H, Hc, len(page) // 1024, "KB")
    cj = json.load(open(f"{D}/canvas.json"))


W = SX + 3 * (SW + GAP) - GAP + 70
B = Board(); y = 30
def row(rid, title, parts, shots, nid=None, at=0):
    global y
    c = storyCard(B, y, rid, title, parts)
    hs = [B.screen(f"{nid or rid}{chr(97 + at + i)}", i, y, t, n, st, wd) for i, (t, n, st, wd) in enumerate(shots)]
    y = rowEnd(c, *hs)
row("DT268", "Served: plates scanned to explore are kept", [
  ("Coach Milan, 9 November 21:46 to 23:14", "Today's plan is not the place for a photo taken to explore. A space to save meals scanned just for exploration: at a restaurant, a photo of each friend's meal, to measure it for them, and for me to take it for the next time. In Recipes, with a label: not crafted, served cooked in another kitchen. AI does the heavy lifting and the mapping."),
  ("Now", "A photo read as Exploring logs nothing, and it is gone when the Plate is cleared unless you tapped Save as an idea. At a table with friends the plates are lost."),
  ("Three steps, three releases", "Step 1, keep and find: Served plates kept, name and dish filled by Chef Mealan, the one question, visits, the group in Recipes, the plate open, I ate this. Step 2, numbers and sharing: ranges from the read, Share the numbers. Step 3, the menu: a photo of the menu on a visit, matched to the plates."),
  ("Step 1: the Plate", "A plate read as Exploring is kept, marked Served. Chef Mealan fills the name and the dish (starter, main, side, dessert, drink); a tap corrects, you add whose. A second photo of the same plate joins it as one more photo. One question at most, as today (about 150 g or about 200 g), the one that moves the numbers most; Skip keeps the range wide. Scan another plate asks whose: Another dish of mine, or Someone else's plate. Don't keep it removes it."),
  ("Step 1: Recipes", "Served is a chip and a group above Made by me. A visit is one card: plates of the same day within a couple of hours, and your tap. Its title is your note (Café Jadran, typed once with the pencil; made up for this drawing); with no note it is the day and the meal. No location is asked. Add a recipe stays; it is left out of the drawing for room."),
  ("The mark", "Three kinds, one path: Served (another kitchen, read from a photo), On paper (yours, not made yet), From the kitchen (cooked and weighed). A Served plate never says Cooked and weighed."),
], [("Now: Recipes", "rdt268a", "draft", "Your own recipes only."), ("Step 1: the Plate, after an Exploring read", "rdt268b", "changed", "Name and dish filled; one question; whose plate next."), ("Step 1: Recipes", "rdt268c", "changed", "The Served chip; a visit as one card.")])
row("DT268", "A Served plate: open it, eat it, share it", [
  ("Step 1: the plate, open", "The photo large and the meal's other photos small under it, as on a meal opened from Plan (DT267). No steps and no Start cooking. The line that it is a read from a photo and that another kitchen often uses more oil and butter than a photo shows. The foods as read. I ate this, Put it on the Plate, Remove."),
  ("Step 2: numbers with a range", "Energy, protein, fat, carbs and PD, each as about a number and its range. The range comes from the read: a low and a high amount for each food. Fat reaches further up. An answered question narrows it. The row in Recipes and the shared picture say about and one number. Not calibrated until the weighed plates are in the photo eval."),
  ("Step 1: I ate this", "On a visit all your dishes go in as one meal, each with its photo, and the total. The plates of the others are not counted. The day counts the middle of the range. The day and the meal are asked out loud, the day of the photos first; the button says where it goes. Everything stays in Served."),
  ("Step 2: Share the numbers", "The photo with the numbers strip through the phone's share sheet, to the friend whose plate it is. It says Served, read from a photo. The same picture Make a post (CR1a) draws: built once, here first."),
], [("Steps 1 to 3: a Served plate, opened from Recipes", "rdt268d", "changed", "Photos, the honest line, the menu's line, ranges, foods, actions."), ("Step 1: I ate this, on a visit", "rdt268e", "changed", "Your dishes as one meal; day and meal asked."), ("Step 2: Share the numbers, on a Served plate", "rdt268f", "changed", "The picture that goes to the friend.")], at=3)
row("DT268", "Step 3: a photo of the menu", [
  ("Coach Milan, 23:12", "Is it possible to use a photo of the menu as additional info for mapping?"),
  ("New", "Add a photo of the menu, once for the visit. Chef Mealan reads it in its own language: the name of each dish, what is in it, the weight where the menu prints it, and the course from the section. Each plate is matched to a line and says so. Where it is not sure which line, that is the one question for that plate. Not this takes a match off."),
  ("Why it matters", "The menu names what a photo cannot show: cream sauce, fried in butter. Menus in Serbia and the region often print grams; that tightens the range more than anything else."),
  ("The limit", "A menu weight is what the kitchen says, often before cooking. It tightens the range; the plate stays Served, not weighed."),
  ("Evals", "The dish guess, the ranges and the menu match each need cases in the photo eval before the step ships."),
  ("Not in DT268", "Make it my recipe (Served to On paper, then cooked to From the kitchen). Friends' accounts. A restaurant or dish list kept by us. Saving the photo to the gallery (DT269, parked)."),
], [("Step 3: the menu, on a visit", "rdt268g", "changed", "The menu read; each plate matched; one question.")], at=6)
board("Stories201.dc.html", "DT268. Served: plates scanned to explore, kept in Recipes, in three steps",
  "9 November 2026 (Coach Milan 21:46 to 23:14). Drawn for approval.",
  B, W, y - 100, "Stories200.dc.html")
