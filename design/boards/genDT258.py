# Board DT258 (Stories193; Coach Milan 8 November 08:11): Chef Mealan's eight waiting lines in Srpski and German. Words only, a table.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "Your phone"), "draft": ("#53627f", "#fff", "0.3.111, as it is"), "changed": ("#2a72d9", "#fff", "New, drawn for your approval")}
MARK = ""

def ih(name): w, h = Image.open(f"{R}/{name}.png").size; return int(h * SW / w)
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
          f'<div style="margin-top:8px">{img(name, "#2a72d9" if status == "changed" else "#d1dcf0")}</div></div>')
        return y + TOP + ih(name)
    # a computer screen across the three columns
    def wide(s, nid, y, title, name, status, what):
        bg, fg, label = CHIP[status]; WW = 3 * SW + 2 * GAP
        im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((WW * 2, int(im.size[1] * WW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=74)
        h = int(im.size[1] / 2)
        s.html.append(f'<div style="position:absolute;left:{s.x(0)}px;top:{y}px;width:{WW}px">'
          f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
          f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span> <span style="font-size:12.5px;color:#172742;margin-left:8px">{what}</span></div>'
          f'<div style="margin-top:8px"><img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{WW}px;border-radius:10px;border:1.5px solid {"#2a72d9" if status == "changed" else "#d1dcf0"};display:block"></div></div>')
        return y + TT + 8 + CH + 8 + h
    def render(s, W, H): return f'<div style="position:relative;width:{W}px;height:{H}px">{"".join(s.html)}</div>'

def storyCard(B, y, rid, title, parts, w=350):
    body = "".join(f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>' for h, t in parts)
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
                  f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{rid}</span>{title}</div>{body}</div>')
    return y + 70 + sum(30 + math.ceil(len(re.sub("<[^>]+>|&amp;", "x", t)) / 40) * 21 for _, t in parts)
def rowEnd(*hs): return max(hs) + 140

LEGEND = ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "draft", "changed"))
  + '<span style="color:#172742">Left: the story, one item per row. Right: each line as a Srpski or German phone shows it in 0.3.111, then the new line. Words only; no screen changes. Drawn in English; every release ships in Srpski and German too.</span></div>')

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
c = storyCard(B, y, "DT258", "Chef Mealan speaks one language", [
  ("Coach Milan, 8 November 08:11", "Yes. Number 1: the chef lines that mix languages."),
  ("Now", "Eight of his lines are translated and checked in both tables, but the app still shows them in English, or half English. The words that go into them (a weekday, a meal, a count, how far the cooking got) were made in English, so the app held the whole line back."),
  ("New", "The app makes those words in the phone's language and the eight lines go in, in Srpski and in German. Where the words need it, the line itself is fixed, listed on the right."),
  ("He or she", "In Srpski, Zauzet si, Napravio si, pojeo and stao take her form when the profile says she, as his other lines do."),
  ("Tables", "The changed lines go into both tables as checked, as agreed on 7 November. You check them in the app."),
  ("Kept", "Every screen as it is. English as it is."),
])
X0 = B.x(0); WW = 3 * SW + 2 * GAP
def cell(t, w, bold=False, bg="#fff", col="#172742"):
    return f'<td style="width:{w}px;vertical-align:top;padding:8px 9px;border-bottom:1px solid #d1dcf0;background:{bg};color:{col};font-size:12.5px;line-height:1.45;{"font-weight:800;" if bold else ""}">{t}</td>'
E = lambda t: f'<span style="background:#ffe1dc;border-radius:4px;padding:0 3px">{t}</span>'
N = lambda t: f'<span style="background:#fff3b0;border-radius:4px;padding:0 3px">{t}</span>'
ROWS = [
  ("Whose plate", "After a photo on the Plate",
   f"Fotografija od danas, u 12:40. {E('Whose plate is it, and when?')}",
   "Fotografija od danas, u 12:40. Čiji je ovo tanjir, i kada?",
   "Ein Foto von heute um 12:40. Wessen Teller ist das, und wann?"),
  ("Add or new plate", "A food or recipe comes to a plate that has foods",
   f"{E('Your plate already has 2 foods.')} Skyr: ide na tanjir od 12:40. {E('Add them to yours, or start a new plate with them?')}",
   f"Tvoj tanjir već {N('ima 2 namirnice')}. Skyr: ide na tanjir od 12:40. {N('Da ih dodaš svom, ili da počneš nov tanjir s njima?')}",
   f"Auf deinem Teller sind schon 2 Lebensmittel{N('.')} Skyr käme auf einen Teller von 12:40. {N('Zu deinem hinzufügen oder einen neuen Teller damit beginnen?')}"),
  ("Busy at a meal", "Today, a meal in a calendar block",
   f"{E('Lunch at 12:30 is in a busy block,')} 12:00 do 14:00. {E('Move it for Sunday?')}",
   f"Ručak u 12:30 pada u zauzet blok, 12:00 do 14:00. Da ga pomerim za {N('nedelju')}?",
   "Mittagessen um 12:30 fällt in einen vollen Block: 12:00 bis 14:00. Für Sonntag verschieben?"),
  ("Busy until late", "Today, little time to cook before a meal",
   f"{E('Busy until 18:30. Dinner at 19:00 leaves 30 minutes to cook. A quick dinner, or cook on Saturday and warm it up?')}",
   f"Zauzet si do 18:30. Večera u 19:00 ostavlja 30 minuta za kuvanje. Nešto brzo za {N('večeru')}{N(', ili da skuvaš u subotu i podgreješ')}?",
   f"Verplant bis 18:30. Abendessen um 19:00 lässt dir {N('30 Minuten')} zum Kochen. Etwas Schnelles {N('zum Abendessen')}{N(', oder am Samstag kochen und aufwärmen')}?"),
  ("Take it along", "Today, booked over a meal",
   f"{E('Booked from')} 12:00 do 14:00. {E('Take lunch along?')}",
   f"Zauzet od 12:00 do 14:00. Da poneseš {N('ručak')}?",
   f"{N('Von')} 12:00 bis 14:00 verplant. Mittagessen mitnehmen?"),
  ("Busy at training", "Today, training in a calendar block",
   f"{E('Training at 12:30 is in a busy block,')} 12:00 do 14:00. {E('Move it for Sunday?')}",
   f"Trening u 12:30 pada u zauzet blok, 12:00 do 14:00. Da ga pomerim za {N('nedelju')}?",
   "Training um 12:30 fällt in einen vollen Block: 12:00 bis 14:00. Für Sonntag verschieben?"),
  ("Go on cooking", "Coming back in the middle of a cook",
   f"{E('You were cooking')} Protein pancake: 3 od 5 koraka označeno, 2 fotografije. {E('Go on where you left off?')}",
   "Kuvanje: Protein pancake: 3 od 5 koraka označeno, 2 fotografije. Da nastaviš gde si stao?",
   "Du hast Protein pancake gekocht: 3 von 5 Schritten abgehakt, 2 Fotos. Da weitermachen, wo du aufgehört hast?"),
  ("How many you ate", "On Make, after a recipe made in pieces",
   f"{E('You made')} 4 palačinke. {E('How many did you eat?')}",
   "Napravio si 4 palačinke. Koliko si pojeo?",
   "Du hast 4 Pfannkuchen gemacht. Wie viele hast du gegessen?"),
]
H = '<tr>' + cell("Line", 150, True, "#eef3fb") + cell("Now: a Srpski phone, 0.3.111", 290, True, "#eef3fb") + cell("New: Srpski", 290, True, "#e6f0ff") + cell("New: Deutsch (Beta)", 290, True, "#e6f0ff") + '</tr>'
R = "".join('<tr>' + cell(f"<b>{a}</b><br><span style='color:#53627f'>{b}</span>", 150) + cell(n, 290) + cell(s, 290) + cell(d, 290) + '</tr>' for a, b, n, s, d in ROWS)
KEY = (f'<div style="margin-top:10px;font-size:12.5px;line-height:1.5;color:#172742">{E("Red")}: English on a Srpski phone today. A German phone shows the same English. '
       f'{N("Yellow")}: a change to the line or its words. The cook-ahead part was missing; a German line with no plate name ended in a colon; '
       f'Srpski meals and weekdays now take the form the sentence needs (za večeru, za nedelju); German says keine Zeit when no minutes are left.</div>'
       f'<div style="margin-top:6px;font-size:12.5px;line-height:1.5;color:#53627f">Examples: Sunday 8 November, a block 12:00 to 14:00. Names of your own, like Protein pancake, stay as you wrote them.</div>')
B.html.append(f'<div style="position:absolute;left:{X0}px;top:{y}px;width:{WW + 50}px"><table style="border-collapse:collapse;border:1.5px solid #2a72d9;border-radius:10px;font-family:Nunito,system-ui,sans-serif">{H}{R}</table>{KEY}</div>')
th = 40 + sum(30 + 21 * max(len(n) // 44, len(s) // 44, len(d) // 44, 2) for _, _, n, s, d in [(a, b, __import__("re").sub("<[^>]+>", "", n), __import__("re").sub("<[^>]+>", "", s), __import__("re").sub("<[^>]+>", "", d)) for a, b, n, s, d in ROWS]) + 110
y = rowEnd(c, y + th)
board("Stories193.dc.html", "DT258. Chef Mealan speaks one language",
  "8 November 2026 (Coach Milan 08:11). Drawn for your approval; nothing built.",
  B, W + 60, y - 100, "Stories192.dc.html")
