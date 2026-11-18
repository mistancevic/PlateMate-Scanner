# The Kanban (canvas page Kanban): drawn from docs/backlog.json. Coach Milan 2 November 00:59 to 01:04: To do split into Later,
# Next, Now; In progress; Done counted as the last 7 versions. Cards coloured by epic; a card names its board and version.
import json, os, html
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
bl = json.load(open("/home/claude/platemate-scanner/docs/backlog.json"))
E = bl["epics"]; T = bl["tickets"]; V = bl["versions"]
COL = {"home": "#d35400", "setup": "#2e7be8", "plate": "#1e8e5a", "cook": "#8e44ad", "coach": "#123a7a", "explorer": "#c0392b", "trust": "#5b6b8a", "lang": "#b7950b", "ops": "#16a085", "chef": "#a04000"}
CW, G, PAD = 268, 18, 18
cols = [("todo", "To do", "Now, Next and Later, one below the other."), ("progress", "In progress", "Branch open, tests running."), ("done", "Done", f"Merged. The last {len(V)} versions, newest first.")]
LEGEND = ('<div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:#172742;margin-top:8px;padding:8px 10px;background:#f4f7fc;border-radius:10px">'
  '<b style="color:#5b6b8a">CODES</b>'
  '<span><b>P1 to P11</b> a person\'s happy paths</span><span><b>C1 to C7</b> a coach\'s happy paths</span>'
  '<span><b>DT</b> a design ticket (Draw, then Go)</span><span><b>B</b> a bug fix (Reproduce, then Go)</span><span><b>HP</b> a home page ticket</span>'
  '<span><b>EX</b> Explorer, <b>EV</b> evals, <b>OP</b> operations, <b>R</b> recipes, <b>f</b> a privacy finding</span>'
  '<span><b>Stories N</b> the board on Page 2</span><span><b>v0.3.50</b> the version it shipped in</span></div>')
def chip(e): return f'<span style="display:inline-block;background:{COL[e]};color:#fff;border-radius:999px;padding:1px 8px;font-size:11.5px;font-weight:800">{html.escape(E[e]["name"])}</span>'
def card(t):
    meta = []
    own = t.get("board") and t.get("where")
    if own: meta.append(f'<span style="display:inline-block;background:#eaf1fd;color:#123a7a;border:1px solid #b9cdf0;border-radius:6px;padding:1px 7px">Board: {t["id"]}, canvas {t["where"]}</span>')
    elif t.get("board"): meta.append("Board " + (t["board"] if str(t["board"]).startswith("Stories") else f"Stories{t['board']}") + (f", canvas {t['where']}" if t.get("where") else ""))
    if t.get("version"): meta.append(f"v{t['version']}")
    why = f'<div style="font-size:12.5px;line-height:1.4;color:#3d4a63;margin-top:5px">{html.escape(t["why"])}</div>' if t.get("why") else ""
    m = f'<div style="font-size:11.5px;color:#5b6b8a;margin-top:5px;font-weight:700">{" · ".join(meta)}</div>' if meta else ""
    # from 18 November 2026: the opportunity, the problem, the story, the acceptance criteria for what is new, what must not change
    head = lambda x: f'<div style="font-size:11.5px;font-weight:900;color:#5b6b8a;letter-spacing:.04em;margin-top:8px">{x}</div>'
    para = lambda x: f'<div style="font-size:12.5px;line-height:1.4;color:#172742;margin-top:3px">{html.escape(x)}</div>'
    ac = ""
    if own: t = {k: v for k, v in t.items() if k not in ("opportunity", "problem", "story", "ac", "unchanged")}
    if t.get("opportunity"):
        o = t["opportunity"]; row = lambda k, v: f'<div style="font-size:12.5px;line-height:1.4;color:#172742;margin-top:3px"><b>{k}</b> {html.escape(v)}</div>'
        ac += head("OPPORTUNITY, WHY WE ACT") + row("Where it comes from:", o["from"]) + row("The job:", o["job"]) + row("What stood in the way:", o["kind"]) + row("Why now:", o["why_now"])
    if t.get("problem"): ac += head("PROBLEM") + para(t["problem"])
    if t.get("story"): ac += head("STORY") + para(t["story"])
    if t.get("ac"): ac += head("ACCEPTANCE CRITERIA, WHAT IS NEW") + "".join(f'<div style="margin-top:6px;padding:6px 8px;border-radius:8px;background:#f4f7fc;font-size:12px;line-height:1.4;color:#172742"><b style="color:#123a7a">{html.escape(a["id"])}</b> <b>{html.escape(a["title"])}</b><br>{html.escape(a["text"]).replace("Given ", "<b>Given</b> ", 1).replace(", when ", ", <b>when</b> ", 1).replace(", then ", ", <b>then</b> ", 1)}</div>' for a in t["ac"])
    if t.get("unchanged"): ac += head("ALREADY WORKS, MUST NOT CHANGE") + "".join(f'<div style="font-size:12px;line-height:1.4;color:#3d4a63;margin-top:3px">· {html.escape(u)}</div>' for u in t["unchanged"])
    return (f'<div style="border:1.5px solid #d1dcf0;border-left:5px solid {COL[t["epic"]]};border-radius:10px;padding:9px 10px;background:#fff;margin-bottom:8px">'
            f'<div style="display:flex;justify-content:space-between;align-items:center;gap:6px"><b style="font-size:12.5px;color:#123a7a">{t["id"]}</b>{chip(t["epic"])}</div>'
            f'<div style="font-size:13.5px;font-weight:700;line-height:1.35;color:#172742;margin-top:4px">{html.escape(t["title"])}</div>{why}{m}{ac}</div>')
def column(key, name, sub):
    rows = [t for t in T if t["state"] == key]
    body = ""
    if key == "todo":
        rows = [t for t in T if t["state"] in ("now", "next", "later")]
        for k, n, d in [("now", "Now", "Board drawn and approved. Waits for Go."), ("next", "Next", "Brainstormed, your answer is in. No board yet."), ("later", "Later", "One line. An idea, not yet talked through.")]:
            vs = [t for t in rows if t["state"] == k]
            body += (f'<div style="margin:6px 0 8px;padding:6px 8px;border-radius:8px;background:{"#2e7be8" if k == "now" else "#d1dcf0"};color:{"#fff" if k == "now" else "#172742"}"><b style="font-size:13.5px">{n}</b> <span style="font-size:12px;opacity:.85">{len(vs)}</span><div style="font-size:11.5px;line-height:1.35;opacity:.9">{d}</div></div>'
                     + ("".join(card(t) for t in vs) or '<div style="font-size:13px;color:#8a97b0;padding:4px 2px 10px">Nothing here.</div>'))
    elif key == "done":
        for v in V:
            vs = [t for t in rows if t.get("version") == v]
            body += f'<div style="font-size:12px;font-weight:900;color:#5b6b8a;letter-spacing:.04em;margin:6px 0 6px">{v} · {len(vs)}</div>' + "".join(card(t) for t in vs)
    else:
        body = "".join(card(t) for t in rows) or '<div style="font-size:13px;color:#8a97b0;padding:8px 2px">Nothing here.</div>'
    hd = "#172742"
    return (f'<div style="width:{CW}px;flex:none;background:#eef3fb;border-radius:14px;padding:10px">'
            f'<div style="background:{hd};color:#fff;border-radius:10px;padding:7px 10px"><b style="font-size:15px">{name}</b> <span style="opacity:.8;font-size:13px">{len(rows)}</span><div style="font-size:11.5px;opacity:.9;line-height:1.35;margin-top:2px">{sub}</div></div>'
            f'<div style="margin-top:10px">{body}</div></div>')
epics = "".join(f'<div style="width:{CW}px;flex:none;border:1.5px solid {COL[k]};border-radius:10px;padding:8px 10px;background:#fff"><div>{chip(k)}</div><div style="font-size:12.5px;line-height:1.4;color:#172742;margin-top:5px">{html.escape(e["why"])}</div></div>' for k, e in E.items())
W = PAD * 2 + 3 * CW + 2 * G
# the page is as tall as its longest column; measure it in a browser and give it as KANBAN_H (13,700 on 18 November 2026, 13:15)
H = int(os.environ.get("KANBAN_H", "13700"))
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
{LEGEND}
<div style="font-size:12px;font-weight:900;color:#5b6b8a;letter-spacing:.05em;margin-top:16px">EPICS, AND WHY</div>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">{epics}</div>
<div style="display:flex;gap:{G}px;align-items:flex-start;margin-top:18px">{"".join(column(*c) for c in cols)}</div>
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
open(f"{D}/Kanban.dc.html", "w").write(page); print("Kanban.dc.html", W, len(page) // 1024, "KB")
