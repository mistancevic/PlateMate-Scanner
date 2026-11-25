# Board B168 and DT349 (24 November 2026; Coach Milan 07:04 to 13:54). Main on top, new below, the Plate for reference.
# Pictures from shotB168.cjs.
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(f"{HERE}/genDT308d.py").read(); exec(src[:src.index("\nstart(4)")])
s13 = open(f"{HERE}/genDT313.py").read(); exec(s13[s13.index("def gwt"):s13.index("def parts")])
SX = 400
T = json.load(open(f"{HERE}/ticketB168.json")); t5, t6 = T["B168"], T["DT349"]
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
CHIP = {**CHIP, "draft": (CHIP["draft"][0], CHIP["draft"][1], "Before, 0.3.192")}
B = Board(); PW = 390; G = 90
COLW = 4 * PW + 3 * G; GAP2 = 140
W = SX + 2 * COLW + GAP2 + 40  # two new flows side by side: the board stays under 8000 px (README)
def req(t, words):
    o = t["opportunity"]
    return [("1. The request", ""), ("Opportunity, why we act", f'<b>Where it comes from:</b> {o["from"]}<br><b>The job:</b> {o["job"]}<br><b>What stood in the way:</b> {o["kind"]}<br><b>Why now:</b> {o["why_now"]}'),
      ("Problem", t["problem"]), ("Story", t["story"]), ("In Coach Milan's words", words),
      ("2. The solution and the decision", ""), ("Now", t["now"]), ("Proposed", t["proposed"]), ("Looked at, not chosen", t["looked_at"]), ("Decision", t["decision"])]
W8 = "24 November 07:04: yes, its own ticket, we need to fix that. 07:07: draw it with one portion. 07:42: the same PD card layout as on the Plate, in the design system and components; can we use + - to navigate what is considered for calculation? 07:48: A. 07:58: I dont want more navigations in the card; we already have the + - portion feature, use that one; make it as a variant; for the PD card, a new design ticket. 13:47: so far all good; the + - position is to brainstorm; Cook it is more like a CTA, so maybe separate Cook it as CTA and the portioning selection and its impact on the portion calculation. 13:53: then we should separate the whole recipe and cooking from the portion calculation of macros. 13:54: draw and then we continue. 14:49: no; the header should be related to the meal: title, photo, PD card and macros and all the info there as it is now; full meal, portion and 100 g as comparison reference, that is good. Where the photo is, a placeholder photo of the meal with the no photo info, so the CTAs fit into the photo. Portioning should be somewhere else, + - or chip selection with portion numbers. 14:50: yes, except the PD card: not one portion but the whole meal. 15:14: one person, two (a partner, or two meals), three, a family of 4 or 5: these numbers are most probably needed; + - or chips? 17:38: it seems we need both: chips for quick selection and a way to select exact; later the exact can be custom, even smart: 1 is father, 2 is mother, 3 a kid of 10, 4 a kid of 3, so it calibrates the total dynamically. 18:42: so it is not portion but parts of the meal; portion is my custom calculated size, weight and macros based on the selected meal and the overall daily plan. 22:26: yes (servings). Important is to understand that there is a difference between portion and serving, especially between different people and their goal dependency. 25 November 07:54: we need to align on the structure of the page; the card and Cook for are not in sync; PD has everything as a block; Foods is one block. 07:58: the top is fixed and per full recipe as is; for customization below we have a game; PD stays the same no matter what; other numbers are dynamically calculated; My Recipes is for me; recipes from others may require some adaptation. 08:01: still we need meal selection or looking mode; Cook for, are you sure we need that wording? 08:02: yes (two controls, DT351 into DT349)."
parts = [("Tickets", "B168 and DT349, drawn together on one board (Coach Milan 24 November 13:51 to 13:54). On the canvas page Kanban each is one short card with the label Board: B168 and DT349, canvas Page 6."),
  ("How to read this board", "<b>As a prototype, left to right; each arrow is a tap.</b> B168.1: Lazy Burek's page as in 0.3.192. B168.2: the same, new, Just looking: the top is the recipe as written and never moves; below it How much, where the servings, their numbers and the foods follow one choice. B168.3: the same page seen as one of my meals: the count becomes my portions (nutrition rule N17). B168.4: the Plate's card, for reference, to the right of B168.1. The two new flows stand side by side under the flow before. A blue outline marks what each note is about."),
  ("In Coach Milan's words", W8),
  ("B168. " + t5["title"], "")] + req(t5, "")[1:4] + req(t5, "")[5:] + \
  [("DT349. " + t6["title"], "")] + req(t6, "")[1:4] + req(t6, "")[5:] + \
  [("3. The agreement", "Two blocks at the bottom of this board, B168 and DT349.")]
n0 = len(B.html); storyCard(B, 30, "B168 DT349", "the top is the recipe, fixed; below it, How much", parts, 350); B.html[n0] = B.html[n0].replace("<div style=", "<div data-card style=", 1)
XO = 0
X = lambda i: SX + XO + i * (PW + G)
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
y1 = row(y, "B168.1 Before, 0.3.192", "the PD card, its numbers, Cook it", [
  ("68-1a", PW, "B168.1a Recipe page, PD card", "draft", "One portion in one small line."),
  ("68-1b", PW, "B168.1b The numbers", "draft", "Inside the card; Total 897 g: the whole recipe."),
  ("68-1c", PW, "B168.1c Cook it at 1", "draft", "1 portions; the card does not follow.")], ["the letters", "Cook it − three times"])
XO = COLW + GAP2
y4 = row(y, "B168.4 The Plate", "the card the recipe page takes, for reference", [
  ("68-4a", PW, "B168.4a The Plate, PD card", "same", "As now; it becomes PdCard.")], [])
XO = 0; y = max(y1, y4)
y2 = row(y, "B168.2 New: Just looking", "the top is fixed; How much counts the recipe's servings; Foods follows", [
  ("68-2a", PW, "B168.2a Recipe page", "changed", "The top fixed; How much; Foods as one block; 1 SERVING in Nutrition."),
  ("68-2b", PW, "B168.2b The numbers", "changed", "Under the card; the whole recipe, Total 897 g."),
  ("68-2c", PW, "B168.2c 2 servings", "changed", "The line and the foods follow; the top does not."),
  ("68-2d", PW, "B168.2d Other, 10 servings", "changed", "Other: − and + for an exact number.")], ["the letters", "Servings, 2", "Other, + to 10"])
XO = COLW + GAP2
y3 = row(y, "B168.3 New: see it as one of my meals", "the count becomes my portions for that meal; the top stays the recipe", [
  ("68-3a", PW, "B168.3a Recipe page, How much", "changed", "The page of B168.2a, at its How much block."),
  ("68-3b", PW, "B168.3b Seen as Dinner", "changed", "My dinner portion; Foods for 1 dinner portion."),
  ("68-3c", PW, "B168.3c 2 portions", "changed", "Two of my dinners."),
  ("68-3d", PW, "B168.3d Seen as a Snack", "changed", "A smaller portion, the same PD.")], ["Dinner", "Portions, 2", "Snack"])
XO = 0; y = max(y2, y3)
# every screen carries its id, for both tickets (rule 9); board() counts only the first id, so the count is made here
html = "".join(B.html); ids = set(re.findall(r"B168\.\d+[a-z]", html)); imgs = html.count("<img")
if len(ids) < imgs: raise SystemExit(f"{imgs} screens but {len(ids)} screen ids")
B.no_ids = True
y = max(y, 30 + HT.get("card", 3400) + 60) + 20
acTable(B, y, W - 40, {**t5, "rel": "Proposed; not agreed until Coach Milan says Go"}); B.html[-1] = B.html[-1].replace("<div data-ac", "<div data-ac=\"B168\"", 1)
y += HT.get("ac5", 800) + 30
acTable(B, y, W - 40, {**t6, "rel": "Proposed; not agreed until Coach Milan says Go"}); B.html[-1] = B.html[-1].replace("<div data-ac", "<div data-ac=\"DT349\"", 1)
Hc = y + HT.get("ac6", 700) + 40
board("Stories294.dc.html", T["boardTitle"], "Drawn 24 November 2026, 07:10, to 25 November 08:30 (servings 24 November 22:26; the fixed top and How much 25 November 08:02), for the Go of Coach Milan. Tickets B168 and DT349, Kanban column Now. Pictures from the real app: before on main, 0.3.192; new on a scratch build of main with the change. Nothing in the app is changed yet.", B, W, Hc, "Stories293.dc.html")
inner = B.render(W, Hc)
json.dump({"B168": {"file": "Stories294.dc.html", "w": W, "h": min(8000, Hc + 230), "inner": inner}}, open(os.environ.get("BOARDS_OUT", "/home/claude/boards/outB168.json"), "w"))
print("B168", W, Hc + 230)
