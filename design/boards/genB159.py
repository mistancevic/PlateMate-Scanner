# Board B159 (23 November 2026; Coach Milan 17:07 and 17:09): a day before the client's phone recorded activity says not known.
# Main on top, new below. Pictures from shotB159.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB159.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB159.json")) if os.path.exists(f"{HERE}/heightsB159.json") else {}
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.185, not on Preview yet")}
B = Board(); PW = 390; G = 70
W = SX + 2 * PW + G + 40
parts = [("Ticket", "B159. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B159, canvas Page 6."),
  ("How to read this board", "<b>As a prototype.</b> B159.1: a client's card on the coach's Clients page as it is in main, 0.3.185, not on Preview yet. B159.2: the same card, new. The example client Sara, whose phone recorded from yesterday. A blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "23 November 17:05: before the release it was a more coloured page. 17:07: so what is there now that is the whole truth? 17:09: fix first. 17:15: an o instead of a question mark."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B159", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "B159.1 In main, 0.3.185", "not on Preview yet: Clients, Sara's card", 0, 1)
label(y, "B159.2 New", "the same card", 1, 1)
y += 60
RB = [shot(X(0), y, "1a", PW, "B159.1a Sara's card", "draft", "Monday and Tuesday read not opened, though her phone only recorded from yesterday."),
  shot(X(1), y, "2a", PW, "B159.2a Sara's card", "changed", "Monday and Tuesday read o: not known. The key line names it.")]
bs = RB
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
board("Stories286.dc.html", t["boardTitle"], "Drawn 23 November 2026. Ticket B159, Kanban column Next. Pictures from the real app on a scratch build of main, 0.3.185 and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories285.dc.html")
inner = B.render(W, Hc)
json.dump({"B159": {"file": "Stories286.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out159.json"), "w"))
print("B159", W, Hc + 230)
