# Board B158 (22 November 2026, Coach Milan 21:46 to 21:48): the heads-up of DT336 AC7 says what to do. Two whole flows like a
# prototype, today on top, new below, to the table read on Label. Pictures from shotB158.cjs. Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB158.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB158.json")) if os.path.exists(f"{HERE}/heightsB158.json") else {}
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB")
    h = round(im.size[1] * w / im.size[0]); im = im.resize((w, h), Image.LANCZOS)
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
parts = [("Ticket", "B158. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B158, canvas Page 6."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> B158.1: the flow as it is today in 0.3.174, to the heads-up. B158.2: the same flow, new words in the heads-up, then what the person does: close, the camera on Label, the table read. A screen that stays is marked No change; a blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 21:28: But tea with sugar on the pack has to have nutrition label with sugar listed there. 21:46: It would be easier to say, barcode reading currently doesn't return values. Close, and open camera for nutrition label reading. That is better and universal."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B158", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "B158.1 Today, 0.3.174", "Oat biscuits, a name and no values in the database", 0, 2)
y += 60
RA = [shot(X(0), y, "1a", PW, "B158.1a The barcode", "draft", "I tap Use the code only."),
  shot(X(1), y, "1b", PW, "B158.1b The label check", "draft", "The heads-up says to type the values.")]
arrow(X(1) - G + 2, y + 540)
y2 = max(RA) + 70
label(y2, "B158.2 New", "the heads-up says what to do; the rest is the app as it is")
y2 += 60
bs = [shot(X(0), y2, "2a", PW, "B158.2a The barcode", "same", "I tap Use the code only."),
  shot(X(1), y2, "2b", PW, "B158.2b The label check", "changed", "New words: close this, then Label."),
  shot(X(2), y2, "2c", PW, "B158.2c Foods", "same", "Close brings me back to Foods."),
  shot(X(3), y2, "2d", PW, "B158.2d The camera on Label", "same", "I take a photo of the table."),
  shot(X(4), y2, "2e", PW, "B158.2e The label check", "same", "The values, read from the photo.")]
for i in range(1, 5): arrow(X(i) - G + 2, y2 + 540)
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories276.dc.html", t["boardTitle"], "Drawn 22 November 2026. Ticket B158, Kanban column Next. Pictures from the real app on a scratch build of main, today and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories275.dc.html")
inner = B.render(W, Hc)
json.dump({"B158": {"file": "Stories276.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out158.json"), "w"))
print("B158", W, Hc + 230)
