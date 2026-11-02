# Board BP1 version 5 (Stories161), Coach Milan 2 November 09:15 to 09:23: the six things 0.3.51 changed without approval,
# and the counted numbers, each beside what the approved version 4 drew, for his call one by one; and the new video.
# 0.3.51 is rolled back on production (Milan 09:23); /built is the 0.3.50 page until this is decided and built.
import base64, io, html, os
from PIL import Image
exec(open("/home/claude/boards/genDT210.py").read().split("W = SX + 3")[0].replace("Now: 0.3.49, untouched. New: the same pages with the change drawn in, blue outline and yellow note.", "Left: what version 4 drew. Right: what 0.3.51 built. One decision per row.").replace("0.3.49, as it is", "0.3.50, as it is"))
R = "/home/claude/boards/rs"
def pic(name, w):
    im = Image.open(f"{R}/{name}.png").convert("RGB"); im = im.resize((w * 2, int(im.size[1] * w * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=72)
    return f'<img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{w}px;border-radius:10px;border:1.5px solid #d1dcf0;display:block">', int(im.size[1] / 2)
def poster(path, w):
    im = Image.open(path).convert("RGB"); im = im.resize((w * 2, int(im.size[1] * w * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=72)
    return f'<img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{w}px;border-radius:10px;border:1.5px solid #2e7be8;display:block">', int(im.size[1] / 2)
X0, CW, G = 400, 500, 40
B = Board(); y = 30
def chip(t, bg): return f'<span style="display:inline-block;background:{bg};color:#fff;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{t}</span>'
def row(nid, title, ask, left, right, lw=CW, rw=CW):
    global y
    B.html.append(f'<div style="position:absolute;left:{X0}px;top:{y}px;width:{2*CW+G}px"><div style="background:#172742;color:#fff;border-radius:10px;padding:7px 10px;font-size:14px;font-weight:800"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:6px">{nid}</span>{title}</div>'
                  f'<div style="font-size:13.5px;line-height:1.45;color:#172742;margin-top:8px;padding:8px 10px;background:#fff8d6;border-radius:8px;outline:3px solid #2e7be8;outline-offset:2px"><b>Your call:</b> {ask}</div></div>')
    y += 112
    hs = []
    for i, (lab, bg, cont) in enumerate([left, right]):
        x = X0 + i * (CW + G)
        if isinstance(cont, tuple): body, h = pic(cont[0], cont[1])
        else: body, h = f'<div style="width:{CW}px;box-sizing:border-box;border:1.5px dashed #d1dcf0;border-radius:10px;padding:14px;font-size:13.5px;line-height:1.45;color:#3d4a63">{cont}</div>', 90
        B.html.append(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{CW}px">{chip(lab, bg)}<div style="margin-top:8px">{body}</div></div>')
        hs.append(h + 34)
    y += max(hs) + 70
A, N = ("Approved, version 4", "#2e7be8"), ("Built in 0.3.51, not approved", "#c0392b")
cy = storyCard(B, 30, "BP1 v5", "/built: what 0.3.51 changed without your approval", [
  ("Coach Milan, 09:15 to 09:23", "We agreed on the design, and the build changed it on the fly. Any change is discussed on the design first, and only that version is coded. 0.3.51 is rolled back on production; /built is the 0.3.50 page."),
  ("How to read it", "One row per change. Left: what version 4 drew and you approved. Right: what 0.3.51 built instead. Say left or right for each, or something else. Then the build is exactly that, nothing more."),
  ("The numbers", "Version 4 drew 229 releases, 90 eval cases, 531 unit tests, about seven a day. A script now counts them from the repo: 284, 100 in 8 sets, 533, about nine a day. The earlier ones were counted by hand and were wrong."),
  ("New: the video", "The 90 seconds behind See it work is from 24 October and shows the old Today and Plan. Proposal: a new minute and a half made from the home page clips of 1 November, in the order the page tells the system."),
  ("Also open", "The title, product manager or product builder: my view is manager in the title, builder in the description. Your call; not drawn."),
])
y = 30
row("1", "The numbers and the last sentence of the lead", "left, the hand-counted numbers and every AI answer is checked by a human; or right, the counted numbers and nothing the AI reads counts before a person checks it (the chat is an AI answer no one checks before it shows).",
    (A[0], A[1], ("bp5-lead-v4", CW)), (N[0], N[1], ("bp5-lead-51", CW)))
row("2", "The system on a phone", "left, the whole graph shrunk to the phone's width (its words about 3 px); or right, the same parts in a column with the lines in words.",
    (A[0], A[1], ("bp5-graph-v4", 300)), (N[0], N[1], ("bp5-graph-51", 300)))
row("3", "The three boards as pictures", "left, the plate board (it shows your own phone screenshot with your targets, on a public page); or right, the Clients board in its place.",
    (A[0], A[1], ("bp5-pics-v4", CW)), (N[0], N[1], ("bp5-pics-51", CW)))
row("4", "Who builds: the coach card", "left, every number is tried on himself first (the line you parked as DT202, says too much); or right, without it.",
    (A[0], A[1], ("bp5-who-v4", CW)), (N[0], N[1], ("bp5-who-51", CW)))
row("5", "Books by Milan", "left, no books section (as drawn; the story card said the books stay); or right, the books and Tell me when the books are out, before Who builds.",
    (A[0], A[1], "Not on the drawing. The Who builds card Author names the Worth series."), (N[0], N[1], ("bp5-books-51", CW)))
row("6", "See it work, 90 seconds", "left, the button with no place drawn for the video; or right, the video opens under the buttons, Close the video to fold it.",
    (A[0], A[1], ("bp5-video-v4", 300)), (N[0], N[1], ("bp5-video-51", 300)))
# 7: the new video
B.html.append(f'<div style="position:absolute;left:{X0}px;top:{y}px;width:{2*CW+G}px"><div style="background:#172742;color:#fff;border-radius:10px;padding:7px 10px;font-size:14px;font-weight:800"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:6px">7</span>New, proposed: the 90 seconds from the home page clips</div>'
              f'<div style="font-size:13.5px;line-height:1.45;color:#172742;margin-top:8px;padding:8px 10px;background:#fff8d6;border-radius:8px;outline:3px solid #2e7be8;outline-offset:2px"><b>Your call:</b> these five clips of 1 November, in this order, about 18 seconds each, recorded again as one on the screens of today (the coach clip still shows My clients, from before the Clients tab); or other clips; or keep the video of 24 October.</div></div>')
y += 112
x = X0
for i, (k, t) in enumerate([("plate", "1. The Plate: PD, the letters, the numbers"), ("recipes", "2. Recipes for your day"), ("cook", "3. Cook mode, read aloud"), ("coach", "4. A coach's clients"), ("explorer", "5. Explorer: the body")]):
    img, h = poster(f"/home/claude/platemate-scanner/public/landing/way-{k}.webp", 190)
    B.html.append(f'<div style="position:absolute;left:{x + i * 210}px;top:{y}px;width:190px">{chip(chr(0x2192) if False else "New", "#2e7be8")}<div style="margin-top:8px">{img}</div><div style="font-size:12.5px;color:#172742;margin-top:6px;font-weight:700">{t}</div></div>')
y += h + 120
# 8 (Coach Milan 09:35 Go; the build stopped here to ask): the five clips are 10 to 12 seconds each, not 18, so 54 seconds
B.html.append(f'<div style="position:absolute;left:{X0}px;top:{y}px;width:{2*CW+G}px"><div style="background:#172742;color:#fff;border-radius:10px;padding:7px 10px;font-size:14px;font-weight:800"><span style="background:#c0392b;border-radius:6px;padding:1px 6px;margin-right:6px">8</span>Found at Go, 09:35: the five clips make 54 seconds, not 90</div>'
              f'<div style="font-size:13.5px;line-height:1.5;color:#172742;margin-top:8px;padding:10px 12px;background:#fff8d6;border-radius:8px;outline:3px solid #2e7be8;outline-offset:2px"><b>Your call before anything is built.</b> Row 7 drew about 18 seconds per clip. The clips run 9.9 to 11.9 seconds (the home page rule HC8 keeps a clip between 6 and 12). Five of them make 54 seconds, so the button\'s 90 seconds would be wrong. The coach clip also has to be recorded again with the Clients tab, since the switch it taps is gone.<br><br>'
              '<b>A.</b> The five clips as they are, 54 seconds. The button reads See it work, one minute.<br>'
              '<b>B.</b> Seven clips: the five, plus Scan a label and Photo of my meal (the path the page walks through), about 75 seconds. The button reads See it work, 75 seconds.<br>'
              '<b>C.</b> Build the page now with the video of 24 October and its 90 seconds; the new video comes as its own release after.</div></div>')
y += 260
W = X0 + 2 * CW + G + 40
board("Stories161.dc.html", "BP1 v5. /built: what 0.3.51 changed without approval, for your call",
  "2 November 2026 (Coach Milan 09:15 to 09:23). 0.3.51 is rolled back; /built on production is the 0.3.50 page. Left: approved version 4. Right: built without approval. Nothing is built until you decide.",
  B, W, y, "Stories160.dc.html")
