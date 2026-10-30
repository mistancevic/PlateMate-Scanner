# Board DT168 (Stories120): the privacy audit and the fix. Milan 30 October 10:57. Panels from shotDT168.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "0.3.9, as it is"), "changed": ("#2e7be8", "#fff", "New, drawn for your approval")}
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
  + '<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: 0.3.9, untouched. New: the same pages with the change drawn in, blue outline and yellow note. Toasts and the round chef button are left out of every screen. Chef Mealan\'s answers are stand-ins written to the prompts in the app: this workspace cannot reach the AI.</span></div>')

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
cy = storyCard(B, y, "DT168", "Data privacy: the rules keep the promises, not only the screens", [
  ("Coach Milan, 30 October 10:57", "We need to fix data privacy. Double check that, and if other parts also need it."),
  ("How it was checked", "Read in the code, nothing run: the database rules, every server route, file storage, what goes to Gemini and other services, the phone's own storage, sign-out, export and delete. A second, independent read of the server and storage. Not tested on live data."),
  ("High", "1. A coach's account can read a client's whole record, by the rules: body data, health answers, allergies, the library, notes, own words. The app shows only part of it. 2. Sign-out leaves everything on the phone; the next person to sign in on that phone gets it saved into their account. 3. A coach can change any field of a client's record, also allergies and the 18+ date."),
  ("Medium", "4. Photo copies from before October are readable by the coach. 5. Any coach account can read access requests and book sign-ups (name, email, phone). 6. Delete my account leaves published recipes, cook status and some access requests. 7. Export my data is incomplete (photo files, recipes). 8. Gemini gets the ticked health situations and allergies, and the notice doesn't say so. 9. The members' food catalogue keeps each food's market and date: in a small pilot that can point to a person."),
  ("Low", "10. A coach's send-back note shows on the public recipe page. 11. Member numbers use a salt that can be guessed. 12. Open Food Facts search and the coach's Airtable button aren't in the notice. 13. A food name and a user id in the server logs; a coach's photo stays in the browser cache an hour."),
  ("Holds", "The coach's photo route checks the link and the share; photo files are owner-only; no route logs what people write; Gemini gets no name, email or id."),
  ("The fix", "The record splits in two: a private part only the person reads, and the part the coach needs. The server reads the private part only for safety. Coach writes limited to goal, formula, notes, check-in day and the chat confirmation. Sign-out clears the phone, and data is tagged by account so it never passes to another. Old photo copies owner-only, then deleted. Requests and sign-ups owner-only. Delete and export complete. Public recipes stripped. Logs cleaned. The notice says what goes to Gemini and Open Food Facts. Existing accounts move over on their next save; nothing is lost."),
  ("Your choices", "Members' catalogue: drop market and date, or opt-in. Weight to the coach: trend as direction and % unless body data is shared, or kg as today and the notice says so. Airtable button: remove, or list Airtable. A secret for member numbers: one line in the deploy settings, the step written for you."),
])
h = rowEnd(cy,
  B.screen("DT168a", 0, y, "Now: who can read what", "r168a", "now", "The rules allow more than the screens show."),
  B.screen("DT168b", 1, y, "New: after the fix", "r168b", "changed", "A private part only you read."),
  B.screen("DT168c", 2, y, "New: said plainly", "r168c", "changed", "Disclosed; three choices yours."))
y = h
board("Stories120.dc.html", "DT168. Data privacy",
  "30 October 2026 (Coach Milan, fix data privacy and check every part). Now: 0.3.9, untouched. Drawn for your approval; nothing built.",
  B, W, y - 100, "Stories119.dc.html")
