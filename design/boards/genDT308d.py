# DT308, the three frames the meal model still missed (from shotDT308m.cjs; Coach Milan 17 November 22:33 and 23:41). Template from DT309.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"same": ("#8a97b0", "#fff", "No change"), "now": ("#5b6b8a", "#fff", "Your phone"), "draft": ("#53627f", "#fff", "As it is today"), "changed": ("#2a72d9", "#fff", "New, drawn for your approval")}
MARK = ""

def ih(name): w, h = Image.open(f"{R}/{name}.png").size; return int(h * SW / w)
def img(name, border):
    im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((SW * 2, int(im.size[1] * SW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=74)
    return f'<img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{SW}px;border-radius:10px;border:1.5px solid {border};display:block">'

class Board:
    def __init__(s): s.html = []
    def x(s, col): return SX + col * (SW + GAP)
    def screen(s, nid, col, y, title, name, status, what):
        bg, fg, label = CHIP[status]
        s.html.append(f'<div style="position:absolute;left:{s.x(col)}px;top:{y}px;width:{SW}px">'
          f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
          f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span></div>'
          f'<div style="height:{DH}px;margin-top:8px;font-size:12.5px;line-height:1.42;color:#172742;overflow:hidden">{what}</div>'
          f'<div style="margin-top:8px">{img(name, "#2a72d9" if status == "changed" else "#d1dcf0")}</div></div>')
        return y + TOP + ih(name)
    # a computer screen across the three columns
    def wide(s, nid, y, title, name, status, what):
        bg, fg, label = CHIP[status]; WW = 3 * SW + 2 * GAP
        im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((WW * 2, int(im.size[1] * WW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=74)
        h = int(im.size[1] / 2)
        s.html.append(f'<div style="position:absolute;left:{s.x(0)}px;top:{y}px;width:{WW}px">'
          f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
          f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span> <span style="font-size:12.5px;color:#172742;margin-left:8px">{what}</span></div>'
          f'<div style="margin-top:8px"><img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{WW}px;border-radius:10px;border:1.5px solid {"#2a72d9" if status == "changed" else "#d1dcf0"};display:block"></div></div>')
        return y + TT + 8 + CH + 8 + h
    def render(s, W, H): return f'<div style="position:relative;width:{W}px;height:{H}px">{"".join(s.html)}</div>'

def storyCard(B, y, rid, title, parts, w=350):
    body = "".join((f'<div style="margin-top:16px;padding-top:10px;border-top:2px solid #172742;font-size:15.5px;font-weight:900;color:#123a7a">{h}</div>' if t == "" else f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>') for h, t in parts)
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
                  f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">{rid}</span>{title}</div>{body}</div>')
    return y + 70 + sum(30 + math.ceil(len(re.sub("<[^>]+>|&amp;", "x", t)) / 40) * 21 for _, t in parts)
def rowEnd(*hs): return max(hs) + 140

LEGEND = ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("draft", "same", "changed"))
  + '<span style="color:#172742">Left: the story, one item per row. Right: the app as it is, then the same page with the change drawn in, blue outline and yellow note. Drawn in English; every release ships in Srpski and German too.</span></div>')

def board(fname, title, sub, B, W, Hc, after):
    H = min(8000, Hc + 230)
    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&amp;display=swap">
<style>
body{{margin:0}}
a{{color:#1f5fc7}}a:hover{{color:#2e7be8}}
</style>
</helmet>
<div style="width: {W}px; height: {H}px; box-sizing: border-box; padding: 14px 18px; background: #fff; color: #172742; font-family: 'Nunito', ui-sans-serif, system-ui, sans-serif; font-size: 15px; display: flex; flex-direction: column; gap: 16px; overflow: hidden">
<b style="font-size: 22px; font-weight: 900">{title}</b>
<span style="font-size: 14px; color: #3d4a63; font-weight: 600; line-height: 1.45">{sub}</span>
{LEGEND}
{B.render(W, Hc)}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{W},"height":{H}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{}};
  }}
}}
</script>
</body>
</html>
'''
    open(f"{D}/{fname}", "w").write(page)
    if not os.path.exists(f"{D}/canvas.json"): print(fname, W, H, Hc, len(page) // 1024, "KB"); return
    cj = json.load(open(f"{D}/canvas.json"))
    if fname not in cj["order"]: cj["order"].append(fname)
    a = cj["boards"][after]
    cj["boards"][fname] = {"x": 0, "y": a["y"] + a["h"] + 120, "w": W, "h": H, "title": title, "page": a["page"]}
    json.dump(cj, open(f"{D}/canvas.json", "w")); print(fname, W, H, Hc, len(page) // 1024, "KB")
    cj = json.load(open(f"{D}/canvas.json"))




def start(cols):
    global W, B, y
    W = SX + cols * (SW + GAP) - GAP + 70; B = Board(); y = 30
def row(rid, title, parts, shots, nid=None, at=0, arrows=True):
    global y
    c = storyCard(B, y, (nid or rid), title, parts)
    hs = [B.screen(f"{nid or rid}{chr(97 + at + i)}", i, y, t, n, st, wd) for i, (t, n, st, wd) in enumerate(shots)]
    if arrows:
        for i in range(1, len(shots)): B.html.append(f'<div style="position:absolute;left:{B.x(i) - GAP}px;top:{y + TOP + 220}px;width:{GAP}px;text-align:center;font-size:44px;font-weight:900;color:#2a72d9">→</div>')
    y = rowEnd(c, *hs)



start(4)
row("cal", "The calendar behind the pencil, with What is it? and the moment under the meals", [
  ("Why", "DT308.1 draws only the calendar. Behind the pencil today there are two more questions: What is it? (Savoury, Sweet a DaaM, Both) and Chef Mealan's What kind of moment? (Regular meal, Before training, Travel and the others). They were not on the board, and they may not go without your word."),
  ("Proposed", "They stay behind the pencil, under the calendar's meals, as they are today: the same words, chips and lines."),
  ("The taps", "A tap on a meal sets the meal and the day and closes the calendar, as in DT308.1. A tap on one of these chips sets it and keeps the calendar open. The pencil closes the calendar with no meal set."),
  ("Once set", "The line says the meal, then the day, date and time, and under it the moment when it is not a regular meal. X clears the meal and the day; the moment goes back to Regular meal."),
  ("With no meal", "A moment or a taste chosen with no meal set holds for the plate just the same."),
], [("The Plate with foods", "m_1", "changed", "Where you are: the Plate, no meal set."), ("The calendar, open", "m_2", "changed", "Tap: the pencil."), ("A moment chosen", "m_3", "changed", "Tap: Before training."), ("The meal is set", "m_4", "changed", "Tap: Dinner.")], nid="DT308.9")
row("fit", "Fit to my target with no meal set", [
  ("Why", "Today Fit lands a plate in its meal: the meal's energy and your PD target. With no meal set there is no meal size to aim at."),
  ("Proposed", "With no meal set, Fit aims only at your PD target. It moves the amounts of your own foods, as always. The energy is whatever the foods then give."),
  ("The result", "It says This plate where a meal's name stands today."),
  ("Chef Mealan's line", "New, after the tap: No meal is set, so Fit aimed at your PD target only: 4.8 or more. The energy is what your foods give. It stands first in his card. Under it, as today, what Fit did, with Undo."),
  ("Drawn on", "Just looking in 0.3.156, which already works this way. The meal line, the words This plate and Chef Mealan's new line are drawn in."),
], [("The Plate, under the target", "f_1", "changed", "Where you are: the Plate, no meal set."), ("After Fit", "f_2", "changed", "Tap: Fit to my target.")], nid="DT308.10")
board("Stories241.dc.html", "DT308: the calendar behind the pencil, and Fit with no meal set (DT308.9, DT308.10)",
  "17 and 18 November 2026 (Coach Milan 22:33, 23:41, 00:07). Drawn on the app as built in 0.3.156. Drawn for approval; no Go.",
  B, W, y - 100, "Stories240.dc.html")

start(4)
row("plan", "Plan it on a plate without a photo", [
  ("Why", "DT308.6 ends with Did you eat it? after Plan it. That cannot be meant: a planned plate is not eaten yet. And a plate without a photo has no read, so it had no place for the question at all."),
  ("Proposed", "A plate without a photo ends with the same question as a read: What do you do with it? Save it, Plan it, Ate it. The three are choices, so all three are white (DT310)."),
  ("Plan it", "The calendar opens under the button, on tomorrow, with nothing marked. A tap on a meal plans the plate at once. You land on Plan, on that day, with the message of today. Nothing is counted. No Did you eat it?. The Plate is empty again."),
  ("Decided", "<b>Put it in Monday's lunch falls away</b> (Coach Milan, 18 November 00:22). To fit a plate to a meal's size, set the meal first with the pencil; Fit to my target then aims at that meal."),
  ("New", "Plan opens on the day you planned for. Today it opens on today."),
  ("The same for a photo", "Plan it at the end of a read (DT308.6) ends the same way: on Plan, with no Did you eat it?."),
], [("The Plate with foods", "p_1", "changed", "Where you are: the Plate, no meal set."), ("The calendar under the button", "p_2", "changed", "Tap: Plan it."), ("Plan, Monday", "p_3", "changed", "Tap: Lunch.")], nid="DT308.11")
row("held", "A meal that already holds something", [
  ("Today", "A plate put into a meal that holds one takes its place without a word."),
  ("Proposed", "A meal can hold more than one plate. The calendar's row says what the meal holds. A tap on it opens one question right under the row, with three answers."),
  ("Add as another dish", "The meal then holds both, the one that was there and the plate. You land on Plan, on that day. It is the main button, because it loses nothing."),
  ("Replace it", "The plate takes the meal's place. The meal that was there leaves the plan and stays in My recipes."),
  ("Cancel", "The question closes and nothing changes. The calendar stays open, so you can tap another meal or another day."),
  ("The same for Ate it", "A meal already eaten asks the same way, with the same three answers."),
], [("The Plate with foods", "p_1", "changed", "Where you are: the Plate, no meal set."), ("The calendar, a meal is taken", "p_5", "changed", "Tap: Plan it."), ("The question, in place", "p_6", "changed", "Tap: Lunch."), ("Plan, Monday: two dishes", "p_7", "changed", "Tap: Add as another dish.")], nid="DT308.11", at=3)
row("ate", "Ate it on a plate without a photo, to the end", [
  ("The steps", "Ate it opens the calendar under the button, on today, with the guess from the clock marked and its reason. A tap on the meal logs the plate at once. You land on Today with the meal eaten."),
  ("The line, and Undo", "New on Today: the message says what was logged and where (Logged: Skyr, Oats &amp; Banana is today's dinner, 563 kcal). The meal's card has Undo, as a meal logged on Today has. Undo takes the meal out of Today and puts the plate back on the Plate, with no meal set."),
  ("No amount asked", "A read asks Did you eat it? All of it, Half, Part of it, because the amounts are a guess from a photo. On a plate you built, the amounts are yours, so nothing more is asked."),
], [("The Plate with foods", "a_1", "changed", "Where you are: the Plate, no meal set."), ("The calendar under the button", "a_2", "changed", "Tap: Ate it."), ("Today", "a_3", "changed", "Tap: Dinner.")], nid="DT308.11", at=7)
row("save", "Save it on a plate without a photo", [
  ("Where it goes", "Into My recipes, as a recipe with its foods and amounts. It is what Save in My recipes does on a read today."),
  ("Its name", "With foods on the plate the top does not say Meal title any more: it shows the foods' name in grey. If you typed no name, the recipe takes that name, here Skyr, Oats &amp; Banana, and the line under the button says so. A name you type on top renames it."),
  ("The plate stays", "Nothing is counted and no meal is set. The button turns into Saved in My recipes with a tick and cannot be tapped again. Plan it and Ate it are still there."),
  ("Not Saved for later", "Saved for later, the list of parked plates on the empty Plate, is a different thing and stays as it is."),
], [("The Plate with foods", "s_1", "changed", "Where you are: the Plate, no meal set."), ("Saved, the plate stays", "s_2", "changed", "Tap: Save it."), ("Recipes", "s_3", "changed", "Tap: Recipes.")], nid="DT308.11", at=10)
board("Stories242.dc.html", "DT308.11: a plate without a photo. Plan it, a meal that holds something, Ate it, Save it",
  "18 November 2026 (Coach Milan 00:07 and 00:22). The end of a plate without a photo: What do you do with it? Drawn on the app as built in 0.3.156. Drawn for approval; no Go.",
  B, W, y - 100, "Stories241.dc.html")

start(7)
row("prep", "Prepare it with no meal set: cook first, the meal is asked when you say you ate it", [
  ("The steps", "On the Plate with foods you tap Prepare it. Prep, Make and Eat are as in 0.3.156: you pick how to eat it, cook and tick the steps, then say how much you ate and how it tasted."),
  ("Where the meal is asked", "On Eat, when you tap Save. No meal is set, so the same calendar opens right under Save, on today, with the guess from the clock marked and its reason. One tap on the meal."),
  ("Why there", "Until then nothing depends on the meal: you are cooking. Save is the moment the app writes into your day, so it is the moment it needs the meal."),
  ("With a meal set", "If you set the meal with the pencil before Prepare it, nothing is asked on Eat. Save logs to that meal, as today."),
  ("What is logged", "The meal on Today, for the meal and day you tapped, eaten at the time you saved, with the amount you said (All of it) and its numbers. Your taste and your note. The cook on the recipe: Your cooks and Every time you ate it."),
  ("The end", "The recipe's page, as in 0.3.156. The Plate is empty again."),
  ("Prep, frames o and p", "The fixed set of ways (All in one, Topped, Protein first) was a quick solution to get through the process (Coach Milan, 18 November 10:05). Prep is to be rebuilt to fit today's app, as its own card, DT312. It is not part of 0.3.157, and the meal question at Save does not depend on it."),
], [("The Plate with foods", "r_1", "changed", "Where you are: the Plate, no meal set."), ("Prep", "r_2", "same", "Tap: Prepare it."), ("Prep, a way picked", "r_3", "same", "Tap: Protein first."), ("Make", "r_4", "same", "Tap: Make it this way."), ("Eat", "r_5", "same", "Tap: Cooked. Next: Eat. Then All of it and Good, as today."), ("Eat, the calendar", "r_6", "changed", "Tap: Save."), ("The recipe", "r_7", "same", "Tap: Dinner.")], nid="DT308.11", at=13)
board("Stories243.dc.html", "DT308.11: Prepare it with no meal set",
  "18 November 2026 (Coach Milan 00:22). You tap Prepare it on the landing, cook, and reach the end. Drawn on the app as built in 0.3.156. Drawn for approval; no Go.",
  B, W, y - 100, "Stories242.dc.html")

start(7)
row("now", "Something is on the plate: a photo taken now", [
  ("What exists", "Since 0.3.152 the photo screen warns that your plate is not empty, and after the read one screen asks: Add to my plate, or Start a new plate. Both stay."),
  ("Where it is asked", "After the read or the scan, as today. Only then the app can say what would join."),
  ("One question, one look", "The same screen for a photo taken now, an older photo and a recipe: what is on your plate, what comes, Add to my plate, Start a new plate."),
  ("Add to my plate", "New: you land on the Plate with foods, the one landing, not on a read. The foods join, marked ~. The meal line stays as it was."),
  ("Start a new plate", "New: the last line of the question says where the old plate goes. See DT308.12m to o."),
  ("A way back", "New (Coach Milan, 18 November 10:05): the question is also information, so you can step away from it. Back on the top left returns to the photo screen with nothing changed. Remove the photo stays the way to drop the photo."),
], [("The Plate with foods", "x_a", "changed", "Where you are: the Plate, no meal set."), ("Add more, open", "x_b", "changed", "Tap: + Add more to your plate."), ("The camera", "x_c", "same", "Tap: Photo or scan. The camera opens on Meal, as in 0.3.155."), ("One photo taken", "x_d", "same", "Tap: the shutter."), ("The photo screen", "x_e", "changed", "Tap: Use this photo."), ("The question", "x_f", "changed", "Tap: Read the plate."), ("The Plate with foods", "x_g", "changed", "Tap: Add to my plate.")], nid="DT308.12")
row("old", "An older photo, on a plate whose meal is set", [
  ("The fault", "In 0.3.152, after Add to my plate with an older photo, the whole plate is treated as from the photo's time, and the app asks Did you eat it? for yesterday."),
  ("Solved by the meal model", "No meal is guessed from a photo. The plate keeps its own meal line: the one you set, or not set. The photo's day and time are used only if you later say Ate it on a plate with no meal set, as the marked guess in the calendar."),
], [("Add more, open", "x_h", "changed", "Where you are: the Plate, the meal is set. + Add more to your plate is open."), ("The camera", "x_i", "same", "Tap: Photo or scan."), ("The photo screen", "x_j", "changed", "Tap: Your photos, and you pick a photo from Saturday."), ("The question", "x_k", "changed", "Tap: Read the plate."), ("The Plate with foods", "x_l", "changed", "Tap: Add to my plate.")], nid="DT308.12", at=7)
row("new", "Start a new plate: the old plate is saved in My recipes. One line near the top says so", [
  ("Today", "Start a new plate keeps only the new foods. The plate that was there is gone, not kept anywhere."),
  ("One place", "The old plate goes to one place: My recipes. It is saved there before the new plate starts. With no name typed it takes the foods' name."),
  ("Before the tap", "The question's last line says it: Skyr, Oats &amp; Banana is saved in My recipes, so nothing is lost."),
  ("After the tap, one line", "Near the top of the new plate, under the meal line, in the warning's colour. It holds everything about the old plate: where it is, the link Open it in My recipes, Undo, and an X. It stays until you close it."),
  ("Undo", "It takes the tap back: your old plate is on the Plate again, as if you had not tapped. So no second question is needed before the tap."),
  ("Saved for later", "Not used here. It stays what it is in 0.3.156, the list of parked plates on the empty Plate, and gets no new place."),
  ("The new plate", "It holds only what came, and starts with no meal set. For a photo you are on its read, which ends with What do you do with it? (DT308.4)."),
], [("The question", "x_m", "changed", "Where you are: the question after the read."), ("The new plate, with the line", "x_n", "changed", "Tap: Start a new plate."), ("The old plate in My recipes", "x_o", "same", "Tap: Open it in My recipes.")], nid="DT308.12", at=12)
board("Stories244.dc.html", "DT308.12 (1 of 2): something is on the plate, and a photo comes. Add to my plate, Start a new plate",
  "18 November 2026 (Coach Milan 00:16 and 00:22). On the landing of 0.3.155: a photo taken now, an older photo, and what Start a new plate does with the old plate. Drawn on the app as built in 0.3.156. Drawn for approval; no Go.",
  B, W, y - 100, "Stories243.dc.html")

start(5)
row("code", "A barcode or a label", [
  ("As today", "A barcode or a label brings one food. It joins the plate, and the message says what was added. The meal line does not change."),
  ("No question", "The question is for a whole meal that arrives, a photo or a recipe. For one food it would only be in the way: you opened the camera from + Add more to your plate."),
  ("A label", "The same: after the label check, the food joins the plate."),
], [("Add more, open", "x_b", "changed", "Where you are: the Plate, no meal set. + Add more to your plate is open."), ("The camera", "x_q", "same", "Tap: Photo or scan."), ("Barcode", "x_r", "same", "Tap: Barcode. The code is read, or typed as here."), ("The Plate with foods", "x_s", "changed", "Tap: Look up.")], nid="DT308.12", at=15)
row("recipe", "A recipe from Recipe photo or Recipe link", [
  ("The gap", "Since 0.3.155 both tiles are reachable with foods on the plate. Today the recipe takes the plate's place with no question, and the plate is gone."),
  ("Proposed", "The same question, in the same look, when you tap Put it on my plate: what is on your plate, what the recipe is, Add to my plate or Start a new plate. Back on the top left returns to what was read, with nothing changed."),
  ("Add to my plate", "The recipe joins your foods as one dish: one row with its name and weight, its foods under it, as built in 0.3.155."),
  ("Start a new plate", "Only the recipe, as today. The old plate is saved in My recipes, with the same one line near the top: the link, Undo and X (DT308.12n)."),
  ("Recipe photo", "The same from the other tile: the pictures are read, then Put it on my plate asks."),
], [("Add more, open", "x_t", "changed", "Where you are: the Plate, no meal set. + Add more to your plate is open."), ("The link", "x_u", "same", "Tap: Recipe link, and you paste the link."), ("What was read", "x_v", "same", "Tap: Read it."), ("The question", "x_w", "changed", "Tap: Put it on my plate."), ("The Plate with foods", "x_x", "changed", "Tap: Add to my plate.")], nid="DT308.12", at=19)
board("Stories245.dc.html", "DT308.12 (2 of 2): something is on the plate, and a barcode, a label or a recipe comes",
  "18 November 2026 (Coach Milan 00:16 and 00:22). On the landing of 0.3.155: a barcode or a label joins with no question; a recipe from Recipe photo or Recipe link asks the same question as a photo. Drawn on the app as built in 0.3.156. Drawn for approval; no Go.",
  B, W, y - 100, "Stories244.dc.html")

AC311 = [
  ("AC1", "The top of the card is the plate, not a button", "Given my plate holds skyr, oats and a banana, when I open the Plate, then the top of the card says On your plate and the result comes right under it, with no button in between."),
  ("AC2", "Empty plate stands with the foods", "Given the same plate, when I look at the row right above the foods, then Empty plate stands on its left."),
  ("AC3", "Group into parts stands opposite and reads well", "Given the same plate, when I look at that row, then Group into parts stands on its right, with its words on one line and clear of the button's border."),
  ("AC4", "With nothing to group, Empty plate keeps its place", "Given my plate holds only skyr, so there is no Group into parts, when I look above the food, then Empty plate stands alone in the same place on the left."),
]
def gwt(t):
    m = re.match(r"Given (.*), when (.*), then (.*)$", t); return [x[0].upper() + x[1:] for x in m.groups()]
def gwtBold(t): return t.replace("Given ", "<b>Given</b> ", 1).replace(", when ", ", <b>when</b> ", 1).replace(", then ", ", <b>then</b> ", 1)
def acTable(B, y, w, acs):
    th = "padding:9px 12px;text-align:left;font-size:13.5px;font-weight:800;color:#fff;background:#172742"
    td = "padding:10px 12px;font-size:13.5px;line-height:1.45;color:#172742;vertical-align:top;border-bottom:1px solid #d1dcf0"
    hd = "font-size:12px;font-weight:900;letter-spacing:.05em;color:#5b6b8a"
    rows = ""
    for i, t, x in acs:
        g, wh, th2 = gwt(x.rstrip("."))
        rows += f'<tr><td style="{td};font-weight:800;color:#123a7a;white-space:nowrap">{i}</td><td style="{td};font-weight:700">{t}</td><td style="{td}">{g}</td><td style="{td}">{wh}</td><td style="{td}">{th2}</td></tr>'
    li = lambda x: f'<div style="font-size:13.5px;line-height:1.45;color:#172742;margin-top:4px">{x}</div>'
    B.html.append(f'<div style="position:absolute;left:20px;top:{y}px;width:{w}px;box-sizing:border-box;border:2px solid #172742;border-radius:14px;padding:14px 16px;background:#fff">'
      f'<div style="font-size:19px;font-weight:900;color:#123a7a"><span style="background:#123a7a;color:#fff;border-radius:7px;padding:1px 8px;margin-right:7px">DT311</span>3. The agreement: what gets built</div>'
      f'<div style="margin-top:6px;font-size:13.5px;color:#172742">Empty plate on the left, opposite Group into parts. Release 0.3.157. A walkthrough check names its criterion, for example DT311 AC1.</div>'
      f'<div style="{hd};margin-top:14px">ACCEPTANCE CRITERIA, WHAT IS NEW</div>'
      f'<table style="margin-top:6px;width:100%;border-collapse:collapse;table-layout:fixed"><colgroup><col style="width:58px"><col style="width:20%"><col style="width:24%"><col style="width:22%"><col></colgroup>'
      f'<tr><th style="{th};border-radius:8px 0 0 0">#</th><th style="{th}">Scenario</th><th style="{th}">Given</th><th style="{th}">When</th><th style="{th};border-radius:0 8px 0 0">Then</th></tr>{rows}</table>'
      f'<div style="display:flex;gap:40px;margin-top:16px"><div style="flex:1.4"><div style="{hd}">ALREADY WORKS, MUST NOT CHANGE</div>'
      + li("Empty plate asks once: the first tap says Tap again to empty, the second tap empties the plate.") + li("Group into parts groups the foods as it does today, and shows when it shows today.") + li("Everything else on the card: the result, Fit to my target, the foods, + Add more to your plate, Prepare it.")
      + f'</div><div style="flex:1"><div style="{hd}">DESIGN DETAILS FOR THE BUILD</div>' + li("Group into parts: room around its words, on one line, 44 high.") + li("The screens above on this board, DT311b and DT311c, are what it looks like.")
      + '</div></div></div>')
    return y

start(3)
row("empty", "Empty plate on the left, opposite Group into parts. Three states side by side, not steps", [
  ("Ticket", "DT311. This board is the ticket: everything about it is here. On the canvas page Kanban, column Now, it is one short card with the label Board: DT311, canvas Page 5."),
  ("How to read this board", "<b>This card, top to bottom:</b> the request, then the solution and the decision. <b>The screens</b> on the right: the design. <b>The wide block at the bottom:</b> the agreement, what gets built."),
  ("1. The request", ""),
  ("Opportunity, why we act", "<b>Where it comes from:</b> Coach Milan's own look at the Plate on 18 November 2026, 10:05, while going through the boards. No tester has reported it.<br><b>The job:</b> Read my plate and its result, then change its foods.<br><b>What stood in the way:</b> Nobody was blocked. Two kinds: a risk of a wrong tap, because a delete button is the first control on the card; and looks broken, because the words of Group into parts touch its border.<br><b>Why now:</b> 0.3.157 rebuilds this card anyway, so the change is small now and would cost a release of its own later."),
  ("Problem", "On a plate with foods, the first button I meet is the one that throws the plate away: Empty plate sits at the top of the card, next to its title and above the result. The other button for the foods, Group into parts, is somewhere else, and its words touch its border, so it looks broken."),
  ("Story", "When I open my plate, I want to read what is on it and its result before anything else, and find the buttons for the foods next to the foods, so that I do not meet a delete button first and do not look in two places."),
  ("In Coach Milan's words", "18 November 10:05: Empty plate could stand on the left, opposite Group into parts; that button's words are tight to its border; and when Group into parts is not there, Empty plate needs one general position."),
  ("2. The solution and the decision", ""),
  ("Now", "Empty plate is at the top right of the card, next to On your plate, above the result. Group into parts is on the right above the foods, and its words touch its border."),
  ("Proposed", "One row above the foods: Empty plate on the left, Group into parts on the right. Both act on the foods, so they stand next to them. The card's top says only On your plate."),
  ("One position", "With no Group into parts (one food, or a plate already in parts) the row stays, with Empty plate alone on the left. It never moves."),
  ("Looked at and not chosen: above the PD block", "Not there: the top of the card is the best place of the page, and a button that throws the plate away should not sit where the eye lands first."),
  ("Decision", "Coach Milan, 18 November 10:53: DT311 goes into 0.3.157. Go for 0.3.157: 11:14."),
  ("3. The agreement", "In the wide block at the bottom of this board."),
], [("Now", "e_0", "draft", "As it is in 0.3.156. Red: the two buttons."), ("With Group into parts", "e_1", "changed", "The same plate, with the change."), ("With one food", "e_2", "changed", "No Group into parts.")], nid="DT311", arrows=False)
acTable(B, 1800, W - 40, AC311); y = 1800 + 469 + 150  # measured: the card ends at 1742, the block is 469 high, the table is 348 high
board("Stories246.dc.html", "DT311: Empty plate on the left, opposite Group into parts",
  "18 November 2026 (Coach Milan 10:05). A small card of its own; it can go with 0.3.157. Drawn on the app as built in 0.3.156. Drawn for approval; no Go.",
  B, W, y - 100, "Stories245.dc.html")
