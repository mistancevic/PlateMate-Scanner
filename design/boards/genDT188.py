# Board DT188 (Stories137): roles and navigation. Milan 31 October 15:52 Draw. Panels from shotDT188.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.29, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.29, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
cy = storyCard(B, y, "DT188", "Roles and navigation", [
  ("Coach Milan, 31 October 12:56 to 13:00", "Explorer grew into a third of the app and deserves its place on the bottom bar. The coach is not a different person: one account, two views, switched at the top. The coach coaches and suggests, never touches a client's plan directly; a suggestion lands with the client as a tap to accept. Roles: superadmin, coach, client (with or without a coach as a state), visitor. The kitchen screen is a session, not a role."),
  ("The bar, for everyone", "Today, Plan, Plate, Recipes, Explorer. Explorer leaves the menu; Foods and Me stay in it. Five tabs at 44 px or more fit a 390 px phone with labels at 12 px. The Clients tab goes."),
  ("The coach's two views", "My day: the app as everyone has it, with the same five tabs. My clients: the bar becomes Clients, then the chosen client's Today, Plan and Recipes, read-only and exactly as the client sees them, and Explorer to send a page. The switch is at the top of Today only, remembered until switched back."),
  ("Suggest, never touch", "From a client's screen the coach can suggest a planned snack, a page from Explorer, a note (as today, with Got it), a recipe (as today). A suggestion is a card on the client's Today with Accept and Not now. Accept does only what the client could have done alone. The coach sees the answer; the badge on Today counts suggestions as it counts notes. Nothing on a client's plan, goal or numbers is ever written by the coach; the coach's goal from a date stays a suggestion the client confirms."),
  ("Roles", "Superadmin (Milan): everything a coach has, plus Admin in the menu: people and roles, coach links, kitchen sessions, the privacy tracker. Coach: set in the console as today; My day and My clients. Client: the app; with a coach is a state on the client, started with the coach code, ended by either side. Visitor: not signed in; Explorer, Foods and Recipes to read, nothing saved, Sign in on every write. Kitchen screen: a session of a client's account on a second device, as built."),
  ("Not in this board", "Any change to what a client's screens show. New coach actions beyond the four. A coach with more than one coach above. Pricing. The four situations still marked later."),
  ("To decide", "Does Accept on a snack suggestion go to this week only or to the Lifestyle default? (Drawn: this week only.) Does the coach see Not now with a reason, or only the answer? (Drawn: the answer only.) Visitor: Recipes to read or not at all?"),
])
h = rowEnd(cy,
  B.screen("DT188a", 0, y, "Now: the client's bar, four tabs", "r188a", "now", "Explorer is in the menu."),
  B.screen("DT188b", 1, y, "Now: the menu, Explorer in it", "r188b", "now", "Me, Explorer, Foods and the rest."),
  B.screen("DT188c", 2, y, "Now: the coach's bar, a Clients tab", "r188c", "now", "The coach is a fifth tab today."))
y = h
h = rowEnd(
  B.screen("DT188d", 0, y, "New: Explorer, the fifth tab", "r188d", "changed", "For everyone; the same bar on every profile."),
  B.screen("DT188e", 1, y, "New: the menu without Explorer", "r188e", "changed", "Foods and Me stay in the menu."),
  B.screen("DT188f", 2, y, "New: the coach's switch, My day", "r188f", "changed", "One account, two views; the Clients tab goes."))
y = h
h = rowEnd(
  B.screen("DT188g", 0, y, "New: My clients, the bar becomes the client's screens", "r188g", "changed", "Clients, Today, Plan, Recipes, Explorer; read-only."),
  B.screen("DT188h", 1, y, "New: a client's Today, read-only, with Suggest", "r188h", "changed", "Four things to suggest; nothing touched."),
  B.screen("DT188i", 2, y, "New: the client's Today, a suggestion as a tap", "r188i", "changed", "Accept or Not now; the coach sees which."))
y = h
h = rowEnd(B.screen("DT188j", 0, y, "New: the roles, and Admin for the superadmin", "r188j", "changed", "Four roles; the kitchen screen is a session."))
y = h
board("Stories137.dc.html", "DT188. Roles and navigation",
  "31 October 2026 (Coach Milan 12:56 to 13:00, 15:52 Draw). Now: 0.3.29, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories136.dc.html")
