# Board DT312 (27 November 2026; Coach Milan 14:29 and 14:33: pull it into Now, widen it, draw it). Three kinds of plate, each as
# in main 0.3.200 with the new flow under it (a scratch build of main with the change). Left band: a recipe (DT312.1, DT312.2)
# and a new dish I cook (DT312.3, DT312.4). Right band: a plate that is ready to eat (DT312.5, DT312.6). Two bands keep the
# board under 8000 px. No agreement block yet. Pictures from shotDT312.cjs.
import json, os, base64
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT312.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT312.json")) if os.path.exists(f"{HERE}/heightsDT312.json") else {}
ASSETS = json.load(open(f"{HERE}/assetsDT312.json")) if os.path.exists(f"{HERE}/assetsDT312.json") else {}
PW = 250; G = 90
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB")
    h = round(im.size[1] * w / im.size[0])
    os.makedirs(f"{R}/web", exist_ok=True); im.resize((w * 2, h * 2), Image.LANCZOS).save(f"{R}/web/{name}.webp", "WEBP", quality=74)
    srcu = ASSETS.get(name) or "data:image/webp;base64," + base64.b64encode(open(f"{R}/web/{name}.webp", "rb").read()).decode()
    return h, f'<img src="{srcu}" style="width:{w}px;height:{h}px;border-radius:12px;border:2px solid {border};display:block">'
def shot(x, y, name, title, status, note):
    bg, fg, label = CHIP[status]; h, im = pic(name, PW, "#2a72d9" if status == "changed" else "#d1dcf0")
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{PW}px">'
      f'<div style="font-size:17px;font-weight:900;color:#123a7a;line-height:1.25;min-height:44px">{title}</div>'
      f'<div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:{bg};color:{fg};font-size:12.5px;font-weight:800">{label}</div>'
      f'<div style="margin-top:6px;font-size:13px;line-height:1.4;color:#3d4a63;min-height:54px">{note}</div>'
      f'<div style="margin-top:8px">{im}</div></div>')
    return y + 140 + h
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.200")}
B = Board()
BG = 150; W2 = SX + 5 * (PW + G) - G + BG
W = W2 + 4 * (PW + G) - G + 40
parts = [("Ticket", "DT312. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT312, canvas Page 6."),
  ("How to read this board", "<b>As a prototype, left to right; each arrow is a tap.</b> Three kinds of plate, each as in main 0.3.200 and new right under it. Left band: DT312.1 and DT312.2 a recipe (Lazy Burek); DT312.3 and DT312.4 a new dish I cook (Eggs and Salmon). Right band: DT312.5 and DT312.6 a plate that is ready to eat (Skyr and Banana). A blue outline marks what each yellow note is about; the sizes are measured on the page. The AI is off in this run, so the steps are written by hand."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "27 November 14:29: I think Prepare it is misleading. For me preparation sounds like go for it. While I am on the Plate I am crafting the recipe. I am redirected to a preparation page which is empty, no info from the Plate, but the steps to cook and lock it. Either we craft the cooking steps on the Plate page or we solve it differently. And especially three steps that are independent in the process. Cooking and later giving feedback on how it was is kind of a separate process: I am supposed to give feedback on the meal while I am about to start eating it, because that is the expected step after Make. 14:33: yes, definitely. Before: 18 November 10:05, the three ways were a chip solution with a fixed set, to get through the process quickly; the flow should be reconstructed to fit today's app."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Open, to decide on this board", t["open"]), ("Decision", t["decision"]), ("3. The agreement", "Empty until the Go: the criteria and the checks come with it.")]
n0 = len(B.html); storyCard(B, 30, "DT312", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
X0 = SX
X = lambda i: X0 + i * (PW + G)
def label(y, text, sub, n):
    lw = n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:24px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(i, y, tap):
    x = X(i) + PW
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:38px;font-weight:900;color:#2a72d9">→</div>')
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y + 44}px;width:{G}px;text-align:center;font-size:12.5px;font-weight:800;color:#2a72d9;line-height:1.3">{tap}</div>')
def row(y, rid, text, sub, screens, taps, n=None):
    label(y, f"{rid} {text}", sub, n or len(screens)); y += 60
    ends = [shot(X(i), y, nm, f"{rid}{chr(97 + i)} {ti}", st, no) for i, (nm, ti, st, no) in enumerate(screens)]
    for i, tp in enumerate(taps): arrow(i, y + 220, tp)
    return max(ends) + 70
MAIN = "In main, 0.3.200"; NEW = "New, drawn for your approval"
y = 30
y = row(y, "DT312.1", "A recipe", MAIN + ": Plate, Prep, Make, Eat in one chain", [
  ("12-1a", "The Plate", "draft", "Ends with Prepare it as it is."),
  ("12-1b", "Prep", "draft", "No numbers; the steps again; Lock it and cook."),
  ("12-1c", "Make", "draft", "Ends with Cooked. Next: Eat."),
  ("12-1d", "Eat", "draft", "Asked before I have eaten.")],
  ["tap<br>Prepare it<br>as it is", "tap Lock it<br>and cook", "tap Cooked.<br>Next: Eat"], 5)
y = row(y, "DT312.2", "New: a recipe", NEW + ": the Plate, cooking, then I ate it", [
  ("12-2a", "The Plate", "changed", "What you make and the steps, then Start cooking."),
  ("12-2b", "Make", "changed", "No bar; ends with Cooked."),
  ("12-2c", "Today", "changed", "Ready to eat, I ate it."),
  ("12-2d", "How was it?", "changed", "After I ate.")],
  ["tap Start<br>cooking", "tap<br>Cooked", "later, tap<br>I ate it"], 5)
y = row(y, "DT312.3", "A new dish I cook", MAIN, [
  ("12-3a", "The Plate", "draft", "Prepare it; Write my own jumps away."),
  ("12-3b", "Prep", "draft", "Only the place for steps, and Lock it and cook."),
  ("12-3c", "Make", "draft", "Cooked. Next: Eat."),
  ("12-3d", "Eat", "draft", "Asked before I have eaten.")],
  ["tap<br>Prepare it", "tap Lock it<br>and cook", "tap Cooked.<br>Next: Eat"], 5)
y = row(y, "DT312.4", "New: a new dish I cook", NEW + ": the steps are written on the Plate", [
  ("12-4a", "The Plate, writing the steps", "changed", "Write my own opens in the Steps card."),
  ("12-4b", "The Plate, steps kept", "changed", "Ends with Start cooking."),
  ("12-4c", "Make", "changed", "No bar; my steps; Cooked."),
  ("12-4d", "Today", "changed", "Ready to eat, I ate it."),
  ("12-4e", "How was it?", "changed", "After I ate; Save in My recipes.")],
  ["tap Keep<br>my steps", "tap Start<br>cooking", "tap<br>Cooked", "later, tap<br>I ate it"])
yL = y
X0 = W2; y = 30
B.html.append(f'<div style="position:absolute;left:{W2 - BG // 2 - 2}px;top:20px;width:4px;height:{yL - 40}px;background:#d1dcf0;border-radius:2px"></div>')
y = row(y, "DT312.5", "A plate that is ready to eat", MAIN + ": the same three pages", [
  ("12-5a", "The Plate", "draft", "Nothing to cook; Prepare it."),
  ("12-5b", "Prep", "draft", "How do you want to eat it? Three fixed ways."),
  ("12-5c", "Make", "draft", "Start cooking, for skyr and a banana."),
  ("12-5d", "Eat", "draft", "Asked before I have eaten.")],
  ["tap<br>Prepare it", "pick a way,<br>tap Make it<br>this way", "tap Cooked.<br>Next: Eat"])
y = row(y, "DT312.6", "New: a plate that is ready to eat", NEW + ": Eat it, then I ate it", [
  ("12-6a", "The Plate", "changed", "Ends with Eat it."),
  ("12-6b", "Today", "changed", "Ready to eat, I ate it."),
  ("12-6c", "How was it?", "changed", "After I ate.")],
  ["tap<br>Eat it", "later, tap<br>I ate it"], 4)
y = max(y, yL)
Hc = max(y, 30 + HT.get("card", 2600) + 60)
board("Stories302.dc.html", t["boardTitle"], "Drawn 27 November 2026, 15:10 (Coach Milan 14:33: yes, definitely). Ticket DT312, Kanban column Now. Each kind of plate as in main 0.3.200, and new right under it. Pictures from the real app: main 0.3.200, and a scratch build of main with the change. Nothing in the app is changed yet. DT346 waits for this.", B, W, Hc, "Stories301.dc.html")
print("DT312", W, Hc + 230)
