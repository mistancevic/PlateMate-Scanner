# The Kanban (canvas page Kanban): drawn from docs/backlog.json. Coach Milan 2 November 00:59 to 01:04: To do split into Later,
# Next, Now; In progress; Done counted as the last 7 versions. Cards coloured by epic; a card names its board and version.
import json, os, html
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
bl = json.load(open("/home/claude/platemate-scanner/docs/backlog.json"))
E = bl["epics"]; T = bl["tickets"]; V = bl["versions"]
COL = {"home": "#d35400", "setup": "#2e7be8", "plate": "#1e8e5a", "cook": "#8e44ad", "coach": "#123a7a", "explorer": "#c0392b", "trust": "#5b6b8a", "lang": "#b7950b", "ops": "#16a085"}
CW, G, PAD = 268, 18, 18
cols = [("later", "Later", "One line. An idea, not yet talked through."), ("next", "Next", "Brainstormed, your answer is in. No board yet."), ("now", "Now", "Board drawn and approved. Waits for Go."), ("progress", "In progress", "Branch open, tests running."), ("done", "Done", f"Merged. The last {len(V)} versions, newest first.")]
def chip(e): return f'<span style="display:inline-block;background:{COL[e]};color:#fff;border-radius:999px;padding:1px 8px;font-size:11.5px;font-weight:800">{html.escape(E[e]["name"])}</span>'
def card(t):
    meta = []
    if t.get("board"): meta.append(f"Board Stories{t['board']}")
    if t.get("version"): meta.append(f"v{t['version']}")
    why = f'<div style="font-size:12.5px;line-height:1.4;color:#3d4a63;margin-top:5px">{html.escape(t["why"])}</div>' if t.get("why") else ""
    m = f'<div style="font-size:11.5px;color:#5b6b8a;margin-top:5px;font-weight:700">{" · ".join(meta)}</div>' if meta else ""
    return (f'<div style="border:1.5px solid #d1dcf0;border-left:5px solid {COL[t["epic"]]};border-radius:10px;padding:9px 10px;background:#fff;margin-bottom:8px">'
            f'<div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><b style="font-size:12.5px;color:#123a7a">{t["id"]}</b>{chip(t["epic"])}</div>'
            f'<div style="font-size:13.5px;font-weight:700;line-height:1.35;color:#172742;margin-top:4px">{html.escape(t["title"])}</div>{why}{m}</div>')
def column(key, name, sub):
    rows = [t for t in T if t["state"] == key]
    body = ""
    if key == "done":
        for v in V:
            vs = [t for t in rows if t.get("version") == v]
            body += f'<div style="font-size:12px;font-weight:900;color:#5b6b8a;letter-spacing:.04em;margin:6px 0 6px">{v} · {len(vs)}</div>' + "".join(card(t) for t in vs)
    else:
        body = "".join(card(t) for t in rows) or '<div style="font-size:13px;color:#8a97b0;padding:8px 2px">Nothing here.</div>'
    hd = "#172742" if key != "now" else "#2e7be8"
    return (f'<div style="width:{CW}px;flex:none;background:#eef3fb;border-radius:14px;padding:10px">'
            f'<div style="background:{hd};color:#fff;border-radius:10px;padding:7px 10px"><b style="font-size:15px">{name}</b> <span style="opacity:.8;font-size:13px">{len(rows)}</span><div style="font-size:11.5px;opacity:.9;line-height:1.35;margin-top:2px">{sub}</div></div>'
            f'<div style="margin-top:10px">{body}</div></div>')
epics = "".join(f'<div style="width:{CW}px;flex:none;border:1.5px solid {COL[k]};border-radius:10px;padding:8px 10px;background:#fff"><div>{chip(k)}</div><div style="font-size:12.5px;line-height:1.4;color:#172742;margin-top:5px">{html.escape(e["why"])}</div></div>' for k, e in E.items())
W = PAD * 2 + 5 * CW + 4 * G
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Kanban</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&amp;display=swap">
<style>body{{margin:0}}</style>
</helmet>
<div style="width:{W}px;box-sizing:border-box;padding:{PAD}px;background:#fff;color:#172742;font-family:'Nunito',ui-sans-serif,system-ui,sans-serif;font-size:15px">
<b style="font-size:22px;font-weight:900">Chef Mealan Kanban</b>
<div style="font-size:14px;color:#3d4a63;font-weight:600;line-height:1.45;margin-top:4px">Drawn from docs/backlog.json in the repo. A card moves right only when its step is done: an idea, then your answer, then a board, then Go, then a version. Say the word and the card moves. Done shows the last {len(V)} versions.</div>
<div style="font-size:12px;font-weight:900;color:#5b6b8a;letter-spacing:.05em;margin-top:16px">EPICS, AND WHY</div>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">{epics}</div>
<div style="display:flex;gap:{G}px;align-items:flex-start;margin-top:18px">{"".join(column(*c) for c in cols)}</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{W},"height":2000}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{}};
  }}
}}
</script>
</body>
</html>
'''
open(f"{D}/Kanban.dc.html", "w").write(page); print("Kanban.dc.html", W, len(page) // 1024, "KB")
