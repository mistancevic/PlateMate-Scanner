# Board DT348 (25 November 2026; Coach Milan 23 November 23:50 to 23:59, Next; 25 November 20:18: draw). Main on top, new below. Pictures from shotDT348.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT348.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT348.json")) if os.path.exists(f"{HERE}/heightsDT348.json") else {}
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB")
    h = round(im.size[1] * w / im.size[0]); im = im.resize((w, h), Image.LANCZOS)
    # media go in as canvas assets (ticket form, rule 6); the webp is written next to the shots
    os.makedirs(f"{R}/web", exist_ok=True); im2 = im.resize((w * 2, h * 2), Image.LANCZOS) if False else Image.open(f"{R}/{name}.png").convert("RGB"); im2.save(f"{R}/web/{name}.webp", "WEBP", quality=72)
    srcu = ASSETS.get(name) or "data:image/webp;base64," + base64.b64encode(open(f"{R}/web/{name}.webp", "rb").read()).decode()
    return h, f'<img src="{srcu}" style="width:{w}px;height:{h}px;border-radius:12px;border:2px solid {border};display:block">'
def shot(x, y, name, w, title, status, note):
    bg, fg, label = CHIP[status]; h, im = pic(name, w, "#2a72d9" if status == "changed" else "#d1dcf0")
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px">'
      f'<div style="font-size:18px;font-weight:900;color:#123a7a">{title}</div>'
      f'<div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:{bg};color:{fg};font-size:12.5px;font-weight:800">{label}</div>'
      f'<div style="margin-top:6px;font-size:13.5px;line-height:1.4;color:#3d4a63;min-height:38px">{note}</div>'
      f'<div style="margin-top:8px">{im}</div></div>')
    return y + 110 + h
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.196")}
B = Board(); PW = 390; G = 90
W = SX + 3 * PW + 2 * G + 40
ASSETS = json.load(open(f"{HERE}/assetsDT348.json")) if os.path.exists(f"{HERE}/assetsDT348.json") else {}
parts = [("Ticket", "DT348. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT348, canvas Page 6."),
  ("How to read this board", "<b>As a prototype, left to right; each arrow is a tap.</b> DT348.1 as in main, 0.3.196: Edit recipe's steps, a tap on the button after the last step, and the publish sheet's steps. DT348.2 the same, new. A blue outline marks what each note is about."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "23 November 23:50: + Add a step and + Step here are two different buttons for the same job; should they be one kind? 23:59: yes, add it as Next. 25 November 20:18: yes (a full run first), but draw if it is not done yet: DT348. 26 November 01:28: I think we already had a design for these buttons. 01:40: but the buttons are not the same again; what is the better label, + Step here or + Add a step? Round or more squared? 01:41: yes (+ Add a step, the outlined button, between and after). 07:51: double check the spaces between buttons and steps. 08:03: Go."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "DT348", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
y = 30
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, c0=0, n=None):
    lw = (W - SX - 40) if n is None else n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(c0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(x, y, ch="→", tap=""):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:40px;font-weight:900;color:#2a72d9">{ch}</div>')
    if tap: B.html.append(f'<div style="position:absolute;left:{x}px;top:{y + 45}px;width:{G}px;text-align:center;font-size:12.5px;font-weight:800;color:#2a72d9">{tap}</div>')
def row(y, n, st, notes, last):
    r = [shot(X(i), y, f"48-{n}{c}", PW, f"DT348.{n}{c} {ttl}", s, nt) for i, (c, ttl, s, nt) in enumerate(zip("abc", ["Edit recipe, Steps", "Edit recipe, step 3 added", "Publish sheet, Steps"], st, notes))]
    arrow(X(0) + PW, y + 260, "→", f"tap<br>{last}"); arrow(X(1) + PW, y + 260, "→", "on the recipe<br>page, tap<br>Publish")
    return r
label(y, "DT348.1 In main, 0.3.196", "two buttons for one job", 0, 3)
y += 60
r1 = row(y, 1, ["draft", "draft", "draft"], ["+ Step here between, + Add a step at the end.", "Step 3 added; + Add a step again.", "The same editor: the same two buttons."], "+ Add a step")
y = max(r1) + 70
label(y, "DT348.2 New, redrawn 26 November", "one button: + Add a step", 0, 3)
y += 60
r2 = row(y, 2, ["changed", "same", "changed"], ["+ Add a step between and after.", "Step 3 added; + Add a step between and after.", "The same editor changes with it."], "+ Add a step")
RB = r2
bs = RB
y = max(bs + [30 + HT.get("card", 1500)]) + 80
acTable(B, y, W - 40, {**t, "rel": "Go 26 November 2026, 08:03; built in 0.3.197"})
Hc = y + HT.get("ac", 900) + 40
board("Stories298.dc.html", t["boardTitle"], "Drawn 25 November 2026, redrawn 26 November 01:50 and 08:00; Go 08:03, built in 0.3.197. Ticket DT348, Kanban column Done. Pictures from the real app: before on main, 0.3.196; new on a scratch build of main with the change. Nothing in the app is changed yet.", B, W, Hc, "Stories297.dc.html")
inner = B.render(W, Hc)
json.dump({"DT348": {"file": "Stories298.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outDT348.json"), "w"))
print("DT348", W, Hc + 230)
