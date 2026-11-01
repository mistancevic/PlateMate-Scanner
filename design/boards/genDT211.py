# Boards DT211 (Stories158) and DT212 (Stories159): cooking you can find, and a plate that ends. Coach Milan 2 November 00:44 to 00:47. Panels from shotDT211.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.50, as it is"), "phone": ("#5b6b8a", "#fff", "Your phone, 00:42"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.50, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
cy = storyCard(B, y, "DT211", "Cooking you can find", [
  ("Coach Milan, 00:44", "I wanted to make a recipe and test the voice, and I couldn't find it on the recipe page. And how do I share it so it works on a second phone?"),
  ("Where it is now", "Recipe, Cook it as written, then Make, then Start cooking. The voice is asked once. Use another screen shows only inside cooking: a 4-letter code and a QR code, the other phone opens chefmealan.com/cook, no sign-in."),
  ("Start cooking on the recipe", "Start cooking right under the numbers, on the first screen, and again as the main button after the steps. One line says what it does: one step at a time, read aloud, say next, back or repeat, a second phone can show the steps. It opens cooking straight away. Make stays behind it for the ticks, the photo and how it went."),
  ("A recipe with no steps", "Says so where Start cooking would be: Draft the steps to cook along. Today the button is just missing, with no word why."),
  ("Stays as it is", "Change it first, cooking itself, the voice, Use another screen."),
])
h = rowEnd(cy,
  B.screen("DT211a", 0, y, "Now: a recipe", "r211a", "now", "Cook it as written at the end. No word about the voice or a second phone."),
  B.screen("DT211b", 1, y, "New: a recipe", "r211b", "changed", "Start cooking under the numbers and after the steps, with what it does."),
  B.screen("DT211e", 2, y, "New: a recipe with no steps", "r211e", "changed", "Draft the steps to cook along, where Start cooking would be."))
y = h
h = rowEnd(B.screen("DT211c", 0, y, "Now: Make", "r211c", "now", "Start cooking with the voice, one tap after Cook it as written."),
  B.screen("DT211d", 1, y, "Now: cooking", "r211d", "now", "The voice question, then Use another screen at the bottom. Stays as it is."))
y = h
board("Stories158.dc.html", "DT211. Cooking you can find",
  "2 November 2026 (Coach Milan 00:44 to 00:47). Now: 0.3.50, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories157.dc.html")

B = Board(); y = 30
cy = storyCard(B, y, "DT212", "A plate that ends", [
  ("Coach Milan, 00:44", "There is still a mess on the Plate. It keeps adding more and more foods, and nothing gets resolved."),
  ("What it is", "The protein pancake photo from yesterday at 13:11, read as chicken, peas and rice. Nothing ever ends a plate, so each new thing is asked against it, and Chef Mealan judges it against now: at 00:42 that is tomorrow's breakfast. Six things at once on one screen."),
  ("A plate that ends", "A plate from an earlier meal (over 3 hours, or another day, the DT206 rule) asks one thing when the Plate opens: Did you eat it? Ate it saves it to that day and meal. Clear it empties the plate. Keep working on it opens it as it is."),
  ("One question at a time", "When the Plate asks something, the question shows alone. Foods, numbers and Chef Mealan's cards wait until you answer."),
  ("Start cooking never adds", "With a plate from earlier, the same question comes first, then the recipe starts on its own plate. Cancel goes back to the recipe."),
  ("One Chef Mealan line per thing", "The eating window is said once, in Your day. The card under it only asks Did you eat it, with the numbers."),
  ("Wrong foods", "The photo card gets Wrong foods? Read the photo again. The pancake read as chicken goes to the photo test list."),
])
h = rowEnd(cy,
  B.screen("DT212a", 0, y, "Now: your Plate at 00:42", "r212a", "phone", "Your screenshot. The recipe question on top of yesterday's plate, two Chef Mealan cards."),
  B.screen("DT212b", 1, y, "New: the Plate opens", "r212b", "changed", "A plate from yesterday: one question, Did you eat it?"),
  B.screen("DT212c", 2, y, "New: Start cooking, plate from earlier", "r212c", "changed", "The question first, then the recipe on its own plate."))
y = h
h = rowEnd(B.screen("DT212e", 0, y, "New: a plate of now", "r212e", "changed", "Read the photo again; the eating window said once."))
y = h
board("Stories159.dc.html", "DT212. A plate that ends",
  "2 November 2026 (Coach Milan 00:44 to 00:47). Now: your own screenshot of 0.3.50. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories158.dc.html")
