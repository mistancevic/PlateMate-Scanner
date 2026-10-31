# Board DT182 (Stories131): Explorer, The body: the map; The fat store, Glycogen, and Fat burning, what is true when. Milan 31 October 12:45. Panels from shotDT182.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.24, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.24, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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


W = SX + 3 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "DT182", "Explorer, The body: the map, the fat store, glycogen, and fat burning", [
  ("Coach Milan, 31 October 12:39 to 12:45", "The third part of Explorer is The body: what the food becomes. Muscles, organs, the skeleton, the gut, the brain, the hormones. Glucose and glycogen both explained; the fat you eat against the fat you carry; fat burning as a situation."),
  ("The map", "Explorer in one sentence: what you eat (Nutrients), what it becomes (The body), when it helps and when it hurts (Situations). The body has eight families: Muscle, The fat store, Glycogen, Bone, The gut (starts in the mouth), The liver, Hormones (DT181), The brain. Two drawn here; the rest each its own board."),
  ("One shape for every page", "What it is, what moves it with its source, When it helps, when it hurts (Helps, Hurts, Watch), your case in the five parts at the family's horizon, the chat chips. Nothing changes unless you tap."),
  ("The fat store", "The fat you eat is fuel and building material; the fat you carry is the store; the one does not become the other by itself. Five words placed: in circulation (Frayn 2010), burned, most in easy work (Venables 2005), used over the day, the honest number (Hall 2012), stored, from any source, fat with the least work (Hellerstein 1999), ketones, normal in a fast or a low-carb day and not fat loss by itself (Cahill 2006)."),
  ("Glycogen", "Glucose moves in the blood, held in a narrow range; glycogen is the store, about 400 g in muscle and 100 g in the liver (Jensen 2011). The liver's store keeps glucose steady and runs low overnight (Nilsson and Hultman 1973); muscle's is used by work and refilled by carbs after (Burke 2011). Only what was used gets refilled; a full store takes nothing more. Your case places the day's carbs after the hard session."),
  ("Fat burning: what is true when", "A situation page. A walk before breakfast burns more fat during it and the same over the weeks (Schoenfeld 2014). A long easy walk burns most per minute. A hard session runs on carbs, fat after. After a big meal, storage for hours is what a meal is for. A low-carb day brings ketones, not fat loss by itself. A cut below the range drops muscle with the fat. Your case at the week: the trend 0.2 kg against the goal's 0.25 to 0.5, closed by a walk a day and two dinners, not a harder cut."),
  ("The links", "A situation reads the body pages, the body pages read the nutrients, every page can send you to a situation. The chat chips on the fat page: Does my walk burn fat, Is a low-carb day better, Why is the scale flat this week."),
  ("The wellness line", "What happens in anyone. No body fat reading, no target, no fat burner, no ketone strip, no test read, no condition. The weigh-ins and the trend on Goal are the app's view, shared only by choice."),
  ("Sources to check before a build", "Frayn 2010; Venables, Achten and Jeukendrup 2005; Hall 2012; Hellerstein 1999; Cahill 2006; Jensen 2011; Nilsson and Hultman 1973; Burke 2011; Schoenfeld 2014. Each number kept only if the paper says it."),
  ("Not in DT182", "Muscle, Bone, The gut, The liver, The brain: each its own board. The map is drawn so the shape is agreed first."),
])
h = rowEnd(cy,
  B.screen("DT182a", 0, y, "Now: Hormones as the third chip", "r182a", "now", "One family standing for the whole of the body."),
  B.screen("DT182b", 1, y, "New: The body, the map", "r182b", "changed", "Eight families; the shape of the whole Explorer."),
  B.screen("DT182c", 2, y, "New: The fat store", "r182c", "changed", "The fat you eat, the fat you carry; five words placed."))
y = h
h = rowEnd(y,
  B.screen("DT182d", 0, y, "New: Glycogen", "r182d", "changed", "Glucose next to it; only what was used gets refilled."),
  B.screen("DT182e", 1, y, "New: Fat burning, what is true when", "r182e", "changed", "Six claims placed; your case at the week."),
  B.screen("DT182f", 2, y, "New: the chat and the links", "r182f", "changed", "The three parts read each other."))
y = h
board("Stories131.dc.html", "DT182. Explorer, The body: the map, the fat store, glycogen, and fat burning",
  "31 October 2026 (Coach Milan, Explorer brainstorm: what the food becomes, and what is true when). Now: 0.3.24, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories130.dc.html")
