# Board B151 v3 (20 November 2026, Coach Milan 16:08 to 16:13): the flow rethought, drawn as two whole flows like a prototype:
# today on top, new below, every screen; the pencil's edit mode as a branch. Pictures from shotB151v3.cjs. Run: gen, measure, gen.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT336.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT336.json")) if os.path.exists(f"{HERE}/heightsDT336.json") else {}
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
parts = [("Ticket", "DT336. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT336, canvas Page 5."),
  ("How to read this board", "<b>Whole flows, like a prototype.</b> DT336.1: the flow as it is today, from the barcode to the save that stops. DT336.2: the same flow, new, to the tea on a plate. DT336.3: a biscuit with no values, with a new heads-up. A screen that stays is marked No change; a blue outline marks what is new."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "22 November 17:35: For the food that is obviously 0 kcal like a tea, there is no reason for such questions or any other check. We note it as a tea or similar and enable it to be saved. If I ask anything to confirm, it may sound weird."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT336", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
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
label(y, "DT336.1 Today", "a tea scanned by its barcode, with no values in the database")
y += 60
RA = [shot(X(0), y, "1a", PW, "DT336.1a The barcode", "draft", "I tap Use the code only."),
  shot(X(1), y, "1b", PW, "DT336.1b The label check", "draft", "Every value is empty."),
  shot(X(2), y, "1c", PW, "DT336.1c Confirm & save", "draft", "It stops: energy and protein required.")]
for i in range(1, 3): arrow(X(i) - G + 2, y + 540)
y2 = max(RA) + 70
label(y2, "DT336.2 New", "the same flow: the tea counts as 0, with no question")
y2 += 60
RB = [shot(X(0), y2, "2a", PW, "DT336.2a The barcode", "same", "I tap Use the code only."),
  shot(X(1), y2, "2b", PW, "DT336.2b The label check", "changed", "One line: it counts as 0."),
  shot(X(2), y2, "2c", PW, "DT336.2c Confirm & save", "changed", "No box to tick."),
  shot(X(3), y2, "2d", PW, "DT336.2d The food's card", "changed", "No PD, said in words."),
  shot(X(4), y2, "2e", PW, "DT336.2e On the Plate", "changed", "Energy and protein stay.")]
for i in range(1, 5): arrow(X(i) - G + 2, y2 + 540)
y3 = max(RB) + 70
label(y3, "DT336.3 Any other product with no values", "a biscuit: a heads-up, then type the values", 0, 2)
y3 += 60
bs = [shot(X(0), y3, "3a", PW, "DT336.3a The barcode", "same", "I tap Use the code only."),
  shot(X(1), y3, "3b", PW, "DT336.3b The label check", "changed", "New heads-up. Empty: type the values from the pack.")]
arrow(X(1) - G + 2, y3 + 540)
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, t)
Hc = y + HT.get("ac", 900) + 40
# The open point, settled by Coach Milan 22 November 2026, 20:32: which products count as 0, a table in the agreement block
CHK = '<div style="font-size:12px;font-weight:900;letter-spacing:.05em;color:#5b6b8a;margin-top:14px">CHECKS, AGREED WITH THE GO</div>'
OBV0 = "<div style=\"font-size:12px;font-weight:900;letter-spacing:.05em;color:#5b6b8a;margin-top:14px\">WHICH PRODUCTS COUNT AS 0: THE OPEN POINT, SETTLED BY COACH MILAN 22 NOVEMBER 20:32</div><table style=\"margin-top:6px;width:100%;border-collapse:collapse;table-layout:fixed\"><colgroup><col style=\"width:220px\"><col style=\"width:62%\"><col></colgroup><tr><th style=\"padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742\">Step</th><th style=\"padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742\">What counts</th><th style=\"padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742\">Note</th></tr><tr><td style=\"padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0;font-weight:700\">1. The category</td><td style=\"padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0\">The product database's category is one of: teas, green teas, black teas, herbal teas, infusions, coffees, ground coffees, coffee beans, instant coffees, waters, mineral waters, spring waters, salts, sea salts.</td><td style=\"padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0;color:#3d4a63\">Read first. The server asks for it with the product (categories_tags).</td></tr><tr><td style=\"padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0;font-weight:700\">2. The name</td><td style=\"padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0\">Only when there is no category. A whole word: tea, Tee, Kräutertee, čaj, чај; coffee, Kaffee, kafa, кафа; water, Wasser, Mineralwasser, voda, вода; salt, Salz, morska so, kuhinjska so.</td><td style=\"padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0;color:#3d4a63\">In Serbian, so alone is too short and is also a German word, so only morska so and kuhinjska so.</td></tr><tr><td style=\"padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0;font-weight:700\">3. Words that block the 0</td><td style=\"padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0\">Always win, over the category and over the name: iced tea, Eistee, ledeni čaj, latte, cappuccino, 3in1, milk, Milch, mleko, sugar, Zucker, šećer, syrup, juice, Saft, sok, flavoured, Geschmack, crisps, chips, biscuits, Kekse, keks, cake, Kuchen, kolač, chocolate, Schokolade, čokolada, cream, Sahne, nuts, vinegar. The categories iced teas, coffee drinks, flavoured waters and sweetened drinks block it too.</td><td style=\"padding:10px 12px;font-size:14px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0;color:#3d4a63\">Salt and vinegar crisps, tea biscuits, coffee cake and Kaffee Sahne get the heads-up of AC7, never 0.</td></tr></table>"
Hc += 280
B.html = [h.replace(CHK, OBV0 + CHK, 1) for h in B.html]
board("Stories274.dc.html", t["boardTitle"], "Drawn 22 November 2026. Ticket DT336, Kanban column Next. Pictures from the real app on a scratch build of main, today and new. Drawn for the Go of Coach Milan; nothing in the app is changed.", B, W, Hc, "Stories273.dc.html")
inner = B.render(W, Hc)
json.dump({"DT336": {"file": "Stories274.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/out336.json"), "w"))
print("DT336", W, Hc + 230)
