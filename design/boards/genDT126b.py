# Board DT126b (Milan 25 October 15:00 to 15:02: "the search is universal and relates to any tab"; "tabs are also part of the
# filter selection"; "Draw"). Shots from shotDT126b.cjs.
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
cy = storyCard(B, y, "DT126b", "Recipes: one bar for the whole tab, and the tabs as part of the filter", [
  ("Milan, 15:00 to 15:02", "The search is universal and relates to any tab. Now we have three filters and a mess. Tabs are also part of the filter selection."),
  ("Why", "0.2.105 put a bar on Members and another on Mine, each with its own state. A tab answers one question, where a recipe comes from, and that is the same kind of question as Kitchen or Member. Two bars that forget each other and a third place that filters without saying so is the mess."),
  ("New: one filter set", "Recipes has one filter set: the search, From, Kitchen, Moment, Fits my day, No cooking, With my foods, and the sort. One bar above the tabs holds it, and it keeps its state when you switch tabs. From is a field of the set: Mine, Coach Milan, Members (all), then each member, then Without a name, each with a count. The three tabs are shortcuts for the first three lines of From."),
  ("New: idle, the tabs browse", "Nothing typed and nothing lit: Recipes looks as today, Mine open, each tab with its count. Add a recipe stays on Mine."),
  ("New: a search folds the tabs", "The moment you type or light a chip, the tabs become a count row, none lit, and the list is one, grouped by source: Mine, Coach's, Members, each group with its count and an empty group saying so in one line. A row keeps the line of its source: one portion on Mine, your portion for the meal ahead on Members. The line under the bar says 3 of 10. Tapping a tab while searching sets From to that source and narrows the list; tapping it again clears From and the groups return. Clear all empties the set and the tabs come back."),
  ("New: Shared stays a state", "From says where a recipe came from; Shared with members on a Mine row says where it went. Shared leaves the bar: a recipe of yours shared with members is still found under Mine, and under Members as shared by you."),
  ("Where it shows", "The Recipes tab. The coach's recipe list on Clients gets the same search later, not now. The recipe pages do not change."),
  ("Not in this step", "Saved filters. A food to use up as a filter (the Plate's job). Searching across Recipes and foods in one field."),
])
h = rowEnd(cy,
  B.screen("DT126b-a", 0, y, "Now: a bar on Members", "r126bNowM", "now", "0.2.105. Members has its bar, with its own state; quark typed here finds nothing of Mine."),
  B.screen("DT126b-b", 1, y, "Now: another bar on Mine", "r126bNowMine", "now", "Mine has its own bar, blank again. Three tabs, two bars, nothing shared."))
y = h
h = rowEnd(
  B.screen("DT126b-c", 0, y, "New: idle, one bar above the tabs", "r126bIdle", "changed", "Nothing typed, nothing lit: the tabs browse as today, each with its count."),
  B.screen("DT126b-d", 1, y, "New: a search folds the tabs", "r126bSearch", "changed", "Quark: the tabs become counts, the list is one, grouped Mine, Coach's, Members."))
y = h
h = rowEnd(
  B.screen("DT126b-e", 0, y, "New: From, open", "r126bFrom", "changed", "The tabs as its first lines, then each member, then Without a name, with counts."),
  B.screen("DT126b-f", 1, y, "New: chips with no search", "r126bChips", "changed", "Fits my day and No cooking: every source answers, grouped; a tab tap narrows to one."))
y = h
board("Stories73.dc.html", "DT126b. Recipes: one bar above the tabs, From as a filter, a search that folds the tabs into one grouped list",
  "25 October 2026 (Milan 15:00 to 15:02). Now: 0.2.105, untouched. New: drawn in. Nothing built. Replaces the per-tab bars of DT126.",
  B, W, y - 100, "Stories72.dc.html")
