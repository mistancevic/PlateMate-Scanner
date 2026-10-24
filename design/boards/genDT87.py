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
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.86, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: main 0.2.86, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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

# ===== Stories58: DT87 to DT90, release 1 and 2 =====
B = Board(); y = 30
cy = storyCard(B, y, "DT87", "The button says what it does: Fit to my target", [
  ("Your call, 11:43", "Make it a dinner is the wrong label. It was Fit to my target, with the chef hat, so a person knows the AI is behind it. The job: Chef Mealan helps the meal land in its planned range."),
  ("Now", "Since 0.2.9 (15 October) the button says Make it a lunch or Make it a dinner. Make it then means three things on one Plate: ask the AI, cook it, take it as it is. Next to Keep it as it is, the hat shrinks to a dot (DT87b)."),
  ("New", "Fit to my target, with the chef hat at full size. The line under it: Chef Mealan adds what it needs to land your dinner in its range."),
  ("Empty plate", "The button stays grey, and one line says why: Add one food first. Chef Mealan builds the dinner around it."),
  ("Must not change", "Without the AI, the button falls back to the quick fit and says so, as now."),
])
h = rowEnd(cy,
  B.screen("DT87a", 0, y, "Now: empty Plate", "dt87NowEmpty", "now", "Make it a dinner, grey. Nothing says why."),
  B.screen("DT87b", 1, y, "Now: one food added", "dt87NowOne", "now", "Make it a dinner. The hat is a dot."),
  B.screen("DT87c", 2, y, "New: empty Plate", "dt87NewEmpty", "changed", "Fit to my target, grey, and the line that says why."),
  B.screen("DT87d", 3, y, "New: one food added", "dt87NewOne", "changed", "Fit to my target with the hat. The line names the range."))
y = h
cy = storyCard(B, y, "DT88", "Chef Mealan's dinner in a cook's words", [
  ("Found in the walk, 11:28", "The chips read + 135 g penne, dry. The plate's line says the penne, dry sets the energy. The toast Added. Set the amount you actually have. stays over three screens."),
  ("New, the ideas", "The head says what the screen is for: A dinner around your chicken. Foods as a cook says them: 135 g dry penne, 150 g cooked chicken breast."),
  ("New, on the plate", "The name is short, and how to weigh it goes under it: weigh it dry, weigh it cooked. The line: Chef Mealan's Italian dinner, around your chicken. Change any amount you like."),
  ("The toast", "It closes when you leave the step it belongs to."),
  ("Not here", "The amounts stay as they are in this release. DT91 changes them."),
])
h = rowEnd(cy,
  B.screen("DT88a", 0, y, "Now: Make it a dinner", "dt88NowIdeas", "now", "One idea of three. Chips in database words: penne, dry."),
  B.screen("DT88b", 1, y, "Now: on the plate", "dt88NowPlate", "now", "The penne, dry sets the energy."),
  B.screen("DT88c", 2, y, "New: the ideas", "dt88NewIdeas", "changed", "A dinner around your chicken. 135 g dry penne."),
  B.screen("DT88d", 3, y, "New: on the plate", "dt88NewPlate", "changed", "Chicken breast, weigh it cooked. Penne, weigh it dry."))
y = h
cy = storyCard(B, y, "DT89", "How to make it, for Chef Mealan's dinner", [
  ("Now", "After Make it, a Chef Mealan dinner goes to How do you want to eat it?, the ways written for a yogurt bowl. All in one stirs 135 g dry penne into cold passata. Protein first offers the chicken with a pinch of cinnamon, then the treat. No heat, no time, and no way to ask for steps."),
  ("New", "How to make it. Chef Mealan drafts the steps on this step, at the plate's amounts, and they go with the recipe. Drawn from the real How to make it screen."),
  ("The rule", "A plate with a food you cook (dry pasta, raw meat, rice, potatoes) always gets steps. The three bowl ways stay only for ready foods, like skyr with fruit."),
  ("With the AI off", "Write my own, as on the recipe page."),
])
h = rowEnd(cy,
  B.screen("DT89a", 0, y, "Now: after Make it", "dt89NowMake", "now", "How do you want to eat it? Dry penne stirred in a bowl."),
  B.screen("DT89b", 1, y, "New: after Make it", "dt89NewMake", "changed", "How to make it, Chef Mealan's steps at your amounts."))
y = h
cy = storyCard(B, y, "DT90", "What is saved is what you made", [
  ("Now", "How did it go? asks All as the recipe says, though there was no recipe. Save promises the foods, the grams, the steps and the photos, and keeps no steps: the recipe page says No steps yet. Nothing says Chef Mealan made it, and no kitchen is picked."),
  ("Your finding, 11:37", "You named the dish with Yeast in the title. The name was gone, and the last step gave you a fritters recipe. Not reproduced here without the AI: the first thing to test in the real AI round."),
  ("New, How did it go?", "As the steps say, Not as the steps say."),
  ("New, the recipe page", "Under the title: Chef Mealan's Italian dinner, around your chicken. Made on 24 October. The steps from How to make it are there. Its kitchen: Italian, picked. The foods in a cook's words."),
  ("Your name", "A name you type stays. Chef Mealan's title fills the name only while it is empty."),
])
h = rowEnd(cy,
  B.screen("DT90a", 0, y, "Now: How did it go?", "dt90NowMade", "now", "All as the recipe says. There was no recipe."),
  B.screen("DT90b", 1, y, "New: How did it go?", "dt90NewMade", "changed", "As the steps say."),
  B.screen("DT90c", 2, y, "Now: the recipe page", "dt90NowPage", "now", "No steps yet. No source, no kitchen."),
  B.screen("DT90d", 3, y, "New: the recipe page", "dt90NewPage", "changed", "Who made it, the steps, Italian picked."))
y = h
board("Stories58.dc.html", "DT87 to DT90. Making a dinner with Chef Mealan: the words, the steps, what is saved",
  "24 October 2026 (Milan 11:37 to 11:49: making a recipe with Chef Mealan is broken; draw it first). Walked on main 0.2.86: an empty Plate at 18:30, Maintain at 2,800 kcal, kitchens Balkan, Italian and Mediterranean, one food added: chicken breast, 150 g. Release 1 (DT87, DT88, DT90) and release 2 (DT89). Approved at 12:12, built in 0.2.87 with DT91: the Built screens are on the DT91 board.",
  B, W, y - 100, "Stories57.dc.html")

# ===== Stories59: DT91, release 3 =====
B = Board(); y = 30
cy = storyCard(B, y, "DT91", "The dinner itself: the amounts, the cooking foods, raw weight", [
  ("Now, the amounts", "The app gives the whole gap to one food. The dinner needs 686 kcal more than the chicken, so the penne gets 135 g dry; a normal portion is 80 to 100 g. The potato dinner needed 632 g of potatoes and the bulgur dinner 720 g of cooked bulgur, over the 450 g cap, so both were dropped without a word: one idea of three."),
  ("Now, the foods", "Only foods that carry numbers. No onion, no garlic, no herb, though the dish's line names oregano. The steps may use only the listed foods, salt, pepper and water."),
  ("Rule 1, the range", "The dinner lands in its range: about 933 kcal, within 10 %, so 840 to 1,026 kcal, at PD 6.4 or more. 10 % is the same measure Metrics uses for a day lived by the plan."),
  ("Rule 2, a normal base", "The base stays a normal portion: dry pasta 70 to 110 g, raw potatoes 200 to 400 g, dry bulgur or rice 60 to 100 g. Code holds these, not the AI. The rest of the energy comes from the other foods, which Chef Mealan sizes for the dish; the app checks."),
  ("Rule 3, cooking foods", "Chef Mealan names onion, garlic, herbs and spices for the dish. Onion and garlic are counted. A herb, salt and pepper go under For cooking, not counted. The steps may use them."),
  ("Rule 4, raw weight", "What you cook goes on the plate raw: 200 g chicken breast, about 150 g cooked. The numbers stay the same; the scale shows what you weigh. Code holds the raw to cooked factor."),
  ("When an idea fails", "Its card says why, instead of disappearing."),
  ("The drawn numbers", "Calculated from typical values: Italian 909 kcal, PD 7.9; Balkan 917 kcal, PD 7.1; Mediterranean 940 kcal, PD 8.6."),
  ("Before any build", "These rules change what Chef Mealan is asked. A round with the real AI comes first."),
])
h = rowEnd(cy,
  B.screen("DT91a", 0, y, "Now: Make it a dinner", "dt88NowIdeas", "now", "One idea: 135 g dry penne. Two dropped without a word."),
  B.screen("DT91b", 1, y, "New: the ideas", "dt91NewIdeas", "changed", "Three dinners in the range, cooking foods named."),
  B.screen("DT91c", 2, y, "New: on the plate", "dt91NewPlate", "changed", "200 g raw chicken, 100 g dry penne, onion, garlic. 909 kcal."),
  B.screen("DT91d", 3, y, "New: How to make it", "dt91NewMake", "changed", "The steps cook the raw chicken and use the onion and garlic."))
y = h
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.87")
cy = storyCard(B, y, "Built, 0.2.87", "DT87 to DT91, on main", [
  ("Your call, 12:12", "All stories may go to code. You test it in reality; the dry and cooked part may be tricky, let's see."),
  ("Built", "Fit to my target with the hat. The ideas name the range and are written in a cook's words. The penne stops at 110 g dry and the passata, parmesan and oil grow with it. The potato dinner fits at 400 g. The bulgur bowl says why it did not fit. Herbs come as For cooking, not counted. How to make it drafts the steps at the plate's amounts. The recipe keeps the steps, its kitchen and who made it."),
  ("A name you type", "It stays. A dish from another recipe that you name yourself is saved as a recipe of its own, adapted from it, and Save lands on it. This may be your Yeast and fritters case: test it first."),
  ("Not changed", "The toast closes after 4 seconds, as before: in the walk it stayed only because the screens came faster."),
  ("Journeys", "New walkthrough chef-dinner, with Chef Mealan's answers as stand-ins. The real AI answers are for your preview."),
])
cy = y + int((cy - y) * 0.88)
h = rowEnd(cy,
  B.screen("DT92a", 0, y, "Built: one food added", "dt92BuiltOne", "built", "Fit to my target. Chicken breast, weigh it cooked, about 200 g raw."),
  B.screen("DT92b", 1, y, "Built: the ideas", "dt92BuiltIdeas", "built", "840 to 1,026 kcal. Two fit, the bulgur bowl says why."),
  B.screen("DT92c", 2, y, "Built: on the plate", "dt92BuiltPlate", "built", "110 g dry penne, the rest grown with it. For cooking, not counted."),
  B.screen("DT92d", 3, y, "Built: How to make it", "dt92BuiltMake", "built", "Chef Mealan's steps at your amounts."))
y = h
h = rowEnd(B.screen("DT92e", 0, y, "Built: How did it go?", "dt92BuiltMade", "built", "As the steps say."),
  B.screen("DT92f", 1, y, "Built: the recipe page", "dt92BuiltPage", "built", "Who made it, the herbs, the steps, a cook's words."))
board("Stories59.dc.html", "DT91. Chef Mealan's dinner: amounts in the range, the cooking foods, raw weight",
  "24 October 2026 (Milan 11:37 to 11:49). Release 3, on its own board: it changes what Chef Mealan is asked and what the app calculates. The same walk as DT87 to DT90. All five stories approved at 12:12 and built in 0.2.87 with DT87 to DT90, not released: the real AI answers are for the preview.",
  B, W, y - 100, "Stories58.dc.html")
