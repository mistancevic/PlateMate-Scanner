# Board DT312 (27 November 2026; Coach Milan 14:29 and 14:33: pull it into Now, widen it, draw it; 16:16 and 16:17: one logic,
# redraw). Left band, as in main 0.3.200: DT312.1 a recipe's copy from the Plate, DT312.3 a new dish, DT312.5 a ready plate,
# DT312.7 from a recipe's page. Right band, new (a scratch build of main with the change): DT312.8 the ways in, DT312.9 the
# one cook, DT312.10 after Cooked. The first drawing's rows DT312.2, DT312.4 and DT312.6 are replaced by these. Three bands
# keep the board under 8000 px (DT312.12 and DT312.13 are the third). No agreement block yet. Pictures from shotDT312.cjs.
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
BG = 150; W2 = SX + 4 * (PW + G) - G + BG
W3 = W2 + 5 * (PW + G) - G + BG
W = W3 + 4 * (PW + G) - G + 40
parts = [("Ticket", "DT312. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT312, canvas Page 6."),
  ("How to read this board", "<b>As a prototype, left to right; each arrow is a tap.</b> Left band, as in main 0.3.200, four ways through: DT312.1 a recipe's copy from the Plate, DT312.3 a new dish I cook, DT312.5 a plate that is ready to eat, DT312.7 from a recipe's page. Right band, new, one logic in three parts: <b>DT312.8 the ways in</b>, side by side, not a sequence; <b>DT312.9 the one cook</b>, the same for every way in; <b>DT312.10 after Cooked</b> with no meal set; <b>DT312.11</b> the same with a meal set on the Plate. Third band: <b>DT312.12</b> the Plate's main step pinned, as the phone shows it; <b>DT312.13</b> Chef Mealan's one question for a cooked meal that waits, with the time on each screen (between 13a and 13b no tap: time passes); <b>DT312.14</b> the meal's page for three kinds of meal, side by side. The first drawing's rows DT312.2, DT312.4 and DT312.6 are replaced by DT312.8 to DT312.10. A blue outline marks what each yellow note is about; the sizes are measured on the page. The AI is off in this run, so the steps are written by hand."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "27 November 16:12, on the first drawing: cooking is starting with preparing ingredients first; which flow is here, why is there a difference from the other cooking flow? 16:16: it is important to have one logic. The mid process should be the same, only the inputs and what to do with the output should differ. That gives us a system that can be reused all over again, and users get used to the flows. 16:17: yes. 15:44: the three ways should go away. 15:50: Today is the place where we manage actions out of the Plate and from the Plan. 16:01: yes, filled. Before, 14:29: I think Prepare it is misleading. For me preparation sounds like go for it. While I am on the Plate I am crafting the recipe. I am redirected to a preparation page which is empty, no info from the Plate, but the steps to cook and lock it. Either we craft the cooking steps on the Plate page or we solve it differently. And especially three steps that are independent in the process. Cooking and later giving feedback on how it was is kind of a separate process: I am supposed to give feedback on the meal while I am about to start eating it, because that is the expected step after Make. 14:33: yes, definitely. Before: 18 November 10:05, the three ways were a chip solution with a fixed set, to get through the process quickly; the flow should be reconstructed to fit today's app."),
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
def row(y, rid, text, sub, screens, taps, n=None):
    label(y, f"{rid} {text}", sub, n or len(screens)); y += 60
    ends = [shot(X(i), y, nm, f"{rid}{chr(97 + i)} {ti}", st, no) for i, (nm, ti, st, no) in enumerate(screens)]
    for i, tp in enumerate(taps):
        if tp: arrow(i, y + 220, tp)
    return max(ends) + 70
y = 30
y = row(y, "DT312.1", "A recipe's copy, from the Plate", MAIN + ": Plate, Prep, the Make page, Eat", [
  ("12-1a", "The Plate", "draft", "Ends with Prepare it as it is."),
  ("12-1b", "Prep", "draft", "No numbers; the steps again; Lock it and cook."),
  ("12-1c", "The Make page", "draft", "A checklist; a second Start cooking; Cooked. Next: Eat."),
  ("12-1d", "Eat", "draft", "Asked before I have eaten.")],
  ["tap<br>Prepare it<br>as it is", "tap Lock it<br>and cook", "tap Cooked.<br>Next: Eat"])
y = row(y, "DT312.3", "A new dish I cook", MAIN, [
  ("12-3a", "The Plate", "draft", "Prepare it; Write my own jumps away."),
  ("12-3b", "Prep", "draft", "Only the place for steps, and Lock it and cook."),
  ("12-3c", "The Make page", "draft", "Cooked. Next: Eat."),
  ("12-3d", "Eat", "draft", "Asked before I have eaten.")],
  ["tap<br>Prepare it", "tap Lock it<br>and cook", "tap Cooked.<br>Next: Eat"])
y = row(y, "DT312.5", "A plate that is ready to eat", MAIN + ": the same pages", [
  ("12-5a", "The Plate", "draft", "Nothing to cook; Prepare it."),
  ("12-5b", "Prep", "draft", "How do you want to eat it? Three fixed ways."),
  ("12-5c", "The Make page", "draft", "Start cooking, for skyr and a banana."),
  ("12-5d", "Eat", "draft", "Asked before I have eaten.")],
  ["tap<br>Prepare it", "pick a way,<br>tap Make it<br>this way", "tap Cooked.<br>Next: Eat"])
y = row(y, "DT312.7", "From a recipe's page", MAIN + ": the other cooking flow", [
  ("12-7a", "Lazy Burek's page, Steps", "draft", "Start cooking."),
  ("12-7b", "Cook mode, Get it ready", "draft", "Opens at once; put out what you need."),
  ("12-7c", "Cook mode, done", "draft", "Cooked. Next: Eat; no How did the cooking go?"),
  ("12-7d", "Eat", "draft", "Asked before I have eaten.")],
  ["tap Start<br>cooking", "Step 1,<br>then Next<br>to the end", "tap Cooked.<br>Next: Eat"])
yL = y
X0 = W2; y = 30
B.html.append(f'<div style="position:absolute;left:{W2 - BG // 2 - 2}px;top:20px;width:4px;height:{yL - 40}px;background:#d1dcf0;border-radius:2px"></div>')
y = row(y, "DT312.8", "New: the ways in, side by side", NEW + ": each hands the cook a name, the foods, the steps", [
  ("12-8a", "A recipe's page", "same", "Start cooking leads to DT312.9a."),
  ("12-8b", "The Plate, a recipe's copy", "changed", "Start cooking › leads to DT312.9a."),
  ("12-8c", "The Plate, a new dish: writing the steps", "changed", "Write my own opens in the Steps card."),
  ("12-8d", "The Plate, a new dish", "changed", "Start cooking › leads to DT312.9a."),
  ("12-8e", "The strip, Cooking now", "changed", "Go on › opens the cook where I left it.")],
  [None, None, "tap Keep<br>my steps", None])
y = row(y, "DT312.9", "New: the one cook", NEW + ": the same for every way in", [
  ("12-9a", "Get it ready", "changed", "Put out what you need."),
  ("12-9b", "The steps, one at a time", "same", "Voice or buttons; a photo on any step."),
  ("12-9c", "Done", "changed", "The meal's photo, How did the cooking go?, Cooked.")],
  ["tap<br>Step 1 ›", "tap Next ›<br>to the end"], 5)
y = row(y, "DT312.10", "New: after Cooked, no meal set", NEW + ": I ate it logs at once; How was it? is on the meal's card", [
  ("12-10a", "Today", "changed", "Ready to eat, I ate it."),
  ("12-10b", "Which meal was it?", "changed", "Only when no meal was set."),
  ("12-10c", "Today, logged", "changed", "In Today's meals; How was it? on the card."),
  ("12-10d", "How was it?", "changed", "The meal's own page."),
  ("12-10e", "The Plate, ready to eat", "changed", "Eat it › skips the cook, leads to DT312.10a.")],
  ["later, tap<br>I ate it", "tap<br>Lunch", "tap How<br>was it?", None])
y = row(y, "DT312.11", "New: with a meal set on the Plate", NEW + ": the meal sits in its place on Today", [
  ("12-11a", "The Plate, Lunch set", "same", "Meal and day: Lunch, 13:45."),
  ("12-11b", "Today, while cooking", "changed", "In Lunch's place: Cooking now, Go on."),
  ("12-11c", "Today, after Cooked", "changed", "In Lunch's place: I ate it."),
  ("12-11d", "Today, logged", "changed", "One tap; Lunch in Today's meals; How was it? on the card.")],
  ["tap Start<br>cooking,<br>Step 1,<br>✕ Close", "tap Go on,<br>Next to the<br>end, Cooked", "later, tap<br>I ate it"], 5)
yM = y
X0 = W3; y = 30
B.html.append(f'<div style="position:absolute;left:{W3 - BG // 2 - 2}px;top:20px;width:4px;height:{max(yL, yM) - 40}px;background:#d1dcf0;border-radius:2px"></div>')
y = row(y, "DT312.12", "New: the main step stays in view", NEW + ": the phone's screen, the button pinned above the tab bar", [
  ("12-12a", "The Plate, a recipe's copy", "changed", "Start cooking › pinned."),
  ("12-12b", "The Plate, a new dish", "changed", "The same place."),
  ("12-12c", "The Plate, ready to eat", "changed", "Eat it › in the same place.")],
  [None, None], 4)
y = row(y, "DT312.13", "New: a cooked meal that waits", NEW + ": Chef Mealan asks once, after 30 minutes; the time is on each screen", [
  ("12-13a", "Today, 12:10", "same", "Cooked for lunch; it waits."),
  ("12-13b", "Today, 14:20", "changed", "Did you eat your Lazy Burek?"),
  ("12-13c", "Today, after Not yet", "changed", "It waits; no question again today."),
  ("12-13d", "Today, 12:45, no meal set", "changed", "The question in the strip's place.")],
  [None, "tap<br>Not yet", None], 4)
y = row(y, "DT312.14", "New: the meal's page, How was it?", NEW + ": what the Eat page asked, moved; opened from How was it? on the card", [
  ("12-14a", "A recipe with servings", "changed", "How many of the 4 portions did you eat?"),
  ("12-14b", "A changed recipe for one plate", "changed", "Update my recipe, Save as a new recipe, Only this time."),
  ("12-14c", "A new dish", "changed", "Save in My recipes; It makes N.")],
  [None, None], 4)
y = max(y, yL, yM)
Hc = max(y, 30 + HT.get("card", 2600) + 60)
board("Stories302.dc.html", t["boardTitle"], "Drawn 27 November 2026, 15:10; redrawn 16:50 as one logic (Coach Milan 16:16 and 16:17). Ticket DT312, Kanban column Now; DT355 is merged into it. Left: four ways through as in main 0.3.200. Right, new: the ways in, the one cook, after Cooked. Pictures from the real app: main 0.3.200, and a scratch build of main with the change. Nothing in the app is changed yet. DT346 waits for this.", B, W, Hc, "Stories301.dc.html")
print("DT312", W, Hc + 230)
