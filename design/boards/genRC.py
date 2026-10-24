import json, base64
S = __import__("os").environ.get("BOARDS_DIR", __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
src = open(f"{S}/genT.py").read()
exec(src[: src.index("boards = {}")])
D = "/home/claude/canvas/project"
def wide(title, w, h, body, bg="#fff"):
    return page(title, h, body, bg).replace("width: 390px", f"width: {w}px").replace('"width":390', f'"width":{w}')
img = lambda n: "data:image/webp;base64," + base64.b64encode(open(f"{S}/rc/{n}.webp", "rb").read()).decode()

# ---------- the numbers, from the labels Milan sent (per 100 g or 100 ml) and example amounts ----------
FOODS = [  # name, amount text, grams, kcal, protein, carbs, fat, fibre (per 100)
    ("Protein flour, wheat and barley", "200 g", 200, 357, 21.0, 59.0, 2.4, 5.0),
    ("Skim milk with milk protein", "500 ml", 500, 51, 7.5, 5.0, 0.1, 0.0),
    ("Eggs", "3 (about 180 g)", 180, 143, 12.6, 0.7, 9.5, 0.0),
    ("Mascarpone", "50 g", 50, 379, 3.4, 3.4, 39.0, 0.0),
    ("Oil spray", "1 short spray a crepe", 3, 810, 0.0, 0.0, 90.0, 0.0),
    ("Salt", "a pinch", 1, 0, 0, 0, 0, 0),
]
N = 12
tot = [sum(f[2] * f[i] / 100 for f in FOODS) for i in range(3, 8)]
kcal, prot, carb, fat, fib = tot
one = [x / N for x in tot]
PD = 100 * prot / kcal
SHARE = round(400 * prot / kcal)
print("batch", [round(x, 1) for x in tot], "one", [round(x, 1) for x in one], "PD", round(PD, 1), "share", SHARE)
K1, P1, C1, F1, FI1 = round(one[0]), round(one[1]), round(one[2]), round(one[3]), round(one[4], 1)
PDs = f"{PD:.1f}"

BLUE, INK, MUTED, LINEC = "#2e7be8", "#172742", "#5b6b8a", "#d1dcf0"
def thumbs(sz=16, col="#fff"):
    t = f'<svg width="{sz}" height="{sz}" viewBox="0 0 24 24" fill="none" stroke="{col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>'
    return f'<span style="display: inline-flex; gap: 1px">{t}{t}</span>'
def daam(sz=13, pad="5px 10px"):
    return f'<span style="display: inline-flex; align-items: center; gap: 6px; padding: {pad}; border-radius: 999px; background: {BLUE}; color: #fff; font-size: {sz}px; font-weight: 900; white-space: nowrap">{thumbs(sz + 3)}DaaM good</span>'
def stat(big, small, w="1"):
    return f'<div style="flex: {w}; display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 10px 4px; background: #fff; border: 1.5px solid {LINEC}; border-radius: 14px"><b style="font-size: 22px; font-weight: 900; line-height: 1.1">{big}</b><small style="font-size: 11.5px; font-weight: 800; color: {MUTED}">{small}</small></div>'
def trow(a, b, strong=False):
    wt = 900 if strong else 700
    return f'<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e3eaf7; font-size: 13.5px"><span style="font-weight: {wt}">{a}</span><span style="font-weight: {wt}">{b}</span></div>'
def pdscale(mark, h=10, labels=True, fs=10.5):
    # PD 0 to 10, with the goal ranges under it
    pos = lambda v: f"{min(v, 10) * 10:.1f}%"
    bands = [("Performance", 2.5, 4), ("Build muscle", 3.5, 4.5), ("Maintain", 4, 5.5), ("Recomposition", 5.5, 7), ("Lose fat", 6.5, 9)]
    bar = f'<div style="position: relative; height: {h}px; border-radius: {h}px; background: linear-gradient(90deg, #f0705c, #f6b94a 35%, #35cf9e 65%, #13916a)"><span style="position: absolute; left: {pos(mark)}; top: -5px; width: 4px; height: {h + 10}px; margin-left: -2px; border-radius: 2px; background: {INK}"></span></div>'
    ticks = '<div style="position: relative; height: 14px; font-size: 10px; font-weight: 800; color: #8b93a5">' + "".join(f'<span style="position: absolute; left: {pos(v)}; transform: translateX(-50%)">{v}</span>' for v in (0, 2, 4, 6, 8, 10)) + '</div>'
    if not labels: return bar + ticks
    rows = "".join(f'<div style="position: relative; height: 15px"><span style="position: absolute; left: {pos(a)}; width: calc({pos(b)} - {pos(a)}); top: 5px; height: 5px; border-radius: 3px; background: {"#2e7be8" if a <= mark <= b else "#c3cde0"}"></span><span style="position: absolute; {"right: " + f"{100 - b * 10:.1f}%" + "; text-align: right" if b > 6 else "left: " + f"{a * 10:.1f}%"}; top: -3px; font-size: {fs}px; font-weight: 800; color: {"#123a7a" if a <= mark <= b else "#8b93a5"}; white-space: nowrap; transform: translateY(-1px); padding: 0 2px; {"" }">{n}</span></div>' for n, a, b in bands)
    return bar + ticks + f'<div style="display: flex; flex-direction: column; gap: 3px">{rows}</div>'

def pdlist(mark, fs=13):
    bands = [("Lose fat", 6.5, 9), ("Recomposition", 5.5, 7), ("Maintain", 4, 5.5), ("Build muscle", 3.5, 4.5), ("Performance", 2.5, 4)]
    out = ""
    for n, a, b in bands:
        on = a <= mark <= b + 0.25
        note = "fits" if a <= mark <= b else ("just above" if on else "")
        col = "#123a7a" if on else "#8b93a5"
        out += f'<div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #e3eaf7; font-size: {fs}px; font-weight: 800; color: {col}"><span>{"✓ " if on else ""}{n}</span><span>{note + " · " if note else ""}PD {a:g} to {b:g}</span></div>'
    return pdscale(mark, 10, False) + f'<div style="display: flex; flex-direction: column">{out}</div>'

boards = {}
ING = "".join(f'<div style="display: flex; justify-content: space-between; gap: 10px; padding: 7px 0; border-bottom: 1px solid #e3eaf7"><span style="font-size: 14px; font-weight: 700">{f[0]}</span><span style="font-size: 14px; font-weight: 900; white-space: nowrap">{f[1]}</span></div>' for f in FOODS)
STEPS = [
    "Whisk the eggs, the milk and the mascarpone until smooth.",
    "Add the flour and the salt and whisk again. Let it rest 15 minutes. Protein flour takes up more liquid, so add a splash of milk if it gets thick.",
    "Heat a pan, one short spray of oil, a thin layer of batter. About a minute on each side.",
]
STEPHTML = "".join(f'<div style="display: flex; gap: 10px"><b style="width: 24px; height: 24px; flex: none; border-radius: 12px; background: #dae6fb; color: #1f5fc7; font-size: 13px; display: flex; align-items: center; justify-content: center">{i + 1}</b><span style="font-size: 14px; font-weight: 600; color: #3d4a63; line-height: 1.45">{s}</span></div>' for i, s in enumerate(STEPS))
NUMS = f'<div style="display: flex; gap: 8px">{stat(K1, "kcal")}{stat(f"{P1} g", "protein")}{stat(f"PD {PDs}", "protein density", "1.25")}</div>'
NUTRI = card('<b style="font-size: 16px">Nutrition</b>' + '<div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 900; color: #5b6b8a; letter-spacing: .04em"><span>ONE CREPE</span><span>ALL 12</span></div>' + "".join(
    f'<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e3eaf7; font-size: 13.5px; font-weight: 700"><span style="flex: 1">{a}</span><span style="width: 70px; text-align: right; font-weight: 900">{b}</span><span style="width: 80px; text-align: right; color: #5b6b8a">{c}</span></div>'
    for a, b, c in [("Energy", f"{K1} kcal", f"{round(kcal)} kcal"), ("Protein", f"{one[1]:.1f} g", f"{prot:.0f} g"), ("Carbs", f"{one[2]:.0f} g", f"{carb:.0f} g"), ("Fat", f"{one[3]:.1f} g", f"{fat:.0f} g"), ("Fibre", f"{FI1} g", f"{fib:.0f} g")]
) + f'<small style="font-size: 12px; color: #5b6b8a; font-weight: 600; line-height: 1.4">Worked out from the labels of the foods used, weighed. {SHARE} % of the energy is protein; the EU rule for calling food high protein is 20 %.</small>')

TOPBAR = '<div style="display: flex; justify-content: space-between; align-items: center"><b style="font-size: 15px; font-weight: 900; color: #1f5fc7">Chef Mealan</b><span style="font-size: 13px; font-weight: 800; color: #1f5fc7">All recipes</span></div>'
HERO = f'<div style="position: relative; margin: 0 -18px"><img src="{img("stacksq")}" style="display: block; width: 390px; height: 312px; object-fit: cover"><span style="position: absolute; left: 16px; bottom: 14px">{daam()}</span></div>'
TITLE = (H1("High protein crepes") +
         '<span style="font-size: 15px; color: #3d4a63; font-weight: 600; line-height: 1.45; margin-top: -8px">Thin, soft, and they roll without breaking. Protein flour and protein milk do the work, so each crepe brings 9 g of protein.</span>'
         '<small style="font-size: 12.5px; color: #5b6b8a; font-weight: 700; margin-top: -6px">Coach Milan · 12 crepes · 35 minutes</small>')
FITS = setting("Fits best", chips(chip("Lose fat", True), chip("Recomposition", True)), f"PD {PDs} sits in the range of these two goals. Any goal can have them; the amount is what changes.")

# R0 scope
boards["RecipeScope.dc.html"] = ("R0. Recipes you can share", page("R0. Recipes you can share", 1290, "\n".join([
    H2("Recipes you can share"),
    SUB("A recipe from the app gets its own page on chefmealan.com and a set of Instagram images. Everyone sees the recipe. Members also see their own amounts."),
    row("The page", "chefmealan.com/r/protein-crepes. Photo, the numbers for one crepe, PD, ingredients with grams, steps, full nutrition. No sign-in. Opens fast from an Instagram story or the link in your bio."),
    row("What only members get", "Their own amounts: how many crepes fit their goal and their day, and what to add to fill the plate. Plus Add to my recipes and Put on my plate, in one tap."),
    row("What a visitor gets instead", "The same place on the page says that Mealan sets these amounts for each person, with Ask for an invite. The recipe itself is never locked."),
    row("The Instagram images", "4 images, 1080 × 1350, made from the same recipe: the photo, the numbers, the ingredients, and PD with the link. A post can be all 4 as a carousel, or one image alone. The numbers image is also the last frame of a reel."),
    row("Where the numbers come from", "From the recipe, weighed, with the label of each food. Never guessed from a photo. A photo can show a cookie; it can't show what went into it."),
    row("Who publishes", "You, as coach, from a recipe you already have in the app: Publish, add a photo and two lines, done. No deploy, no second tool."),
    row("High protein, only when it's true", f"The words high protein appear only when at least 20 % of the energy is protein, as the EU rule asks. These crepes: {SHARE} %."),
    row("All recipes", "chefmealan.com/recipes lists every public recipe, newest first. That's the link for your Instagram bio."),
    NOTE("The numbers on these boards use example amounts I picked for 12 crepes, with the labels from your photos. Send me your real amounts, or put the recipe in the app, and every number updates."),
    DEC("1. Your real amounts. 2. Start with everything public and only the amounts for members, or also some recipes for members only? I'd start public. 3. Your ingredients photo shows the brand names; the site uses no brands, so I left that photo out. Fine for Instagram, your call. 4. The look of the Instagram images: blue like the app, or warm like the food (board R3 shows both)."),
]), bg="#fff"), 390)

# R1 the public page
boards["RecipePublic.dc.html"] = ("R1. The recipe page, for anyone", page("R1. The recipe page, for anyone", 2230, "\n".join([
    TOPBAR, HERO, TITLE, NUMS, FITS,
    card('<b style="font-size: 16px">Your amounts</b><span style="font-size: 14px; color: #3d4a63; font-weight: 600; line-height: 1.45">How many crepes fit your day, and what to add so the plate fits your goal: Mealan works it out for each person.</span>' + ACT("Ask for an invite") + '<small style="font-size: 12px; color: #5b6b8a; font-weight: 600; text-align: center">A closed pilot with coaches.</small>', "#dae6fb"),
    card('<div style="display: flex; justify-content: space-between; align-items: baseline"><b style="font-size: 16px">Ingredients</b><small style="font-size: 12.5px; font-weight: 800; color: #5b6b8a">for 12 crepes</small></div>' + ING),
    card('<b style="font-size: 16px">Steps</b>' + STEPHTML),
    NUTRI,
    card('<b style="font-size: 16px">What is PD?</b><span style="font-size: 14px; color: #3d4a63; font-weight: 600; line-height: 1.45">Protein density: grams of protein for every 100 kcal. These crepes have PD ' + PDs + ', so 100 kcal of crepe bring ' + PDs + ' g of protein.</span>' + pdlist(PD)),
    '<small style="font-size: 12px; color: #5b6b8a; font-weight: 600; text-align: center">Impressum · Privacy · Disclaimer</small>',
])), 390)

# R2 the member view: only the part that changes
YOUR = card(
    '<div style="display: flex; justify-content: space-between; align-items: baseline"><b style="font-size: 16px">Your amounts</b><small style="font-size: 12px; font-weight: 800; color: #1f5fc7">Recomposition · breakfast</small></div>'
    + trow("High protein crepes", "3 crepes") + trow("Skyr, natural, to fill them", "150 g") + trow("Berries", "100 g")
    + '<div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; padding-top: 2px"><span>On your plate</span><span>500 kcal · 44 g protein · PD 8.7</span></div>'
    + '<small style="font-size: 12px; color: #5b6b8a; font-weight: 600; line-height: 1.4">Mealan set the crepes for your breakfast and added skyr and berries to fit your PD target. You can change any amount on the Plate.</small>'
    + ACT("Put on my plate") + LINK("Add to my recipes"), "#dae6fb")
boards["RecipeMember.dc.html"] = ("R2. The same page, signed in", page("R2. The same page, signed in", 1160, "\n".join([
    TOPBAR.replace("All recipes", "Open the app"), HERO, TITLE, NUMS, YOUR,
    NOTE("Everything below is the same as on R1: ingredients, steps, nutrition, PD. Someone from the coaching community sees this when they're signed in on this phone; the link is the same for everyone."),
    NOTE("Members only recipes, if you want them later: a visitor sees the photo, the name and the numbers, and the ingredients and steps say Members only, with Ask for an invite."),
])), 390)

# R3 the Instagram images: 4 slides, 1080 x 1350 shown at 1/3, plus slide 2 in a warm look
W, Hh = 360, 450
def slide(inner, bg="#fff", pad="22px"):
    return f'<div style="width: {W}px; height: {Hh}px; flex: none; position: relative; overflow: hidden; border-radius: 6px; box-shadow: 0 6px 18px rgba(20,40,80,.16); background: {bg}; box-sizing: border-box; padding: {pad}; display: flex; flex-direction: column">{inner}</div>'
mark = '<span style="font-size: 12px; font-weight: 900; color: #1f5fc7">Chef Mealan</span>'
s1 = slide(f'<img src="{img("stack")}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover"><div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,20,40,0) 45%, rgba(10,20,40,.78))"></div>'
           f'<div style="position: absolute; left: 20px; top: 18px">{daam(12, "4px 9px")}</div>'
           '<div style="position: absolute; left: 20px; right: 20px; bottom: 20px; color: #fff; display: flex; flex-direction: column; gap: 4px"><b style="font-size: 32px; font-weight: 900; line-height: 1.05">High protein crepes</b><span style="font-size: 15px; font-weight: 700; opacity: .92">9 g protein in each. Still thin, still soft.</span><small style="font-size: 11px; font-weight: 900; letter-spacing: .06em; opacity: .75; margin-top: 6px">CHEF MEALAN · SWIPE FOR THE NUMBERS →</small></div>', pad="0")
def numcard(bg, ink, sub, chipbg, line, serif=False):
    ff = "font-family: Georgia, 'Times New Roman', serif;" if serif else ""
    return slide(
        f'<div style="display: flex; justify-content: space-between; align-items: center"><small style="font-size: 11px; font-weight: 900; letter-spacing: .08em; color: {sub}">ONE CREPE · WEIGHED</small>{mark if not serif else "<span style=\"font-size: 12px; font-weight: 900; color: " + sub + "\">Chef Mealan</span>"}</div>'
        f'<div style="display: flex; gap: 14px; align-items: center; margin: 12px 0 8px"><img src="{img("top")}" style="width: 104px; height: 104px; border-radius: 52px; object-fit: cover; flex: none"><div style="display: flex; flex-direction: column"><b style="{ff} font-size: 46px; font-weight: 900; line-height: 1; color: {ink}">PD {PDs}</b><span style="font-size: 13px; font-weight: 800; color: {sub}">{PDs} g protein in every 100 kcal</span></div></div>'
        + "".join(f'<div style="display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1.5px solid {line}; font-size: 16px; font-weight: 800; color: {ink}"><span style="{ff}">{a}</span><span>{b}</span></div>' for a, b in [("Energy", f"{K1} kcal"), ("Protein", f"{P1} g"), ("Carbs", f"{C1} g"), ("Fat", f"{F1} g"), ("Fibre", f"{FI1} g")])
        + f'<div style="margin-top: auto; padding: 9px 11px; border-radius: 12px; background: {chipbg}; font-size: 12.5px; font-weight: 800; color: {ink}; line-height: 1.35">Every number comes from the recipe and the labels, weighed. Not guessed from a photo.</div>', bg)
s2 = numcard("#eef3fc", INK, MUTED, "#dae6fb", "#c9d8f2")
s2w = numcard("#f7efe4", "#3b2414", "#8a6a4f", "#efe0cc", "#e4d2bb", serif=True)
s3 = slide(f'<div style="display: flex; justify-content: space-between; align-items: center"><small style="font-size: 11px; font-weight: 900; letter-spacing: .08em; color: {MUTED}">FOR 12 CREPES</small>{mark}</div>'
           '<b style="font-size: 24px; font-weight: 900; margin: 6px 0 6px">What goes in</b>'
           + "".join(f'<div style="display: flex; justify-content: space-between; gap: 8px; padding: 6px 0; border-bottom: 1.5px solid #e3eaf7"><span style="font-size: 15px; font-weight: 700">{f[0]}</span><span style="font-size: 15px; font-weight: 900; white-space: nowrap">{f[1]}</span></div>'.replace("padding: 6px 0", "padding: 9px 0") for f in FOODS)
           + f'<div style="margin-top: auto; display: flex; gap: 10px; align-items: center"><img src="{img("batter")}" style="width: 64px; height: 64px; border-radius: 12px; object-fit: cover"><span style="font-size: 12.5px; font-weight: 700; color: #3d4a63; line-height: 1.35">Rest the batter 15 minutes. Protein flour takes up more milk than plain flour.</span></div>', "#fff")
s4 = slide(f'<div style="display: flex; justify-content: space-between; align-items: center"><small style="font-size: 11px; font-weight: 900; letter-spacing: .08em; color: {MUTED}">WHAT IS PD?</small>{mark}</div>'
           '<b style="font-size: 22px; font-weight: 900; margin: 6px 0 4px; line-height: 1.15">Protein density: protein for every 100 kcal</b>'
           f'<span style="font-size: 13px; font-weight: 700; color: #3d4a63; line-height: 1.4; margin-bottom: 12px">Each goal has its own range. These crepes, PD {PDs}:</span>'
           + pdlist(PD, 13.5)
           + '<div style="margin-top: auto; display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 14px; background: #2e7be8; color: #fff"><b style="font-size: 16px; font-weight: 900">Full recipe: link in bio</b><span style="font-size: 12.5px; font-weight: 700; opacity: .9">chefmealan.com/r/protein-crepes · steps, nutrition, and how many fit your goal</span></div>', "#fff")
lab = lambda t: f'<small style="font-size: 11.5px; font-weight: 900; letter-spacing: .06em; color: {MUTED}">{t}</small>'
colw = lambda t, s, n="": f'<div style="display: flex; flex-direction: column; gap: 8px">{lab(t)}{s}<small style="font-size: 12px; color: {MUTED}; font-weight: 600; width: {W}px; line-height: 1.4">{n}</small></div>'
boards["RecipeInsta.dc.html"] = ("R3. The Instagram images", wide("R3. The Instagram images", 2080, 620, "\n".join([
    H2("The Instagram images: a carousel of 4, each also fine alone"),
    SUB("1080 × 1350, shown here at a third. Made from the recipe, so the numbers on the images and on the page are the same. You download them from the Publish sheet."),
    '<div style="display: flex; gap: 28px; align-items: flex-start">'
    + colw("1 · THE PHOTO", s1, "Stops the scroll. The rating you gave it, the name, one line.")
    + colw("2 · THE NUMBERS", s2, "The nutrition map with real numbers. Also the last frame of a reel.")
    + colw("3 · THE INGREDIENTS", s3, "Grams, no brands. Enough to cook it from the image.")
    + colw("4 · PD AND THE LINK", s4, "Teaches PD with the goal ranges, then sends to the page.")
    + '<div style="width: 1.5px; align-self: stretch; background: #d1dcf0"></div>'
    + colw("2 · WARM LOOK, TO COMPARE", s2w, "The same image in the colours of the food. Pick one look for all.")
    + '</div>',
]), bg="#fff"), 2080)

# R4 the reel: shots and the end card
def frame(inner, bg="#111"):
    return f'<div style="width: 180px; height: 320px; flex: none; position: relative; overflow: hidden; border-radius: 10px; background: {bg}; box-shadow: 0 6px 18px rgba(20,40,80,.16)">{inner}</div>'
cap = lambda t: f'<div style="position: absolute; left: 10px; right: 10px; bottom: 14px; color: #fff; font-size: 14px; font-weight: 900; line-height: 1.15; text-shadow: 0 1px 6px rgba(0,0,0,.6)">{t}</div>'
full = lambda n: f'<img src="{img(n)}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover">'
endc = f'<div style="position: absolute; inset: 0; background: #eef3fc; padding: 14px 12px; display: flex; flex-direction: column; gap: 6px; color: {INK}"><small style="font-size: 9px; font-weight: 900; letter-spacing: .08em; color: {MUTED}">ONE CREPE</small><b style="font-size: 30px; font-weight: 900; line-height: 1">PD {PDs}</b>' + "".join(f'<div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800; padding: 4px 0; border-bottom: 1px solid #c9d8f2"><span>{a}</span><span>{b}</span></div>' for a, b in [("Energy", f"{K1} kcal"), ("Protein", f"{P1} g"), ("Carbs", f"{C1} g"), ("Fat", f"{F1} g")]) + '<div style="margin-top: auto; padding: 8px; border-radius: 10px; background: #2e7be8; color: #fff; font-size: 11.5px; font-weight: 900; line-height: 1.3">Full recipe: link in bio</div></div>'
boards["RecipeReel.dc.html"] = ("R4. The reel: 4 shots, then the numbers", wide("R4. The reel", 1000, 490, "\n".join([
    H2("The reel: 4 shots, then the numbers"),
    SUB("About 15 seconds, filmed on the phone. The words sit on the video; the last frame is image 2 in 9 × 16, held for 3 seconds so people can read it."),
    '<div style="display: flex; gap: 18px">'
    + colw("0–3 S", frame(full("batter") + cap("Crepe batter, with protein flour.")).replace(f"width: {W}px", "width: 180px"), "The batter.").replace(f"width: {W}px", "width: 180px")
    + colw("3–7 S", frame('<div style="position: absolute; inset: 0; background: linear-gradient(160deg, #3a2a20, #7a5838)"></div>' + cap("Thin layer, one spray, a minute a side.")), "In the pan. You film this one.").replace(f"width: {W}px", "width: 180px")
    + colw("7–10 S", frame(full("top") + cap("Soft. Rolls without breaking.")), "One on the plate.").replace(f"width: {W}px", "width: 180px")
    + colw("10–12 S", frame(full("stack") + cap("12 of them.")), "The stack, lifted.").replace(f"width: {W}px", "width: 180px")
    + colw("12–15 S", frame(endc), "The numbers. Same as image 2.").replace(f"width: {W}px", "width: 180px")
    + '</div>',
]), bg="#fff"), 1000)

# R5 the Publish sheet, for the coach
seg2 = lambda name, inner, hint="": setting(name, inner, hint)
boards["RecipePublish.dc.html"] = ("R5. Publish, from a recipe in the app", page("R5. Publish, from a recipe in the app", 1000, "\n".join([
    '<div style="display: flex; justify-content: space-between"><span style="color: #1f5fc7; font-weight: 800">← High protein crepes</span><span style="color: #1f5fc7; font-weight: 800">Close</span></div>',
    H1("Publish this recipe"),
    SUB("Only coaches see this. The recipe, its foods and grams come from the app; you add what a reader needs."),
    seg2("Photo", f'<div style="display: flex; gap: 8px"><img src="{img("stacksq")}" style="width: 96px; height: 96px; border-radius: 12px; object-fit: cover; outline: 3px solid #2e7be8; outline-offset: 2px"><img src="{img("top")}" style="width: 96px; height: 96px; border-radius: 12px; object-fit: cover"><img src="{img("batter")}" style="width: 96px; height: 96px; border-radius: 12px; object-fit: cover"></div>', "The first one leads. Tap to change the order."),
    field("Name", "High protein crepes"),
    f'<div style="display: flex; flex-direction: column; gap: 4px"><small style="font-size: 12.5px; font-weight: 800">Two lines about it</small><span style="min-height: 72px; border-radius: 12px; background: #fff; border: 1.5px solid #d1dcf0; font-size: 15px; font-weight: 700; padding: 10px 12px; line-height: 1.4">Thin, soft, and they roll without breaking. Protein flour and protein milk do the work.</span></div>',
    '<div style="display: flex; gap: 10px">' + field("Makes", "12 crepes") + field("Time", "35 min") + '</div>',
    seg2("Who sees it", chips(chip("Everyone", True), chip("Members")), "Everyone: the whole recipe is public; members also see their amounts."),
    card(f'<span style="font-size: 13.5px; font-weight: 800; color: #13916a">✓ High protein: {SHARE} % of the energy is protein</span><span style="font-size: 13.5px; font-weight: 800; color: #13916a">✓ Every food has a label or a known value</span><span style="font-size: 13.5px; font-weight: 800; color: #13916a">✓ Your rating: DaaM good</span>'),
    ACT("Publish"),
    NOTE("After Publish: Copy link (chefmealan.com/r/protein-crepes), Download the 4 images, and Unpublish at any time. Changing the recipe in the app updates the page and the images."),
])), 390)

# R6 all recipes, R7 the home page
def rcard(big=True):
    h = 200 if big else 150
    return (f'<div style="background: #fff; border: 1.5px solid #d1dcf0; border-radius: 18px; overflow: hidden; display: flex; flex-direction: column">'
            f'<div style="position: relative"><img src="{img("stacksq")}" style="display: block; width: 100%; height: {h}px; object-fit: cover"><span style="position: absolute; left: 12px; bottom: 10px">{daam(12, "4px 9px")}</span></div>'
            f'<div style="padding: 12px 14px; display: flex; flex-direction: column; gap: 6px"><b style="font-size: 18px; font-weight: 900">High protein crepes</b>'
            f'<span style="font-size: 13.5px; font-weight: 800; color: #3d4a63">One crepe: {K1} kcal · {P1} g protein · PD {PDs}</span>'
            f'<small style="font-size: 12px; font-weight: 700; color: #5b6b8a">Fits best: Lose fat, Recomposition · 35 min</small></div></div>')
NEXT = '<div style="border: 1.5px dashed #b9cdf1; border-radius: 18px; padding: 18px 14px; display: flex; flex-direction: column; gap: 4px; align-items: center; text-align: center"><b style="font-size: 14px; color: #5b6b8a">The next recipe goes here</b><small style="font-size: 12px; font-weight: 600; color: #8b93a5">Newest first. A visitor never sees this box; it shows where the next one lands.</small></div>'
boards["RecipeList.dc.html"] = ("R6. All recipes", page("R6. All recipes", 890, "\n".join([
    TOPBAR.replace("All recipes", "Sign in"),
    H1("Recipes"),
    '<span style="font-size: 15px; color: #3d4a63; font-weight: 600; line-height: 1.45; margin-top: -8px">From Coach Milan\'s kitchen. Every number is worked out from the recipe, weighed, not guessed from a photo.</span>',
    rcard(), NEXT,
    card('<b style="font-size: 16px">Your amounts, for every recipe</b><span style="font-size: 14px; color: #3d4a63; font-weight: 600; line-height: 1.45">In the app, Mealan sets how much of each recipe fits your goal and your day.</span>' + ACT("Ask for an invite"), "#dae6fb"),
    '<small style="font-size: 12px; color: #5b6b8a; font-weight: 600; text-align: center">Impressum · Privacy · Disclaimer</small>',
    NOTE("chefmealan.com/recipes, the link for your Instagram bio. One recipe per row on a phone, three per row on a computer. Filters come once there are more than about 12 recipes."),
])), 390)
ghost = lambda t: f'<div style="opacity: .45; display: flex; flex-direction: column; gap: 4px"><small style="font-size: 11px; font-weight: 900; letter-spacing: .08em; color: #1f5fc7">{t[0]}</small><b style="font-size: 20px; font-weight: 900">{t[1]}</b><span style="font-size: 12px; font-weight: 700; color: #5b6b8a">…</span></div>'
boards["RecipeHome.dc.html"] = ("R7. chefmealan.com: recipes on the home page", page("R7. chefmealan.com: recipes on the home page", 1010, "\n".join([
    '<div style="display: flex; justify-content: space-between; align-items: center"><b style="font-size: 16px; font-weight: 900">Chef Mealan</b><span style="display: flex; gap: 16px"><span style="font-size: 14px; font-weight: 800; color: #1f5fc7; padding: 2px 8px; border-radius: 8px; background: #dae6fb">Recipes</span><span style="font-size: 14px; font-weight: 800; color: #1f5fc7">Sign in</span></span></div>',
    NOTE("New in the top bar: Recipes, next to Sign in."),
    ghost(("HOW IT WORKS", "Three steps, while you decide what to eat")),
    LINE,
    '<small style="font-size: 11.5px; font-weight: 900; letter-spacing: .08em; color: #1f5fc7">FROM THE KITCHEN</small>',
    '<b style="font-size: 24px; font-weight: 900; line-height: 1.2; margin-top: -10px">Recipes with the numbers worked out</b>',
    '<span style="font-size: 15px; color: #3d4a63; font-weight: 600; line-height: 1.45; margin-top: -6px">Coach Milan cooks them, weighs them, and puts the numbers next to the photo. In the app, Mealan sets how much of each fits your goal.</span>',
    rcard(False),
    '<span style="font-size: 15px; font-weight: 900; color: #1f5fc7">All recipes →</span>',
    LINE,
    ghost(("YOUR WEEK", "Plan your usual week once")),
    NOTE("A new section after How it works, so a visitor first gets the idea, then sees it on a real plate. It shows the 3 newest public recipes, side by side on a computer, and stays hidden while there are none."),
    DEC("Where on the home page: after How it works (as drawn), or right under the top, before How it works? I'd keep it here: the top already says what Chef Mealan does, and visitors from Instagram land on the recipe page itself."),
])), 390)

cj = json.load(open(f"{D}/canvas.json"))
POS = {"RecipeScope.dc.html": (0, 24900, 1290), "RecipePublic.dc.html": (470, 24900, 2230), "RecipeMember.dc.html": (940, 24900, 1160), "RecipePublish.dc.html": (1410, 24900, 1000), "RecipeInsta.dc.html": (0, 27280, 620), "RecipeReel.dc.html": (0, 28020, 490), "RecipeList.dc.html": (1880, 24900, 890), "RecipeHome.dc.html": (2350, 24900, 1010)}
for fn, (title, html, w) in boards.items():
    open(f"{D}/{fn}", "w").write(html)
    if fn not in cj["order"]: cj["order"].append(fn)
    x, y, h = POS[fn]
    cj["boards"][fn] = {"x": x, "y": y, "w": w, "h": h, "title": title}
cj["notes"]["t17"] = {"x": 0, "y": 24600, "text": "Recipes you can share: the page and the Instagram images", "kind": "title1", "maxW": 1400}
json.dump(cj, open(f"{D}/canvas.json", "w"))
print("ok")
