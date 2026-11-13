# Board DT265 (Stories196; Coach Milan 8 November 15:12 to 15:55): a demo account a coach can open before any pitch. From shotDT265.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "Your phone"), "draft": ("#53627f", "#fff", "0.3.115, as it is"), "changed": ("#2a72d9", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story, one item per row. Right: the app as it is (0.3.115), then the same page with the change drawn in, blue outline and yellow note. Drawn in English; every release ships in Srpski and German too.</span></div>')

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
row("DT265", "Try it as a coach", [
  ("Coach Milan, 8 November 15:12", "Yes, demo account. Today a prospect sees only the home page."),
  ("Now", "A coach reads the coach section and taps Get a coach code. Nothing opens before Coach Milan answers the request."),
  ("New", "Try it as a coach, 14 days: a sign in (Google or email), then a demo account of the coach's own. Two example clients, Nina and Lena, built from Coach Milan's own cooked week: plates, photos, cards, a goal set by the coach. No code, no card."),
  ("Several, not one", "Each prospect gets their own demo from the same template, so two coaches never see each other's taps. It resets after 14 days; the account stays and can become a real coach account with a code."),
  ("The AI in the demo", "The demo coach can set a goal, answer a card, send a note, and ask Chef Mealan: 30 AI calls in the 14 days, then the AI parts say the demo's AI is used up. About 1 euro of AI per prospect."),
  ("Coach Milan, 16:04", "If the coach is free, anyone can pick that they are a coach."),
  ("The rule", "The coach's own seat is free only inside a paid plan. After day 14 with no plan: the example clients and the AI parts go, the account stays, and the person can become a Standard member like anyone else. A free rider gets 14 days and 30 calls, the same as a member's free week."),
  ("Kept", "Get a coach code as today, answered by Coach Milan. The local coach demo (?coachdemo) stays the walkthroughs' way in."),
], [("Now: the coach section", "r265a", "draft", "Read, then ask for a code."), ("New: Try it as a coach", "r265b", "changed", "14 days, after a sign in."), ("New: Clients, the demo", "r265c", "changed", "Nina and Lena, from a real week.")])
row("DT265", "Inside the demo, and its end", [
  ("New", "A client's page as the coach sees it: Today, Week, Shared, Goal. The banner on every page says it is a demo and how many days are left."),
  ("New", "From day 12 the banner says what comes next, with the first plan of the pricing paper (H1: 49 euros a month for 10 clients, the coach's own seat free inside it). Get my coach code sends the access request with I am a coach already picked; Coach Milan answers as today."),
  ("New", "Day 15 with no plan: the banner says the demo is over, the example clients and the AI are off, and offers two doors: Get my coach code, or Join as a member."),
  ("Coach Milan, 16:21 to 16:27", "The waiting list stays the door until the app is ready for random users. Then the funnel page (PR2) and payment (PR3) come first; the demo is built without a checkout: the price as a line, from launch, and both doors go to the request form until PR3."),
  ("Open", "Whether the demo coach's own day (My day) shows a filled week too, or starts empty like a new account."),
], [("New: a client's week", "r265d", "changed", "Set a goal, answer, ask."), ("New: day 12", "r265e", "changed", "What comes next, H1."), ("New: day 15, no plan", "r265f", "changed", "Over; two doors, to Coach Milan until PR3.")], nid="DT265", at=3)
board("Stories196.dc.html", "DT265. A demo account for coaches",
  "8 November 2026 (Coach Milan 15:12 to 16:27). Drawn for your approval; waits until the app is ready for random users.",
  B, W, y - 100, "Stories195.dc.html")
