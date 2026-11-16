# Boards DT303 and B145 (from shotDT303.cjs; Coach Milan 15 November 20:57 to 21:04): the flow from a photo to the plate, one step at a time; two bugs in the form and the read. Template from B144.
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
    body = "".join(f'<div style="margin-top:10px"><b style="font-size:12px;letter-spacing:.05em;color:#5b6b8a">{h.upper()}</b><div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:3px">{t}</div></div>' for h, t in parts)
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
    c = storyCard(B, y, rid, title, parts)
    hs = [B.screen(f"{nid or rid}{chr(97 + at + i)}", i, y, t, n, st, wd) for i, (t, n, st, wd) in enumerate(shots)]
    if arrows:
        for i in range(1, len(shots)): B.html.append(f'<div style="position:absolute;left:{B.x(i) - GAP}px;top:{y + TOP + 220}px;width:{GAP}px;text-align:center;font-size:44px;font-weight:900;color:#2a72d9">→</div>')
    y = rowEnd(c, *hs)

# ---------- B145 ----------
start(2)
row("Now", "Two things wrong in the photo form and the read", [
  ("1. The form", "You log a photo as a snack (15:57), and the form asks Which dish of your snack is it? A snack has no dishes."),
  ("2. The read", "You read the photo with no words, and the plate says For cooking, not counted: simmered, pureed. Those are methods Chef Mealan made up, not foods you named."),
], [("1. The form, for a snack", "b145n1", "now", "Tap: Photo of my meal, pick the photo. The form asks which dish of your snack."), ("2. The read, with no words", "b145n2", "now", "Tap: Read the plate. A cooking line with methods.")], nid="B145", arrows=False)
row("New", "The same two steps, fixed", [
  ("1. The form", "The row Which dish of your ... is it? shows for breakfast, lunch and dinner only. For a snack the form goes from How much of it is yours straight to your words."),
  ("2. The read", "The line For cooking, not counted shows only cooking foods you named in your words. With no words there is no line, and Chef Mealan never puts a method in it."),
  ("Languages", "No new lines."),
], [("1. The form, for a snack", "b145a", "changed", "Tap: Photo of my meal, pick the photo. No dish row."), ("2. The read, with no words", "b145b", "changed", "Tap: Read the plate. No cooking line.")], nid="B145", at=2, arrows=False)
board("Stories226.dc.html", "B145. The photo form asks a snack for its dish; the read invents cooking methods",
  "15 November 2026 (Coach Milan 20:57, his test of version 0.3.150 on the phone). The read's answers in the new frames are stand-ins. Drawn for approval.",
  B, W, y - 100, "Stories225.dc.html")

# ---------- DT303, fourth drawing: the meal line that exists; three screens; four scenarios ----------
start(5)
F = "changed"
row("1", "A photo from Your photos, of a lunch you ate", [
  ("Path", "Plate. Photo of my meal. Pick the photo. The photo screen. Read the plate. The read. Save it to my day. Today."),
  ("The meal line", "It is the line that exists, under the title: the meal, the day, off the plan, the moment. It stays there on the photo screen, the read and the plate. Its pencil becomes a button, Change."),
  ("The photo fills it in", "A photo from Your photos carries its time: 13:10 today, so Lunch, today at 13:10, and you ate it. A photo you take now means now. Chef Mealan no longer asks Ate at, Eating now, Just looking: the line holds it."),
  ("The photo screen", "Only the photo, bigger, with Remove the photo beside it, and Read the plate. No dish row, no text box."),
  ("The read", "The foods and always the result. His guess of the dish as plain text. Left: Correct the read. Right: the main button, which follows the meal line."),
], [("The Plate", "w1a", F, "You open Plate."), ("The camera", "w1b", "same", "Tap: Photo of my meal. Then Your photos, pick one."), ("The photo screen", "w1c", F, "The photo is picked."), ("The read", "w1d", F, "Tap: Read the plate."), ("Today", "w1e", "same", "Tap: Save it to my day.")], nid="DT303.1")
row("2", "A photo you take now", [
  ("Path", "The Plate and the camera as in 1. The photo screen. Read the plate. The read. Put it on my plate. The plate."),
  ("The plate", "As it is today. Nothing changes there in this work."),
], [("The photo screen", "w2a", F, "You take the photo."), ("The read", "w2b", F, "Tap: Read the plate."), ("The plate", "w2c", "same", "Tap: Put it on my plate.")], nid="DT303.2")
row("3", "A pot, you eat a part, and the first read is wrong", [
  ("Path", "The photo screen with the pot question. Read the plate: one food. Correct the read: your words. Read it again: the soup in its foods. Put it on my plate."),
  ("The pot question", "Only for a pot or a tray: All of it · A part of it. A part of it shows grams, Chef Mealan's estimate of one serving, which you correct."),
  ("Correct the read", "What is wrong or missing? Add another photo, Say it, or type. Read it again reads the photos and your words together. Back closes it."),
], [("The photo screen", "w3a", F, "You take the photo of the pot."), ("The read", "w3b", F, "Tap: Read the plate."), ("Correct the read", "w3c", F, "Tap: Correct the read, then type."), ("The read again", "w3d", F, "Tap: Read it again.")], nid="DT303.3")
row("4", "Just looking", [
  ("Path", "Plate. Change. What is it for? Just looking. Done. Photo of my meal. The photo screen. Read the plate. The read. Done."),
  ("Behind Change", "The questions that exist: Which day? What is it for? What is it? What kind of moment? New: What time? Now · At 18:00, beside Which day?. Done becomes a button."),
  ("The read", "The result, and Done. Nothing is logged. Put it on my plate is the second button, if you decide to eat it."),
], [("The questions behind Change", "w4a", F, "Tap: Change, then Just looking."), ("The photo screen", "w4b", F, "Tap: Done, Photo of my meal, take the photo."), ("The read", "w4c", F, "Tap: Read the plate.")], nid="DT303.4")
board("Stories227.dc.html", "DT303. From a photo to the plate: the meal line that exists, three screens, four scenarios",
  "16 November 2026, fourth drawing (Coach Milan 07:39: no drop-downs, too much was drafted, meal and timing belong together under the title; 07:46: keep the meal line that exists and let the photo fill it in; 07:51 Draw). Parked as their own cards: the dishes of one meal, correcting one food by a tap, the plate cleanup, the meal line for the other ways in (DT304). The read's answers are stand-ins. Languages: about ten new lines, in English, Serbian and German. Drawn for approval.",
  B, W, y - 100, "Stories226.dc.html")

# ---------- DT305, fifth drawing: tick what applies, then Done; six scenarios ----------
F = "changed"
PA, PB, PC = ("The Plate", "z_a", F, "You open Plate."), ("The camera", "z_b", "same", "Tap: Photo of my meal."), ("The photo screen", "z_c", F, "Tap: the round button. You type what he should know.")
SUB = "16 November 2026, tenth drawing (11:21: Change the foods, at the foods; 10:59: the chips are All of it, Half, Part of it, with the weight field below; 10:49: the question is its own block; Done and Save in My recipes are for the whole section; 10:14: the two side by side; one question does not fit two different jobs; 10:06: the ticks get their question and Done moves into their card, by the design rules; earlier: Coach Milan 09:43: Find ideas gets the hat; a blue Ate it reads as selected; the group of buttons overwhelms; the tap from a to b must be visible; Ate half makes no sense as a button; 09:52: half or an exact portion as a chip beside the field; Draw). Every row is one scenario from the Plate to where it ends. A yellow ring marks what you tap next. The read's answers are stand-ins. Languages: about ten new lines, in English, Serbian and German. Drawn for approval."
start(7)
row("1", "To be informed", [
  ("Purpose", "What is it, and what is it worth. Nothing is kept, nothing counts."),
  ("Path", "Plate. Photo of my meal. Take the photo. The photo screen. Read the plate. The read. Done. Back on the Plate."),
  ("a, the Plate", "As today, with one change: Find ideas carries Chef Mealan's hat."),
  ("c, the photo screen", "The meal's title, still empty, in the place of the question. The meal line as today. The photo, bigger, with Remove the photo. The box: Anything Chef Mealan should know? with Say it. Read the plate."),
  ("d, the read", "The same in every scenario: the title, the photo, its foods with Change the foods under them, always the result, his guess of the dish, what you said, Chef Mealan's word about your day. Under it the question Did you eat it? in its own block, with three chips: All of it, Half, Part of it, white until chosen, blue with a check mark when chosen. Below them the weight field, once a chip is chosen. Save in My recipes is an action, so it is a button. The two buttons are for the whole read, so they sit under everything, side by side: Save in My recipes, white with the blue border, and Done, filled."),
  ("New rule for the book", "An answer to tick always sits under its question, in its own block. The buttons of a section sit under the whole section, in one row."),
], [PA, PB, PC, ("The read", "z1d", F, "Tap: Read the plate."), ("The Plate", "y_a", "same", "Tap: Done.")], nid="DT305.1")
row("2", "To keep it for another time, or to make it at home", [
  ("Purpose", "It becomes a recipe, with its foods, amounts and photo, marked From your photo. Nothing counts now."),
  ("Path", "As in 1 up to the read. Save in My recipes: the button says Saved in My recipes. Done. Back on the Plate."),
  ("Afterwards", "It is under My recipes in Recipes. From there you count it another time, plan it, or cook it at home, as with any recipe today."),
], [PA, PB, PC, ("The read", "z2d", F, "Tap: Read the plate."), ("The read, saved", "z2e", F, "Tap: Save in My recipes."), ("The Plate", "y_a", "same", "Tap: Done.")], nid="DT305.2")
row("3", "To count it for the day", [
  ("Purpose", "You ate it, today."),
  ("Path", "As in 1 up to the read. All of it. The weight shows below, the whole meal. Done. Today, with the line Logged at 19:13. It's on Today."),
  ("The amount", "The chips answer the question and fill the weight field below: All of it 210 g, Half 105 g. Part of it leaves the field for you to type. No Ate it tick and no Ate half button."),
], [PA, PB, PC, ("The read", "z3d", F, "Tap: Read the plate."), ("The read, chosen", "z3e", F, "Tap: All of it."), ("Today", "z3f", "same", "Tap: Done.")], nid="DT305.3")
board("Stories230.dc.html", "DT305. A photo of a meal: tick what applies, then Done. Scenarios 1 to 3", SUB, B, W, y - 100, "Stories229.dc.html")
start(7)
row("4", "To decide before you eat, and eat a part", [
  ("Purpose", "The meal is in front of you. Chef Mealan's word sits under the result. You take half."),
  ("Path", "As in 1 up to the read. Half: the field says 105 g. Done. Today."),
], [PA, PB, PC, ("The read", "z4d", F, "Tap: Read the plate."), ("The read, chosen", "z4f", F, "Tap: Half."), ("Today", "z3f", "same", "Tap: Done.")], nid="DT305.4")
row("5", "To count it for the plan", [
  ("Purpose", "It is for a meal that is still coming."),
  ("Path", "Plate. Photo of my meal. The photo screen. The pencil on the meal line. Which day? Tomorrow. Done. Read the plate. The read. Plan it for tomorrow's dinner. Done. Plan."),
  ("The question follows the meal line", "Today or a past day: Did you eat it? All of it, Half, Part of it. A coming day: Is it for the plan? Plan it for tomorrow's dinner; ticked, it reads Planned for tomorrow's dinner. These wordings are new, as is the line Planned for tomorrow's dinner. It's on Plan."),
], [PA, PB, ("The photo screen", "z5c", F, "Tap: the round button."), ("Behind the pencil", "z5c2", F, "Tap: the pencil, then Tomorrow."), ("The read", "z5d", F, "Tap: Done, then Read the plate."), ("The read, chosen", "z5e", F, "Tap: Plan it for tomorrow's dinner."), ("Plan", "z5f", F, "Tap: Done.")], nid="DT305.5")
row("6", "To count it for a past day", [
  ("Purpose", "Yesterday's dinner, from a photo you already have."),
  ("Path", "Plate. Photo of my meal. Your photos, pick the photo. The photo screen. Read the plate. The read. All of it. Done. Today, with the new line Logged for yesterday, 19:40."),
  ("The photo fills in the meal line", "A photo from Your photos carries its day and time, so the line says Dinner, yesterday at 19:40. The pencil changes it if it is wrong."),
], [PA, ("The camera", "y_b", "same", "Tap: Photo of my meal. Then Your photos."), ("The photo screen", "z6c", F, "Tap: a photo from yesterday."), ("The read", "z6d", F, "Tap: Read the plate."), ("The read, chosen", "z6e", F, "Tap: All of it."), ("Today", "z6f", F, "Tap: Done.")], nid="DT305.6")
row("7", "To correct it or change it first", [
  ("Purpose", "A food is wrong or missing, or you want Chef Mealan to fit the meal to your target, before it counts."),
  ("Path", "As in 1 up to the read. An amount you correct on the read itself, by a tap on it. For more: Change the foods. The plate, as it is today, with these foods on it and all its tools. From there you finish as today."),
  ("The button", "Change the foods sits at the foods, under the photo, not with the buttons at the bottom. White with the blue border. It is on the read in every scenario."),
], [PA, PB, PC, ("The read", "z7d", F, "Tap: Read the plate."), ("The plate", "y7e", "same", "Tap: Change the foods.")], nid="DT305.7")
board("Stories231.dc.html", "DT305. A photo of a meal: tick what applies, then Done. Scenarios 4 to 7", SUB, B, W, y - 100, "Stories230.dc.html")
