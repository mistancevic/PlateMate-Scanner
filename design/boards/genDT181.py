# Board DT181 (Stories130): Explorer, Hormones, version 1 for the brainstorm. Milan 31 October 11:54. Panels from shotDT181.cjs.
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
cy = storyCard(B, y, "DT181", "Explorer, Hormones: version 1, for the brainstorm", [
  ("Coach Milan, 31 October 10:50 and 11:54", "Hormones, insulin, blood sugar, testosterone and the like are much discussed. Drawn before a brainstorm, so this is version 1: a shape to talk about."),
  ("Where", "A third part of Explorer, Hormones. Four members in version 1: Insulin, Hunger hormones, Cortisol, Testosterone. Oestrogen and the cycle, thyroid and growth hormone wait for their own wellness line."),
  ("The shape, as DT180", "Each page: what it does, what moves it (food, training, sleep), one line each with its paper; then your case in the five parts at the member's own horizon: insulin per meal, hunger and cortisol per day, testosterone per month. The chat chips. Nothing changes unless you tap."),
  ("The wellness line", "What happens in anyone. No page reads a blood value, says a level is low or high, names a condition (insulin resistance, diabetes, low T) or a treatment, or names a supplement or a booster. Someone told to watch their blood sugar follows their doctor's plan; the app follows the numbers given to it."),
  ("Insulin, per meal", "Rises after every meal, that is its job. How fast depends on the food (GI, our Carbs table), slower with protein and fibre on the plate, best after training; a short night and meal size move it. Your case reads the Plate's letters P, C and Fi, the GI, the training week."),
  ("Testosterone, per month", "Four levers with evidence: sleep (a week of 5 hours, 10 to 15 % lower, Leproult 2011), strength training, body fat, eating far too little. Your case reads the sleep habit, the training week, the weigh-ins, against the check-in."),
  ("Hunger hormones and cortisol, per day", "Two short nights: leptin down, ghrelin up, hunger up a quarter (Spiegel 2004). Protein keeps you full (Weigle 2005). The case points to the situation page, A bad night's sleep, which has the taps. Cortisol in short, same shape."),
  ("Sources to check before a build", "Ludwig 2002; Atkinson 2008; Richter and Hargreaves 2013; Spiegel 1999 and 2004; Weigle 2005; Leproult 1997 and 2011; Kraemer 2005; Camacho 2013; Loucks 2004; Lovallo 2005. Each number kept only if the paper says it."),
  ("To decide in the brainstorm", "The four members, or fewer. Whether blood sugar is said at all, or only insulin. Whether Testosterone is on the page for every member, or only when the profile says male. The word Hormones in the chip, or The body."),
])
h = rowEnd(cy,
  B.screen("DT181a", 0, y, "Now: no hormone page", "r181a", "now", "Nutrients and Situations; hormones elsewhere, as claims."),
  B.screen("DT181b", 1, y, "New: Hormones, four members", "r181b", "changed", "Each at its own horizon."),
  B.screen("DT181c", 2, y, "New: Insulin, theory", "r181c", "changed", "What it does, what moves it, the wellness line."))
y = h
h = rowEnd(y,
  B.screen("DT181d", 0, y, "New: Insulin, your case at the meal", "r181d", "changed", "The Plate's letters, the GI, the training week."),
  B.screen("DT181e", 1, y, "New: Testosterone, per month", "r181e", "changed", "Four levers; no level, no supplement."),
  B.screen("DT181f", 2, y, "New: Hunger hormones, per day", "r181f", "changed", "Points to the situation page; cortisol in short."))
y = h
board("Stories130.dc.html", "DT181. Explorer, Hormones: version 1, for the brainstorm",
  "31 October 2026 (Coach Milan, Explorer brainstorm: hormones and insulin, kept on the wellness line). Now: 0.3.24, untouched. Drawn for the brainstorm; nothing built.",
  B, W, y - 100, "Stories129.dc.html")
