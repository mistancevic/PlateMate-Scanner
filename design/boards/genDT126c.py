# Board DT126c (Milan 25 October 15:08: "Mine, coach's, members should be in the filter selection drop down as, say Cook. Or
# creator."). No tabs. Shots from shotDT126c.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.105, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.105, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT126c", "Recipes: no tabs, one list, Made by in the filter", [
  ("Milan, 15:00 to 15:08", "The search is universal and relates to any tab. Tabs are also part of the filter selection. Mine, Coach's, Members should be in the filter drop-down, as Cook, or Creator."),
  ("Why", "0.2.105 has three tabs and a bar per tab, each with its own state. Where a recipe comes from is a filter question like Kitchen, so it goes into the filter set and the tabs go."),
  ("New: one list, one bar", "Recipes is one list under one bar. The filter set: the search, Made by, Kitchen, Moment, Fits my day, No cooking, With my foods, the sort. Made by is a drop-down: Me, Coach Milan, each member with a count, A member without a name. Idle, the list is grouped by who made it, Made by me, Made by Coach Milan, Made by members, two rows per group and a line for the rest; Add a recipe sits under the bar. The line under the bar says 10 recipes."),
  ("New: a search or a filter", "The same list, only the hits, grouped with the counts in the headings; an empty group drops out. Made by: Marko with No cooking and nothing left says so, with the filters named. Clear all empties the set. Each row keeps its line: one portion for mine and the coach's, your portion for the meal ahead for members'. The allergy filter stays silent and always on."),
  ("The word", "Made by, because the app already says made by (the cook of a plate, madeBy) and Cook is the publishing permission on Clients. Creator fits too; say which."),
  ("You, as a member", "Marko sees himself as Me, and his recipe shared without a name counts under Me: 2, one without your name; its row says shared by you, without your name. For others it sits under A member without a name."),
  ("The address", "/my-recipes?member=Marko still opens Recipes with Made by: Marko. The links All of Marko's recipes › on a member's recipe page set the same."),
  ("Not in this step", "The coach's list on Clients. Saved filters. One field over recipes and foods together."),
])
h = rowEnd(cy,
  B.screen("DT126c-a", 0, y, "Now: tabs and a bar per tab", "r126cNow", "now", "0.2.105. Members' bar with quark typed; Mine has another; the tabs decide what you see."),
  B.screen("DT126c-b", 1, y, "New: no tabs, one list, grouped", "r126cIdle", "changed", "Idle: Made by me, Made by Coach Milan, Made by members, two rows each and a line for the rest."))
y = h
h = rowEnd(
  B.screen("DT126c-c", 0, y, "New: quark typed", "r126cSearch", "changed", "Only the hits, grouped, counts in the headings. 3 of 10."),
  B.screen("DT126c-d", 1, y, "New: Made by, open", "r126cMadeBy", "changed", "Me, Coach Milan, each member, A member without a name, with counts."))
y = h
h = rowEnd(
  B.screen("DT126c-e", 0, y, "New: filters stack, and an empty answer", "r126cEmpty", "changed", "Made by: Marko and No cooking leave nothing; the line names both."))
y = h
board("Stories74.dc.html", "DT126c. Recipes: no tabs, one list under one bar, Made by in the filter set",
  "25 October 2026 (Milan 15:00 to 15:08). Now: 0.2.105, untouched. New: drawn in. Nothing built. Replaces DT126b (Stories73).",
  B, W, y - 100, "Stories73.dc.html")
