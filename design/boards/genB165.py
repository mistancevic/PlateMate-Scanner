# Board B165 and B166 (23 November 2026; Coach Milan 22:26 and 23:33: both on one board). Main on top, new below, one ticket
# after the other. Pictures from shotB165.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
T = json.load(open(f"{HERE}/ticketB165.json")); t5, t6 = T["B165"], T["B166"]
ASSETS = json.load(open(f"{HERE}/assetsB165.json")) if os.path.exists(f"{HERE}/assetsB165.json") else {}
HT = json.load(open(f"{HERE}/heightsB165.json")) if os.path.exists(f"{HERE}/heightsB165.json") else {}
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB")
    if im.size[0] > 800: w = round(w * im.size[0] / 780)  # a screen wider than the phone keeps its scale
    h = round(im.size[1] * w / im.size[0]); im = im.resize((round(w * 1.5), round(h * 1.5)), Image.LANCZOS)
    # media go in as canvas assets (ticket form, rule 6): the webp is written next to the shots; with its upload's url known
    # (assetsB165.json) the board names that url, else the picture stays inline for a local look only
    os.makedirs(f"{R}/web", exist_ok=True); im.save(f"{R}/web/{name}.webp", "WEBP", quality=72)
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "Before, 0.3.191")}
B = Board(); PW = 390; G = 90
W = SX + 3 * PW + 2 * G + 40
def req(t, words):
    o = t["opportunity"]
    return [("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
      ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", words),
      ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"])]
parts = [("Tickets", "B165 and B166, drawn together on one board (Coach Milan 23 November 23:33). This board is both tickets. On the canvas page Kanban each is one short card with the label Board: B165 and B166, canvas Page 6."),
  ("How to read this board", "<b>As a prototype, left to right; each arrow is a tap.</b> B165.1: Lazy Burek's steps, then Edit recipe, as in 0.3.191. B165.2: the same, new. B166.1: the PD card, the numbers, Per 100 kcal, as in 0.3.191. B166.2: the same, new. A blue outline marks what each note is about."),
  ("B165. " + t5["title"], "")] + req(t5, "23 November 22:26, screenshots of Edit recipe: the chip runs out of the field. 23:33: draw B165 and B166 together.")[1:] + \
  [("B166. " + t6["title"], "")] + req(t6, "23 November 22:26, screenshots of the recipe page: an empty space after Total, Per 100 kcal far down and barely visible. 23:33: draw both.")[1:] + \
  [("3. The agreement", "Two blocks at the bottom of this board, B165 and B166.")]
n0 = len(B.html); storyCard(B, 30, "B165 B166", "a long chip, and numbers you can read", parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
X = lambda i: SX + i * (PW + G)
def label(y, text, sub, n):
    lw = n * PW + (n - 1) * G
    B.html.append(f'<div style="position:absolute;left:{X(0)}px;top:{y}px;width:{lw}px;border-bottom:3px solid #123a7a;padding-bottom:6px"><span style="font-size:26px;font-weight:900;color:#123a7a">{text}</span><span style="font-size:15px;color:#3d4a63;margin-left:12px">{sub}</span></div>')
def arrow(i, y, tap):
    x = X(i) + PW + (30 if i == 0 and tap == "Edit recipe" else 0)
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{G - (30 if tap == "Edit recipe" else 0)}px;text-align:center"><div style="font-size:40px;font-weight:900;color:#2a72d9;line-height:1">→</div><div style="font-size:12.5px;font-weight:800;color:#2a72d9;line-height:1.25">tap<br>{tap}</div></div>')
def row(y, rid, sub, shots, taps):
    label(y, rid, sub, len(shots)); y += 60
    ends = [shot(X(i), y, *s) for i, s in enumerate(shots)]
    for i, tap in enumerate(taps): arrow(i, y + 260, tap)
    return max(ends) + 70
y = 30
y = row(y, "B165.1 Before, 0.3.191", "the recipe page, then Edit recipe", [
  ("65-1a", PW, "B165.1a Recipe page, Steps", "draft", "The steps wrap here. Edit recipe is under them."),
  ("65-1b", PW, "B165.1b Edit recipe, Steps", "draft", "The long chip runs past the field, the card and the phone's edge.")], ["Edit recipe"])
y = row(y, "B165.2 New", "the same two screens", [
  ("65-2a", PW, "B165.2a Recipe page, Steps", "same", "As before."),
  ("65-2b", PW, "B165.2b Edit recipe, Steps", "changed", "The long chip wraps inside its box.")], ["Edit recipe"])
y = row(y, "B166.1 Before, 0.3.191", "the PD card, the numbers, Per 100 kcal", [
  ("66-1a", PW, "B166.1a Recipe page, PD card", "draft", "One portion's PD, with the letters."),
  ("66-1b", PW, "B166.1b The numbers", "draft", "An empty space after Total: white on white."),
  ("66-1c", PW, "B166.1c Per 100 kcal", "draft", "Its lines barely visible.")], ["the letters", "Per 100 kcal"])
y = row(y, "B166.2 New", "the same three screens", [
  ("66-2a", PW, "B166.2a Recipe page, PD card", "same", "As before."),
  ("66-2b", PW, "B166.2b The numbers", "changed", "The note under Total in grey."),
  ("66-2c", PW, "B166.2c Per 100 kcal", "changed", "The lines in dark text.")], ["the letters", "Per 100 kcal"])
# every screen carries its id, for both tickets (rule 9); board() counts only the first id, so the count is made here
html = "".join(B.html); ids = set(re.findall(r"B16[56]\.\d+[a-z]", html)); imgs = html.count("<img")
if len(ids) < imgs: raise SystemExit(f"{imgs} screens but {len(ids)} screen ids")
B.no_ids = True
y = max(y, 30 + HT.get("card", 3400) + 60) + 20
acTable(B, y, W - 40, {**t5, "rel": "Proposed; not agreed until Coach Milan says Go"}); B.html[-1] = B.html[-1].replace("<div data-ac", "<div data-ac=\"B165\"", 1)
y += HT.get("ac5", 800) + 30
acTable(B, y, W - 40, {**t6, "rel": "Proposed; not agreed until Coach Milan says Go"}); B.html[-1] = B.html[-1].replace("<div data-ac", "<div data-ac=\"B166\"", 1)
Hc = y + HT.get("ac6", 700) + 40
board("Stories293.dc.html", T["boardTitle"], "Drawn 23 November 2026, for the Go of Coach Milan. Tickets B165 and B166, Kanban column Next. Pictures from the real app on a scratch build of main, 0.3.191, and a sketch of the change on that build. Nothing in the app is changed yet.", B, W, Hc, "Stories292.dc.html")
inner = B.render(W, Hc)
json.dump({"B165": {"file": "Stories293.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outB165.json"), "w"))
print("B165", W, Hc + 230)
