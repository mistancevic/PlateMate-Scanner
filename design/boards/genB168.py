# Board B168 (24 November 2026; Coach Milan 07:04 and 07:07). Main on top, new below. Pictures from shotB168.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
t5 = json.load(open(f"{HERE}/ticketB168.json")); T = t5
ASSETS = json.load(open(f"{HERE}/assetsB168.json")) if os.path.exists(f"{HERE}/assetsB168.json") else {}
HT = json.load(open(f"{HERE}/heightsB168.json")) if os.path.exists(f"{HERE}/heightsB168.json") else {}
def pic(name, w, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB")
    if im.size[0] > 800: w = round(w * im.size[0] / 780)  # a screen wider than the phone keeps its scale
    h = round(im.size[1] * w / im.size[0]); im = im.resize((round(w * 1.5), round(h * 1.5)), Image.LANCZOS)
    # media go in as canvas assets (ticket form, rule 6): the webp is written next to the shots; with its upload's url known
    # (assetsB168.json) the board names that url, else the picture stays inline for a local look only
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
W = SX + 2 * PW + 1 * G + 40
def req(t, words):
    o = t["opportunity"]
    return [("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
      ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", words),
      ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"])]
parts = [("Ticket", "B168. This board is the ticket. On the canvas page Kanban it is one short card with the label Board: B168, canvas Page 6."),
  ("How to read this board", "<b>As a prototype, left to right; each arrow is a tap.</b> B168.1: Lazy Burek's PD card and its numbers, as in 0.3.192. B168.2: the same, new. A blue outline marks what each note is about.")] + \
  req(t5, "24 November 07:04: whether the numbers table under One portion gets its own ticket: yes, we need to fix that. 07:07: draw it with one portion.") + [("3. The agreement", "In the wide block at the bottom of this board.")]
n0 = len(B.html); storyCard(B, 30, "B168", "one portion, its numbers", parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
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
y = row(y, "B168.1 Before, 0.3.192", "the PD card, then its numbers", [
  ("68-1a", PW, "B168.1a Recipe page, PD card", "draft", "One portion: 549 kcal, 224 g."),
  ("68-1b", PW, "B168.1b The numbers", "draft", "Total 897 g, 2,194 kcal: the whole recipe.")], ["the letters"])
y = row(y, "B168.2 New", "the same two screens", [
  ("68-2a", PW, "B168.2a Recipe page, PD card", "same", "As before."),
  ("68-2b", PW, "B168.2b The numbers", "changed", "Total 224 g, 549 kcal: one portion.")], ["the letters"])
# every screen carries its id, for both tickets (rule 9); board() counts only the first id, so the count is made here
html = "".join(B.html); ids = set(re.findall(r"B168\.\d+[a-z]", html)); imgs = html.count("<img")
if len(ids) < imgs: raise SystemExit(f"{imgs} screens but {len(ids)} screen ids")
B.no_ids = True
y = max(y, 30 + HT.get("card", 2000) + 60) + 20
acTable(B, y, W - 40, {**t5, "rel": "Proposed; not agreed until Coach Milan says Go"}); B.html[-1] = B.html[-1].replace("<div data-ac", "<div data-ac=\"B168\"", 1)
Hc = y + HT.get("ac", 700) + 40
board("Stories294.dc.html", T["boardTitle"], "Drawn 24 November 2026, for the Go of Coach Milan. Ticket B168, Kanban column Now. Pictures from the real app on a scratch build of main, 0.3.192, with the change behind a flag for the board. Nothing in the app is changed yet.", B, W, Hc, "Stories293.dc.html")
inner = B.render(W, Hc)
json.dump({"B168": {"file": "Stories294.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outB168.json"), "w"))
print("B168", W, Hc + 230)
