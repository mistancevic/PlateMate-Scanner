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
CHIP = {"now": ("#5b6b8a", "#fff", "0.2.91, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.2.91, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
B = Board(); y = 30
cy = storyCard(B, y, "DT104", "A failed read says so", [
  ("Your finding, 21:55", "One bar and 7 g of yeast, a snack. No verdict from Chef Mealan at all, only an empty card with his name."),
  ("Why", "The dish check ran and failed (an error from the model, or an answer that is not the expected form). The app swallows a failed read and shows nothing, so a plate looks checked when it was not."),
  ("New", "A failed read says: Chef Mealan could not read your plate, with Try again. The pilot log keeps the failure, so we see how often the model misses. Rules: C30."),
])
cy2 = storyCard(B, cy + 20, "DT105", "An ingredient on the plate is caught by code, before any read", [
  ("Why", "Yeast is on the C6 list since 0.2.91, but only Quick picks, the tip and the swaps ask it. The gate still waits for the model."),
  ("New", "A plate with an ingredient on it (yeast, flour, baking powder, stock, oil, sugar, salt, spices) gets a line at once, offline too: Active dry yeast is an ingredient, not a food. It needs a dish around it. Two buttons: Take the yeast out; Ask Chef Mealan for a dish around it (the chat opens with the plate and asks for a dough or a batter). The read still runs for the rest of the plate. Rules: C6 in the gate (C30)."),
])
cy3 = storyCard(B, cy2 + 20, "DT106", "Foods Chef Mealan names in the chat become rows you can add", [
  ("Your finding, 21:56", "He answered: low-fat quark and an apple go well with your bar; skip the yeast. Words only. The tip rows under the plate have + Add; the chat has nothing."),
  ("New", "His words stay his. Code reads the food names in the answer, matches them to your foods and to the basic foods table (the 125 foods per 100 g), and puts one row per match under the answer: the start amount, the PD, what the plate would reach, + Add. A food in neither gets Scan it. A food he says to drop gets Take it out. Every row goes through the culinary rules (C6, C20, C21) before it is shown; a name that fails is not a row. Rules: section 6 gets a row, the chat's answer."),
])
cy4 = storyCard(B, cy3 + 20, "DT107", "Ask Chef Mealan always asks; the chips come back under every answer", [
  ("Your finding", "The first tap on Ask Chef Mealan what to add gave chips; the second tap, silence."),
  ("Why", "The chips show only in an empty chat, and the button from the tip opens the chat without a question. The second time the first chat was still there."),
  ("New", "Every Ask Chef Mealan button on the Plate sends the plate as a new question, every time; the old turns stay above as history. The chips (Swap a food on my plate, Make my plate a snack, Better match for my target?) sit under every answer, not only in an empty chat."),
])
h = rowEnd(cy4,
  B.screen("DT104a", 0, y, "Now: bar and yeast, the read fails", "dt104Now", "now", "An empty Chef Mealan card. Your screen at 21:55, rebuilt with the read failing."),
  B.screen("DT105b", 1, y, "New: the yeast is caught by code", "dt105New", "changed", "A line and two buttons at once; no read needed for this."),
  B.screen("DT104b", 2, y, "New: bar and skyr, the read fails", "dt104New", "changed", "The card says the read failed, with Try again."))
y = h
h = rowEnd(y,
  B.screen("DT106a", 0, y, "Now: the chat, words only", "dt106Now", "now", "What goes with this? His answer, nothing to tap."),
  B.screen("DT106b", 1, y, "New: rows under the answer", "dt106New", "changed", "Quark + Add, Apple + Add, yeast Take it out; the chips under the answer."),
  B.screen("DT107a", 2, y, "Now: the second tap, silence", "dt107Now", "now", "The old turn, no chips, no new question."),
  B.screen("DT107b", 3, y, "New: the plate asked again", "dt107New", "changed", "The plate goes in as a new question every time."))
y = h
board("Stories64.dc.html", "DT104 to DT107. A failed read says so, an ingredient is caught by code, rows under a chat answer, Ask Chef Mealan always asks",
  "24 October 2026 (Milan 21:55 to 22:11, testing 0.2.91 on the preview: one bar and 7 g of yeast, then the chat). Now: 0.2.91 with the read failing, as on his phone. New: the same screens with the change drawn in. Nothing built.",
  B, W, y - 100, "Stories63.dc.html")

B = Board(); y = 30
cy = storyCard(B, y, "DT108", "Four letters read a food against your day", [
  ("Where it comes from", "The first version of 21 September had it (commit 18512c0): XP, XF, XC, XFi, each the macro's grams per 100 kcal, and a string under the scan: [ P | f | C | fi ]. Capital High, small Moderate, a dash Low, against thresholds per profile. It went out the same day when PD took its place. Milan, 22:11: the idea is fast understanding of a food relative to the goal: f | C | P+ | Fi is low fat, carbs as needed, high protein, fibre as needed."),
  ("New", "Every food, plate and recipe gets four letters next to its PD: P protein, F fat, C carbs, Fi fibre, in that order. Each letter reads the macro's grams per 100 kcal against your day's rate: capital with a plus, more than your day (High, High+); capital, as your day needs (On plan); small, under (Low); small with a minus, close to none (Low−). The same five bands PD has today (0.6, 0.9, 1.5, 2.5 of the rate), applied to all four, so protein's letter never disagrees with its PD band."),
  ("Your rates", "From your plan, no new setting: protein from the PD target (6.5 g per 100 kcal); fat from the plan's 30 percent (3.3 g); carbs from the rest (10.9 g at 2,750 kcal and 180 g protein); fibre 14 g per 1,000 kcal (1.4 g), the dietary guideline, until the plan has its own. A food with no fibre value shows fi? and the tap says why."),
  ("Where", "The plate readout, under the number. Each food row, after its PD. The food card, under the PD block, with the four numbers behind it on a tap. Recipe tiles and the basic foods table later, same letters. Letters say the level, never good or bad: F+ on a nut is the nut. The colour stays with PD only."),
  ("Open for you", "The order: P F C Fi as the old string, or F C P Fi as you wrote it today. Whether a plus on fat and carbs needs a word on the first sight (the tap explains it now)."),
])
h = rowEnd(cy,
  B.screen("DT108a", 0, y, "Now: a bowl, PD only", "dt108Now", "now", "Skyr, banana, oats, Nutella: a number per food, one for the plate."),
  B.screen("DT108b", 1, y, "New: the letters next to every PD", "dt108New", "changed", "Readout: P f C fi. Skyr P+ f- c fi-. Banana p- f- C+ Fi. Oats p F C Fi+. Nutella p- F+ C fi."))
y = h
board("Stories65.dc.html", "DT108. Four letters read a food against your day: P F C Fi",
  "24 October 2026 (Milan 20:48 and 22:11). Now: 0.2.91, untouched. New: the same screen with the letters drawn in. Nothing built; an idea from the first version, back as a board.",
  B, W, y - 100, "Stories64.dc.html")
