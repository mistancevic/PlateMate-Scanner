# Board DT253 (Stories188; Coach Milan 7 November 08:29 to 13:06): In your language, a home page block with its own clip. From shotDT253.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"frame": ("#2e7be8", "#fff", "New: a frame of the new clip"), "now": ("#5b6b8a", "#fff", "Your phone, 5 November"), "draft": ("#5b6b8a", "#fff", "0.3.104, a frame of the clip"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
          f'<div style="margin-top:8px">{img(name, "#2e7be8" if status in ("changed", "frame") else "#d1dcf0")}</div></div>')
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
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("frame", "changed"))
  + '<span style="color:#172742">Left: the story, one item per row. Right: the app as it is (0.3.104), then the same page with the change drawn in, blue outline and yellow note. Drawn in English; every release ships in Srpski and German too.</span></div>')

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
def row(rid, title, parts, shots, nid=None, at=0):
    global y
    c = storyCard(B, y, rid, title, parts)
    hs = [B.screen(f"{nid or rid}{chr(97 + at + i)}", i, y, t, n, st, wd) for i, (t, n, st, wd) in enumerate(shots)]
    y = rowEnd(c, *hs)
row("DT253", "In your language, on the home page", [
  ("Coach Milan, 7 November 08:29 to 11:23", "Let visitors know the app speaks their language, a block alongside the other clips, with its own video showing Srpski and Deutsch. The English page: English first, then Srpski, then Deutsch. The /sr and /de pages get their own clips later, starting in their language, when Deutsch is out of Beta."),
  ("Coach Milan, 13:45", "An evergreen title: Chef Mealan is multilingual. Below it the three languages, until we add more."),
  ("New", "A fourth block after Cook it, The day as it goes and The body. Title: Chef Mealan is multilingual. Under it the languages as chips: English, Srpski, Deutsch · Beta. They come from the same list as the switch EN SR DE, so a new language joins the home page by itself, with no change to the block. Four lines: the whole app, a recipe from a link or screenshot, a recipe in another language offered in yours, cooking read aloud and heard in your language. Deutsch is in Beta. Its clip, about 30 seconds, as the other clips: the real app on test data."),
  ("What is new", "The block and its clip. The clip shows the app as it is today, frame by frame (blue: new frames of the new clip); in the app only frame 8 changes, the fix. Nothing else in the app changes."),
  ("Kept", "The switch EN SR DE at the top. On /sr and /de the block reads in that language, with this English clip until theirs are made."),
], [("New: the block", "r253h", "changed", "Chef Mealan is multilingual.")])
row("DT253", "The clip, 1 to 3: English, then Srpski", [
  ("Clip", "1. Today in English. 2. Menu, Settings, Language: Srpski. 3. The same Today in Srpski: Danas."),
], [("1. English", "r253f1", "frame", "Today."), ("2. Language", "r253f2", "frame", "Srpski."), ("3. Srpski", "r253f3", "frame", "Danas.")], nid="DT253", at=1)
row("DT253", "The clip, 4 to 6: a Serbian recipe, then Deutsch", [
  ("Clip", "4. Prebranac from a Serbian link, in Srpski as the page wrote it. 5. The switch: Meni, Podešavanja, Jezik, Deutsch (Beta) (Coach Milan 13:38). 6. The same recipe, now in a German app: Chef Mealan offers it in German, once."),
], [("4. The recipe", "r253f4", "frame", "As written, Srpski."), ("5. To Deutsch", "r253f45", "frame", "The switch."), ("6. Offered", "r253f5", "frame", "In German, once.")], nid="DT253", at=4)
row("DT253", "The clip, 7 to 9 and the end", [
  ("Clip", "7. In German, Übersetzt von Chef Mealan, the Srpski original one tap away. 8. Kochen starten: Alles bereitlegen, the foods read aloud in German, then Schritt 1. 9. The end: English · Srpski · Deutsch (Beta), on the app's blue, 2 seconds."),
  ("Before recording", "Coach Milan confirms the Srpski lines of 0.3.103 and 0.3.104 in his table, so no English shows on a Srpski screen. Then I record it, check every frame, and it goes on the home page."),
  ("A fix first", "Frame 8 showed the foods in Srpski (pasulj, crni luk) while the steps are in German: Get it ready takes the names from the recipe's foods, not from the steps as shown. Fixed with your Go, it reads them as the steps write them: Bohnen, Zwiebel."),
], [("7. In German", "r253f6", "frame", "Original one tap away."), ("8. Cooking", "r253f7", "changed", "With the fix: Bohnen."), ("9. The end", "r253f8", "frame", "2 seconds.")], nid="DT253", at=7)
board("Stories188.dc.html", "DT253. In your language, on the home page",
  "7 November 2026 (Coach Milan 08:29 to 13:38). Drawn for your approval; nothing built. 13:38: the switch to Deutsch drawn in. 13:45: the evergreen title.",
  B, W, y - 100, "Stories187.dc.html")
