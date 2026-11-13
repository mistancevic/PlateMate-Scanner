# Board DT259 (Stories194; Coach Milan 8 November 08:11 to 08:21): sign in with any email; remove old invites. From shotDT259.cjs.
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
  + '<span style="color:#172742">Left: the story, one item per row. Right: the app as it is (0.3.111), then the same page with the change drawn in, blue outline and yellow note. Drawn in English; every release ships in Srpski and German too.</span></div>')

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
row("DT259", "Sign in with any email", [
  ("Coach Milan, 8 November 08:11 and 08:21", "Dajana applied for the beta with Hotmail. Only Google works, and there was no warning. So we can have any email sign up."),
  ("Now", "Sign in is Google only. The beta form and the invite form take any email, so a Hotmail or a work email gets an invite it cannot use."),
  ("New", "Sign in offers Continue with Google, or your email: Chef Mealan sends a link, one tap and you are in. No password. Check your inbox names spam."),
  ("Your part", "In the Firebase console: Authentication, Sign-in method, Email/Password, turn on Email link. About 2 minutes."),
  ("Kept", "Google sign in as it is. An invite still works only for the email it was sent to. Calendar stays Google: an email account sees Connect Google there."),
], [("Now: Sign in", "r259a", "draft", "Google only."), ("New: Sign in", "r259b", "changed", "Google, or a link by email."), ("New: after Send me a link", "r259c", "changed", "Check your inbox.")])
row("DT259", "The link on another phone, and Delete my account", [
  ("New", "A link opened on another phone or browser asks for the email once more, as Firebase needs. On the same phone it signs in straight away."),
  ("Coach Milan, 8 November 08:46 and 08:47", "Where is the account deletion started, so this screen shows? But then deletion is a big one. It will remove everything."),
  ("Now", "Menu, Delete my account, Tap again to delete everything. The data goes first; Google asks to sign in again only at the end, so a closed Google window leaves an empty account."),
  ("New", "Menu, Delete my account opens its own screen: what goes, in words, Export my data first, then the check that it is you. A link for an email account, Continue with Google for a Google one. Nothing is deleted before that check, for both."),
], [("New: another phone", "r259d", "changed", "Which email is this link for?"), ("New: Delete my account", "r259e", "changed", "What goes, Export first, then the link.")], nid="DT259", at=3)
row("DT259", "Remove old invites", [
  ("Coach Milan, 8 November 08:11", "I had to revoke it but also there is no option for me to delete it. Also there is one from Dada that was revoked."),
  ("Now", "Revoke closes an invite. It then stays in Clients, Invites for good."),
  ("New", "remove on a revoked or an expired invite takes it out of the list. A used invite stays: it ties a client to you."),
], [("Now: Clients, Invites", "r259f", "draft", "Revoked stays."), ("New: remove", "r259g", "changed", "On revoked and expired."), ("New: after remove", "r259h", "changed", "Used stays.")], nid="DT259", at=5)
row("DT259", "Safe sign in", [
  ("Coach Milan, 8 November 08:32 and 08:36", "Are we covered with enough steps for the sign up and email confirmation regarding security? Yes, all four steps."),
  ("1. Send it again waits", "60 seconds, so nobody can use Chef Mealan to fill someone else's inbox."),
  ("2. Two Firebase settings, your side", "Email enumeration protection on: nobody can test which emails have an account. One account per email address: a Hotmail used with Google and with a link stays one account."),
  ("3. From chefmealan.com", "The sign-in email comes from chefmealan.com, in the app's language. A few DNS records at your domain host; I write you the steps."),
  ("4. The privacy page", "Names sign in by email link and who sends the email, in English, Srpski and German."),
  ("Kept", "Getting in still needs an invite code and the 18+ tap. Signing in alone opens nothing."),
], [("New: Send it again waits", "r259i", "changed", "60 seconds."), ("New: the privacy page", "r259j", "changed", "Account, how you sign in.")], nid="DT259", at=8)
board("Stories194.dc.html", "DT259. Sign in with any email",
  "8 November 2026 (Coach Milan 08:11 to 08:47). Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories193.dc.html")
