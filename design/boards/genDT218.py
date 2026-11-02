# Boards DT218 to DT221 on one board (Stories164; Coach Milan 2 November 17:53 to 17:58), from /home/claude/walk/shotDT218.cjs: the strip after eating, a photo with no foods, the two Lock buttons, the short not-understood line. Built on genDT216.py.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.56, as it is"), "phone": ("#5b6b8a", "#fff", "Your phone, 00:42"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.56, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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




W = SX + 4 * (SW + GAP) - GAP + 70
B = Board(); y = 30
c = storyCard(B, y, "DT218", "After eating, a way out of the strip", [
  ("Coach Milan, 17:53", "The blue message can't be resolved. On click it lands on Today and then nothing."),
  ("Now", "After Eaten, the strip waits 30 minutes for the last question: how did it carry you. Go on lands on Today, where nothing asks yet. There is no way to close it."),
  ("New: Go on", "Scrolls to the meal's card on Today and opens the question there: Light and awake, Fine, Heavy, tired. Answer now, or when Chef Mealan asks."),
  ("New: the ✕", "On the strip, 44 px. It ends the cook without the last answer. The meal's card keeps everything else: photos, steps, how the cooking went."),
  ("Your answer", "Closes the cook. The strip goes."),
])
h1 = B.screen("DT218a", 0, y, "Now: Today after eating", "r218a", "now", "The strip says 28 more minutes. Go on lands here; nothing asks; no ✕.")
h2 = B.screen("DT218b", 1, y, "New: Go on and ✕", "r218b", "changed", "Go on opens the question on the meal's card. ✕ on the strip ends the cook.")
y = rowEnd(c, h1, h2)
c = storyCard(B, y, "DT219", "A photo with no foods", [
  ("Coach Milan, 17:53", "No option to empty the Plate, it is blocked with this photo. Retake, read again: empty again, but then Empty plate was there."),
  ("Now", "The photo was read and found 0 foods. It stays on the Plate as a card. Empty plate shows only when there are foods, so the only way out is Retake."),
  ("New: Empty plate", "Shows whenever the Plate has foods or a photo."),
  ("New: no foods found", "The photo is not put on the Plate. Chef Mealan says so in one line, with Take it again and Add the foods myself. The Plate stays as it was."),
])
h1 = B.screen("DT219a", 0, y, "Now: 0 foods read", "r219a", "now", "The photo card with 0 foods; no Empty plate.")
h2 = B.screen("DT219b", 1, y, "New: Empty plate", "r219b", "changed", "Empty plate whenever there are foods or a photo.")
h3 = B.screen("DT219c", 2, y, "New: no foods found", "r219c", "changed", "One line from Chef Mealan; Take it again or Add the foods myself.")
y = rowEnd(c, h1, h2, h3)
c = storyCard(B, y, "DT220", "Two buttons, one name", [
  ("Coach Milan, 17:53", "Lock the recipe. I don't know what the steps are for! And after the steps again Lock the recipe, the same as on the Plate."),
  ("Now", "On the Plate, Lock the recipe (white) opens How to make it. Under the steps, Lock the recipe (blue) keeps them. Two buttons, one name, two jobs."),
  ("New: on the Plate", "The white button says where it goes: How to make it ›"),
  ("New: under the steps", "One line says what the steps are for: Make reads them aloud, one at a time, and you tick them as you go. The blue button says what comes next: Lock it and cook ›"),
])
h1 = B.screen("DT220a", 0, y, "Now: the Plate", "r220a", "now", "Lock the recipe (white), at the bottom, opens How to make it.")
h2 = B.screen("DT220b", 1, y, "New: the Plate", "r220b", "changed", "The same button: How to make it ›")
h3 = B.screen("DT220c", 2, y, "Now: How to make it", "r220c", "now", "Lock the recipe again, blue. What the steps are for is not said.")
h4 = B.screen("DT220d", 3, y, "New: How to make it", "r220d", "changed", "The line on what the steps are for; Lock it and cook ›")
y = rowEnd(c, h1, h2, h3, h4)
c = storyCard(B, y, "DT221", "Short when it doesn't catch you", [
  ("Coach Milan, 17:58", "When the app doesn't understand, it says a very long and unnecessary sentence, especially all the words that trigger action."),
  ("Now", "The phone reads aloud: I heard you, but that isn't something I can do yet. Say next, back, repeat, how much, timer, what's left, or stop."),
  ("New: spoken", "Only: Sorry, say that again?"),
  ("New: on the screen", "The words you can say stay in the YOU SAID box, small, not read aloud: next, back, repeat, how much rice, timer 5 minutes, what's left, stop. Start with Chef to ask about the dish."),
])
h1 = B.screen("DT221a", 0, y, "Now: not understood", "r221a", "now", "The whole list of commands, read aloud.")
h2 = B.screen("DT221b", 1, y, "New: not understood", "r221b", "changed", "Spoken: Sorry, say that again? The list stays on the screen.")
y = rowEnd(c, h1, h2)
board("Stories164.dc.html", "DT218 to DT221. The strip, the stuck photo, the two Lock buttons, the short line",
  "2 November 2026 (Coach Milan 17:53 to 17:58). Drawn for your approval; nothing built. Now: 0.3.56, untouched. The red error (nested arrays) is the bug fix 0.3.57, not drawn here.",
  B, W, y - 100, "Stories163.dc.html")
