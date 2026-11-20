# Board B151 v2 (20 November 2026, Coach Milan 15:52 to 15:57): Ate it white while you choose, blue with a tick once eaten. Two rows,
# each the step before, the screen today, an arrow, the screen new. Pictures from shotB151v2.cjs. Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB151.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB151v2.json")) if os.path.exists(f"{HERE}/heightsB151v2.json") else {}
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB"); h = round(im.size[1] * w / im.size[0]); im = im.resize((w, h), Image.LANCZOS)
    bb = io.BytesIO(); im.save(bb, "WEBP", quality=80)
    return h, f'<img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{w}px;height:{h}px;border-radius:12px;border:2px solid {border};display:block">'
def shot(x, y, name, w, title, status, note):
    bg, fg, label = CHIP[status]; h, im = pic(name, w, "#2a72d9" if status == "changed" else "#d1dcf0")
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px">'
      f'<div style="font-size:18px;font-weight:900;color:#123a7a">{title}</div>'
      f'<div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:{bg};color:{fg};font-size:12.5px;font-weight:800">{label}</div>'
      f'<div style="margin-top:6px;font-size:13.5px;line-height:1.4;color:#3d4a63;min-height:38px">{note}</div>'
      f'<div style="margin-top:8px">{im}</div></div>')
    return y + 110 + h
B = Board(); PW = 390; G = 70
W = SX + 3 * PW + 2 * G + 40
parts = [("Ticket", "B151. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B151, canvas Page 5."),
  ("How to read this board", "<b>Two rows, two moments of Ate it.</b> Top: choosing the meal. Bottom: the meal I ate, opened again. Each row reads left to right: the step before, the screen as it is today, an arrow, the screen new. Yellow notes say what happens; what changes has a blue outline. Drawn on Sunday 15 November 2026, 18:00."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "18 November 19:51: I see Ate it as a blue chip. Is it a button or a status? If it is eaten, then it should be with a checkmark, and if it is to be selected it should be with a white background. 20 November 15:52: is there included the moment when Ate it is really pressed, and it should turn blue and have a small checkmark next to it on the left side?"),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B151", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
th = "padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742"
td = "padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0"
rows = "".join(f'<tr><td style="{td};font-weight:700">{where}</td><td style="{td};background:#fdf0f0">{old or "<i>none</i>"}</td><td style="{td};background:#eaf1fd;font-weight:700">{new}</td><td style="{td};color:#3d4a63">{why}</td></tr>' for _k, where, old, new, why in t.get("text", []))
y = 30
X = lambda i: SX + i * (PW + G)
RA = [shot(X(0), y, "a0", PW, "The end of a plate", "draft", "The step before: I tap Ate it."),
  shot(X(1), y, "now_a", PW, "Ate it tapped, today", "draft", "Blue with no tick, while I still choose."),
  shot(X(2), y, "new_a", PW, "Ate it tapped, new", "changed", "White while I choose. Dinner: blue with a tick.")]
B.html.append(f'<div style="position:absolute;left:{X(2) - G + 2}px;top:{y + 330}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">→</div>')
y2 = max(RA) + 60
bs = [shot(X(0), y2, "b0", PW, "Today, after Ate it", "draft", "The step before: I tap Change or delete."),
  shot(X(1), y2, "now_b", PW, "The meal opened again, today", "draft", "Nothing says it is eaten."),
  shot(X(2), y2, "new_b", PW, "The meal opened again, new", "changed", "Ate it, blue, a small tick on its left.")]
B.html.append(f'<div style="position:absolute;left:{X(2) - G + 2}px;top:{y2 + 420}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">→</div>')
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories261.dc.html", t["boardTitle"], "Redrawn 20 November 2026. Ticket B151, Kanban column Now. Pictures from the real app on a scratch build of 0.3.170, today and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories271.dc.html")
inner = B.render(W, Hc)
json.dump({"B151": {"file": "Stories261.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out151.json"), "w"))
print("B151", W, Hc + 230)
