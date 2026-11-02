# Boards DT211 (Stories158) and DT212 (Stories159), version 2 (Coach Milan 2 November 10:41 to 10:55); DT211 version 3 (11:09) in genDT211v3.py. Panels from shotDT211.cjs and shotDT211v2.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.52, as it is"), "phone": ("#5b6b8a", "#fff", "Your phone, 00:42"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
    # a computer screen across the three columns
    def wide(s, nid, y, title, name, status, what):
        bg, fg, label = CHIP[status]; WW = 3 * SW + 2 * GAP
        im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((WW * 2, int(im.size[1] * WW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=74)
        h = int(im.size[1] / 2)
        s.html.append(f'<div style="position:absolute;left:{s.x(0)}px;top:{y}px;width:{WW}px">'
          f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
          f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span> <span style="font-size:12.5px;color:#172742;margin-left:8px">{what}</span></div>'
          f'<div style="margin-top:8px"><img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{WW}px;border-radius:10px;border:1.5px solid {"#2e7be8" if status == "changed" else "#d1dcf0"};display:block"></div></div>')
        return y + TT + 8 + CH + 8 + h
    def render(s, W, H): return f'<div style="position:relative;width:{W}px;height:{H}px">{"".join(s.html)}</div>'

def storyCard(B, y, rid, title, parts, w=350):
    body = "".join(f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>' for h, t in parts)
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
                  f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{rid}</span>{title}</div>{body}</div>')
    return y + 70 + sum(30 + math.ceil(len(re.sub("<[^>]+>|&amp;", "x", t)) / 40) * 21 for _, t in parts)
def rowEnd(*hs): return max(hs) + 140

LEGEND = ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "changed"))
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.52, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
B = Board(); y = 30
cy = storyCard(B, y, "DT211", "Cooking you can find, version 6", [
  ("Coach Milan, 00:44 to 11:09", "I couldn't find the voice on the recipe page. One Start cooking, after the review of everything. The picture slots showed double blue frames and sat too close. A recipe with no steps: the draft is already in the Steps block, so Start cooking can wait there, grey, with a note. On Make, say what the ticks are for."),
  ("The picture slot", "One dashed frame of 72 px, a + over the word Picture, nothing else; 14 px between the steps. The blue outline on the first slot is this board's marking, not the app. The cause today: the step number's round style also catches the words in the slot, so the word is squeezed and cut. Picture is the app's word for an image a person or Chef Mealan adds (Pictures for the steps, Draw a picture, Picture by Chef Mealan); Photo is what a camera takes (Photo of my meal, Add my photo)."),
  ("Start cooking in the Steps block", "At the end of the Steps block, after the last step and the line about pictures: Start cooking, and under it: 5 steps, read aloud. Say next, back or repeat. A second phone can show them. It opens cooking straight away; Make stays behind it. Change it first and Edit recipe stay below the block."),
  ("No steps yet", "Draft the steps with Chef Mealan and Write my own stay where they are. Under them Start cooking is grey: Start cooking reads the steps aloud, one at a time. It opens once the steps are here: drafted by Chef Mealan or written by you."),
  ("Make", "Only the title of the steps block changes: Tick each step when it is done."),
  ("Version 6 (11:33): cooking, then eating", "Make rounds off the cooking: Photos while you cook (the prep and the steps), then The meal, the final look (one photo when it is on the plate), then How did the cooking go (as the steps say, or not, with what was different). Then Cooked. Next: Feedback. Feedback is the eating: the final photo comes along from Make, then How much did you eat, How did it taste, the line for your coach. Feedback's own photo box goes. This replaces the photo and How did it go parts of versions 4 and 5."),
  ("Version 5 (11:28): two sets of photos", "Make keeps the photos of the making, the prep and the steps, as many as you like, under Photos while you cook; Make's line under the title becomes Tick the steps as you go, and take photos while you cook. Feedback asks for the meal as it looks at the end, its own photo, under The meal, the final look; the cooking photos show under it, smaller, as While you cooked."),
  ("Version 4 (11:22): Make, then Feedback", "How did it go and How much did you eat move from Make to the top of Feedback, as they are, with How did it taste after them; the line under Feedback's title says all three. Make ends on one main button in the Next pattern of Me and Your summary: Cooked. Next: Feedback, with How it went, how much you ate, and how it tasted under it. Later today and Not after all keep the card for Today with no rating, as today."),
])
h = rowEnd(cy,
  B.screen("DT211a", 0, y, "Now: a recipe", "r211a3", "now", "The slot cut off, steps touching; Cook it as written below the block."),
  B.screen("DT211b", 1, y, "New: a recipe, version 3", "r211b3", "changed", "One dashed slot; Start cooking at the end of the Steps block."),
  B.screen("DT211e", 2, y, "New: a recipe with no steps", "r211e3", "changed", "Start cooking grey in the block, with why."))
y = h
h = rowEnd(B.screen("DT211c", 0, y, "Now: Make", "r211c3", "now", "The steps, boxes with no word what for."),
  B.screen("DT211f", 1, y, "New: Make", "r211c4", "changed", "Tick each step when it is done."),
  B.screen("DT211d", 2, y, "Now: cooking", "r211d", "now", "The voice, Use another screen. Stays as it is."))
y = h
h = rowEnd(B.screen("DT211g", 0, y, "Now: the end of Make", "r211m0", "now", "How did it go, How much, then Rate it."),
  B.screen("DT211h", 1, y, "New: Make, v6", "r211m3", "changed", "Photos while you cook, the final photo, how the cooking went."),
  B.screen("DT211i", 2, y, "Now: Feedback", "r211f0", "now", "Starts at how it tasted."))
y = h
h = rowEnd(B.screen("DT211j", 0, y, "New: Feedback, v6", "r211f3", "changed", "The eating: the final photo, how much, the taste."))
y = h
board("Stories158.dc.html", "DT211. Cooking you can find (v6)",
  "2 November 2026 (Coach Milan 00:44 to 11:33). Version 6: Make rounds off the cooking with the final photo and how the cooking went; Feedback is the eating. Version 5: photos while you cook on Make, the final photo of the meal on Feedback. Version 4: Make ends on Cooked. Next: Feedback; How it went moves to Feedback. Version 3: one dashed slot, Start cooking inside the Steps block, grey until there are steps, Make's title. Now: 0.3.52, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories157.dc.html")
