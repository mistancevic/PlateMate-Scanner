# Board DT301 (from shotDT301.cjs; Coach Milan 14 November 17:25 to 17:33, Draw): the Plate, more prominent. Template from B143.
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



W = SX + 4 * (SW + GAP) - GAP + 70
B = Board(); y = 30
def row(rid, title, parts, shots, nid=None, at=0, arrows=True):
    global y
    c = storyCard(B, y, rid, title, parts)
    hs = [B.screen(f"{nid or rid}{chr(97 + at + i)}", i, y, t, n, st, wd) for i, (t, n, st, wd) in enumerate(shots)]
    if arrows:
        for i in range(1, len(shots)): B.html.append(f'<div style="position:absolute;left:{B.x(i) - GAP}px;top:{y + TOP + 220}px;width:{GAP}px;text-align:center;font-size:44px;font-weight:900;color:#2a72d9">→</div>')
    y = rowEnd(c, *hs)
row("Now", "Flow 1. An idea for what you crave, today", [
  ("The flow", "1. You open the Plate. 2. You type crêpes; nothing is found; you tap Ask Chef Mealan for one. 3. One idea, with its foods and how to make it. 4. Put it on my plate."),
  ("What goes wrong", "The box hardly shows and its grey text reads like something typed. Searching and asking Chef Mealan are two separate steps, and you get one idea at a time."),
], [("1. Plate opens", "p301a", "draft", "The box and three lines of help."), ("2. Crêpes typed", "p301b", "draft", "Nothing found; Ask Chef Mealan for one."), ("3. Chef Mealan's idea", "p301k", "draft", "You tap Put it on my plate."), ("4. Put it on my plate", "p301l", "draft", "The plate with that dish.")], nid="DT301", at=0)
row("New", "Flow 1. The same, with Find ideas", [
  ("Step 1", "Under What are you craving?: Get an idea for what you crave, or build your own plate. Chef Mealan sets the amounts. The meal line moves up, under it: it says what this plate is for. Then the ideas block, one card: the box in the round look of the chat bar, grey text Type what you crave or want to cook, and Find ideas, the one button."),
  ("Step 2", "Find ideas looks in your recipes, Coach's, the members' and Chef Mealan's starters, and asks Chef Mealan at the same time. Nothing found: his ideas come in the same card under the chef's hat, the same dish or similar ones. Three, each short: the name, the PD, one line why, and View more."),
  ("Step 3", "View more opens one idea: its foods, how to make it. Save in My recipes on the left, Put it on my plate on the right (21:04). An idea is not saved by itself. View less closes it. A new set of ideas: Find ideas again. No Ask Chef Mealan button, no Another idea."),
  ("Step 4", "Put it on my plate: no change."),
], [("1. Plate opens", "p301e", "changed", "Meal line up; box and Find ideas."), ("2. Find ideas", "p301f", "changed", "Three ideas, each short."), ("3. View more", "p301m", "changed", "Save, or Put it on my plate."), ("4. Put it on my plate", "p301l", "same", "As today.")], nid="DT301", at=4)
row("Also", "Flow 1 when dishes are found, and saving an idea", [
  ("Now", "Chicken: dishes as you type; under them a line and a link, Ask Chef Mealan for another."),
  ("New", "Chicken, Find ideas: your dishes first, then Chef Mealan's three ideas under them in the same card, each short with View more."),
  ("Saving an idea", "Save in My recipes turns into ✓ Saved in My recipes; Put it on my plate stays. Today every idea is kept in My recipes by itself; that line goes."),
], [("Now: dishes found", "p301i", "draft", "Dishes, a line, a link."), ("New: dishes found", "p301j", "changed", "Your dishes, then three ideas."), ("New: an idea saved", "p301q", "changed", "✓ Saved in My recipes.")], nid="DT301", at=8, arrows=False)
row("Now", "Flow 2. Build your own plate, today", [
  ("The flow", "1. You open the Plate. 2. Further down, On the plate, empty: four big buttons stacked. You tap Manual. 3. The Manual sheet."),
], [("1. Plate opens", "p301a", "draft", "As in flow 1."), ("2. On the plate, empty", "p301c", "draft", "Four buttons stacked."), ("3. Manual", "p301n", "draft", "Type a food.")], nid="DT301", at=11)
row("New", "Flow 2. The same, with a plate and Add a food", [
  ("Step 2", "New design, for your approval: an empty plate drawn in the card, with Nothing on the plate yet. Then the first part as a heading, Add a food, over the four tiles in two rows, icon above the word: Manual, Scan, Photo of my meal, Say what you have."),
  ("Step 3", "Manual: no change."),
], [("1. Plate opens", "p301e", "changed", "As in flow 1."), ("2. On the plate, empty", "p301g", "changed", "A plate; Add a food over the tiles."), ("3. Manual", "p301n", "same", "As today.")], nid="DT301", at=14)
row("Now", "Flow 3. Bring a recipe, today", [
  ("The flow", "1. You open the Plate. 2. Under the four buttons, Start from a recipe: Screenshot and Link. You tap Link. 3. The box for the link."),
], [("1. Plate opens", "p301a", "draft", "As in flow 1."), ("2. Start from a recipe", "p301d", "draft", "Screenshot, Link."), ("3. The link box", "p301o", "draft", "Paste the link, Read it.")], nid="DT301", at=17)
row("New", "Flow 3. The same, as the second part", [
  ("Step 2", "A line, then the second part as a heading: Have a recipe? Start from it. The buttons say what the tap does: Use a screenshot, Paste a link. The same two buttons in Add a recipe on Recipes get the same words."),
  ("Step 3", "The same box. Its line names the button by its new words: ... so they don't open for us: tap Use a screenshot there. Its button after a login error: Use a screenshot. How to, step 1: Open Recipes. Under Add a recipe, tap Use a screenshot."),
  ("Fit to my target (23:30)", "One filled button per screen: on an empty plate Find ideas is the filled one; Fit to my target is white with a blue border until a food is on the plate, then filled, as today."),
  ("How to (21:20)", "Found while building: How to, What should I eat now?, says the old steps. Step 2: Type a dish or a craving, like sarma or chocolate, and tap Find ideas. Step 3: Tap one of your dishes, or View more on one of Chef Mealan's ideas, then Put it on my plate."),
  ("Languages", "Ten changed lines and new ones (Find ideas, View more, View less, Chef Mealan's ideas, Save in My recipes, Saved in My recipes), in English, Serbian and German. The help line under the box, Ask Chef Mealan for one or for another, Another idea and Kept in My recipes as an idea go."),
], [("1. Plate opens", "p301e", "changed", "As in flow 1."), ("2. Have a recipe?", "p301h", "changed", "The second part, as a heading."), ("3. The link box", "p301p", "changed", "Its line, in the new words.")], nid="DT301", at=20)
board("Stories223.dc.html", "DT301. The Plate: Find ideas, a plate, and a recipe to bring in",
  "14 November 2026 (Coach Milan 17:25 to 20:59: the Plate more prominent; the line under the title; the meal line up; the ideas block with Find ideas, the one button that looks in your recipes and asks Chef Mealan; three ideas with View more; On the plate in two parts; each scenario followed from the first screen; 20:59: Have a recipe? Start from it; 21:05: Save in My recipes; 23:30: Fit to my target outlined on an empty plate, the How to lines). Drawn for approval.",
  B, W, y - 100, "Stories222.dc.html")
