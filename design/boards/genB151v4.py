# Board B151 v3 (20 November 2026, Coach Milan 16:08 to 16:13): the flow rethought, drawn as two whole flows like a prototype:
# today on top, new below, every screen; the pencil's edit mode as a branch. Pictures from shotB151v3.cjs. Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB151.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB151v4.json")) if os.path.exists(f"{HERE}/heightsB151v4.json") else {}
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
W = SX + 5 * PW + 4 * G + 40
parts = [("Ticket", "B151. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B151, canvas Page 5."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> Top row: the flow as it is today, from the plate to the meal opened again. Below it, new: first with no meal set, then with the meal set first with the pencil, screen under screen; every screen has its id, B151.1a to B151.3d, to point at it. Arrows show what was tapped and where it leads. Yellow notes say what happens; what changes has a blue outline. Drawn on Sunday 15 November 2026, 18:00."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "18 November 19:51: I see Ate it as a blue chip. Is it a button or a status? 20 November 15:52: the moment when Ate it is really pressed, it should turn blue and have a small checkmark on the left side. 16:05: Ate is clicked and nothing changed. 16:08: then the flow with the question and the chips is not UX. Rethink the flow and the design. 19:07: I know the ingredients, so I am crafting the meal: most likely I select the meal and timing on top. 19:09: how does the button become main? Then that is not a button but a status. 19:16: no scrolls on a tap; ask it where it is happening, or give instructions. 19:18: display the summary of the plate before What do you do with it?, and then the action buttons get meaning."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B151", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
th = "padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742"
td = "padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0"
rows = "".join(f'<tr><td style="{td};font-weight:700">{where}</td><td style="{td};background:#fdf0f0">{old or "<i>none</i>"}</td><td style="{td};background:#eaf1fd;font-weight:700">{new}</td><td style="{td};color:#3d4a63">{why}</td></tr>' for _k, where, old, new, why in t.get("text", []))
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub):
    B.html.append(f'<div style="position:absolute;left:{SX}px;top:{y}px;width:{W - SX - 40}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "B151.1 Today", "the flow as it is, from the plate to the meal opened again")
y += 60
RA = [shot(X(0), y, "c1", PW, "B151.1a The plate", "draft", "No meal selected at the top."),
  shot(X(1), y, "c2", PW, "B151.1b The end of the plate", "draft", "A question and three chips."),
  shot(X(2), y, "c3", PW, "B151.1c Ate it tapped", "draft", "Blue, and a second calendar."),
  shot(X(3), y, "c4", PW, "B151.1d Today", "draft", "Logged as Dinner."),
  shot(X(4), y, "c5", PW, "B151.1e The meal opened again", "draft", "Nothing says it is eaten.")]
for i in range(1, 5): arrow(X(i) - G + 2, y + 520)
y2 = max(RA) + 70
label(y2, "B151.2 New, no meal set", "I build the plate and tap Ate it")
y2 += 60
RB = [shot(X(0), y2, "a1", PW, "B151.2a The plate", "same", "No meal selected."),
  shot(X(1), y2, "a2", PW, "B151.2b The end of the plate", "changed", "A summary, then three equal actions."),
  shot(X(2), y2, "a3", PW, "B151.2c Ate it tapped", "changed", "Which meal was it? right under it."),
  shot(X(3), y2, "a4", PW, "B151.2d Today", "same", "Logged as Dinner."),
  shot(X(4), y2, "a5", PW, "B151.2e The meal opened again", "changed", "Ate it, on the right of the name.")]
for i in range(1, 5): arrow(X(i) - G + 2, y2 + 520)
y3 = max(RB) + 70
label(y3, "B151.3 New, the meal set first", "I know my foods and set Dinner with the pencil")
y3 += 60
bs = [shot(X(0), y3, "b1", PW, "B151.3a The plate, Dinner set", "same", "The pencil, then Dinner."),
  shot(X(1), y3, "b2", PW, "B151.3b The end of the plate", "changed", "The summary says Dinner. Ate it logs at once."),
  shot(X(2), y3, "b4", PW, "B151.3c Today", "same", "Logged as Dinner, with no question."),
  shot(X(3), y3, "b5", PW, "B151.3d The meal opened again", "changed", "Ate it, on the right of the name.")]
for i in (1, 2, 3): arrow(X(i) - G + 2, y3 + 520)
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories261.dc.html", t["boardTitle"], "Redrawn 20 November 2026. Ticket B151, Kanban column Now. Pictures from the real app on a scratch build of 0.3.170, today and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories271.dc.html")
inner = B.render(W, Hc)
json.dump({"B151": {"file": "Stories261.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out151.json"), "w"))
print("B151", W, Hc + 230)
