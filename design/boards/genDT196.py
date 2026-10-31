# Board DT195 (Stories144): a reaction on every claim in Explorer. Milan 31 October 20:37 to 20:49. Panels from shotDT195.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.36, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.36, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen.</span></div>')

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
cy = storyCard(B, y, "DT196", "The privacy leftovers: what is left on the tracker", [
  ("Coach Milan, 31 October 21:41", "The tracker (claude.ai/artifact/BsHzpZSNwMWhtRWFjmpB3Y) has every high and medium finding fixed and live. Five small ones are open. All five in one release."),
  ("f15, an account nobody uses", "12 months without opening the app: one email to the sign-in address. A month later, if the app was still not opened, the account is deleted the way Delete my account does it. Agreed 30 October 13:24. Once a day the server looks at the last sign-in Google keeps for each account; no new field on the person."),
  ("The email needs a sender", "The server sends no email today. To decide: an address on chefmealan.com through Google Workspace (an app password in deploy.env), or a mail service with a free tier (Resend). Drawn: Google Workspace. One email, no link to tap."),
  ("f16, a phone that changed hands", "30 days without opening the app on a phone: that phone asks for the sign-in again before it shows anything. Agreed 30 October 13:24. The day it was last opened is kept on the phone. A different person signing in clears the phone first, as since 0.3.10."),
  ("Silent fixes, nothing to see", "f03: state comes off the coach's write list in the rules (the coach apps that needed it are gone). f10: the public recipe pages stop serving the coach's send-back note, the rating and the internal ids. f13: the server logs drop the food name and the account id; a coach's view of an unshared plate photo is no longer cached by the browser."),
  ("The notice", "Section 4, How long, gets two paragraphs: the 12 months and the 30 days, in the words on the screen to the right."),
  ("Not in this board", "f17, sharing to the members' catalogue only when switched on: parked for review with more testers. A second email. A countdown in the app."),
])
h = rowEnd(cy,
  B.screen("DT196a", 0, y, "Now: section 4, while your account exists", "r196a", "now", "Nothing about an account nobody uses, nothing about a phone."),
  B.screen("DT196b", 1, y, "New: two paragraphs in section 4", "r196b", "changed", "12 months and a month's notice; 30 days on a phone."),
  B.screen("DT196c", 2, y, "New: sign in again after 30 days", "r196c", "changed", "Before anything shows. Nothing is lost."))
y = h
h = rowEnd(
  B.screen("DT196d", 0, y, "New: the one email, a month before", "r196d", "changed", "The two dates, no link to tap."))
y = h
board("Stories145.dc.html", "DT196. The privacy leftovers",
  "31 October 2026 (Coach Milan 21:41: privacy first, redraw). Now: 0.3.36, untouched. Drawn for your approval; nothing built. The silent fixes f03, f10 and f13 have no screen.",
  B, W, y - 100, "Stories144.dc.html")
