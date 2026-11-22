# Board B151 v3 (20 November 2026, Coach Milan 16:08 to 16:13): the flow rethought, drawn as two whole flows like a prototype:
# today on top, new below, every screen; the pencil's edit mode as a branch. Pictures from shotB151v3.cjs. Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB155.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB155.json")) if os.path.exists(f"{HERE}/heightsB155.json") else {}
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB")
    # the day and time the screen is drawn on, on every screen (ticket form, rule 8): a yellow strip above the phone's picture
    from PIL import ImageDraw, ImageFont
    st = Image.new("RGB", (im.size[0], im.size[1] + 30), "#fff8d6"); st.paste(im, (0, 30)); d = ImageDraw.Draw(st)
    d.line([(0, 29), (im.size[0], 29)], fill="#2a72d9", width=2)
    try: fnt = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 13)
    except Exception: fnt = ImageFont.load_default()
    txt = "On the phone it is Sunday 22 November 2026, 10:38"; tw = d.textlength(txt, font=fnt); d.text(((im.size[0] - tw) / 2, 7), txt, fill="#172742", font=fnt)
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
W = SX + 4 * PW + 3 * G + 40
parts = [("Ticket", "B155. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B155, canvas Page 5."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> The yellow strip on every screen is the time on the phone: Sunday 22 November 2026, 10:38. B155.1: the flow as it is today, from the application to the card that comes back. B155.2: the same flow, new. B155.3: one branch, asking again with a code not used. A screen that stays is marked No change; a blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 10:40: What is this? He already asked for the code. I see he used it. But still this message is waiting for me. Also there is a note that is 2 requests."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B155", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
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
label(y, "B155.1 Today", "a person applies, is invited, joins, and sends the form once more")
y += 60
RA = [shot(X(0), y, "1a", PW, "B155.1a The application waits", "draft", "I tap Invite."),
  shot(X(1), y, "1b", PW, "B155.1b After Invite", "draft", "It left Waiting for you: Handled."),
  shot(X(2), y, "1c", PW, "B155.1c She joined, and asked again", "draft", "The card is back, with Invite.")]
for i in range(1, 3): arrow(X(i) - G + 2, y + 540)
y2 = max(RA) + 70
label(y2, "B155.2 New", "the same flow: a person who joined does not wait")
y2 += 60
RB = [shot(X(0), y2, "2a", PW, "B155.2a The application waits", "same", "I tap Invite."),
  shot(X(1), y2, "2b", PW, "B155.2b After Invite", "same", "It left Waiting for you: Handled."),
  shot(X(2), y2, "2c", PW, "B155.2c She joined, and asked again", "changed", "Nothing waits for me."),
  shot(X(3), y2, "2d", PW, "B155.2d Further down", "changed", "Her request: Already a client.")]
for i in range(1, 4): arrow(X(i) - G + 2, y2 + 540)
y3 = max(RB) + 70
label(y3, "B155.3 Asking again with a code not used", "branch from B155.2b: today on the left, new on the right", 0, 2)
y3 += 60
bs = [shot(X(0), y3, "3a", PW, "B155.3a Today", "draft", "It looks like a first request."),
  shot(X(1), y3, "3b", PW, "B155.3b New", "changed", "It waits, and says she was invited.")]
arrow(X(1) - G + 2, y3 + 540)
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories273.dc.html", t["boardTitle"], "Drawn 22 November 2026. Ticket B155, Kanban column Now. Pictures from the real app in the coach demo on a scratch build of 0.3.172, today and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories272.dc.html")
inner = B.render(W, Hc)
json.dump({"B155": {"file": "Stories273.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out155.json"), "w"))
print("B155", W, Hc + 230)
