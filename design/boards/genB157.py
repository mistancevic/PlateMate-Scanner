# Board B157 (22 November 2026, Coach Milan 21:11 to 21:12): Serbian word forms and Ice Tea block the 0 of DT336. Two whole flows
# like a prototype, today on top, new below, and Ice Tea as a third row. Pictures from shotB157.cjs. Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketB157.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsB157.json")) if os.path.exists(f"{HERE}/heightsB157.json") else {}
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
# Coach Milan 22 November 2026, 21:56: "today" on a board meant main, which he had not seen on Preview; the label says so
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.174")}
B = Board(); PW = 390; G = 70
W = SX + 4 * PW + 3 * G + 40
parts = [("Ticket", "B157. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: B157, canvas Page 6."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> B157.1: the flow as it is in main, 0.3.174, not on Preview yet, Čaj sa šećerom saved as 0. B157.2: the same flow, new, to the tea saved with its values from the pack. B157.3: an Ice Tea, new. A screen that stays is marked No change; a blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 21:11: Yes. Should we move onto the next ticket or to clean this one first. 21:12: What if sweet tea is with zero calorie sweetener?"),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B157", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→"):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
label(y, "B157.1 In main, 0.3.174, not on Preview yet", "Čaj sa šećerom, tea with sugar, with no category and no values in the database", 0, 3)
y += 60
RA = [shot(X(0), y, "1a", PW, "B157.1a The barcode", "draft", "I tap Use the code only."),
  shot(X(1), y, "1b", PW, "B157.1b The label check", "draft", "It counts as 0: šećerom is not šećer."),
  shot(X(2), y, "1c", PW, "B157.1c The food's card", "draft", "Saved as 0. The sugar is never counted.")]
for i in range(1, 3): arrow(X(i) - G + 2, y + 540)
y2 = max(RA) + 70
label(y2, "B157.2 New", "the same tea: the heads-up, then its values from the pack")
y2 += 60
RB = [shot(X(0), y2, "2a", PW, "B157.2a The barcode", "same", "I tap Use the code only."),
  shot(X(1), y2, "2b", PW, "B157.2b The label check", "changed", "The heads-up: šećerom blocks the 0."),
  shot(X(2), y2, "2c", PW, "B157.2c Confirm & save", "same", "I type the values from the pack."),
  shot(X(3), y2, "2d", PW, "B157.2d The food's card", "same", "Saved with its values. The sugar counts.")]
for i in range(1, 4): arrow(X(i) - G + 2, y2 + 540)
y3 = max(RB) + 70
label(y3, "B157.3 New", "Ice Tea Peach, written without the d", 0, 2)
y3 += 60
bs = [shot(X(0), y3, "3a", PW, "B157.3a The barcode", "same", "I tap Use the code only."),
  shot(X(1), y3, "3b", PW, "B157.3b The label check", "changed", "The heads-up: Ice Tea blocks the 0.")]
arrow(X(1) - G + 2, y3 + 540)
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
# The words that block the 0, new in B157: a table in the agreement block, above Checks
CHK = '<div style="font-size:12px;font-weight:900;letter-spacing:.05em;color:#5b6b8a;margin-top:14px">CHECKS, AGREED WITH THE GO</div>'
_th = "padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742"
_td = "padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0"
_rows = [("Serbian, Latin", "Matched by how the word starts: šećer, mlek, mleč, čokolad, kolač, keks, sok, sirup, krem, pavlak, šlag, čips, sirć, tort, orah, oras, ukus, and leden before čaj. New: sirup, krem, pavlaka, šlag, čips, sirće, torta, orasi, ukus.", "šećer blocks šećera, šećerom, šećerni; mlek and mleč block mleko, mlekom, mlečni."),
  ("Serbian, Cyrillic", "The same, in Cyrillic: шећер, млек, млеч, чоколад, колач, кекс, сок, сируп, крем, павлак, шлаг, чипс, сирћ, торт, орах, орас, укус, and леден before чај.", "Чај са шећером gets the heads-up."),
  ("English", "Added as whole words: ice tea, icetea.", "Ice Tea Peach gets the heads-up, as iced tea and Eistee do.")]
OBV0 = ('<div style="font-size:12px;font-weight:900;letter-spacing:.05em;color:#5b6b8a;margin-top:14px">THE WORDS THAT BLOCK THE 0, WHAT B157 ADDS</div>'
  '<table style="margin-top:6px;width:100%;border-collapse:collapse;table-layout:fixed"><colgroup><col style="width:180px"><col style="width:62%"><col></colgroup>'
  f'<tr><th style="{_th}">Words</th><th style="{_th}">What blocks the 0</th><th style="{_th}">Example</th></tr>'
  + "".join(f'<tr><td style="{_td};font-weight:700">{a}</td><td style="{_td}">{b}</td><td style="{_td};color:#3d4a63">{c}</td></tr>' for a, b, c in _rows) + '</table>')
B.html = [h.replace(CHK, OBV0 + CHK, 1) for h in B.html]
board("Stories275.dc.html", t["boardTitle"], "Drawn 22 November 2026. Ticket B157, Kanban column Done, v0.3.175. Pictures from the real app on a scratch build of main, 0.3.174 and new. Go 22 November 21:57; built in 0.3.175.", B, W, Hc, "Stories274.dc.html")
inner = B.render(W, Hc)
json.dump({"B157": {"file": "Stories275.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out157.json"), "w"))
print("B157", W, Hc + 230)
