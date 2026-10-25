# Board DT126 (Milan 25 October 13:49 and 13:50: a search bar in the recipes, filters with several options, sorting; "Draw as
# suggested"). Shots from shotDT126.cjs. Self-contained: the same look as genRS.py's boards, without its layers.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.104, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
MARK = ""
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.105")

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
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "changed", "built"))
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.104, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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

W = SX + 2 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT126", "Recipes: search, filters with drop-downs, sort, and a Member list that hides nothing", [
  ("Milan, 13:48, 13:49 and 14:22", "Tester 3's Tuna salata was in Members all along, shared without his name; the Marko chip hid it and the count said 1. We need a search bar in the recipes, filtering with several options, sorting as well. Members and kitchens go into the filter too: soon there will be tens of member chips, and ten kitchens picked are ten chips."),
  ("Why", "Members and Mine are plain lists with two chip rows, cook and kitchen. With five testers and their recipes the lists already need finding, and the cook chip reads a privacy switch as a filter: a recipe shared without a name drops out of its cook's chip, and the count counts the named ones only. That looks like a lost recipe."),
  ("New: one search", "One field at the top of Mine and Members. It takes the same words the food search takes and matches the title, the foods in the recipe (in any of the pilot's languages, through the one food list of DT125) and the cook's name. The line under the bar says what is shown of what: 1 of 5 recipes."),
  ("New: filters, several at once", "The two chip rows of today (members, kitchens) go. Kitchen and Member are drop-downs in the bar: one line per kitchen or member with its count, most recipes first, All at the top; a pick shows in the chip (Kitchen: Balkan). The other chips: Moment (breakfast, lunch, dinner, snack, by the recipe's share of the day), Fits my day (PD at or above today's target), No cooking (no step needs a pot, the culinary rules' needsCooking), With my foods (every food already in your list). A lit chip clears on a tap. The allergy filter stays silent and always on. Search, drop-downs and chips work together. On Mine, Member reads Shared: with members, with Coach Milan, not shared."),
  ("New: sort", "Newest, Most made, Highest PD, Quickest (fewest steps), A to Z. One of them lit, Newest by default, as the list is ranked today."),
  ("New: the Member list tells the truth", "Show my name stays the member's choice per recipe. In the Member drop-down his own line is You, and it counts all of his: You · 2, one without your name; the unnamed one reads shared by you, without your name, with the switch one tap away on its page. Everyone else finds it under Without a name, as shared by a member."),
  ("Where it shows", "Members and Mine get the whole bar. Coach's list on Clients gets the search only. The recipe page does not change."),
  ("Not in this step", "Saved filters. Tags of your own on a recipe. A filter by a food you want to use up (that is the Plate's job)."),
])
h = rowEnd(cy,
  B.screen("DT126a", 0, y, "Now: the Marko chip, one recipe", "r126now", "now", "Members with the cook chip on. Tuna salata, shared without a name, is not here and the count says 1."),
  B.screen("DT126b", 1, y, "New: the search finds it", "r126search", "changed", "Tuna typed: the title, the foods in it and the cook's name answer. The bar: Kitchen and Member as drop-downs, four chips, the sort. No chip rows."))
y = h
h = rowEnd(
  B.screen("DT126c", 0, y, "New: two filters and a sort", "r126filter", "changed", "No cooking and Fits my day lit, Highest PD. The line says 2 of 5 and names the filters."),
  B.screen("DT126d", 1, y, "New: the Member drop-down, open", "r126cook", "changed", "One line per member with a count; You · 2, one without your name. Thirty members are thirty lines, not thirty chips."))
y = h
h = rowEnd(
  B.screen("DT126e", 0, y, "New: the same bar on Mine", "r126mine", "changed", "Kitchen: Balkan picked, Most made. Member reads Shared here."))
y = h
h = rowEnd(
  B.screen("DT126f", 0, y, "Built: the search finds it", "b126search", "built", "0.2.105 as it renders: tuna typed, 1 of 5 recipes, Clear all."),
  B.screen("DT126g", 1, y, "Built: two filters and a sort", "b126filter", "built", "Fits my day and No cooking lit, Highest PD, the line names both."))
y = h
h = rowEnd(
  B.screen("DT126h", 0, y, "Built: the Member drop-down", "b126cook", "built", "As the cook sees it: You · 2, one without your name; the unnamed one says so on its tile."),
  B.screen("DT126i", 1, y, "Built: Mine", "b126mine", "built", "Kitchen: Balkan, Most made. Shared in place of Member."))
y = h
board("Stories72.dc.html", "DT126. Recipes: one search, drop-downs for kitchen and member, filters that stack, a sort",
  "25 October 2026 (Milan 13:48 to 14:22; redrawn at 14:22: members and kitchens into the filter). Now: 0.2.104, untouched. New: the bar drawn in. Built: 0.2.105 as it renders, green chip.",
  B, W, y - 100, "Stories71.dc.html")
