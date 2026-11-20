# Board B151 v3 (20 November 2026, Coach Milan 16:08 to 16:13): the flow rethought, drawn as two whole flows like a prototype:
# today on top, new below, every screen; the pencil's edit mode as a branch. Pictures from shotB151v3.cjs. Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB151.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB151v8.json")) if os.path.exists(f"{HERE}/heightsB151v8.json") else {}
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB")
    # the day and time the screen is drawn on, on every screen (ticket form, rule 8): a yellow strip above the phone's picture
    from PIL import ImageDraw, ImageFont
    st = Image.new("RGB", (im.size[0], im.size[1] + 30), "#fff8d6"); st.paste(im, (0, 30)); d = ImageDraw.Draw(st)
    d.line([(0, 29), (im.size[0], 29)], fill="#2a72d9", width=2)
    try: fnt = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 13)
    except Exception: fnt = ImageFont.load_default()
    txt = "Drawn on Sunday 15 November 2026, 18:00"; tw = d.textlength(txt, font=fnt); d.text(((im.size[0] - tw) / 2, 7), txt, fill="#172742", font=fnt)
    im = st; h = round(im.size[1] * w / im.size[0]); im = im.resize((w, h), Image.LANCZOS)
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
W = SX + 7 * PW + 6 * G + 40
parts = [("Ticket", "B151. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B151, canvas Page 5."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> B151.1: the flow as it is today. New: B151.2 I already ate it. B151.3 I eat it now. B151.4 a meal whose time has passed. B151.5 a coming day. B151.6 a past day. B151.7 two branches from B151.2d. Arrows show what was tapped and where it leads; yellow notes say what happens; what changes has a blue outline. Every screen has its id and, on top, the day and time it is drawn on: Sunday 15 November 2026, 18:00."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "20 November 20:21: we need to change the logic of where the question is asked that relates to Prepare it and Ate it. Save it to My recipes makes sense to be at the end of the process. Selection of the meal and date already says if that is for the future as a plan, or it was before and now just adding it for the log, and also if that was already eaten. 20:23: Already eaten, then we can tell that it will count there and the math will recalculate. 20:47: then the question should be different, so the answers can be referred to as eaten, now, later or plan it. 20:59: Dinner is planned but it is eaten. 21:00: chips should be dynamically displayed depending on the meal and date setting. 21:02: why do we need chips when only one option is possible? That can be a conclusion."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B151", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
th = "padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742"
td = "padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0"
rows = "".join(f'<tr><td style="{td};font-weight:700">{where}</td><td style="{td};background:#fdf0f0">{old or "<i>none</i>"}</td><td style="{td};background:#eaf1fd;font-weight:700">{new}</td><td style="{td};color:#3d4a63">{why}</td></tr>' for _k, where, old, new, why in t.get("text", []))
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "B151.1 Today", "the flow as it is, from the plate to the meal opened again")
y += 60
RA = [shot(X(0), y, "c1", PW, "B151.1a The plate", "draft", "No meal selected at the top."),
  shot(X(1), y, "c2", PW, "B151.1b The end of the plate", "draft", "A question and three chips."),
  shot(X(2), y, "c3", PW, "B151.1c Ate it tapped", "draft", "Blue, and a second calendar."),
  shot(X(3), y, "c4", PW, "B151.1d Today", "draft", "Logged as Dinner."),
  shot(X(4), y, "c5", PW, "B151.1e The meal opened again", "draft", "Nothing says it is eaten.")]
for i in range(1, 5): arrow(X(i) - G + 2, y + 540)
y2 = max(RA) + 70
label(y2, "B151.2 New, I already ate it", "I build the plate and say in the pencil block that I ate it")
y2 += 60
RB = [shot(X(0), y2, "2a", PW, "B151.2a The plate", "same", "No meal selected. I tap the pencil."),
  shot(X(1), y2, "2b", PW, "B151.2b The pencil block", "changed", "A line says: nothing counts."),
  shot(X(2), y2, "2c", PW, "B151.2c Dinner tapped", "changed", "Three answers, none marked."),
  shot(X(3), y2, "2d", PW, "B151.2d Already ate it tapped", "changed", "It counts in today's Dinner."),
  shot(X(4), y2, "2e", PW, "B151.2e The pencil closed", "changed", "Eaten, and the Recorded line."),
  shot(X(5), y2, "2f", PW, "B151.2f The end of the plate", "changed", "Only Save it to My recipes."),
  shot(X(6), y2, "2g", PW, "B151.2g Today", "same", "Dinner, eaten, in the day's numbers.")]
for i in range(1, 7): arrow(X(i) - G + 2, y2 + 540)
y3 = max(RB) + 70
label(y3, "B151.3 New, I eat it now", "as B151.2a and 2b, then Now", 0, 4)
label(y3, "B151.5 New, a coming day", "one answer: a conclusion", 4, 3)
y3 += 60
RC = [shot(X(0), y3, "3a", PW, "B151.3a Dinner tapped", "changed", "As B151.2c: three answers, none marked."),
  shot(X(1), y3, "3b", PW, "B151.3b Now tapped", "changed", "It counts from now."),
  shot(X(2), y3, "3c", PW, "B151.3c The pencil closed", "changed", "Now, and the Recorded line."),
  shot(X(3), y3, "3d", PW, "B151.3d The end of the plate", "changed", "Prepare it, then Save it to My recipes."),
  shot(X(4), y3, "5a", PW, "B151.5a Monday, Lunch tapped", "changed", "No question: it goes into the plan."),
  shot(X(5), y3, "5b", PW, "B151.5b The pencil closed", "changed", "The top line: Planned."),
  shot(X(6), y3, "5c", PW, "B151.5c The end of the plate", "changed", "Prepare it, then Save it to My recipes.")]
for i in (1, 2, 3, 5, 6): arrow(X(i) - G + 2, y3 + 540)
y4 = max(RC) + 70
label(y4, "B151.4 New, a meal whose time has passed", "Lunch at 13:45", 0, 2)
label(y4, "B151.6 New, a past day", "one answer: a conclusion", 2, 2)
label(y4, "B151.7 New, two branches from B151.2d", "one screen each", 4, 2)
y4 += 60
bs = [shot(X(0), y4, "4a", PW, "B151.4a Lunch tapped", "changed", "Two answers: no Later."),
  shot(X(1), y4, "4b", PW, "B151.4b Already ate it tapped", "changed", "It counts in today's Lunch."),
  shot(X(2), y4, "6a", PW, "B151.6a Saturday, Dinner tapped", "changed", "No question: it counts there."),
  shot(X(3), y4, "6b", PW, "B151.6b The pencil closed", "changed", "Eaten, and the Recorded line."),
  shot(X(4), y4, "7a", PW, "B151.7a Taking it back", "changed", "A tap on Later takes it out of the day."),
  shot(X(5), y4, "7b", PW, "B151.7b Dinner already holds a dish", "changed", "Replace it, or Add a dish.")]
for i in (1, 3): arrow(X(i) - G + 2, y4 + 540)
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories261.dc.html", t["boardTitle"], "Redrawn 20 November 2026. Ticket B151, Kanban column Now. Pictures from the real app on a scratch build of 0.3.170, today and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories271.dc.html")
inner = B.render(W, Hc)
json.dump({"B151": {"file": "Stories261.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out151.json"), "w"))
print("B151", W, Hc + 230)
