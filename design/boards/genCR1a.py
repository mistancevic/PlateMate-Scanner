# Board CR1a (Stories199; Coach Milan 8 November 21:19 to 21:30, Yes): Make a post, the first creator build. From shotCR1a.cjs.
import base64, io, json, math, os, re
from PIL import Image
S = os.environ.get("BOARDS_DIR", os.path.dirname(os.path.abspath(__file__)))
R = os.environ.get("BOARDS_SHOTS", f"{S}/rs")
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
SW, GAP, SX = 240, 150, 400
K = SW / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"now": ("#5b6b8a", "#fff", "Your phone"), "draft": ("#53627f", "#fff", "0.3.116, as it is"), "changed": ("#2a72d9", "#fff", "New, drawn for your approval")}
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
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "draft", "changed"))
  + '<span style="color:#172742">Left: the story, one item per row. Right: the app as it is (0.3.116), then the same page with the change drawn in, blue outline and yellow note. Drawn in English; every release ships in Srpski and German too.</span></div>')

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
    cj = json.load(open(f"{D}/canvas.json"))
    if fname not in cj["order"]: cj["order"].append(fname)
    a = cj["boards"][after]
    cj["boards"][fname] = {"x": 0, "y": a["y"] + a["h"] + 120, "w": W, "h": H, "title": title, "page": a["page"]}
    json.dump(cj, open(f"{D}/canvas.json", "w")); print(fname, W, H, Hc, len(page) // 1024, "KB")
    cj = json.load(open(f"{D}/canvas.json"))


W = SX + 3 * (SW + GAP) - GAP + 70
B = Board(); y = 30
def row(rid, title, parts, shots, nid=None, at=0):
    global y
    c = storyCard(B, y, rid, title, parts)
    hs = [B.screen(f"{nid or rid}{chr(97 + at + i)}", i, y, t, n, st, wd) for i, (t, n, st, wd) in enumerate(shots)]
    y = rowEnd(c, *hs)
row("CR1a", "Make a post: where it starts", [
  ("Coach Milan, 8 November 21:19 to 21:30", "Creator is a role, not a mode. The flow is part of the coachee's and the coach's flow. We keep what we have: the public recipe page, the Instagram images (0.1.89), the step photos and the cover video. One new step at the end of cooking, Make a post."),
  ("Now", "Cook ends with Done, Photo of your meal, Cooked. Next: Eat, and Make for the step photos and notes. The Instagram images sit in the publish sheet, four pictures, no caption."),
  ("New", "Cook ends with Make a post under Cooked. Next: Eat. The recipe page has it too, above the steps, for a recipe that was cooked. A recipe never cooked has none: the photos and the numbers of a cook are the proof."),
  ("Who", "Every member. The pictures carry the Chef Mealan mark. A Creator (CR1b) gets their own look and no mark; a coach is a Creator for their own recipes. The screens stay the same, the role changes the mark and the limits."),
], [("Now: Cook ends", "rcr1aa", "draft", "Nothing here makes a post."), ("New: Cook ends with Make a post", "rcr1ab", "changed", "Under Cooked. Next: Eat."), ("New: the recipe page", "rcr1af", "changed", "Above the steps, for a cooked recipe. The Instagram images button goes.")])
row("CR1a", "The post screen and the pictures", [
  ("New: the post screen", "The pictures of this cook: the plate, the steps, the video, ticked; tap one to leave it out. The caption with the real numbers and three hashtags, in English, Srpski or Deutsch; Rewrite and Shorter by Chef Mealan, or My words. Format 4:5 for the feed, five pictures, or 9:16 for a story, one. Share opens the phone's share sheet; Save puts the pictures on the phone."),
  ("New: the first picture", "The plate, the numbers strip (kcal, protein, PD), Cooked and weighed with the date, and the mark, chefmealan.com, small and half transparent, bottom right. Then the steps, then the video last. The 9:16 picture holds the plate and the numbers only."),
  ("Words", "No Instagram in the words. It is a post; the formats fit Instagram, TikTok and Shorts alike."),
  ("Not in CR1a", "The creator's look, logo and voice, the dreamed mark, credits (CR1b). The production package for external tools (CR1c). The recipe book (CR1d). Pricing (with PR2 and PR3). The caption costs AI calls inside the hourly limit, nothing else."),
  ("Open", "How many posts a month for a member without the Creator role, or none until pricing. Whether the video goes into Share as a file or stays a Save."),
], [("New: the post screen", "rcr1ac", "changed", "Pictures, caption in three languages, format, Share or Save."), ("New: the first picture, 4:5", "rcr1ad", "changed", "Numbers strip, Cooked and weighed, chefmealan.com barely there."), ("New: the story picture, 9:16", "rcr1ae", "changed", "The plate and the numbers.")], at=3)
row("CR1a", "The 10th and the 20th post", [
  ("Coach Milan, 21:46", "After the 10th creation a thank you, and they confirm they are satisfied and want to continue; measure that reaction. After the 20th again. The Chef Mealan mark on the photos; Creator removes it."),
  ("New: the 10th", "A card, not a blocking popup: Your 10th post, thank you, is this worth keeping? Yes, keep going, or Something is missing with a line. The count and the answer go to Coach Milan's Clients view, next to How to."),
  ("New: the 20th (21:53)", "Coach Milan: a question is a bad strategy, no commitment, an empty promise. The button is to pay. The card shows Creator with the price, €29 a month, first month free, and Get Creator. The tap is the signal; Not for me counts too."),
  ("New: the honest door", "After Get Creator: Not open yet, you are first in line. Nothing to pay now, no card field; the first month free when it opens. Put me first in line, by email, is the second signal. The same door PR2 uses; no trick."),
  ("The mark (23:18)", "Barely visible, small, no space taken: chefmealan.com in half transparent text, bottom right, the same on every picture, so a picture that travels brings people to the door. Creator replaces it with the creator's own mark: free posts market us, paid posts market the creator."),
], [("New: the 10th post", "rcr1ag", "changed", "Thank you; worth keeping? Yes, or what is missing."), ("New: the 20th post", "rcr1ah", "changed", "Creator at €29, Get Creator. The tap is the signal."), ("New: the honest door", "rcr1ai", "changed", "Not open yet, first in line, nothing to pay.")], at=6)
board("Stories199.dc.html", "CR1a. Creator: Make a post, the first build",
  "8 November 2026 (Coach Milan 21:19 to 21:30, Yes to the frame). Versions stay 0.3.x until the gate opens. Drawn for approval.",
  B, W, y - 100, "Stories198.dc.html")
