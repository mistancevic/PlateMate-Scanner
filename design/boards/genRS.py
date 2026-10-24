# Boards RS and RS2 (18 October 2026, Milan 01:47): tonight's stories R1 to R7, each with its screens now and new.
S = __import__("os").environ.get("BOARDS_DIR", __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
src = open(f"{S}/genTW.py").read().split("\nB = Board()\n")[0].replace('json.load(open(f"{S}/tw/taps.json"))', 'json.load(open(f"{S}/rs/taps.json"))').replace('{S}/tw/{name}.png', '{S}/rs/{name}.png')
exec(src)
CHIP.update({"now": ("#5b6b8a", "#fff", "0.2.28, as it is"), "built": ("#1d7a46", "#fff", "Built in 0.2.29"), "changed": ("#2e7be8", "#fff", "New design"), "draft": ("#b35c00", "#fff", "Draft, after the logic")})
SX = 400  # the story card takes the left 360 px of each row
Board.x = lambda s, col: SX + col * (SW + GAP)
def storyCard(B, y, rid, title, parts, w=350):
    body = "".join(f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>' for h, t in parts)
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
                  f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{rid}</span>{title}</div>{body}</div>')
    import math, re as _re
    return y + 70 + sum(30 + math.ceil(len(_re.sub("<[^>]+>|&amp;", "x", t)) / 40) * 21 for _, t in parts)
def textBox(B, x, y, w, html):
    B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;box-sizing:border-box;border:1.5px dashed #9fb3d6;border-radius:12px;padding:14px 16px;font-size:13.5px;line-height:1.5;color:#172742;background:#f6f8fc">{html}</div>')
def rowEnd(*hs): return max(hs) + 140
def legendRS(ver):
    return ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
      + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "same", "built", "changed", "draft"))
      + f'<span style="color:#172742">Left: the story. Right: the screens, whole, top to bottom. Now: the real {ver} build, untouched. New: the same build with the change drawn in, blue outline and yellow note. Orange frame and line: the button you tap and the screen it opens. Only the app\'s existing parts are used; anything new is named.</span></div>')

def board(fname, title, sub, B, W, Hc, after):
    H = min(8000, Hc + 230)
    html = wide2(title, W, H, "\n".join([H2(title), txt(sub, 14), legendRS(CHIP["now"][2].split(",")[0]), B.render(W, Hc)]), "#fff")
    open(f"{D}/{fname}", "w").write(html)
    cj = json.load(open(f"{D}/canvas.json"))
    if fname not in cj["order"]: cj["order"].append(fname)
    a = cj["boards"][after]
    cj["boards"][fname] = {"x": 0, "y": a["y"] + a["h"] + 120, "w": W, "h": H, "title": title}
    json.dump(cj, open(f"{D}/canvas.json", "w")); print(fname, W, H, Hc, len(html) // 1024, "KB")
    return H

# ===== RS: R1 to R3 =====
B = Board(); y = 30
cy = storyCard(B, y, "R1", "Names read as letters", [
  ("Story", "When I read a recipe, its title and source show as the page shows them: Sally McKenney, Sally's Baking Addiction."),
  ("Now", "The recipe page, Where it came from: Sally&amp;#039;s Baking Addiction. The reader cleaned the steps of the page's codes, never the names."),
  ("Built", "0.2.29, on your OK at 01:47. The title, the source, the foods' names, the group names read as letters. A recipe saved before is cleaned when the app opens: this one, after a reload."),
  ("Must not change", "Anything else on the read or the recipe page.")])
h = rowEnd(cy, B.screen("R1a", 0, y, "Recipe page, after Made today", "r1n", "now", "Where it came from, framed: the name with the page's code in it."),
           B.screen("R1b", 1, y, "The same page", "r1b", "built", "Where it came from: Sally McKenney, Sally's Baking Addiction. Nothing else moved."))
y = h
cy = storyCard(B, y, "R2", "The read shows the recipe's groups", [
  ("Story", "When I read a recipe, I see its foods under the recipe's own groups (Dough, Filling, For shaping and frying, Glaze). Then I know what each amount is for."),
  ("Must happen", "The read card groups the foods with the heading the plate already uses for a part: its name, how many foods, kcal and PD. A recipe without groups stays one list."),
  ("And on the plate", "A part stays when its last food goes. It says so and offers + Add a food to it. Today the part disappears with its last food."),
  ("Must not change", "The amounts, the steps, the buttons under the card, the plate's parts as they are."),
  ("Backlog", "How you make groups in a recipe of your own."),
  ("Built", "0.2.32, on your OK at 10:08, checked against R2b and R2c with screenshots of the built app. New walkthrough recipe-groups, 13 checks.")])
h = rowEnd(cy, B.screen("R2a", 0, y, "Plate: the read card", "r2n", "now", "20 foods in one list. The 1,380 g of oil reads like food to eat."),
           B.screen("R2b", 1, y, "The same read card", "r2b", "changed", "The four groups of the recipe, each with the plate's part heading. Then Put it on my plate, as now."),
           B.screen("R2c", 2, y, "Plate: Glaze emptied", "r2e", "changed", "Glaze after its last food is taken off: it stays, says No foods left in this part, and offers + Add a food to Glaze."))
y = h
W = SX + 3 * (SW + GAP) - GAP + 70
board("Stories01.dc.html", "RS. Tonight's stories, now and new: R1 and R2", "18 October 2026, after your test of 0.2.27 with Sally's apple fritters (00:53 to 01:47). R1 is built in 0.2.29 and 0.2.30. R2 is built in 0.2.32. RS2 has R3 and R4, RS3 has R5 to R8.", B, W, y - 100, "Flow07.dc.html")
B = Board(); y = 30
cy = storyCard(B, y, "R3", "Frying oil is listed, not eaten", [
  ("Story", "When a recipe deep fries, I see the oil listed, as the recipe needs it. The numbers count only the oil the food takes up."),
  ("Now", "The reader turned 1 to 2 quarts into 1,380 g and counted all of it: one fritter is 1,485 kcal, and the plate puts 72 g of oil on it."),
  ("Must happen", "The read marks frying oil for frying. The recipe lists it in its group and leaves it out of the recipe's numbers, the way an optional food is now. On the plate, each portion counts the oil it takes up."),
  ("Decided", "14:24 to 14:36: count the oil the food takes up, 15% of the fried food (a USDA glazed doughnut has about 23 g fat per 100 g, against about 5 g from its dough and glaze), never more. Only when the recipe fries; never butter. Labelled an estimate wherever it shows."),
  ("Must not change", "Oil that is part of the dish, like butter in the dough or oil in a dressing."),
  ("Built", "0.2.38, on your OK at 14:36. One fritter: 564 kcal, not 1,486. R3d to R3f are the built app. One difference from R3b: the oil is counted at 15%, not greyed out, as decided. Walkthrough oil-taken-up, 8 checks.")])
h = rowEnd(cy, B.screen("R3a", 0, y, "Plate: one fritter", "r3n", "now", "Vegetable oil, framed: 72 g on one fritter, counted as eaten."),
           B.screen("R3b", 1, y, "The read card", "r3b", "changed", "The oil in For shaping and frying, marked for frying, greyed like an optional food left out. The numbers without it."),
           B.screen("R3c", 2, y, "Plate: one fritter", "r3c", "changed", "Vegetable oil, taken up in frying: the amount from the source, once you agree it."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.38")
h = rowEnd(y + 60, B.screen("R3d", 0, y, "The read card, built", "b3read", "built", "For frying, the pot on the recipe, and taken up in frying, an estimate. The line under the foods says where 15% comes from."),
           B.screen("R3e", 1, y, "Plate, built", "b3plate", "built", "Vegetable oil, 22 g on one fritter: An estimate, first, so it shows on one line."),
           B.screen("R3f", 2, y, "The recipe page, built", "b3page", "built", "207 g counted, taken up in frying, an estimate. The recipe uses 1,380 g."))
y = h
cy = storyCard(B, y, "R4", "A portion from a recipe stays linked to it", [
  ("Story", "When I tap I ate one on a batch in Prepared for later, Today shows that meal as part of the recipe: In My recipes."),
  ("Now", "Each portion eaten gets Save in My recipes. Saving it made a one-fritter copy in My recipes. Make it on that copy gave small amounts, no groups, and the Fit screen's title, Chef Mealan's recipe."),
  ("Must happen", "A portion that came from a recipe is linked to it, as the first meal from the batch already is. Save in My recipes only for a plate that is no recipe."),
  ("Must not change", "A plate that is no recipe can still be saved from Today."),
  ("Built", "0.2.38, on your OK at 14:36. The Prepared for later card carries the recipe; an older card finds it by the recipe's name. Walkthrough batch-linked, 7 checks.")])
h = rowEnd(cy, B.screen("R4a", 0, y, "Today, after Made today", "r4a", "now", "Your plate, In My recipes. The 11 fritters left wait in Prepared for later."),
           B.screen("R4b", 1, y, "Today, after I ate one", "r4n", "now", "The new meal, framed: Save in My recipes, as if it were a plate of your own."),
           B.screen("R4c", 2, y, "The same Today", "r4b", "changed", "The new meal: In My recipes, linked to the fritters."))
B.edge("R4a", "R4b", "ate", "I ate one")
y = h
h = rowEnd(y + 60, B.screen("R4d", 0, y, "Today, built", "b4today", "built", "Both cheesecake meals: In My recipes. The batch below: 6 left."))
y = h
board("Stories02.dc.html", "RS2. Tonight's stories, now and new: R3 and R4", "18 October 2026. R3 and R4 are built in 0.2.38, with R12's small part (RS9).", B, W, y - 100, "Stories01.dc.html")
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.29")
B = Board(); y = 30
cy = storyCard(B, y, "R5", "Cooked, eaten, left: the logic first", [
  ("Story", "When I make a batch and eat from it over the day or the week, Today shows each meal once, short, and the batch adds up: what I ate and what is left is what I made."),
  ("Must not change", "Prepared for later and its buttons, I ate one and Remove. How did it carry stays a question per meal, unless you say otherwise in Q3.")], w=350)
textBox(B, SX, y, 2 * SW + GAP,
  "<b>What the app keeps now (0.2.28)</b><br>"
  "1. You make the whole recipe, 12 fritters. Your plate is sized for your meal: 943 kcal here. The other 11 go to Prepared for later, each one twelfth of the recipe: 1,498 kcal here, with the oil.<br>"
  "2. Each I ate one copies a whole meal onto Today: every food, a photo request, a carry question, Save in My recipes. Nothing points back to the batch or the recipe.<br>"
  "3. So the batch does not add up: your plate plus 11 twelfths is not the 12 you made.<br><br>"
  "<b>Proposal: three records</b><br>"
  "<b>Cooked.</b> One per batch: the recipe, the day, how many it made.<br>"
  "<b>Eaten.</b> Each meal points at its batch: when, which meal, how much. It is in My recipes through that link.<br>"
  "<b>Left.</b> The batch minus what was eaten, counted down. Remove means thrown or given away, never eaten.<br><br>"
  "<b>Your questions</b><br>"
  "<b>Q1.</b> Your plate now is sized for your meal; the portions left are twelfths. After your plate, should the rest be split equally over the 11 left, or stay twelfths?<br>"
  "<b>Q2.</b> Should I ate one ask which meal it is (lunch, dinner, a snack), so it counts by the plan? Now every one is Off the plan.<br>"
  "<b>Q3.</b> Meals eaten within the same 30 minutes: one carry question for them?")
y5 = y + 520
h = rowEnd(cy, B.screen("R5a", 0, y5, "Today, after 3 × I ate one", "r5n", "now", "Your test, again: four full copies, four carry questions. 5,438 kcal so far."),
           B.screen("R5b", 1, y5, "The same Today, a draft", "r5b", "draft", "Each meal once, short, linked: 1 of the 12 you made. The foods on a tap. One carry question. Waits for Q1 to Q3."))
y = h
cy = storyCard(B, y, "R6", "Add a recipe on Recipes", [
  ("Story", "On Recipes I can start a recipe from a link or screenshots without going to the Plate first."),
  ("Must happen", "The button sits under the Mine, Coach's and Members filter, in Mine only. It opens the Plate as it is today, with Screenshot and Link. In 0.2.27 it sat above the filter."),
  ("Must not change", "The filter, the lists, the Plate.")])
h = rowEnd(cy, B.screen("R6a", 0, y, "Recipes, Mine", "r6n", "now", "The filter, then your recipes. No way in from here."),
           B.screen("R6b", 1, y, "The same Recipes", "r6b", "changed", "+ Add a recipe under the filter, in Mine. The button Make my first recipe has when Mine is empty."),
           B.screen("R6c", 2, y, "Plate", "r6c", "same", "The Plate as today: Screenshot and Link start a recipe."))
B.edge("R6b", "R6c", "add", "Add a recipe")
y = h
cy = storyCard(B, y, "R7", "What it is for, first: piece by piece", [
  ("Story", "The idea of 0.2.27, the plate says what it is for before it sizes anything, comes back in small pieces, each tested with your fritters before it ships."),
  ("Order", "After R2 to R6.")])
textBox(B, SX, y, 3 * SW + 2 * GAP,
  "<b>7a.</b> The line under the Plate's title: Exploring, the day's meals, Done. Board PF, A1 to A3.<br>"
  "<b>7b.</b> The end of the read when exploring: Save in My recipes, Plan it, Make it now. Board PF2. From your test: the card after saving must not point to Today, and one name for the place, Mine or My recipes.<br>"
  "<b>7c.</b> Meal prep. Board PF3. It waits for R5's logic, since it makes a batch.<br>"
  "<b>7d.</b> The two ways, Change the recipe and Add on the side: the rules for the amounts. Board PF4.<br>"
  "<b>7e.</b> Long steps no longer cut at 400 letters.<br><br>"
  "<b>For each piece</b>: its drawing again with today's build, your OK, a walkthrough with Sally's apple fritters, and the old walkthroughs unchanged. A walkthrough that breaks comes back to you as a story.")
y = max(cy, y + 330) + 40
W2 = SX + 3 * (SW + GAP) - GAP + 70
cy = storyCard(B, y, "R8", "Every recipe has its own page", [
  ("Story", "When I open a recipe and refresh, go Back, or open a saved link, I land on that recipe."),
  ("Must not change", "How the recipe page looks, the Recipes list, the public page of a published recipe.")])
textBox(B, SX, y, 3 * SW + 2 * GAP,
  "<span style='display:inline-block;background:#1d7a46;color:#fff;border-radius:999px;padding:2px 10px;font-weight:800;font-size:12px'>Built in 0.2.31</span><br><br>"
  "<b>Now (0.2.30).</b> Only the four tabs have an address. An open recipe keeps the list's address, chefmealan.com/my-recipes, so a refresh opens the list, and a recipe can't be saved as a link.<br><br>"
  "<b>New.</b> An open recipe is at chefmealan.com/my-recipes/ and its own id. A refresh stays on it. Back goes to the list. A saved link opens it, once it is on this phone or in the account. An address with a recipe that isn't there opens the list. The Recipes tab, tapped on an open recipe, goes to the list: your choice A at 02:38.<br><br>"
  "Nothing on screen changes, so there is no drawing. Checked by a new walkthrough, recipe-address, with 11 checks; recipe-cook passes unchanged.")
y = max(cy, y + 300) + 40
board("Stories03.dc.html", "RS3. Tonight's stories, now and new: R5 to R8", "18 October 2026. R5: the logic first, with a draft and three questions. R6: design for your OK. R7: the boards PF to PF4, piece by piece. R8: built in 0.2.31.", B, W2, y, "Stories02.dc.html")

# ===== RS4 and RS5: R9, what you add follows the dish (Milan 10:31 to 10:50) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.32, as it is")
RULE = ("<b>The dish has a taste: sweet or savoury,</b> set by the foods that define it: sugar, fruit, chocolate or a glaze make it sweet; meat, fish or vegetables as the main make it savoury.<br>"
        "<b>Basics fit both:</b> flour, butter and oils, eggs, milk and cream, salt, yeast, baking powder, vanilla, spices, nuts.<br>"
        "<b>A food the taste rejects is not offered at all:</b> in a sweet dish chicken, ham, tuna, onion, ketchup; in a savoury dish jam, chocolate, icing sugar. One line says why.<br>"
        "<b>The food goes into the part you add it to.</b> The rule asks if it belongs in the dish, never which layer: butter fits the dough, not the glaze, and that is the cook's call.<br>"
        "<b>The same for a part, a whole dessert and a meal</b>, and for every offer Chef Mealan makes.<br>"
        "<b>Your own plate, no recipe:</b> what you search and add yourself stays your choice; Chef Mealan's offers follow the rule.<br>"
        "<b>A food the app can't place</b> as sweet, savoury or a basic is let through.")
B = Board(); y = 30
cy = storyCard(B, y, "R9", "What you add follows the dish", [
  ("Story", "When I add a food to a part, a dessert or a meal, I'm only offered foods that go with the dish. Glaze never gets chicken; the whole dessert decides, not the glaze alone."),
  ("Now", "0.2.32 takes any food. Chicken goes into Glaze; the plate stops being the recipe and turns into a mix, and Chef Mealan then offers salmon to lift it."),
  ("Must not change", "The mix tip and its rule; Fit to my target; your own search on a plate of your own."),
  ("Built", "0.2.33, on your OK at 10:59, checked against R9d and R9h with screenshots. Walkthrough recipe-follows-dish, 11 checks.")])
B.label(y - 6 + 0, "")
h = rowEnd(cy, B.screen("R9a", 0, y, "Plate: Glaze emptied", "r9a", "now", "The fritters on the plate, Glaze emptied (R2). + Add a food to Glaze, framed."),
           B.screen("R9b", 1, y, "Your foods, chicken typed", "r9b", "now", "The tap goes to your foods. Chicken breast, cooked is offered with Add."),
           B.screen("R9c", 2, y, "Plate, after Add", "r9c", "now", "150 g of chicken in Glaze. The plate is a mix now: Make it a lunch. Chef Mealan offers salmon."))
B.edge("R9a", "R9b", "add", "+ Add a food to Glaze"); B.edge("R9b", "R9c", "chick", "Add")
y = h
textBox(B, 20, y, 350, "<b>The rule</b> (agreed 10:50)<br><br>" + RULE)
h = rowEnd(y + 640, B.screen("R9d", 0, y, "Your foods, chicken typed", "r9d", "changed", "The fritters are sweet. Chicken is in your foods but not offered; one line says why. Eggs, butter or milk would be offered."))
y = h
W4 = SX + 3 * (SW + GAP) - GAP + 70
board("Stories04.dc.html", "RS4. R9: what you add follows the dish, the fritters", "18 October 2026, design (Milan 10:31: culinary logic for a part, a dessert or a meal; 10:47: the whole dessert decides, not the glaze alone; 10:50: rule agreed, draw). Top: the real 0.2.32 build with Sally's apple fritters. Below: the same tap with the rule. RS5 has a savoury dish and your own plate.", B, W4, y - 100, "Stories03.dc.html")

B = Board(); y = 30
cy = storyCard(B, y, "R9", "A savoury dish, and your own plate", [
  ("Savoury", "Chicken tacos are savoury. Nutella is in your foods, but it isn't offered for the tacos."),
  ("Your own plate", "Nutella alone, no recipe. What you search and add yourself stays yours: chicken can go on it. Chef Mealan's own offers follow the rule: today he offers chicken and salmon to Nutella."),
  ("Built", "0.2.33. One difference from R9h: with chicken and salmon held back, his tip fills up with the next foods that go with Nutella, so quark and skyr show under the whey.")])
h = rowEnd(cy, B.screen("R9e", 0, y, "Plate: chicken tacos", "r9f0", "same", "A savoury recipe on the plate, as today: Filling, Salsa, To serve."),
           B.screen("R9f", 1, y, "Your foods, nutella typed", "r9f", "changed", "Nutella is sweet; the tacos are savoury. Not offered; one line says why."))
y = h
h = rowEnd(y + 200, B.screen("R9g", 0, y, "Your own plate: Nutella", "r9g", "same", "No recipe. Your search offers chicken, as today; it stays your choice. Framed."),
           B.screen("R9h", 1, y, "The same plate", "r9h", "changed", "Chef Mealan's offers: only the whey stays. Chicken and salmon don't go with Nutella."))
y = h
board("Stories05.dc.html", "RS5. R9: a savoury dish, and your own plate", "18 October 2026, design. The real 0.2.32 build; changes drawn in, blue outline and yellow note.", B, W4, y - 100, "Stories04.dc.html")

# ===== RS6: R10, Change the recipe has a limit (Milan 12:03 and 12:07) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.35, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R10", "Change the recipe has a limit", [
  ("Story", "When I tap Change the recipe and Chef Mealan takes long, I see that he is still working, I can stop him, and he never runs on for minutes."),
  ("Now", "Each try waits up to 55 seconds; a model that runs out of time hands over to a second one, up to 55 seconds more; a change that misses your target is asked for once more. More than three minutes, with no way out. A refresh closes the screen, but the server keeps working and spends tokens."),
  ("Must happen", "After 20 seconds, the line a slow read already shows, with Stop. At one minute in all, it stops by itself; the second round is only asked while there is time left. Stop and a refresh stop the server too: no further try starts. A try already sent to Google is still charged; the library stops only the wait. The plate stays as it was."),
  ("Must not change", "What Change the recipe does when it answers in time; Add on the side; the read's own slow line."),
  ("Built", "0.2.36, Stop as your word (12:28). Walkthrough change-limit, 11 checks.")])
h = rowEnd(cy, B.screen("R10a", 0, y, "Plate: the fritters", "r10a", "same", "Under the target: the two ways, as in 0.2.35. Change the recipe, framed."),
           B.screen("R10b", 1, y, "After the tap", "r10b", "now", "Chef Mealan is changing it… Both ways greyed. This stays, up to three minutes, with no way out."))
B.edge("R10a", "R10b", "chg", "Change the recipe")
y = h
h = rowEnd(y + 200, B.screen("R10c", 0, y, "After 20 seconds", "r10c", "changed", "The slow line, as on a slow read, and Stop. Up to one minute in all."),
           B.screen("R10d", 1, y, "After Stop, or at one minute", "r10d", "changed", "Back to the plate as it was. The app's message says nothing changed, and what to try."))
B.edge("R10c", "R10d", "cancel", "Stop")
y = h
board("Stories06.dc.html", "RS6. R10: Change the recipe has a limit", "18 October 2026, design (Milan 12:03: Change the dish took forever, refreshed to stop the tokens; 12:07: yes, draw it). The real 0.2.35 build with Sally's apple fritters; Chef Mealan held back so the wait shows. Changes drawn in, blue outline and yellow note.", B, W4, y - 100, "Stories05.dc.html")

# ===== RS7: R9b, the dish's taste as chips (Milan 12:07 and 12:28) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.36, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R9b", "The dish's taste as chips", [
  ("Story", "When my kitchen mixes sweet and savoury, like jam with meat, I can say so, and the jam is offered for my meatballs."),
  ("Now", "R9 sets the taste from the foods. Swedish meatballs are savoury, so lingonberry jam is held back, with the line."),
  ("Must happen", "Under From all your foods, while a recipe is on the plate: This dish is, with Sweet, Savoury and Both, the app's choice chips. Chef Mealan presets them from the foods, as R9 does. Both offers every food. The choice stays with the recipe. Chef Mealan's own offers follow the chip too."),
  ("Instead of", "My bridge foods idea (jam, honey, chutney always allowed in a savoury dish): the chips let you decide, so no list of exceptions to keep right."),
  ("Must not change", "R9's rule as the preset; the Meal and Dessert chips, which set the size, not the taste.")])
h = rowEnd(cy, B.screen("R9i", 0, y, "Swedish meatballs, jam typed", "r9i", "now", "Lingonberry jam is held back: the line, framed."),
           B.screen("R9j", 1, y, "The same search", "r9j", "changed", "This dish is: Savoury, preset from the foods. Sweet and Both to tap."),
           B.screen("R9k", 2, y, "After Both", "r9k", "changed", "Lingonberry jam is offered. Both stays with the meatballs."))
B.edge("R9j", "R9k", "both", "Both")
y = h
board("Stories07.dc.html", "RS7. R9b: the dish's taste as chips", "18 October 2026, design (Milan 12:07: some kitchens mix sweet and savoury, like jam on meat; 12:28: as option chips). The real 0.2.36 build with a Swedish meatballs recipe and a lingonberry jam in your foods; changes drawn in, blue outline and yellow note.", B, W4, y - 100, "Stories06.dc.html")

# ===== RS8: the plate's definition, what it is for and its taste (Milan 12:52 and 12:56) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.36, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R11", "What the plate is, in one place", [
  ("Story", "When I open the Plate, I say what it is for (Exploring, a meal of my day, meal prep, a plan), whether it is a meal or a dessert, and whether it is sweet, savoury or both. The plate is sized and the foods are offered by that."),
  ("Now", "The pencil opens Meal or Dessert and When is this for. Which meal sizes the plate comes from the clock: at 11:27 Sized for your snack, though you meant lunch. The taste is only guessed from the foods (R9)."),
  ("Must happen", "In the line's section, in this order: What is it for (board PF, A1 to A3, Exploring first, Done in the line); Meal or Dessert, as now; Sweet or savoury, new: not set on an empty plate, preset by Chef Mealan from the foods, a base like crepes or pancakes left open; When is this for, as now. The line says it all: Lunch, 13:45 · 933 kcal · 60 g protein · PD 6.4 · Savoury."),
  ("Built in steps", "1. What is it for, with Exploring and the meals, sizing by the meal picked. 2. Sweet or savoury, which R9b's chips at the search become. Each with a walkthrough using your fritters, the meatballs and crepes."),
  ("Open", "What is it for and When is this for read alike. I'd keep When is this for as it is and let the new one carry its own hint line; or rename the old one What kind of moment. Your call."),
  ("Must not change", "Meal or Dessert and the moments, as they work now; R9's rule as the preset."),
  ("Built, step 1", "0.2.37, 13:06 answers: a new plate starts on the meal the clock is in, named in the line as a guess (Lunch, 13:45 by the clock · Off the plan), not on Exploring as S1 draws it; a meal picked counts by the plan on Today; What kind of moment. Meal prep and Plan it come with their own pieces; Sweet or savoury is step 2. Walkthrough plate-purpose, 13 checks.")])
h = rowEnd(cy, B.screen("S0", 0, y, "Plate, the pencil open", "s0", "now", "As on your phone at 11:27: Meal or Dessert, and When is this for. Nothing says which meal, or the taste."))
y = h
h = rowEnd(y + 100, B.screen("S1", 0, y, "The same, empty plate", "s1", "changed", "What is it for, Exploring first; Meal or Dessert; Sweet or savoury, not set yet; When is this for (now What kind of moment). Done in the line."),
           B.screen("S2", 1, y, "Crepes, Lunch picked", "s2", "changed", "Crepes go both ways: the taste stays open, nothing held back. Lunch sizes the plate, as the line says."),
           B.screen("S3", 2, y, "After Savoury, Done", "s3", "changed", "The line: Lunch, 13:45 · 933 kcal · 60 g protein · PD 6.4 · Savoury. Nutella held back, as R9 does."))
B.edge("S2", "S3", "sav", "Savoury, then Done")
y = h
board("Stories08.dc.html", "RS8. R11: what the plate is, in one place", "18 October 2026, design (Milan 12:52: sweet, savoury or mix belongs with the plate's definition on top, and supports what is offered; where is Exploring; 12:56: draw the combined section; pancakes and crepes are a base for both). Top: the real 0.2.36 build. Below: the section as it would be, drawn into the build.", B, W4, y - 100, "Stories07.dc.html")

# ===== RS9: R12, the whole recipe in your portions, and who eats the rest (Milan 13:55 and 13:58) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.37, as it is")
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.38")
B = Board(); y = 30
cy = storyCard(B, y, "R12", "The whole recipe, in your portions", [
  ("Story", "When I make the whole recipe, the app counts it in my portions, not the recipe's: three bowls on the page can be four of my lunches. I say who eats the rest: me, later, or others with me."),
  ("Now", "1 of 3 bowls on the plate; All 3 bowls on How to make it. You eat a lunch-sized plate, yet 2 bowls go to Keep for later: the numbers don't add up (R5, question 1)."),
  ("Must happen", "No recipe numbers: One bowl, as the recipe makes it; The whole recipe, or Just your plate; a line on the plate says that choice comes next. The whole recipe says what it is for you: about 4 of your lunches. Who eats the rest: Me, later (3 of your lunches, each your lunch size, with the switch Put them in my next meals: dinner today, lunch and dinner tomorrow) or Others with me (how many; their share isn't counted for you, nothing to Keep for later)."),
  ("Answers", "R5 question 1: what is left is counted in your portions. Meal prep (piece 7c) is Me, later with the switch, so it needs no screen of its own."),
  ("Later", "Family members with their own profiles could each count their share."),
  ("Must not change", "What you eat now and how it is sized; the steps; How did it go and How was it."),
  ("Built", "The small part, 0.2.38, on your OK at 14:36: no recipe numbers, the line on the plate, about 4 of your lunches, the rest counted in lunches on Keep for later, the landing line and the Today card. Who eats the rest (Me, later with the switch; R12e) stays open. Walkthrough whole-in-portions, 10 checks.")])
h = rowEnd(cy, B.screen("R12a", 0, y, "Plate: chicken bowls, lunch", "p0", "now", "Sized for your lunch, or 1 of 3 bowls, framed: the recipe's number."),
           B.screen("R12b", 1, y, "How to make it, All 3 bowls", "h0", "now", "You make all 3 bowls, you eat a lunch-sized plate, and 2 bowls go to Keep for later."))
B.edge("R12a", "R12b", "make", "Make it")
y = h
h = rowEnd(y + 200, B.screen("R12c", 0, y, "The same plate", "p1", "changed", "One bowl, as the recipe makes it. Next, on How to make it: the whole recipe, or just your plate."),
           B.screen("R12d", 1, y, "How to make it, the whole recipe", "h1", "changed", "About 4 of your lunches. Me, later: 3 lunches left, put in dinner today, lunch and dinner tomorrow."),
           B.screen("R12e", 2, y, "Others with me", "h2", "changed", "How many others: 2. Their share isn't counted for you; nothing goes to Keep for later."))
y = h
h = rowEnd(y + 60, B.screen("R12f", 0, y, "Plate, built", "b12plate", "built", "One bowl, as the recipe makes it, and the line under it."),
           B.screen("R12g", 1, y, "How to make it, built", "b12make", "built", "About 4 of your lunches; 3 left, each the size of your lunch. Who eats the rest is not built: open."))
y = h
board("Stories09.dc.html", "RS9. R12: the whole recipe, in your portions", "18 October 2026, design (Milan 13:55: no recipe numbers, all is 4 for me and 7 for someone else; 13:58: cooking for oneself, partner and family, colleagues, or meal prep for dinner today and lunch and dinner tomorrow). The real 0.2.37 build with a recipe that makes 3 bowls; changes drawn in, blue outline and yellow note. The small part is built in 0.2.38 (R12f, R12g); Who eats the rest stays open.", B, W4, y - 100, "Stories08.dc.html")
# ===== RS10: R3, the fix: cook with the pot, count the 15% (Milan 15:12 and 15:15) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.38, as it is")
W5 = SX + 4 * (SW + GAP) - GAP + 70
B = Board(); y = 30
cy = storyCard(B, y, "R3", "Cook with the pot, count what is taken up", [
  ("Story", "When I make fritters, the recipe and its steps give the oil as the recipe writes it: the whole pot. Only what I eat counts the oil the food takes up."),
  ("Now", "0.2.38 changed the recipe's oil to what is counted. How to make it says heat 246 g of oil for the whole recipe, and 29 g for just your plate. You can't deep fry in either. Chef Mealan drafts his steps from the same number."),
  ("Must happen", "Your rule (15:15): the mapped recipe and its steps follow the original. The pot is one number, the plate is the other. Cooking shows the pot: the read card, the recipe page, the steps, Chef Mealan's draft. Counting uses what is taken up: the plate, kcal, PD, Today, each labelled an estimate."),
  ("My opinion", "Just your plate keeps the pot too. The pot does not shrink with the portion: one fritter needs oil deep enough to fry it."),
  ("Must not change", "One fritter's numbers (taken up, 15%, an estimate). A splash in a pan and butter, counted in full."),
  ("Seen on the way", "The step heading reads The for shaping and frying. The dusting step names the dough's 67 g of flour on your plate, not the 31 g for dusting: two foods with one name. Both are separate stories."),
  ("Built", "0.2.39, on your OK at 15:29. R3o to R3r are the built app, as drawn. Walkthrough cook-with-the-pot, 7 checks; oil-taken-up changed where this story names it."),
  ("Backlog", "R13, change the way of cooking (15:29): oven, air fryer or a pan with a splash instead of deep frying; Chef Mealan says first if the dish works that way, or only deep frying works. The 15% has a limit: it comes from deep-fried dough; other fried foods take up more or less. Both go into a Culinary rules document.")], w=360)
h = rowEnd(cy, B.screen("R3g", 0, y, "The read card", "f0readc", "now", "Vegetable oil: 246 g in bold, the counted amount, as if the recipe used it."),
           B.screen("R3h", 1, y, "The same card", "f1readc", "changed", "1,380 g in bold, the pot, as written. Counted: 246 g, taken up in frying, an estimate."),
           B.screen("R3i", 2, y, "The recipe page, Foods", "f0pagec", "now", "246 g in bold; the pot only in the small line."),
           B.screen("R3j", 3, y, "The same page", "f1pagec", "changed", "1,380 g in bold. 1 to 2 quarts, for frying. Counted: 246 g, an estimate."))
y = h
h = rowEnd(y + 100, B.screen("R3k", 0, y, "How to make it, the whole recipe", "f0whole", "now", "Step 4: Heat 246 g vegetable oil in a deep pot. Too little to fry."),
           B.screen("R3l", 1, y, "The same, new", "f1whole", "changed", "Heat 1 to 2 quarts (1 to 1.9 L) vegetable oil: the pot, as the recipe writes it."),
           B.screen("R3m", 2, y, "How to make it, just your plate", "f0plate", "now", "Step 4: Heat 29 g vegetable oil. Scaled to your plate."),
           B.screen("R3n", 3, y, "The same, new", "f1plate", "changed", "Enough to fry: 1 to 2 quarts, as the recipe says. The pot does not shrink."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.39")
h = rowEnd(y + 60, B.screen("R3o", 0, y, "The read card, built", "b9read", "built", "1,380 g, the pot. Counted: 246 g, taken up in frying, an estimate."),
           B.screen("R3p", 1, y, "The recipe page, built", "b9page", "built", "1 to 2 quarts (1 to 1.9 L), for frying. Counted: 246 g, an estimate."),
           B.screen("R3q", 2, y, "The whole recipe, built", "b9whole", "built", "Heat 1 to 2 quarts (1 to 1.9 L) vegetable oil in a deep pot."),
           B.screen("R3r", 3, y, "Just your plate, built", "b9plate", "built", "Enough to fry: 1 to 2 quarts, as the recipe says."))
y = h
board("Stories10.dc.html", "RS10. R3, the fix: cook with the pot, count what is taken up", "18 October 2026 (Milan 15:12: we need 100% of the oil to deep fry; 15:15: the mapped recipe and the process follow the original). The real 0.2.38 build with Sally's apple fritters, the read with every food. Now, and the change drawn in. Built in 0.2.39 on your OK at 15:29 (R3o to R3r).", B, W5, y - 100, "Stories09.dc.html")
# ===== RS11: R14, two foods with one name: the flour (Milan 15:50) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.39, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R14", "Each food keeps its own amount in the steps", [
  ("Story", "When a recipe has two foods with one name, like flour in the dough and flour for dusting, each step names its own one, with its own amount."),
  ("Now", "Just your plate, step 3: Dust with 67 g all-purpose flour. That is the dough's flour on your plate. The plate itself lists 4 g for dusting. The whole recipe is right: 31 g. The cause: the steps for your plate find a food by its kind, and both flours are one kind."),
  ("Must happen", "Each step names the food it was written for, at your plate's amount: Dust with 4 g all-purpose flour. The part heading reads For shaping and frying; The goes only before a plain name: The dough, The glaze. On How to make it and on the recipe page."),
  ("Must not change", "The whole recipe's steps, the plate, the numbers, the pot of oil (R3)."),
  ("Built", "0.2.40, on your OK at 15:59. The flour, as drawn: 4 g for dusting on your plate (R14c). The heading needed no change: the app cleans part names to Shaping and frying, so it reads The shaping and frying; only the drawing's test recipe skipped that. Walkthrough steps-own-amounts, 4 checks.")])
h = rowEnd(cy, B.screen("R14a", 0, y, "How to make it, just your plate", "fl0plate", "now", "Framed: The for shaping and frying, and 67 g all-purpose flour for dusting."),
           B.screen("R14b", 1, y, "The same, new", "fl1plate", "changed", "For shaping and frying. Dust with 4 g all-purpose flour, as your plate lists it."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.40")
h = rowEnd(y + 60, B.screen("R14c", 0, y, "Just your plate, built", "b14c", "built", "Dust with 4 g all-purpose flour. The heading here is the test recipe's; the app reads The shaping and frying."))
y = h
board("Stories11.dc.html", "RS11. R14: each food keeps its own amount in the steps", "18 October 2026 (Milan 15:50: draw the flour). Seen on RS10. The real 0.2.39 build with Sally's apple fritters, How to make it, just your plate, sized for your lunch. Now, and the change drawn in. Built in 0.2.40 (R14c).", B, W, y - 100, "Stories10.dc.html")

# ===== RS12: R15, the plate starts with the whole recipe (Milan 15:55 and 15:59) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.39, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R15", "The plate starts with the whole recipe, as mapped", [
  ("Story", "When a recipe comes to the plate, from a link or with Make it from Recipes, I see the whole recipe as I mapped it. Then I pick what I eat."),
  ("Now", "Exploring, Make it from Recipes: the plate offers one choice only, One fritter, as the recipe makes it. The whole recipe is never shown. The line says one fritter is 650 kcal; the card says 667 kcal."),
  ("Why 667", "The plate rounds every food to whole grams and a tiny amount up to 1 g: nutmeg 0.08 g becomes 1 g, cinnamon and vanilla too. That adds 17 kcal to one fritter."),
  ("Must happen", "The plate starts with The whole recipe: its foods at the recipe's grams, the card titled The whole recipe with its numbers. Then One fritter, as the recipe makes it, and with a meal Sized for your lunch. One fritter is one twelfth: the line and the card give one number; tiny amounts keep their grams."),
  ("My opinion", "How to make it keeps its choice. With One fritter you can still make the whole recipe, or just your plate, as for one cookie. With the whole recipe picked, you make all of it, and the line about How to make it goes."),
  ("Must not change", "PD; the parts; Leave it out; Fit to my target; R12's portions and R4's link."),
  ("Built", "0.2.41, on your OK at 16:16. R15d and R15e are the built app. One fritter shows 653 kcal on the line and the card: foods of 1 g and more still round to whole grams (oil 20.5 g is 21 g). Not when the plate fills a meal of the Plan. Walkthrough plate-starts-whole, 7 checks; seven journeys now pick their portion in one added step: batch-linked, cook-with-the-pot, dish-parts, how-to-make, recipe-import, steps-own-amounts, whole-in-portions.")])
h = rowEnd(cy, B.screen("R15a", 0, y, "Plate, Make it from Recipes, Exploring", "r15nowc", "now", "One choice only: One fritter. The line says 650 kcal, the card 667."),
           B.screen("R15b", 1, y, "The same plate, new start", "r15wholec", "changed", "The whole recipe first: 7,794 kcal, the foods at the recipe's grams. One fritter as the second choice."),
           B.screen("R15c", 2, y, "One fritter picked", "r15onec", "changed", "One fritter is one twelfth: 650 kcal on the line and on the card."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.41")
h = rowEnd(y + 60, B.screen("R15d", 0, y, "The whole recipe, built", "b15wholec", "built", "The whole recipe first; the card titled The whole recipe: 7,794 kcal."),
           B.screen("R15e", 1, y, "One fritter, built", "b15onec", "built", "653 kcal on the line and on the card."))
y = h
board("Stories12.dc.html", "RS12. R15: the plate starts with the whole recipe", "18 October 2026 (Milan 15:55, testing 0.2.39: moving to Plate from Recipe has to show the full amount as mapped; 15:59: draw R15). The real 0.2.39 build, Exploring, Make it from Recipes with Sally's apple fritters. Now, and the change drawn in. Built in 0.2.41 (R15d, R15e).", B, W, y - 100, "Stories11.dc.html")
# ===== RS13: R5, Today is the day against the plan (Milan 16:53, 17:23 to 18:48) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.41, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R5", "Today is the day against the plan", [
  ("Purpose", "Today shows only what counts towards the target (18:48): the goal's numbers and macros, the training or rest day, the meals with their numbers, and a few actions to make the day count. The foods are the recipe's, in Recipes, one tap away."),
  ("Now", "Fritters sized for lunch, the whole recipe made at 12:30; I ate one at 16:00 and 19:00. Each meal lists all 20 foods, the batch card all 20 again. No meal says which meal it was. The day's numbers are one small line."),
  ("Must happen", "Your goal card: today against it, PD, kcal, protein, fat, carbs, eaten of the target, with the day (No training today, or the training); fat and carbs say at least when a food has no value. One main action, what comes next: the next meal by the clock with what is left of the day, or Plan tomorrow once the day's meals are logged; Log a meal under it. Each meal: which meal, its kcal, protein, fat, carbs and PD, Open the recipe. Prepared for later: each one lunch with its kcal and protein, Open the recipe, I ate one, which asks which meal it is (Q2)."),
  ("Order", "Under your goal card, by time and importance (18:55): what comes next (the next meal, or tomorrow once dinner is logged), with your batch as a way to eat it; the plan for the rest of the day; today's meals, newest first, each with its carry question; the last two days; Getting to know you, about logging."),
  ("Answers", "Q1 (R12): what is left counts in your portions. Q2: yes. Q3: one carry question for meals close together, later."),
  ("Must not change", "The carry question per meal; Remove; What's in the plan; the last two days; Save in My recipes for a plate that is no recipe."),
  ("Built", "0.2.42, on your OK at 19:00. R5f and R5g are the built app. Different from the drawing, which had no plan: logging dinner as dinner counts it by the plan, so the meals get By the plan or Off the plan, and the day's record card shows under the plan, repeating the top numbers. A plate now saves the meal it was sized for, so Today names it. Walkthrough today-against-plan, 10 checks; eight walkthroughs read the new wording, each named.")])
h = rowEnd(cy, B.screen("R5c", 0, y, "Today at 19:05, now", "r5c4", "now", "Three meals from the batch, each with all 20 foods; the batch card with all 20 again. The day: one small line."),
           B.screen("R5d", 1, y, "The same Today, new", "r5d4", "changed", "Today against your goal, the rest day. Dinner is logged, so next is tomorrow. Meals newest first, with their numbers, recipe and carry question."),
           B.screen("R5e", 2, y, "At 19:00, before dinner, new", "r5e4", "changed", "Next: dinner, 19:30. Make your dinner, or one from your batch: Which meal is it? Dinner picked. Log it."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.42")
h = rowEnd(y + 60, B.screen("R5f", 1, y, "At 19:05, built", "b5d", "built", "Next: tomorrow, Plan tomorrow. Meals newest first, each with its numbers, recipe and carry question; By the plan marks and the day's record, since dinner counts by the plan."),
           B.screen("R5g", 2, y, "At 19:00, built", "b5e", "built", "Next: dinner, 20:00 on this day's times. I ate one: Which meal is it? Dinner, 20:00 picked, or Snack. Log it."))
y = h
board("Stories13.dc.html", "RS13. R5: Today is the day against the plan", "18 October 2026 (Milan 16:53: redraw on the current build; 17:23 to 18:55: Today shows only what counts towards the target, in order of time and importance; Q2 yes, Q3 later). The real 0.2.41 build, the day following the Training week (Sunday, a rest day): Sally's apple fritters sized for lunch, the whole recipe made at 12:30, I ate one at 16:00 and 19:00. Now, and the change drawn in. Replaces the 02:00 draft R5b on RS3. Built in 0.2.42 (R5f, R5g).", B, W, y - 100, "Stories12.dc.html")
# ===== RS14: R6, add a recipe on Recipes, with the Nutrition table on the read (Milan 19:45 and 19:52) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.42, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R6", "Add a recipe on Recipes, and check it", [
  ("Story", "On Recipes I add a recipe I found, from a link or screenshots, to explore it or keep it, without going to the Plate. The read shows its numbers next to its foods, so I can check what the post says against what the foods add up to."),
  ("Now", "Recipes has no way to add. Adding means the Plate: read it there, Put it on my plate, and the recipe lands in Mine on the way. The read card shows the foods, the recipe's claim in one line and the steps; the Nutrition table only on the recipe page after."),
  ("Must happen", "Under the Mine, Coach's and Members filter, in Mine: Add a recipe, the same Link and Screenshot as the Plate. One shared block, so a fix to reading shows on both. The read card on Recipes ends with Save in My recipes, and Save opens the recipe's page, in Recipes. On both screens the read card shows the Nutrition table after the foods (one, all, 100 g, by part); what the recipe says stays once, at the top, next to PD."),
  ("My opinion", "Only Save at the end on Recipes. The recipe page has Make it for the Plate; a second way there is noise."),
  ("Seen on the way", "The Recipes list shows every food of every recipe, with the frying oil as counted (246 g), not the pot. A separate story: short tiles, like Today."),
  ("Must not change", "The Plate's own Link and Screenshot and Put it on my plate; the recipe page."),
  ("Built", "0.2.43, on your OK at 19:58. R6e to R6g are the built app. The saved line's link goes back to Recipes, as drawn (the old card always went to Today). Empty Mine now says: Add one above, or make your first on the Plate. Walkthrough recipes-add, 8 checks.")])
h = rowEnd(cy, B.screen("R6a", 0, y, "Recipes, Mine, now", "r6now", "now", "No way to add here: adding a recipe goes through the Plate."),
           B.screen("R6b", 1, y, "Recipes, new", "r6add", "changed", "Add a recipe under the filter: Screenshot and Link, as on the Plate."),
           B.screen("R6c", 2, y, "The read, on Recipes", "r6read", "changed", "The foods, then the Nutrition table; what the post says at the top; Save in My recipes."),
           B.screen("R6d", 3, y, "After Save", "r6savedc", "changed", "The recipe's page, in Recipes: Saved in My recipes; Make it is there for the Plate."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.43")
h = rowEnd(y + 60, B.screen("R6e", 1, y, "Recipes, built", "b6add", "built", "Add a recipe under the filter, in Mine."),
           B.screen("R6f", 2, y, "The read on Recipes, built", "b6read", "built", "The foods, the Nutrition table, Save in My recipes."),
           B.screen("R6g", 3, y, "After Save, built", "b6savedc", "built", "Saved in My recipes; the link goes back to Recipes."))
y = h
board("Stories14.dc.html", "RS14. R6: add a recipe on Recipes, and check it", "18 October 2026 (Milan 19:45: Recipes gets its own block for screenshots and links, to explore or keep a recipe, without the Plate; 19:52: the read shows the Nutrition table next to the foods, to check what was said online against our numbers). The real 0.2.42 build with Sally's apple fritters; the recipe's own numbers (390 kcal a fritter) are a test value. Now, and the change drawn in. Built in 0.2.43 (R6e to R6g).", B, W5, y - 100, "Stories13.dc.html")

# ===== RS15: R16, the read and the recipe page: picture, PD on top, a table that fits; Today: tags on one line, photos (Milan 21:08, 21:11) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.43, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R16", "See the dish and its PD first; nothing breaks the layout", [
  ("Story", "When I map a recipe, I see the dish and its PD first, then the foods and the table; nothing in the table leaves the card. On Today, a batch or a meal shows its picture, and its numbers stay on one line."),
  ("Now", "The read has no picture and a small PD line. On the recipe page PD sits below the foods. In the Nutrition table, Carbohydrate's 46.7 g leaves the card: the columns are fixed and too narrow. On Today, 11 left and 07:00 PM break onto two lines next to a long name, and no card has a picture."),
  ("Must happen", "The read: the dish's picture on top (the page's own photo from a link, your first screenshot from screenshots), for you only, never published; then where it came from; then the PD block, the same as on the Plate. The recipe page: the PD block under Where it came from. The table: one set of columns for the whole card, each as wide as its widest number, so the numbers line up and none leaves the card. Today is for this day: where I stand, what's next, what I ate. No batch block and no count of what is left; the rest may go to the family or to work. A batch reaches a day only through the plan: the recipe in a slot counts one portion (that already works). Next shows the planned meal with its picture; I ate it logs it as planned in one tap; Change it on the Plate opens the Plate, as Make your breakfast did. Button labels are fixed, never the recipe's words. The time on one line; a small square picture on the batch card and on each meal (the plate's photo you took, else the recipe's cover, else the blank tile)."),
  ("Note", "No real photos in the test data: the blank tile stands where the photo goes."),
  ("Must not change", "The foods, the numbers, the steps; the order of Today (R5); the plan and its numbers."),
  ("Journeys that change", "batch-linked, today-against-plan and whole-in-portions: they check the batch block on Today, which goes. Each change will be reported."),
  ("Built", "0.2.44, on your OK at 22:11. R16i to R16l are the built app. Two more than drawn: the make step and the landing line no longer say the rest goes to Keep for later or Today; they say: to eat them on other days, put the recipe on Plan. A planned meal without foods (a starter) says Make it on the Plate. Two more walkthroughs changed for that: how-to-make and changed-dish. The apostrophe shown as code in Sally's name was only in the test data; the real reader turns it into letters since 0.2.29. New walkthrough dish-first.")])
h = rowEnd(cy, B.screen("R16a", 0, y, "The read, now", "f16read0c", "now", "No picture; PD as a small line; Carbohydrate past the edge further down."),
           B.screen("R16b", 1, y, "The read, new", "f16read1c", "changed", "The dish's picture, where it came from, then the PD block."))
y = h
h = rowEnd(y + 100, B.screen("R16c", 0, y, "The recipe page, now", "f16page0c", "now", "PD below the foods; Carbohydrate's 46.7 g leaves the card."),
           B.screen("R16d", 1, y, "The recipe page, new", "f16page1c", "changed", "PD under Where it came from; one set of columns, so the numbers line up."))
y = h
h = rowEnd(y + 100, B.screen("R16e", 0, y, "Today, now", "f16today0", "now", "For tomorrow, from your batch, with 11 left and I ate one: neither about this day."),
           B.screen("R16f", 1, y, "Today, new: the day is done", "f16today1", "changed", "No batch block. The meal keeps its picture and its time on one line."))
y = h
h = rowEnd(y + 100, B.screen("R16g", 0, y, "Plan, Monday: the fritters for breakfast", "f16plan1", "now", "Already works: the recipe counts one portion, 649 kcal."),
           B.screen("R16h", 1, y, "Today, new: Monday morning", "f16today2", "changed", "Next shows the planned breakfast; I ate it logs it; Change it on the Plate."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.44")
h = rowEnd(y + 60, B.screen("R16i", 0, y, "The read, built", "b16readc", "built", "The page's photo, where it came from, the PD block."),
           B.screen("R16j", 1, y, "The recipe page, built", "b16pagec", "built", "PD under Where it came from."),
           B.screen("R16k", 2, y, "Today, Monday morning, built", "b16today2c", "built", "The planned breakfast with its picture; I ate it."),
           B.screen("R16l", 3, y, "After I ate it, built", "b16today3c", "built", "Logged as breakfast, by the plan, 649 kcal."))
y = h
board("Stories15.dc.html", "RS15. R16: see the dish and its PD first; nothing breaks the layout", "18 October 2026 (Milan 21:08: the Carbohydrates row breaks the design; PD on top, below Where it came from; the picture while creating the recipe; 21:11: 11 left breaks; a photo in the meal card; 21:31: the chip and I ate one read oddly; 21:40: button labels must not depend on the recipe; 21:56 to 22:02: Today follows the plan and the calendar, not what is left of a batch). The real 0.2.43 build with Sally's apple fritters under a long name. Now, and the change drawn in. For your OK.", B, W5, y - 100, "Stories14.dc.html")

# ===== RS16: R17, search by what you crave (Milan 23:04, 23:09) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.44, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R17", "Find what I crave", [
  ("Story", "When I crave something, crêpes, sarma, something chocolate at PD 7 or more, a pudding, I type it in my words and see the dishes I can have, with their PD against my target. When nothing fits, Chef Mealan gives me an idea, and the app sets its numbers."),
  ("Now", "The Plate asks What are you craving?, but its only box searches your foods by name. Crêpes, sarma or chocolate PD 7+ find nothing. Recipes has no search. Chef Mealan's chat does not look through your recipes. On 8 October you said a meal starts from a craving, the plan, or off the plan: the craving start was never built."),
  ("Must happen", "A box under the question. It looks at dish names, their foods and parts, and taste (sweet or savoury), in your recipes, Coach's, the members' and Chef Mealan's starters, and in your foods. Crepes finds crêpes; one word finds its plural. PD 7+ (or PD 7 or more) is read by the app as a filter and shown as a chip with ✕. Results in groups, each row as in Plan's Pick a meal, with PD against your target, sorted by fit. A dish under the filter is named, not hidden. A tap puts the dish on the plate, as Make it does. Nothing found: Ask Chef Mealan for one, only on your tap. His idea uses your foods where it can; the app sets every number; Put it on my plate, Another idea. Every idea is kept in My recipes right away, marked Chef Mealan's idea, not made yet, so you can come back to it tomorrow and change a food (the biscuit you found). Made once, it is a recipe like any other; Remove takes it away."),
  ("My opinion", "The Plate first; Recipes takes the same box later, as it took Add a recipe. Matching by words is code: instant and free. Chef Mealan only on a tap, so a search costs nothing until you want an idea. A word like pudding only finds dishes named pudding; a creamy dessert by another name needs Chef Mealan."),
  ("Decided", "Milan, 23:22. 1. Members' recipes are in the results from day one. 2. Chef Mealan's ideas are kept, not lost: you start with one, do something else, and check it tomorrow."),
  ("My opinion", "Call it an idea, not a draft: Draft already means a coach's page not yet published on chefmealan.com."),
  ("Built", "0.2.45, on your Build at 23:34. R17i to R17l are the built app. Different from the drawing: when dishes are found, Ask Chef Mealan for another is a quiet link, not a card; a starter has no foods, so its tap asks Chef Mealan to make it from yours; with a dish on the plate the box steps aside. Walkthrough craving-search."),
  ("Fixed in 0.2.46", "Milan's test at 00:10: one tap on Sarma made five ideas, because taps while Chef Mealan was thinking each asked again, and each idea took one of the day's drawn pictures. Now one question at a time, the box says Chef Mealan is making an idea for Sarma while he works, and an idea not made yet gets no picture."),
  ("Note", "The recipes are test data built from the test foods: your DaaM good crêpes as a stand-in, a Coach's chocolate quark pudding, a chocolate oat bowl. Their numbers are worked out from those foods; the tiramisu idea too."),
  ("Must not change", "Quick picks and its foods box; Start from a recipe; the plate.")])
h = rowEnd(cy, B.screen("R17a", 0, y, "The Plate, now", "f17now1", "now", "chocolate PD 7+ in the foods box: nothing. It searches food names only."),
           B.screen("R17b", 1, y, "The Plate, new", "f17new0c", "changed", "A box under What are you craving?"),
           B.screen("R17c", 2, y, "crêpes", "f17new1c", "changed", "Your crêpes, PD 8.7, fits."),
           B.screen("R17d", 3, y, "chocolate PD 7+", "f17new2c", "changed", "The filter as a chip; Coach's pudding; the oat bowl named under the filter."))
y = h
h = rowEnd(y + 100, B.screen("R17e", 0, y, "sarma", "f17new3c", "changed", "Chef Mealan's starter, under your PD: shown, and the plate can fit it."),
           B.screen("R17f", 1, y, "tiramisu: nothing found", "f17new4c", "changed", "Ask Chef Mealan for one, on your tap."),
           B.screen("R17g", 2, y, "Chef Mealan's idea", "f17new5c", "changed", "Protein tiramisu from your foods, PD 12.3; numbers by the app; kept as an idea."),
           B.screen("R17h", 3, y, "Recipes, the idea kept", "f17new6c", "changed", "At the top of Mine: Chef Mealan's idea, not made yet."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.45")
h = rowEnd(y + 60, B.screen("R17i", 0, y, "crêpes, built", "c17bx", "built", "Your crêpes, fits; Ask Chef Mealan for another as a link."),
           B.screen("R17j", 1, y, "chocolate PD 7+, built", "c17cx", "built", "The chip; Coach's pudding; the oat bowl named; Nutella's PD said."),
           B.screen("R17k", 2, y, "Chef Mealan's idea, built", "c17fx", "built", "Numbers from the foods; kept as an idea."),
           B.screen("R17l", 3, y, "Recipes, built", "c17gx", "built", "The idea at the top of Mine, marked."))
y = h
board("Stories16.dc.html", "RS16. R17: find what I crave", "18 October 2026 (Milan 23:04: where is the search by what I crave? Crêpes, sarma, a taste, a food, an ingredient, something chocolate PD 7+, a pudding; 23:09: draw it). The real 0.2.44 Plate. Now, and the change drawn in. 23:22: members yes; ideas are kept. For your OK.", B, W5, y - 100, "Stories15.dc.html")

# ===== RS17: R18, Today says which day; Tomorrow, the same (Milan 23:22) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.44, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R18", "Today says which day; tomorrow is one look away", [
  ("Story", "On Today I see which day the plan card is for, Today: Monday, October 19, and under today's meals the same card for tomorrow. When tomorrow is planned, I am asked to check it, not to plan it."),
  ("Now", "What's in the plan has no date. Tomorrow shows only as one small line, Tomorrow is set: 2 slots. When the day is done the main button always says Plan tomorrow, planned or not. And with only breakfast planned, once it is eaten the card says All one slot eaten, Today went by the plan, at 10:00, with lunch and dinner still to come, and the day's record card shows."),
  ("Must happen", "Under What's in the plan: Today: Monday, October 19. A second card, the same, under today's meals: Tomorrow: Tuesday, October 20, with tomorrow's slots and their meals, an open slot as Pick a meal. Planned: Check tomorrow; nothing planned: Plan tomorrow. Both open Plan on Tuesday. The main button when the day is done follows the same rule. Today went by the plan, and the record card, only when no slot of today is still to come; until then: Breakfast eaten, by the plan, and the open slots. The small Tomorrow is set line goes; the Tomorrow card says it."),
  ("My opinion", "Tomorrow under today's meals, not above them: during the day today matters more; at night it is one scroll away, and the main button already points there. Tomorrow's rows open Plan, not the Plate: you check tomorrow, you don't eat it."),
  ("Note", "Test data: your crêpes for breakfast on Monday and Tuesday, Coach's chocolate pudding for Tuesday's lunch."),
  ("Must not change", "The goal card, Next and its line, today's meals, the last few days; the walkthroughs today-plan and today-against-plan keep their checks, except the two lines this story names."),
  ("Built", "0.2.46, on your OK at 00:05. R18g to R18i are the built app, as drawn. A slot still to come is one Next still counts (until 90 minutes after its time). Tomorrow's rows say which slot they are for tomorrow, so they never mix with today's. No walkthrough had to change. New walkthrough today-tomorrow.")])
h = rowEnd(cy, B.screen("R18a", 0, y, "Monday 07:00, now", "f18now0", "now", "No date on the plan card; nothing about tomorrow but a line."),
           B.screen("R18b", 1, y, "Monday 10:00, now", "f18now1", "now", "Breakfast eaten: Today went by the plan, with lunch and dinner to come."),
           B.screen("R18c", 2, y, "Monday 07:00, new", "f18new0", "changed", "Today: Monday, October 19. Tomorrow, the same card: Check tomorrow."),
           B.screen("R18d", 3, y, "Monday 10:00, new", "f18new1", "changed", "Breakfast eaten, by the plan; lunch and dinner open; no record yet."))
y = h
h = rowEnd(y + 100, B.screen("R18e", 0, y, "Monday 23:00, tomorrow planned", "f18new2", "changed", "Check tomorrow, in Next and on the Tomorrow card."),
           B.screen("R18f", 1, y, "Monday 23:00, nothing planned", "f18new3", "changed", "Plan tomorrow, in both places."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.46")
h = rowEnd(y + 60, B.screen("R18g", 0, y, "Monday 07:00, built", "b18a", "built", "Today: Monday, October 19; Tomorrow under today's meals: Check tomorrow."),
           B.screen("R18h", 1, y, "Monday 10:00, built", "b18b", "built", "Breakfast eaten, by the plan; lunch and dinner open; no record yet."),
           B.screen("R18i", 2, y, "Monday 23:00, built", "b18c", "built", "Check tomorrow; Today went by the plan and the record."))
y = h
board("Stories17.dc.html", "RS17. R18: Today says which day; tomorrow is one look away", "18 October 2026 (Milan 23:22: the date in What's in the plan, Today: Sunday, October 18; a section for tomorrow, the same; when tomorrow is planned, check it, not plan it). The real 0.2.44 build. Now, and the change drawn in. For your OK.", B, W5, y - 100, "Stories16.dc.html")

# ===== RS18: R19, one rule for meals on Today and Plan (Milan 05:00, 06:04) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.46, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R19", "One rule for meals: tap to see it, buttons to act", [
  ("Story", "On Today and Plan, I tap a meal and see what it is. What I can do with it is a button on it, named for what it does, the same everywhere."),
  ("Now", "Three behaviours for the same thing. The next meal's card is an info card: tapping does nothing; I ate it is a big button under it, Change it on the Plate a link. Today's planned rows open the Plate. Tomorrow's open Plan. On Plan, tapping a meal opens Pick a meal. A meal kept for later has small I ate it and Not today buttons on its card: another design again."),
  ("The rule", "1. Tap a meal: see the meal (its page: foods, numbers, PD, steps). The next card, today's and tomorrow's rows, Plan's slots, today's meals. 2. Actions are buttons on the card, the same pair as a meal kept for later: ✓ I ate it and Change it (the Plate). 3. The wide blue button only when there is no meal yet: Make your lunch, Plan tomorrow, Check tomorrow. 4. A meal opened from a slot says which slot, with that slot's buttons on top: from Today, I ate it and Change it on the Plate; from Plan, Swap it and Empty the slot. The link on top goes back: ‹ Today, ‹ Plan."),
  ("The rows (Milan 06:17)", "Each planned meal has its small photo on the left and its title as the link; a tap anywhere on the row opens the meal, a bigger target than the title. Skip and the arrow leave the row: they sat too close. Swipe instead, the same gesture as a food on the Plate: left to Swap (blue), right to Skip for today (red), on Plan right to Empty the slot; it acts when you let go. The meal's page keeps Swap it and Skip it today as links, for when you don't swipe."),
  ("06:36", "I ate it and Change it sit on the right of the card. On Plan the time goes into the line, Breakfast, 07:30, as on Today, so the photo and the title get the room; every slot row the same."),
  ("Stays", "Pick a meal on an open slot still picks; Log a meal; Check tomorrow opens Plan."),
  ("My opinion", "This is the change that stops the going in circles: one tap always means the same thing. A starter has no page: its tap opens the Plate, where Chef Mealan makes it."),
  ("Journeys that change", "today-plan (a planned row opened the Plate), today-tomorrow (tomorrow's row opened Plan), and the walkthroughs that tap a planned slot on Plan to swap it; each named and reported on build."),
  ("Note", "Test data as on RS17."),
  ("Built", "0.2.47, on your Build at 06:41. R19h to R19k are the built app. Added beyond the drawing: the swipe's two actions are also buttons a screen reader or a keyboard reaches, out of sight, so nothing is swipe-only; a starter (no recipe page) opens the Plate from Today and Pick a meal on Plan; a swipe never counts as a tap. Walkthrough meals-one-rule. Changed as named: today-plan (Change it on the Plate from the meal), today-against-plan (Change it on the card), where-and-dish (Change it on the Plate from the meal), coach-week and plan-fill (a swipe skips or swaps), plan-slots (times read from the line).")])
h = rowEnd(cy, B.screen("R19a", 0, y, "Today, now", "f19bnow0c", "now", "The card does nothing; today's row opens the Plate; tomorrow's opens Plan."),
           B.screen("R19b", 1, y, "Today, new", "f19bnew0c", "changed", "The card is the meal: tap to see; I ate it and Change it on it. Rows: photo, title as the link."),
           B.screen("R19c", 2, y, "The meal, from Today", "f19bnew1c", "changed", "Breakfast, 07:30 · by the plan; I ate it, Change it on the Plate; Swap it, Skip it today; ‹ Today."),
           B.screen("R19d", 3, y, "Plan, now", "f19bnow1", "now", "Tapping the meal opens Pick a meal."))
y = h
h = rowEnd(y + 100, B.screen("R19e", 0, y, "Plan, new", "f19bnew2", "changed", "Photo, title as the link; tap to see; swipe: Swap, Empty."),
           B.screen("R19f", 1, y, "The meal, from Plan", "f19bnew3c", "changed", "Monday's breakfast; Swap it, Empty the slot; ‹ Plan."),
           B.screen("R19g", 2, y, "Today, the swipe", "f19bnew0sc", "changed", "Left: Swap. Right: Skip. As a food on the Plate."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.47")
h = rowEnd(y + 60, B.screen("R19h", 0, y, "Today, built", "b19ac", "built", "The card with its two buttons on the right; rows with photo and title."),
           B.screen("R19i", 1, y, "The meal from Today, built", "b19bc", "built", "The slot on top; ‹ Today."),
           B.screen("R19j", 2, y, "Plan, built", "b19cc", "built", "The time in the line; photo; title as the link."),
           B.screen("R19k", 3, y, "The meal from Plan, built", "b19dc", "built", "Swap it, Empty the slot; ‹ Plan."))
y = h
board("Stories18.dc.html", "RS18. R19: one rule for meals, tap to see, buttons to act", "19 October 2026 (Milan 05:00: I can't see what a planned meal is; 06:04: today's rows open the Plate, tomorrow's open Plan, the next card does nothing, I ate it is big and Change it a link, the batch card looked different, and Plan opens the picker. Fix the UI/UX; 06:17: Skip and the arrow too close, no photo; swipe for Swap and Skip, a small photo, the title as the link; 06:36: the buttons on the right, the time on Plan takes too much room). The real 0.2.46 build; now, and the rule drawn in. For your OK.", B, W5, y - 100, "Stories17.dc.html")

# ===== RS19: R20, how a meal carried you, shown and used (Milan 23:34, 07:25) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.47, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R20", "How a meal carried you: shown on the meal, used by Chef Mealan", [
  ("Story", "When I tell Chef Mealan how a meal carried me, I see that answer again on the meal. When he picks meals for me, he leans toward the ones that keep me light."),
  ("Now", "Today asks How did it carry you? 30 minutes after a meal, on a second card under it. The answer is saved on the meal's card and counted as an anonymous number (the answer only, no food). Then the card goes. It is shown nowhere and used by nothing. Your 23:34 question: you can't see it because nothing shows it."),
  ("Must happen", "1. The question sits on the meal's own card, with the same three buttons: Light and awake, Fine, Heavy, tired. They take the card's full width, under the photo and the numbers (Milan 18:15). 2. Answered, the card keeps it, also full width: Carried you: Light and awake · Change. Change brings the buttons back, for a wrong tap. 3. The meal's page gets How it carries you: every answer for this recipe, with the day and the meal, and the meals not answered yet. 4. Chef Mealan's read: after two answers the same way, and more of them than the other way, the meal is Light for you or Heavy for you. Fine counts as neither. 5. Pick a meal shows that tag on the meal's row. 6. Fill the day: among meals that fit about as well, a light one comes first and a heavy one second, and one sentence says so. 7. Chef Mealan's ideas (Make it a meal on the Plate, the craving search) get the names of both lists and lean on the light one. 8. Each answer keeps its moment: the meal of the day, a training or rest day, and before or after training when the plan has a training time. The page shows it. 9. Only the last 5 answers count. Change the recipe's foods and the answers from before stay on the page, marked before the change, and stop counting."),
  ("Stays", "The three answers and their words. The anonymous count. A heavy meal is never hidden or taken out: it moves down, and you can still pick it. Members and public pages never see the answers."),
  ("My opinion", "One answer is noise: you slept badly, you trained hard. Two that agree are a signal. That is why nothing changes before two (your OK at 18:35). Per recipe now, because that is what you pick. Was it the crêpes or the moment? The moment is saved with every answer, so the data can tell later. Families (a recipe and its changed copies) and the moment in the read come once there are answers to learn from."),
  ("Journeys that change", "None. No walkthrough answers the question today. A new walkthrough, carry-answers, would check all seven points."),
  ("Note", "Test data: crêpes answered light twice and fine once; Sarma heavy twice and fine once, today's lunch not answered yet. Fine counts as neither (default, 18:31)."),
  ("Built", "0.2.48, on your Build at 18:39. R20f to R20i are the built app. Added beyond the drawing: a meal without a read says Chef Mealan reads it once two answers agree; a meal not named (a card without its slot) says its time, today, 12:30; a change of answer is not counted twice in the anonymous count; the light meal gets one sentence too when it decides a pick. Fill the day says nothing when your answers did not change the pick, as in R20i. Walkthrough carry-answers, 16 checks; 4 unit tests. No journey changed.")])
h = rowEnd(cy, B.screen("R20a", 0, y, "Today, now", "r20nowc", "now", "The question on a second card; the answer for breakfast shown nowhere."),
           B.screen("R20b", 1, y, "Today, new", "r20newc", "changed", "The question on the meal's card, its buttons full width; the answer stays on it, with Change."),
           B.screen("R20c", 2, y, "The meal's page, new", "r20pagec", "changed", "How it carries you: every answer, and Chef Mealan's read: Heavy for you."))
y = h
h = rowEnd(y + 100, B.screen("R20d", 0, y, "Pick a meal, new", "r20pick", "changed", "Light for you, Heavy for you on the rows."),
           B.screen("R20e", 1, y, "Fill the day, new", "r20fill", "changed", "One sentence says why Sarma comes second."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.48")
h = rowEnd(y + 60, B.screen("R20f", 0, y, "Today, built", "b20ac", "built", "The question on Sarma's card, full width; breakfast keeps its answer."),
           B.screen("R20g", 1, y, "The meal's page, built", "b20bc", "built", "How it carries you; Heavy for you."),
           B.screen("R20h", 2, y, "Pick a meal, built", "b20c", "built", "Light for you, Heavy for you."),
           B.screen("R20i", 3, y, "Fill the day, built", "b20d", "built", "Sarma was not a close choice here, so no sentence."))
y = h
board("Stories19.dc.html", "RS19. R20: how a meal carried you, shown and used", "19 October 2026 (Milan 23:34: I click the 30 minutes feedback and don't see it anywhere; 07:25: show the answers and let Chef Mealan use them). The real 0.2.47 build; now, and the change drawn in. For your OK.", B, W5, y - 100, "Stories18.dc.html")

# ===== RS20: R21, the small things 1 to 4; R22, the taste on the Plate, to resolve (Milan 19:07, 22:03) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.48, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R21", "Four small things: short tiles, one number, said once, true after day 14", [
  ("Story", "What I see is short, gives one number for the same food everywhere, says each thing once, and stays true after the first two weeks."),
  ("1. Tiles", "Now: a recipe's tile lists every food with its grams; the fritters run 20 foods long, with the oil at the 246 g counted. New: One fritter · 650 kcal · 8 g protein · PD 1.2 · makes 12, then made and rated as now. The foods stay on the recipe's page."),
  ("2. One number", "Now: one fritter is 653 kcal on the Plate (every food rounded to whole grams), 649 on Plan (the portion saved as 195 g of 2,342) and 650 as the recipe (7,794 ÷ 12). New: one portion is the recipe divided by what it makes, from the exact grams. The Plate shows its grams rounded, as now, and counts the exact ones. Plan, the Plate, the recipe, the tile and Today all say 650."),
  ("3. The record", "Now: the record card repeats the PD, kcal and protein of the goal card at the top. New: it keeps its line only, 3 of 3 by the plan, the line your coach sees."),
  ("4. After day 14", "Your phone, Day 13 of 14, is right. The 19 came from my test data, which started on 1 October. On day 15 you would see Day 15 of 14 while there is not enough data yet (0 full days so far), and the squares stay on the first two weeks though the count is over the last 14 days. New: THE LAST 14 DAYS, the squares move with them, today last."),
  ("Stays", "Everything else on these screens. The amounts you type on the Plate."),
  ("My opinion", "Point 2 matters most: in a nutrition app, two numbers for one fritter cost trust. The record line could also go into the plan card's Today went by the plan; I'd keep it a card, because it is the line your coach sees."),
  ("Journeys that change", "Walkthroughs that read a portion's kcal may move by a few kcal; first-two-weeks past day 14, and today-plan for the record card. Each named on build."),
  ("Built", "0.2.49, on your Go at 22:27. R21h to R21k are the built app: 650 kcal on the Plate, the tile, Plan and Today. Different from the drawing: the Plate shows its grams to a tenth (20.5 g, not 21), so what you see is what is counted. A recipe already in your plan is recounted when the app opens. Walkthrough small-things, 10 checks; 3 unit tests. Changed as named: dish-parts (a slice reads 1 kcal lower: 284, 175, 301) and recipe-import (one pizza, 2.5 g of the 5 g, not 3).")])
h = rowEnd(cy, B.screen("R21a", 0, y, "Recipes, now", "r21tiles", "now", "The fritters' tile: 20 foods, oil 246 g."),
           B.screen("R21b", 1, y, "Recipes, new", "r21tilesNew", "changed", "One fritter · 650 kcal · 8 g protein · PD 1.2 · makes 12."),
           B.screen("R21c", 2, y, "Plate, one fritter, now", "r21platec", "now", "653 kcal: every food rounded to whole grams."),
           B.screen("R21d", 3, y, "Pick a meal, now", "r21pick", "now", "Plan counts 649 kcal."))
y = h
h = rowEnd(y + 100, B.screen("R21e", 0, y, "Pick a meal, new", "r21pickNew", "changed", "650 kcal, the same everywhere."),
           B.screen("R21f", 1, y, "Today, now", "r21today", "now", "The record repeats the top; Day 19 of 14."),
           B.screen("R21g", 2, y, "Today, new", "r21todayNew", "changed", "The record's line only; THE LAST 14 DAYS."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.49")
h = rowEnd(y + 60, B.screen("R21h", 0, y, "Recipes, built", "b21tiles", "built", "One fritter · 650 kcal · 8 g protein · PD 1.2 · makes 12."),
           B.screen("R21i", 1, y, "Plate, built", "b21platec", "built", "One fritter is 650 kcal."),
           B.screen("R21j", 2, y, "Pick a meal, built", "b21pick", "built", "650 kcal."),
           B.screen("R21k", 3, y, "Today, built", "b21today", "built", "The record's line only."))
y = h
board("Stories20.dc.html", "RS20. R21: four small things", "19 October 2026 (Milan 19:07: small things to finish, get rid of them asap; 22:03: Day 13 of 14 on my phone, where is 19? Work on 1 to 4, prepare how to resolve 5; 22:27: too much choice on the Plate? my concept DaaM, Dessert as a Meal; 22:58: redraw R22, taste as chips). The real 0.2.48 build with your fritters read through the app; now, and the change drawn in. For your OK.", B, W5, y - 100, "Stories19.dc.html")

# ===== RS21: R22, What is it?, with DaaM; taste as chips (Milan 22:27, 22:58) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.49, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R22", "What is it? Savoury, a DaaM, or both; your taste as chips", [
  ("Story", "When I start a plate, one question says what it is: savoury, sweet as the meal (my DaaM, Dessert as a Meal), or both in one meal, like sarma and then a DaaM cheesecake for lunch. The foods offered and Chef Mealan follow it. My taste on Me is a few taps Chef Mealan always reads the same way."),
  ("Now", "The Plate asks Meal or Dessert, and the first drawing added Sweet, savoury or both: five choices for two questions. Dessert is a small treat, about a tenth of the day; a sweet dish eaten as the meal has no place. On Me, Taste is part of the plan is free words only, and nothing Chef Mealan does reads them today."),
  ("1. What is it? (23:10)", "In place of Meal or Dessert: Savoury · Sweet, a DaaM · Both. Each is a full meal, sized for the meal and held at your PD. Dessert goes: a small thing, sweet or not, is a Snack, picked in What is it for. Picked, the line says it. Savoury holds sweet foods back, Sweet, a DaaM holds savoury ones back, on a plate of your own too. Nothing picked: everything is offered. A recipe presets it from its foods; a plate of your own is never guessed."),
  ("Both", "One meal with a savoury main and a sweet finish: sarma, then a DaaM cheesecake. Nothing is held back. On the Plate they are two parts, Main and Sweet finish, as a recipe's parts are now; they share the meal's kcal and reach your PD together. Chef Mealan's ideas give both."),
  ("DaaM", "Sweet, a DaaM: a dessert that is the meal. Chef Mealan leans on quark, skyr, whey and eggs so it reaches your PD, as your crêpes and the quark pudding do. The craving search reads sweet and DaaM in your words and sets it."),
  ("2. Taste on Me (22:58)", "Chips first: I like (Creamy, Crunchy, Chocolate, Fruity, Spicy, Fresh herbs), Rather not (Sour, Very sweet, Spicy, Bitter, Fishy), How I eat (Small portions, Big plates more volume, Quick to make). Each chip is one fixed meaning, read the same way every time. In your own words stays, shorter, for what no chip says; read as extra, never over a chip, your allergies or your numbers. Your words today are kept."),
  ("Where it goes", "Chef Mealan reads the chips and your words with every idea (Make it a meal, the craving search), every answer about a plate and every set of steps, as he reads your kitchens now."),
  ("My opinion", "Both, not Mix: the Plate's line already says A mix for a plate of your own foods, so Mix would mean two things. Allergies stay under the health questions: Fishy is taste, not safety. Spicy is liked or rather not, never both."),
  ("Journeys that change", "The walkthroughs that pick Dessert on the Plate (a small sweet plate becomes a Snack); named on build."),
  ("Built", "0.2.50, on your Build at 23:15, with Vanilla next to Chocolate. R22g to R22j are the built app. No walkthrough picked Dessert, so no journey changed. Added beyond the drawing: a tap on the one picked clears it; Both sorts what is already on the plate into Main and Sweet finish when you pick it, basics like milk and eggs into Main (move them if they belong to the sweet finish); Small portions and Big plates never both. Chef Mealan gets only the fixed chips, checked on the server, and your words as their own field. Walkthrough plate-what-is-it, 16 checks; 4 unit tests.")])
h = rowEnd(cy, B.screen("R22a", 0, y, "Plate, its section, now", "r22bNowc", "now", "Meal or Dessert; no taste, no DaaM."),
           B.screen("R22b", 1, y, "The same, new", "r22bNewc", "changed", "What is it?: Savoury · Sweet, a DaaM · Both."),
           B.screen("R22c", 2, y, "Sweet, a DaaM picked", "r22bDaamc", "changed", "A full dinner that tastes like dessert, at your PD."),
           B.screen("R22d", 3, y, "Both, for lunch", "r22bBothc", "changed", "Sarma, then a DaaM cheesecake; one lunch."))
y = h
h = rowEnd(y + 100, B.screen("R22e", 0, y, "Me, now", "r22bMe", "now", "Free words only; read by nothing Chef Mealan does."),
           B.screen("R22f", 1, y, "Me, new", "r22bMeNew", "changed", "I like · Rather not · How I eat, then your own words."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.50")
h = rowEnd(y + 60, B.screen("R22g", 0, y, "Plate, built", "b22ac", "built", "What is it?: Savoury · Sweet, a DaaM · Both."),
           B.screen("R22h", 1, y, "Sweet, a DaaM, built", "b22bc", "built", "The line and the hint."),
           B.screen("R22i", 2, y, "Both at lunch, built", "b22cc", "built", "Chicken in Main, ice cream in Sweet finish."),
           B.screen("R22j", 3, y, "Me, built", "b22d", "built", "The chips, with Vanilla."))
y = h
board("Stories21.dc.html", "RS21. R22: What is it? Savoury, a DaaM, or both; your taste as chips", "19 October 2026 (Milan 22:03: prepare how to resolve 5; 22:27: Meal, Dessert, then sweet, savoury, both: too much? my concept DaaM, Dessert as a Meal; 22:58: redraw R22; chips for the taste on Me, so the input does not vary and is not misread; 23:10: Both in place of Small dessert, a Snack is the small thing; lunch can be sarma and then a DaaM cheesecake). The real 0.2.49 build; now, and the change drawn in. For your OK.", B, W5, y - 100, "Stories20.dc.html")

# ===== RS22: R23, the home page as five jobs, a clip each (Milan 23:42 to 23:50) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.50, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R23", "The home page: what Chef Mealan does for you, a short clip each", [
  ("Story", "A visitor or a recruiter sees in a minute what Chef Mealan does: five moments of the day, each with a short clip from the real app, then all five in one video."),
  ("Now", "How it works plays a video from 12 October: the old Today and a breakfast fitted on the Plate. The pictures under it are from 6 October. Your week tells one feature. Nothing shows the craving search, a recipe read from a link, DaaM, Plan filling a day or How did it carry you."),
  ("New (00:06, B)", "What Chef Mealan does for you, in place of How it works and Your week. Five moments, each with when, a plain title, one line and a clip of about 12 seconds: Every day, Eat by your plan today. Sunday evening, Plan your week in minutes. When a craving hits, Make what you crave fit. When you find a recipe, Bring it in. After a meal, Learn what works for you. On top, all five joined, 60 seconds; the same video on /built, next to the release story. No word Jobs anywhere: it is our working word, not a visitor's."),
  ("The clips", "Recorded from the real app with test data, never yours, by the same scripts that make the canvas screens. Muted, a caption on each step, playing when it scrolls into view, a still frame until then. Recorded again when a release changes a job's screens. RS23 has each clip, step by step, with its captions."),
  ("Shown, kept inside (23:48)", "Shown: the five moments, the real screens, the numbers agreeing. Kept for customers: the coach side, the members' recipes, and the rules Chef Mealan follows."),
  ("Stays", "The top with the calculator, With your coach, Who's behind, How the numbers work, For adults, Try Chef Mealan. No investors anywhere; nothing personal."),
  ("My opinion", "Moments, not features: anyone sees themselves in When a craving hits, and a product person still reads the thinking behind it. Five is enough; the coach side gets its own clip when coaches are invited."),
  ("Built", "0.2.51, on your OK at 00:16. R23c and R23d are the built site. The clips are recorded from the real app on test data (RS23), each 11 to 16 seconds; all five joined run about a minute (67 s), so the label says about a minute. MP4 for Safari and WebM for browsers without H.264, about 5 MB for all of them; each loads only when it scrolls into view. The 12 October video and the Training week drawing go.")])
h = rowEnd(cy, B.screen("R23a", 0, y, "Home page, now", "homeNowc", "now", "How it works with the 12 October video; Your week."),
           B.screen("R23b", 1, y, "Home page, new", "homeNewc", "changed", "What Chef Mealan does for you: five moments, a clip each; all five on top."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.51")
h = rowEnd(y + 60, B.screen("R23c", 0, y, "Home page, built", "homeBuiltc", "built", "The five moments with their clips, playing in view."),
           B.screen("R23d", 1, y, "/built, See it work", "builtBuiltc", "built", "The same minute, after the facts."))
y = h
board("Stories22.dc.html", "RS22. R23: the home page, what Chef Mealan does for you", "19 October 2026 (Milan 23:42: update the home page with video of the new features, for visitors and recruiters; 23:48: a short list of jobs, a video per job; show everything or keep some for customers? 23:50: Draw; 00:06: not Jobs, B: the moment it helps). The real 0.2.50 site, signed out; now, and the change drawn in. For your OK.", B, W5, y - 100, "Stories21.dc.html")

# ===== RS23: the five clips, step by step, with their captions =====
B = Board(); y = 30
CLIPS = [
  ("J1", "Every day: Eat by your plan today", [("j1a", "Lunch is next, by your plan."), ("j1b", "One tap: eaten, as planned."), ("j1c", "The day, against the plan.")]),
  ("J2", "Sunday evening: Plan your week in minutes", [("j2a", "Your day, slot by slot."), ("j2b", "Chef Mealan fills the open slots."), ("j2c", "Pick another: Light for you shows what suits you.")]),
  ("J3", "When a craving hits: Make what you crave fit", [("j3a", "Crave chocolate? Ask for PD 7+."), ("j3b", "The pudding fits your target."), ("j3c", "Sweet, a DaaM: dessert as the meal.")]),
  ("J4", "When you find a recipe: Bring it in", [("j4a", "Paste a link."), ("j4b", "One fritter: 650 kcal, worked out."), ("j4c", "Saved in your recipes, one portion on the tile.")]),
  ("J5", "After a meal: Learn what works for you", [("j5a", "30 minutes later: how did it carry you?"), ("j5b", "One tap."), ("j5c", "Two answers agree: Light for you.")]),
]
for jid, title, frames in CLIPS:
    cy = storyCard(B, y, jid, title, [("Clip", "About 12 seconds, muted. Three steps, each held about 4 seconds, its caption on the clip."), ("Captions", " · ".join(c for _, c in frames))])
    h = rowEnd(cy, *[B.screen(f"{jid}{'abc'[k]}", k, y, f"Step {k + 1}", n, "changed", c) for k, (n, c) in enumerate(frames)])
    y = h - 60
board("Stories23.dc.html", "RS23. The five clips, step by step", "19 October 2026. Frames from the real 0.2.50 app with test data. Each clip plays its three steps with the caption shown; all five joined make the 60 second video. For your OK before recording.", B, W5, y - 40, "Stories22.dc.html")

# ===== RS24: R24, Today: a meal whose time has passed asks; the day stays in sight (Milan 00:06) =====
B = Board(); y = 30
cy = storyCard(B, y, "R24", "Today: a missed meal asks, and you always know which day you are in", [
  ("Story", "When a planned meal's time has passed and it is not logged, Today asks me right there, and I answer in one tap. While I scroll, I always see whether I am in today, tomorrow or the past."),
  ("Now", "At 13:00 breakfast, 07:30, is planned and not logged. Its row has no button; I ate it is only on the meal's page, after R19, one tap away and easy to miss. The day's name is a small blue line inside each plan card (Today: Monday, October 19), lost while scrolling; tomorrow's card sits under Today's meals, and the last few days under tomorrow."),
  ("1. The missed meal", "Under the row, the card's full width: 07:30 has passed. Did you have it? ✓ I ate it (logs it as planned), Change it (opens the Plate for it), Skipped it (closes it on purpose, as the swipe does). The row still opens the meal. Only a meal whose time has passed; the next meal keeps its card on top."),
  ("2. Day bands", "Today, Tomorrow and Earlier: a dark band with the day and the date, staying on top while you scroll through that day; the next band takes over. The small blue lines inside the cards go. Order: Today (your goal, the next meal, the plan, the meals, Getting to know you), Tomorrow (its plan), Earlier (the last few days)."),
  ("New pieces", "The day band is new: the navy of the app's titles as its background, white text the size of a card title. The question uses the next meal's two buttons and a third, Skipped it."),
  ("My opinion", "Skipped it belongs on the question: a missed meal is either eaten or not, and both answers close the day honestly. The bands fix more than the colour: the order was the real confusion."),
  ("Journeys that change", "Walkthroughs that read the plan-day line or the order of Today's sections: today-tomorrow, today-plan; named on build."),
  ("Built", "0.2.51, on your OK at 00:16. R24d and R24e are the built app. A starter (no foods) asks with Make it on the Plate and Skipped it, as the next meal's card does. Fixed in the same release: a recipe put on the Plate presets What is it? from its foods, a one-portion recipe too. Walkthrough today-day-bands, 11 checks. Changed as named: today-tomorrow (the day is read from its band); today-plan passed unchanged."),
  ("00:58, blue not black", "Milan: blue for the Today and Tomorrow blocks, not a new black. A: the band in the app's blue, the blue of the main buttons, white text (R24f, R24g). B: a light blue band, blue text, a blue line on its left (R24h, R24i). My pick: A. B is the same tint as the goal card right under it, so the band and the card run together, and a soft band is what got lost while scrolling before."),
  ("01:03, built 0.2.52", "Milan 01:02: the band sticking to the top looks weird. Built: A, the app's blue, in the page; it scrolls with it and no longer sticks (R24j, R24k). today-day-bands changed as named: it checks the blue and that the band does not stick.")])
h = rowEnd(cy, B.screen("R24a", 0, y, "Today at 13:00, now", "r24now", "now", "Breakfast passed, no button; the day as a small blue line."),
           B.screen("R24b", 1, y, "Today at 13:00, new", "r24new", "changed", "Today, Tomorrow, Earlier bands; Did you have it? under breakfast."),
           B.screen("R24c", 2, y, "Scrolled into tomorrow", "r24scrollc", "changed", "The Tomorrow band stays on top."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.51")
h = rowEnd(y + 60, B.screen("R24d", 0, y, "Today at 13:00, built", "b24a", "built", "The bands; Did you have it? under breakfast."),
           B.screen("R24e", 1, y, "Scrolled, built", "b24bc", "built", "The Tomorrow band on top."))
y = h
h = rowEnd(y + 100, B.screen("R24f", 0, y, "A: app blue", "r24A", "changed", "The band in the main buttons' blue, white text."),
           B.screen("R24g", 1, y, "A, scrolled", "r24Asc", "changed", "Tomorrow on top, in blue."),
           B.screen("R24h", 2, y, "B: light blue", "r24B", "changed", "Tinted, blue text, a blue line on the left."),
           B.screen("R24i", 3, y, "B, scrolled", "r24Bsc", "changed", "Softer; the same tint as the goal card."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.52")
h = rowEnd(y + 60, B.screen("R24j", 0, y, "Today, built in blue", "b24c", "built", "A, in the page."),
           B.screen("R24k", 1, y, "Scrolled, built", "b24dc", "built", "The band scrolls with the page."))
y = h
board("Stories24.dc.html", "RS24. R24: Today, a missed meal asks; the day stays in sight", "20 October 2026 (Milan 00:06: cards without a button to resolve them, I ate it is now on the meal's page; the blue Today and Tomorrow titles are almost invisible while scrolling). The real 0.2.50 build; now, and the change drawn in. For your OK.", B, W5, y - 100, "Stories23.dc.html")

# ===== RS25: R25, a whole recipe is never one meal by accident (Milan 19:07 9,098 kcal day; 01:19 Go to draw) =====
CHIP["now"] = ("#5b6b8a", "#fff", "0.2.52, as it is")
B = Board(); y = 30
cy = storyCard(B, y, "R25", "A whole recipe is never logged as one meal by accident", [
  ("Story", "When I make a recipe that makes several and log what I ate, Chef Mealan asks how many I ate, starting on one. A meal far bigger than a meal is checked once before it counts."),
  ("Now", "A recipe starts on the Plate as The whole recipe (R15): all 12 fritters, 7,794 kcal, right for making it. On How did making it go?, How much did you eat? starts on All of it, so one tap on On to How was it? logs all 12 as one meal. That is most likely how a day of yours reached 9,098 kcal."),
  ("1. How many did you eat?", "When the plate is a whole recipe that makes several, the question counts: You made 12 fritters. How many did you eat? − 1 + fritter, with the kcal and PD, starting on 1. Under it: 11 left: to eat them on other days, put the recipe on Plan (R16: the rest is said, not followed). Then All 12, Later today, Not after all, as now."),
  ("2. A big meal is checked once", "A meal over 2,000 kcal, or over your whole day, asks once before it is logged, from any plate: 7,794 kcal in one meal? That is more than your whole day, 2,800 kcal. Yes, all 12 logs it; How many I ate goes back to the count. Nothing is blocked."),
  ("Stays", "The Plate starting on The whole recipe for making it; a plate of your own; Later today and Not after all; everything after How was it?."),
  ("My opinion", "Count, don't guess: one is what most people eat from a batch, so it is the start, and All 12 is one tap away. 2,000 kcal is my line for the check: no planned meal of yours comes near it, and a feast day still goes through with one tap."),
  ("Journeys that change", "Walkthroughs that make a whole recipe and log All of it (whole-in-portions, batch-linked and others); each named on build."),
  ("Built", "0.2.53, on your Build at 01:30. R25e and R25f are the built app. No walkthrough logged a whole recipe as All of it, so no journey changed. Found on the way: the card for 2 of 12 first stored a portion a hair above its grams, so the app could not read the record back after a reload; recipe-centre caught it. Now the portion is the sum of the very grams kept, and whole-recipe-count reloads to check. A plate of your own over 2,000 kcal asks too, with Change the amounts; the walkthrough checks the recipe case only. Walkthrough whole-recipe-count, 12 checks.")])
h = rowEnd(cy, B.screen("R25a", 0, y, "Plate, the whole recipe", "r25platec", "now", "Starts as all 12 fritters."),
           B.screen("R25b", 1, y, "How did making it go?, now", "r25now", "now", "All of it logs all 12."),
           B.screen("R25c", 2, y, "The same, new", "r25new", "changed", "How many did you eat? − 1 +, starting on one."),
           B.screen("R25d", 3, y, "The check, new", "r25check", "changed", "7,794 kcal in one meal? asked once."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.53")
h = rowEnd(y + 60, B.screen("R25e", 0, y, "The count, built", "b25a", "built", "Starts on 1 fritter, 650 kcal."),
           B.screen("R25f", 1, y, "All 12, built", "b25b", "built", "7,794 kcal in one meal? asked once."))
y = h
board("Stories25.dc.html", "RS25. R25: a whole recipe is never one meal by accident", "20 October 2026 (Milan 19:07 and 22:27: a day with 6 meals, 9,098 kcal, the fritters; 01:19: Go, draw it). The real 0.2.52 build with the fritters read through the app; now, and the change drawn in. For your OK.", B, W5, y - 100, "Stories24.dc.html")

# ===== RS26: R24 again, the day as a header, not a button (Milan 01:23) =====
B = Board(); y = 30
cy = storyCard(B, y, "R24", "The day as a header, not a button", [
  ("Story", "On Today I see where today, tomorrow and the past begin, and nothing that names a day looks like something to tap."),
  ("Now", "0.2.52: the Today, Tomorrow and Earlier bands are blue blocks with white text, round corners and a shadow: the same as the wide blue buttons, Make your dinner and Plan tomorrow (Milan 01:23). The band reads as a button, and the button as a title."),
  ("New", "No band. A header: the day big in the page's dark text, the date in grey on the right, a blue line under it across the page. No fill, no round corners, no shadow. It stays in the page and scrolls with it. Only buttons are blue blocks. This is also the blue line you named at 00:58."),
  ("Stays", "Where the three are and what is under each: Today, Tomorrow, Earlier."),
  ("Journeys that change", "today-day-bands: it checks the line and that the header is not a filled block."),
  ("Built", "0.2.53, on your Build at 01:30. R24n and R24o are the built app. today-day-bands changed as named. The home page and /built clips were recorded again with this Today (Milan 01:34): an orange tap mark that shows before the tap and holds, a pause before each screen changes, slower typing; all five now run a minute and a half, and the pages say so.")])
h = rowEnd(cy, B.screen("R24l", 0, y, "Today, 0.2.52", "r24now2", "now", "The band and the wide button: the same blue block."),
           B.screen("R24m", 1, y, "Today, new", "r24line", "changed", "A header: the day, the date in grey, a blue line under."))
y = h
CHIP["built"] = ("#1d7a46", "#fff", "Built in 0.2.53")
h = rowEnd(y + 60, B.screen("R24n", 0, y, "Today, built", "b26a", "built", "The header with its blue line."),
           B.screen("R24o", 1, y, "Scrolled, built", "b26bc", "built", "Tomorrow's header in the page."))
y = h
board("Stories26.dc.html", "RS26. R24 again: the day as a header, not a button", "20 October 2026 (Milan 01:23: Today, the bands for the day look the same as the Plan tomorrow button). The real 0.2.52 build; now, and the change drawn in. For your OK.", B, W5, y - 100, "Stories25.dc.html")
