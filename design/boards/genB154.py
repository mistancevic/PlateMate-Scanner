# Board B151 v3 (20 November 2026, Coach Milan 16:08 to 16:13): the flow rethought, drawn as two whole flows like a prototype:
# today on top, new below, every screen; the pencil's edit mode as a branch. Pictures from shotB151v3.cjs. Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB154.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB154.json")) if os.path.exists(f"{HERE}/heightsB154.json") else {}
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB")
    # the day and time the screen is drawn on, on every screen (ticket form, rule 8): a yellow strip above the phone's picture
    from PIL import ImageDraw, ImageFont
    st = Image.new("RGB", (im.size[0], im.size[1] + 30), "#fff8d6"); st.paste(im, (0, 30)); d = ImageDraw.Draw(st)
    d.line([(0, 29), (im.size[0], 29)], fill="#2a72d9", width=2)
    try: fnt = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 13)
    except Exception: fnt = ImageFont.load_default()
    txt = "On the phone it is Sunday 15 November 2026, 13:50"; tw = d.textlength(txt, font=fnt); d.text(((im.size[0] - tw) / 2, 7), txt, fill="#172742", font=fnt)
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
parts = [("Ticket", "B154. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B154, canvas Page 5."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> The yellow strip on every screen is the time on the phone, the time the meals are compared with: Sunday 15 November 2026, 13:50. Lunch is at 13:45. B154.1: the flow as it is today, from the tap on Lunch to Today. B154.2: the same flow, new, every screen. A screen that stays is marked No change; a blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "21 November 13:41: such meals are anyway saved and should be taken from there. So Prepare it is just a click away because it is in the recipe."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B154", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
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
label(y, "B154.1 Today", "the flow as it is in 0.3.171: Lunch set five minutes after its time, then cooked")
y += 60
RA = [shot(X(0), y, "1a", PW, "B154.1a Lunch tapped", "draft", "The pencil logs the plate in Lunch."),
  shot(X(1), y, "1b", PW, "B154.1b The end of the plate", "draft", "Prepare it again, for a plate never cooked."),
  shot(X(2), y, "1c", PW, "B154.1c Prep", "draft", "A new cook, with no meal."),
  shot(X(3), y, "1d", PW, "B154.1d Make", "draft", "The steps."),
  shot(X(4), y, "1e", PW, "B154.1e Eat", "draft", "All of it, DaaM good, Save."),
  shot(X(5), y, "1f", PW, "B154.1f Save asks Which meal?", "draft", "The meal is asked a second time."),
  shot(X(6), y, "1g", PW, "B154.1g Today", "draft", "Lunch holds the plate twice.")]
for i in range(1, 7): arrow(X(i) - G + 2, y + 540)
y2 = max(RA) + 70
label(y2, "B154.2 New", "the same flow: the cook stays on Lunch, Save asks nothing, one record. The screen B154.1f is gone")
y2 += 60
bs = [shot(X(0), y2, "2a", PW, "B154.2a Lunch tapped", "same", "The pencil logs the plate in Lunch."),
  shot(X(1), y2, "2b", PW, "B154.2b The end of the plate", "changed", "Prepare it."),
  shot(X(2), y2, "2c", PW, "B154.2c Prep", "same", "The cook stays on Lunch."),
  shot(X(3), y2, "2d", PW, "B154.2d Make", "same", "The steps."),
  shot(X(4), y2, "2e", PW, "B154.2e Eat", "same", "All of it, DaaM good, Save."),
  shot(X(5), y2, "2f", PW, "B154.2f Today", "changed", "Lunch holds the plate once.")]
for i in range(1, 6): arrow(X(i) - G + 2, y2 + 540)
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories272.dc.html", t["boardTitle"], "Drawn 21 November 2026. Ticket B154, Kanban column Next. Pictures from the real app on a scratch build of 0.3.171, today and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories261.dc.html")
inner = B.render(W, Hc)
json.dump({"B154": {"file": "Stories272.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out154.json"), "w"))
print("B154", W, Hc + 230)
