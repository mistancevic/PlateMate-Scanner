# A ticket's board when there is nothing drawn yet: the vertical card only (the ticket form of 18 November 2026,
# docs/ticket-form.md). Reads docs/backlog.json. Run: python3 design/boards/genTicket.py OP5 OP6 OP7
# TICKET_H="OP5=2400,OP6=2100" sets measured heights (the card's height in a browser plus 200).
import html, json, os, sys
S = os.path.dirname(os.path.abspath(__file__))
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
B = json.load(open(os.path.join(S, "..", "..", "docs", "backlog.json")))
HS = dict(x.split("=") for x in os.environ.get("TICKET_H", "").split(",") if "=" in x)
W, CW = 900, 860
STATE = {"later": "Later", "next": "Next", "now": "Now", "progress": "In progress", "done": "Done", "parked": "Parked"}
e = html.escape
def sec(t): return f'<div style="margin-top:18px;padding-top:10px;border-top:2px solid #172742;font-size:16px;font-weight:900;color:#123a7a">{t}</div>'
def part(h, t): return f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:14px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>'
def lst(xs): return "".join(f'<div style="display:flex;gap:8px;margin-top:7px;font-size:14px;line-height:1.5;color:#172742"><b style="color:#123a7a;flex:none;width:22px">{i}.</b><span>{e(x)}</span></div>' for i, x in enumerate(xs, 1))
for tid in sys.argv[1:]:
    t = next(x for x in B["tickets"] if x["id"] == tid and x.get("opportunity")); o = t["opportunity"]
    body = part("Ticket", f'{tid}. This board is the ticket. On the canvas page Kanban, column {STATE[t["state"]]}, it is one short card with the label Board: {tid}, canvas {e(t["where"])}.')
    body += sec("1. The request")
    body += part("Opportunity, why we act", "<br>".join(f"<b>{k}</b> {e(v)}" for k, v in [("Where it comes from:", o["from"]), ("The job:", o["job"]), ("What stood in the way:", o["kind"]), ("Why now:", o["why_now"])]))
    body += part("Problem", e(t["problem"])) + part("Story", e(t["story"]))
    if t.get("findings"): body += sec("What we found") + lst(t["findings"])
    if t.get("open"): body += sec("Open questions") + lst(t["open"])
    body += sec("2. The solution and the decision") + part("Not yet", "Nothing is proposed or drawn. This comes after a brainstorm with Coach Milan.")
    body += sec("3. The agreement") + part("Not yet", "The wide block with the acceptance criteria appears when the decision stands.")
    H = int(HS.get(tid, 4000)); title = f'{tid}: {t["title"]}'
    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{e(title)}</title>
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
<div style="width: {W}px; height: {H}px; box-sizing: border-box; padding: 14px 18px; background: #fff; color: #172742; font-family: 'Nunito', ui-sans-serif, system-ui, sans-serif; font-size: 15px; display: flex; flex-direction: column; gap: 14px; overflow: hidden">
<b style="font-size: 22px; font-weight: 900">{e(title)}</b>
<span style="font-size: 14px; color: #3d4a63; font-weight: 600; line-height: 1.45">A ticket in {STATE[t["state"]]}: the request and what we found. No design yet, no Go.</span>
<div id="card" style="width: {CW}px; box-sizing: border-box; border: 2px solid #172742; border-radius: 14px; padding: 14px 18px; background: #fff">
<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{tid}</span>{e(t["title"])}</div>{body}</div>
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
    open(f'{D}/{t["board"]}.dc.html', "w").write(page); print(t["board"], W, H, title)
