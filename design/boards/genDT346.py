# Board DT346 (26 November 2026; Coach Milan 14:25: draw the three states as they are in main). Four rows, all in main 0.3.200;
# no new flow yet and no agreement block, because no look is chosen. Pictures from shotDT346.cjs.
import json, os, base64
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
SX = 400
t = json.load(open(f"{HERE}/ticketDT346.json")); o = t["opportunity"]
HT = json.load(open(f"{HERE}/heightsDT346.json")) if os.path.exists(f"{HERE}/heightsDT346.json") else {}
ASSETS = json.load(open(f"{HERE}/assetsDT346.json")) if os.path.exists(f"{HERE}/assetsDT346.json") else {}
PW = 250; G = 90
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB")
    h = round(im.size[1] * w / im.size[0])
    # media go in as canvas assets (ticket form, rule 6); the webp is written next to the shots
    os.makedirs(f"{R}/web", exist_ok=True); im.resize((w * 2, h * 2), Image.LANCZOS).save(f"{R}/web/{name}.webp", "WEBP", quality=74)
    srcu = ASSETS.get(name) or "data:image/webp;base64," + base64.b64encode(open(f"{R}/web/{name}.webp", "rb").read()).decode()
    return h, f'<img src="{srcu}" style="width:{w}px;height:{h}px;border-radius:12px;border:2px solid {border};display:block">'
def shot(x, y, name, title, status, note):
    bg, fg, label = CHIP[status]; h, im = pic(name, PW, "#d1dcf0")
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{PW}px">'
      f'<div style="font-size:17px;font-weight:900;color:#123a7a;line-height:1.25;min-height:44px">{title}</div>'
      f'<div style="display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;background:{bg};color:{fg};font-size:12.5px;font-weight:800">{label}</div>'
      f'<div style="margin-top:6px;font-size:13px;line-height:1.4;color:#3d4a63;min-height:54px">{note}</div>'
      f'<div style="margin-top:8px">{im}</div></div>')
    return y + 140 + h
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "In main, 0.3.200"), "out": ("#8a97b0", "#fff", "In main, 0.3.200 · cook mode, out of DT346")}
B = Board()
W = SX + 6 * PW + 5 * G + 40
parts = [("Ticket", "DT346. This board is the ticket: everything about it is here. On the canvas page Kanban it is one short card with the label Board: DT346, canvas Page 6."),
  ("How to read this board", "<b>As a prototype, left to right; each arrow is a tap.</b> Four rows, all as they are in main, 0.3.200: DT346.1 Edit recipe; DT346.2 Put it on the Plate, a recipe with servings; DT346.3 Put it on the Plate, a recipe for one plate; DT346.4 a new dish on the Plate. A blue outline marks what each yellow note is about; the sizes are measured on the page. No new flow yet: the look of each state is chosen next."),
  ("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
  ("Problem", t["problem"]), ("Story", t["story"]),
  ("In Coach Milan's words", "23 November 19:03, after making Lazy Burek: confusing when the recipe is in edit mode and when the Plate is not editing it but making a new recipe. 26 November 10:32: Now, as one batch for the Recipes area, with the design rules applied to the parts it touches. 14:25: pull main; start by drawing the three states as they are in main. Out of scope: cook mode, a member's recipe page and Plan."),
  ("2. The solution and the decision", ""), ("Now", t["now"]), ("Found while drawing", t["found"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]),
  ("Decision", t["decision"]), ("3. The agreement", "Empty until a look is chosen.")]
n0 = len(B.html); storyCard(B, 30, "DT346", t["title"], parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, n):
    lw = n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:24px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(i, y, tap):
    x = X(i) + PW
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G}px;text-align:center;font-size:38px;font-weight:900;color:#2a72d9">→</div>')
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y + 44}px;width:{G}px;text-align:center;font-size:12.5px;font-weight:800;color:#2a72d9;line-height:1.3">{tap}</div>')
def row(y, rid, text, sub, screens, taps):
    label(y, f"{rid} {text}", sub, len(screens)); y += 60
    ends = [shot(X(i), y, n, f"{rid}{chr(97 + i)} {ti}", st, no) for i, (n, ti, st, no) in enumerate(screens)]
    for i, tp in enumerate(taps): arrow(i, y + 220, tp)
    return max(ends) + 70
y = 30
y = row(y, "DT346.1", "Edit recipe on the recipe page", "In main, 0.3.200: the recipe changes in place", [
  ("46-1a", "Lazy Burek's page", "draft", "The page I read; Edit recipe near the end."),
  ("46-1b", "Edit recipe", "draft", "The same page with fields; the only sign is a small tag."),
  ("46-1c", "Saved", "draft", "Back to the reading page; no line says saved.")],
  ["tap<br>Edit recipe", "300 g,<br>tap Save<br>changes"])
y = row(y, "DT346.2", "Put it on the Plate: a recipe with servings", "Lazy Burek makes 4: the change never reaches the recipe", [
  ("46-2a", "Lazy Burek's page, further down", "draft", "What do you do with it?"),
  ("46-2b", "The Plate", "draft", "From your screenshot; I set 300 g."),
  ("46-2c", "Prep", "out", "On the way to Eat."),
  ("46-2d", "Make", "out", "On the way to Eat."),
  ("46-2e", "Eat", "draft", "In My recipes already; no question."),
  ("46-2f", "Recipes, Lazy Burek", "draft", "Still 375 g.")],
  ["tap Put it<br>on the<br>Plate", "300 g,<br>tap Prepare<br>it as it is", "tap Lock it<br>and cook", "tap Cooked.<br>Next: Eat,<br>DaaM good", "tap Save,<br>then<br>Recipes,<br>Lazy Burek"])
y = row(y, "DT346.3", "Put it on the Plate: a recipe for one plate", "Feta omelette, no servings: Eat asks at the end", [
  ("46-3a", "Feta omelette's page, further down", "draft", "What do you do with it?"),
  ("46-3b", "The Plate", "draft", "From My recipes; I set 80 g."),
  ("46-3c", "Prep", "out", "On the way to Eat."),
  ("46-3d", "Make", "out", "On the way to Eat."),
  ("46-3e", "Eat", "draft", "Update my recipe, Save as a new recipe, Only this time.")],
  ["tap Put it<br>on the<br>Plate", "80 g,<br>tap<br>Prepare it", "tap Lock it<br>and cook", "tap Cooked.<br>Next: Eat,<br>DaaM good"])
y = row(y, "DT346.4", "A new dish on the Plate", "No recipe behind it: Save in My recipes at Eat", [
  ("46-4a", "The empty Plate", "draft", "Meal title, nothing yet."),
  ("46-4b", "The Plate, two foods", "draft", "The same screen as DT346.3b but for one line."),
  ("46-4c", "Prep", "out", "On the way to Eat."),
  ("46-4d", "Make", "out", "On the way to Eat."),
  ("46-4e", "Eat", "draft", "Save in My recipes.")],
  ["tap Add on<br>Eggs, then<br>add Salmon", "tap<br>Prepare it", "tap Lock it<br>and cook", "tap Cooked.<br>Next: Eat,<br>DaaM good"])
Hc = max(y, 30 + HT.get("card", 1800) + 60)
board("Stories301.dc.html", t["boardTitle"], "Drawn 26 November 2026 (Coach Milan 14:25: draw the three states as they are in main). Ticket DT346, Kanban column Now. Pictures from the real app, main 0.3.200. Nothing in the app is changed. Next: choose how each state looks.", B, W, Hc, "Stories300.dc.html")
print("DT346", W, Hc + 230)
