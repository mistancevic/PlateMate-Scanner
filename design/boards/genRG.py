S = __import__("os").environ.get("BOARDS_DIR", __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
exec(open(f"{S}/genRC.py").read().split("\nboards = {}\n")[0])
import json, io, base64
from PIL import Image
def wide2(title, w, h, body, bg="#fff"):
    return page(title, h, body, bg).replace("width: 390px", f"width: {w}px", 1).replace('"width":390', f'"width":{w}')
def photo(w=None):
    im = Image.open(f"{S}/rf/stand.jpg").convert("RGB").resize((600, 600)); b = io.BytesIO(); im.save(b, "WEBP", quality=78)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()
PH = photo()
txt = lambda t, s=13: f'<span style="font-size: {s}px; color: #3d4a63; font-weight: 600; line-height: 1.45">{t}</span>'
lab = lambda t: f'<small style="font-size: 11.5px; font-weight: 900; letter-spacing: .06em; color: #5b6b8a">{t}</small>'
def ph(inner, h, bg="#fff", pad="16px 18px"):
    return f'<div style="width: 390px; height: {h}px; border-radius: 22px; overflow: hidden; background: {bg}; border: 1.5px solid #d1dcf0; box-shadow: 0 6px 18px rgba(20,40,80,.14); padding: {pad}; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px; flex: none; position: relative">{inner}</div>'
def col(head, inner, note):
    return f'<div style="display: flex; flex-direction: column; gap: 8px; width: 390px; flex: none">{lab(head)}{inner}<span style="font-size: 13px; color: #3d4a63; font-weight: 600; line-height: 1.45">{note}</span></div>'
def btn(t, kind="primary", h=46, fs=15):
    st = {"primary": "background: #2e7be8; color: #fff; border: none", "plain": "background: #fff; color: #1f5fc7; border: 1.5px solid #c8d8f5",
          "off": "background: #c3cde0; color: #fff; border: none", "warn": "background: #fff; color: #c0392b; border: 1.5px solid #f2b8ae"}[kind]
    return f'<span style="flex: 1; height: {h}px; border-radius: 14px; {st}; font-size: {fs}px; font-weight: 800; display: flex; align-items: center; justify-content: center; white-space: nowrap; padding: 0 10px">{t}</span>'
row2 = lambda *xs: '<div style="display: flex; gap: 10px">' + "".join(xs) + '</div>'
STATE = {"Draft": ("#eef1f6", "#5b6b8a", "#d1dcf0"), "Live": ("#e6f4ec", "#1b6b3f", "#9fd3b4"), "Waiting for Milan": ("#fff4e0", "#8a4b00", "#f2c27a"),
         "Taken down": ("#fdecea", "#a33a2b", "#f2b8ae"), "Sent back": ("#fdecea", "#a33a2b", "#f2b8ae")}
def state(t):
    bg, c, b = STATE[t]
    return f'<span style="display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 12px; background: {bg}; border: 1.5px solid {b}; color: {c}; font-size: 12px; font-weight: 900; white-space: nowrap">{t}</span>'
def field(label, val, ph_=False, h=44, fs=15):
    return f'<div style="display: flex; flex-direction: column; gap: 4px"><small style="font-size: 12.5px; font-weight: 800; color: #5b6b8a">{label}</small><span style="min-height: {h}px; border-radius: 12px; background: #fff; border: 1.5px solid #d1dcf0; font-size: {fs}px; font-weight: 700; color: {"#9aa7bf" if ph_ else "#172742"}; display: flex; align-items: center; padding: 6px 12px; box-sizing: border-box; line-height: 1.35">{val}</span></div>'
def ok(t, c="#13916a"): return f'<span style="font-size: 13px; font-weight: 800; color: {c}">{t}</span>'
TOP = lambda right: f'<div style="display: flex; justify-content: space-between; align-items: center"><b style="font-size: 16px; font-weight: 900; color: #1f5fc7">Chef Mealan</b><b style="font-size: 13.5px; color: #1f5fc7">{right}</b></div>'
def rcard(title, line, img=True):
    im = f'<div style="height: 120px; background: url({PH}) center/cover"></div>' if img else ""
    return f'<div style="border-radius: 16px; overflow: hidden; border: 1.5px solid #d1dcf0; background: #fff">{im}<div style="padding: 10px 12px; display: flex; flex-direction: column; gap: 2px"><b style="font-size: 15px">{title}</b><small style="font-size: 12.5px; font-weight: 800; color: #3d4a63">{line}</small></div></div>'
ARROW = '<span style="color: #9dbcf0; font-size: 24px; font-weight: 900; flex: none">→</span>'
def node(t, sub=""):
    s = f'<small style="font-size: 11.5px; color: #5b6b8a; font-weight: 700; line-height: 1.3">{sub}</small>' if sub else ""
    return f'<div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start; max-width: 170px">{t}{s}</div>'
act = lambda t: f'<span style="display: inline-flex; align-items: center; height: 30px; padding: 0 12px; border-radius: 15px; background: #2e7be8; color: #fff; font-size: 12.5px; font-weight: 800; white-space: nowrap">{t}</span>'
lane = lambda who, items: f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; border: 1.5px solid #d1dcf0; border-radius: 18px; background: #f8faff">{lab(who)}<div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap">{items}</div></div>'
boards = {}

# ---------- RG0 the flow ----------
you = (node(state("Draft"), "kept with the recipe, never public") + ARROW + node(act("See the page"), "as a visitor will see it; nothing saved") + ARROW
       + node(act("Publish")) + ARROW + node(state("Live"), "chefmealan.com/r/…") + ARROW + node(act("Unpublish")) + ARROW
       + node(state("Taken down"), "the link says so and shows All recipes") + ARROW + node(act("Publish again"), "same link, Live again"))
cook = (node(state("Draft")) + ARROW + node(act("See the page")) + ARROW + node(act("Send to Milan")) + ARROW + node(state("Waiting for Milan"), "the cook can't change it while it waits")
        + ARROW + node(act("Make it live"), "Milan, after See the page") + ARROW + node(state("Live"), "the cook can Unpublish it too")
        + '<span style="width: 100%"></span>' + node('<small style="font-size: 12.5px; font-weight: 800; color: #5b6b8a">or</small>') + node(act("Send back with a note")) + ARROW + node(state("Sent back"), "the note shows on the recipe; it is a draft again"))
rules = [
    ("Cook is a permission, not a role", "Coach stays the relationship with clients: their goals and their data. Cook means you can publish recipes. A coach or a client can be a cook. Without it, there is no Publish button."),
    ("Only you make someone a cook, during the pilot", "On the person's row in your clients, one switch. You are a cook from the start."),
    ("Another cook's recipe waits for you", "Their Publish says Send to Milan. You see the page, then Make it live or Send back with a note. Changes to a live recipe wait for you the same way; the live page stays as it was until then."),
    ("The byline", "From Milan's kitchen: the cook's first name, for you and for any cook. It replaces Your coach and Coach Milan's kitchen (Q9)."),
    ("Taken down keeps the link", "Your Instagram posts keep pointing at it, so the link says This recipe was taken down and shows All recipes. Publish again brings it back on the same link."),
    ("The preview has its own recipes", "Publishing on the preview puts the recipe only on the preview's pages; chefmealan.com never shows it. Production has its own. Nothing moves between them, so you test the whole flow without risk."),
    ("Brought in from a link or a screenshot", "Only the foods and grams come across, never the steps or the photos. Adapted from, with the source, shows on the page. Board RG6."),
]
rr = "".join(f'<div style="display: flex; flex-direction: column; gap: 3px; padding: 10px 0; border-bottom: 1px solid #e3eaf7"><b style="font-size: 15px">{t}</b>{txt(d)}</div>' for t, d in rules)
boards["PubFlow"] = ((0, 37100), 1500, wide2("RG0. Publishing: preview, drafts, cooks", 1500, 3000, "\n".join([
    H2("RG0. Publishing, redrawn: a preview, drafts, and cooks"),
    SUB("From your questions, 8 October: a preview page before publishing, taking a recipe down when it no longer makes sense, and who may publish. Replaces Q7, Q9 and Q10 on board RF4."),
    lane("YOU, MILAN", you),
    lane("ANOTHER COOK (A COACH OR A CLIENT YOU MADE A COOK)", cook),
    f'<div style="display: flex; flex-direction: column">{rr}</div>',
    DEC("Decided 8 October: 1. Cook is the word. 2. Changes to another cook's live recipe wait for you. 3. The preview publishes on the preview, production on production: separate recipes, so testing never puts anything on chefmealan.com. Go?"),
]), "#fff"))

# ---------- RG1 the sheet, bottom ----------
s1 = ph(
    '<div style="display: flex; justify-content: space-between; align-items: center"><small style="font-size: 12.5px; font-weight: 800; color: #5b6b8a">High protein crepes</small><b style="color: #1f5fc7; font-size: 15px">Close</b></div>'
    f'<div style="display: flex; justify-content: space-between; align-items: center"><b style="font-size: 22px; font-weight: 900">Publish this recipe</b>{state("Draft")}</div>'
    '<small style="font-size: 12.5px; color: #5b6b8a; font-weight: 600; margin-top: -6px">Saved as you type · 12:58. Close it any time and come back.</small>'
    '<div style="border-top: 1px dashed #d1dcf0; padding-top: 10px; text-align: center; font-size: 12px; font-weight: 800; color: #9aa7bf">photo, name, two lines, makes, foods, steps, who sees it</div>'
    + '<div style="border: 1.5px solid #d1dcf0; border-radius: 14px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px">'
    + ok("✓ High protein: 29 % of the energy is protein") + ok("✓ One crepe: 118 kcal · 8.7 g protein · PD 7.3") + ok("✓ Your rating: DaaM good") + '</div>'
    + '<small style="font-size: 12.5px; color: #3d4a63; font-weight: 700">From Milan\'s kitchen</small>'
    + row2(btn("See the page", "plain"), btn("Publish")), 420)
s1b = ph(
    f'<div style="display: flex; justify-content: space-between; align-items: center"><b style="font-size: 20px; font-weight: 900">Banana protein bread</b>{state("Draft")}</div>'
    + '<div style="border: 1.5px solid #d1dcf0; border-radius: 14px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px">' + ok("✓ One slice: 160 kcal · 11 g protein · PD 6.9") + '</div>'
    + '<small style="font-size: 12.5px; color: #3d4a63; font-weight: 700">From Ana\'s kitchen</small>'
    + row2(btn("See the page", "plain"), btn("Send to Milan"))
    + '<small style="font-size: 12px; color: #5b6b8a; font-weight: 600">Milan sees the page first and makes it live, or sends it back with a note.</small>', 250)
boards["PubSheet"] = ((0, 38000), 390, None)
c1 = col("RG1 · THE SHEET: SEE THE PAGE, THEN PUBLISH", s1 + s1b, "The sheet is kept with the recipe as you type: a draft, never public. See the page shows it as a visitor will. For another cook, Publish says Send to Milan.")

# ---------- RG2 the preview ----------
s2 = ph(
    '<div style="margin: -16px -18px 0; padding: 12px 16px; background: #fff4e0; border-bottom: 1.5px solid #f2c27a; display: flex; flex-direction: column; gap: 8px">'
    '<b style="font-size: 14px; color: #8a4b00">Preview: only you see this. Nothing is live yet.</b>'
    + row2(btn("Back to the sheet", "plain", 40, 14), btn("Publish", "primary", 40, 14)) + '</div>'
    + TOP("All recipes")
    + f'<div style="margin: 0 -18px; height: 230px; background: url({PH}) center/cover; position: relative"><span style="position: absolute; left: 12px; bottom: 12px">{daam()}</span></div>'
    + '<b style="font-size: 25px; font-weight: 900; line-height: 1.15">High protein crepes</b>'
    + '<span style="font-size: 14.5px; color: #3d4a63; font-weight: 600; margin-top: -6px">Thin, soft, and they roll without breaking.</span>'
    + '<small style="font-size: 12.5px; font-weight: 800; color: #5b6b8a; margin-top: -4px">From Milan\'s kitchen · 12 crepes · 35 minutes</small>'
    + f'<div style="display: flex; gap: 8px">{stat("118", "kcal")}{stat("9 g", "protein")}{stat("PD 7.3", "protein density", "1.3")}</div>'
    + '<div style="text-align: center; font-size: 12px; font-weight: 800; color: #9aa7bf">the rest of the page, as a visitor sees it</div>', 570)
c2 = col("RG2 · SEE THE PAGE", s2, "The real page, built from what is in the sheet, with nothing saved. The bar stays on top while you scroll. Publish here is the same as in the sheet.")

# ---------- RG3 my recipes ----------
def rec(title, st, line, buttons):
    return (f'<div style="border: 1.5px solid #d1dcf0; border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; background: #fff">'
            f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><b style="font-size: 15.5px">{title}</b>{state(st)}</div>'
            f'<small style="font-size: 12.5px; color: #5b6b8a; font-weight: 600">{line}</small>'
            f'<div style="display: flex; gap: 14px; flex-wrap: wrap">' + "".join(f'<b style="font-size: 13.5px; color: {"#c0392b" if b == "Unpublish" else "#1f5fc7"}">{b}</b>' for b in buttons) + '</div></div>')
s3 = ph(
    '<div style="display: flex; gap: 8px"><span style="flex: 1; height: 40px; border-radius: 12px; background: #eef3fc; color: #1f5fc7; font-weight: 800; display: flex; align-items: center; justify-content: center">My foods</span><span style="flex: 1; height: 40px; border-radius: 12px; background: #fff; border: 1.5px solid #c8d8f5; color: #1f5fc7; font-weight: 900; display: flex; align-items: center; justify-content: center">My recipes (4)</span></div>'
    + rec("High protein crepes", "Live", "chefmealan.com/r/high-protein-crepes · since 8 Oct", ["Open", "See the page", "Change it", "Unpublish"])
    + rec("Protein pancakes", "Draft", "Not public. Last change 12:58.", ["Open", "Continue", "See the page"])
    + rec("Overnight oats", "Taken down", "The link says it was taken down.", ["Open", "Publish again"])
    + rec("Chili sin carne", "Sent back", "Milan: The photo is too dark. Try daylight.", ["Open", "Continue"])
    + '<small style="font-size: 12px; color: #5b6b8a; font-weight: 600">A recipe nobody started publishing shows no state, as today.</small>', 690)
c3 = col("RG3 · MY RECIPES: WHERE EACH ONE IS", s3, "Each recipe says where it is: Draft, Waiting for Milan, Live, Sent back, Taken down. Change it on a live recipe opens the sheet; the page updates when you publish the changes.")

boards["PubScreens1"] = ((0, 38170), 1300, wide2("RG1 to RG3. Sheet, preview, my recipes", 1300, 3000, "\n".join([
    H2("RG1 to RG3. The sheet, the preview, and My recipes"),
    f'<div style="display: flex; gap: 28px; align-items: flex-start">{c1}{c2}{c3}</div>',
]), "#fff"))

# ---------- RG4 taken down ----------
s4 = ph(
    TOP("All recipes")
    + '<div style="border-radius: 18px; background: #f6f9ff; border: 1.5px solid #d1dcf0; padding: 16px; display: flex; flex-direction: column; gap: 6px">'
    '<b style="font-size: 21px; font-weight: 900">This recipe was taken down</b>'
    '<span style="font-size: 14.5px; color: #3d4a63; font-weight: 600; line-height: 1.45">Overnight oats is no longer on Chef Mealan. These recipes are:</span></div>'
    + rcard("High protein crepes", "One crepe: 118 kcal · 9 g protein · PD 7.3")
    + rcard("Protein pancakes", "One pancake: 140 kcal · 12 g protein · PD 8.6")
    + btn("All recipes", "plain"), 640, "#eef3fc")
c4 = col("RG4 · A LINK TO A RECIPE THAT WAS TAKEN DOWN", s4, "Someone taps the link in an old Instagram post. They land here, not on an error. The name stays so they know which one; nothing else of it shows. Search engines are told it's gone.")

# ---------- RG5 cooks and approval ----------
sw = lambda on: f'<span style="width: 46px; height: 28px; border-radius: 14px; background: {"#2e7be8" if on else "#c3cde0"}; position: relative; flex: none"><span style="position: absolute; top: 3px; {"right" if on else "left"}: 3px; width: 22px; height: 22px; border-radius: 11px; background: #fff"></span></span>'
s5 = ph(
    '<b style="font-size: 20px; font-weight: 900">Your clients</b>'
    + '<div style="border: 1.5px solid #d1dcf0; border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px">'
    '<div style="display: flex; justify-content: space-between"><b style="font-size: 15.5px">Ana</b><small style="font-size: 12.5px; color: #5b6b8a; font-weight: 700">Recomposition · PD 6.3</small></div>'
    f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; border-top: 1px solid #e3eaf7; padding-top: 10px"><div style="display: flex; flex-direction: column; gap: 2px"><b style="font-size: 14px">Cook</b><small style="font-size: 12px; color: #5b6b8a; font-weight: 600">Can send you recipes to publish</small></div>{sw(True)}</div></div>'
    + '<b style="font-size: 20px; font-weight: 900; margin-top: 6px">Recipes waiting for you</b>'
    + '<div style="border: 1.5px solid #f2c27a; background: #fffaf0; border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px">'
    f'<div style="display: flex; justify-content: space-between; align-items: center"><b style="font-size: 15.5px">Banana protein bread</b>{state("Waiting for Milan")}</div>'
    '<small style="font-size: 12.5px; color: #5b6b8a; font-weight: 600">From Ana\'s kitchen · sent today 13:40 · new</small>'
    + row2(btn("See the page", "plain", 42, 14), btn("Make it live", "primary", 42, 14))
    + '<b style="font-size: 13.5px; color: #1f5fc7; text-align: center">Send back with a note</b></div>'
    + '<small style="font-size: 12px; color: #5b6b8a; font-weight: 600">Make it live works only after See the page, so you always look first.</small>', 520)
c5 = col("RG5 · YOU: MAKING A COOK, AND WHAT WAITS FOR YOU", s5, "Coach screens, on the client's row: one Cook switch. Recipes waiting for you sits above your clients when there are any, and Today shows a line: 1 recipe waits for you.")

# ---------- RG6 imported recipe ----------
s6 = ph(
    f'<div style="display: flex; justify-content: space-between; align-items: center"><b style="font-size: 20px; font-weight: 900">Publish this recipe</b>{state("Draft")}</div>'
    + '<div style="border-radius: 14px; background: #f6f9ff; border: 1.5px solid #d1dcf0; padding: 10px 12px"><small style="font-size: 12.5px; color: #3d4a63; font-weight: 700; line-height: 1.4">Brought in from a link. The foods and grams came across; the steps and the photos did not. Write the steps your way and use a photo of your own plate.</small></div>'
    + field("Adapted from", "A recipe site · recipesite.example/lemon-cake")
    + '<small style="font-size: 12px; color: #5b6b8a; font-weight: 600; margin-top: -6px">Shown on the page under the name, with its link. It can\'t be removed.</small>'
    + field("Photo", '<span style="color: #9aa7bf">Only photos from your cards, or Choose a photo</span>', h=44, fs=13.5)
    + field("Steps, one per line", "", True, 70)
    + '<div style="border: 1.5px solid #d1dcf0; border-radius: 14px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px">'
    + ok("Add the steps, in your own words", "#a33a2b") + ok("Add a photo of your plate", "#a33a2b") + '</div>'
    + row2(btn("See the page", "plain"), btn("Publish", "off")), 640)
c6 = col("RG6 · A RECIPE BROUGHT IN FROM A LINK OR A SCREENSHOT", s6, "Ties into the imports on the list (item 10, and the link idea). The ingredients and amounts are facts and come across; another person's words and photos never do. Publish stays off until the steps and your photo are there.")

boards["PubScreens2"] = ((1400, 38170), 1300, wide2("RG4 to RG6. Taken down, cooks, imported", 1300, 3000, "\n".join([
    H2("RG4 to RG6. Taken down, making a cook, and imported recipes"),
    f'<div style="display: flex; gap: 28px; align-items: flex-start">{c4}{c5}{c6}</div>',
]), "#fff"))
del boards["PubSheet"]

titles = {"PubFlow": "RG0. Publishing: preview, drafts, cooks", "PubScreens1": "RG1 to RG3. Sheet, preview, my recipes", "PubScreens2": "RG4 to RG6. Taken down, cooks, imported"}
import sys
H = json.load(open(f"{S}/rgh.json")) if len(sys.argv) > 1 else {}
cj = json.load(open(f"{D}/canvas.json"))
for k, ((x, y), w, html) in boards.items():
    if k in H: html = html.replace("height: 3000px", f"height: {H[k]}px", 1).replace('"height":3000', f'"height":{H[k]}')
    open(f"{D}/{k}.dc.html", "w").write(html)
    fn = f"{k}.dc.html"
    if fn not in cj["order"]: cj["order"].append(fn)
    cj["boards"][fn] = {"x": x, "y": y, "w": w, "h": H.get(k, 3000), "title": titles[k]}
json.dump(cj, open(f"{D}/canvas.json", "w")); print("ok")
