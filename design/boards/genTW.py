# Board PF4 (17 October 2026, Milan 22:29 and 22:39): the two ways, the logic. # was: Boards PF and PF2 (17 October 2026, Milan 21:22 and 21:42): what it is for, first. Lines from the tapped button to the screen it opens. Shots from shotPF.cjs (pf/).
S = __import__("os").environ.get("BOARDS_DIR", __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
exec(open(f"{S}/genRG.py").read().split("\nboards = {}\n")[0])
exec(open(f"{S}/genB.py").read().split("row1 = [")[0].split("YH = ")[0].replace('exec(open(f"{S}/genRG.py").read().split("\\nboards = {}\\n")[0])', ""))
import os
YH = json.load(open(f"{S}/yh.json")) if os.path.exists(f"{S}/yh.json") else {}
def col(sid, title, body, w=300, now=False):
    return (f'<div style="width: {w}px; flex: none; display: flex; flex-direction: column; gap: 10px">'
            f'<div style="background: {"#5b6b8a" if now else "#172742"}; color: #fff; border-radius: 10px; padding: 8px 10px; font-size: 13px; font-weight: 800"><span style="display: inline-block; background: {"#8a97ad" if now else "#2e7be8"}; border-radius: 6px; padding: 1px 7px; margin-right: 6px; font-size: 14px">{sid}</span>{title}</div>{body}</div>')
T = lambda t: txt(t, 12.5)
def imgf(name, w=300, border=True):
    im = Image.open(f"{S}/im/{name}.png").convert("RGB")
    bg = im.getpixel((4, im.size[1] - 4)); px = im.load(); bottom = im.size[1]
    # crop the empty page under the content
    for y in range(im.size[1] - 1, 0, -1):
        if any(sum(abs(a - b) for a, b in zip(px[x, y], bg)) > 24 for x in range(0, im.size[0], 6)): bottom = min(im.size[1], y + 24); break
    im = im.crop((0, 0, im.size[0], bottom))
    im = im.resize((w * 2, int(im.size[1] * w * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=72)
    return f'<img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width: {w}px; border-radius: 12px; border: 1.5px solid {"#2e7be8" if border else "#d1dcf0"}; display: block">'
def box(title, lines):
    return f'<div style="border: 1.5px solid #d1dcf0; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px"><b style="font-size: 14px">{title}</b>' + "".join(f'<div style="font-size: 12.5px; line-height: 1.5; color: #172742">{l}</div>' for l in lines) + '</div>'
gap = "<div style='height:16px'></div>"
small = "<div style='height:10px'></div>"
cap = lambda t: f"<b style='font-size:13px;color:#172742'>{t}</b>"


TAPS = json.load(open(f"{S}/tw/taps.json"))
SW, GAP, K = 240, 150, 240 / 390
TT, CH, DH = 44, 24, 92
TOP = TT + 8 + CH + 8 + DH + 8
CHIP = {"same": ("#e9edf3", "#3b4a66", "Same as now"), "changed": ("#2e7be8", "#fff", "Changed"), "now": ("#5b6b8a", "#fff", "0.2.26, as it is")}
def ih(name):
    return int(Image.open(f"{S}/tw/{name}.png").size[1] / 2 * K)
def img(name, border):
    im = Image.open(f"{S}/tw/{name}.png").convert("RGB"); im = im.resize((SW * 2, int(im.size[1] * SW * 2 / im.size[0]))); bb = io.BytesIO(); im.save(bb, "WEBP", quality=74)
    return f'<img src="data:image/webp;base64,{base64.b64encode(bb.getvalue()).decode()}" style="width:{SW}px;border-radius:10px;border:1.5px solid {border};display:block">'
class Board:
    def __init__(s): s.nodes = {}; s.html = []; s.lines = []; s.chips = []
    def x(s, col): return 20 + col * (SW + GAP)
    def screen(s, nid, col, y, title, name, status, what):
        bg, fg, label = CHIP[status]
        s.nodes[nid] = (s.x(col), y, name, ih(name))
        s.html.append(f'<div style="position:absolute;left:{s.x(col)}px;top:{y}px;width:{SW}px">'
          f'<div style="height:{TT}px;box-sizing:border-box;background:#172742;color:#fff;border-radius:10px;padding:6px 9px;font-size:13px;font-weight:800;line-height:1.3;overflow:hidden"><span style="background:#2e7be8;border-radius:6px;padding:1px 6px;margin-right:5px">{nid}</span>{title}</div>'
          f'<div style="height:{CH}px;margin-top:8px"><span style="display:inline-block;background:{bg};color:{fg};border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800">{label}</span></div>'
          f'<div style="height:{DH}px;margin-top:8px;font-size:12.5px;line-height:1.42;color:#172742;overflow:hidden">{what}</div>'
          f'<div style="margin-top:8px">{img(name, "#2e7be8" if status == "changed" else "#d1dcf0")}</div></div>')
        return y + TOP + ih(name)
    def box(s, nid, col, y, text):
        s.nodes[nid] = (s.x(col), y, None, 0)
        s.html.append(f'<div style="position:absolute;left:{s.x(col)}px;top:{y}px;width:{SW}px;box-sizing:border-box;border:1.5px dashed #9fb3d6;border-radius:12px;padding:12px;font-size:13px;line-height:1.45;color:#172742;background:#f6f8fc">{text}</div>')
    def label(s, y, text):
        s.html.append(f'<div style="position:absolute;left:20px;top:{y}px;font-size:22px;font-weight:900;color:#123a7a">{text}</div>')
    def edge(s, a, b, key, text):
        ax, ay, an, _ = s.nodes[a]; bx, by, bn, _ = s.nodes[b]
        r = TAPS[an][key]
        bx0 = ax + r[0] * K; by0 = ay + TOP + r[1] * K; bw = r[2] * K; bh = r[3] * K
        x1 = ax + SW + 2; y1 = by0 + bh / 2
        s.lines.append(f'<path d="M{bx0 + bw + 3:.0f},{y1:.0f} L{x1:.0f},{y1:.0f}" fill="none" stroke="#e8590c" stroke-width="2" stroke-dasharray="3 4"/>')
        xr = ax + SW + 6
        x2 = bx - 2; y2 = by + (TOP + 40 if bn else 30)
        s.out = getattr(s, "out", {}); n_ = s.out.get(a, 0); s.out[a] = n_ + 1
        mx = (xr + (x2 - xr) / 2 if x2 - xr < 2 * GAP else xr + GAP * 0.5) + (n_ * 38 - 38 if abs(y2 - y1) > 200 else 0)
        s.lines.append(f'<path d="M{x1:.0f},{y1:.0f} L{xr:.0f},{y1:.0f} C{mx:.0f},{y1:.0f} {mx:.0f},{y2:.0f} {x2 - 10:.0f},{y2:.0f} L{x2 - 9:.0f},{y2:.0f}" fill="none" stroke="#e8590c" stroke-width="3"/>'
                     f'<rect x="{bx0 - 3:.0f}" y="{by0 - 3:.0f}" width="{bw + 6:.0f}" height="{bh + 6:.0f}" rx="8" fill="none" stroke="#e8590c" stroke-width="3"/>'
                     f'<path d="M{x2 - 12:.0f},{y2 - 7:.0f} L{x2:.0f},{y2:.0f} L{x2 - 12:.0f},{y2 + 7:.0f} Z" fill="#e8590c"/>')
        cy = y1 - 30 if abs(y2 - y1) < 40 else ((y1 + y2) / 2 - 12 if abs(y2 - y1) > 200 else (y1 + 8 if y2 > y1 else y1 - 34))
        cxl = (mx - (GAP - 14) / 2) if abs(y2 - y1) > 200 else xr + 6
        s.chips.append(f'<div style="position:absolute;left:{cxl:.0f}px;top:{cy:.0f}px;max-width:{GAP - 14}px;font-size:12px;font-weight:800;color:#8a3200;background:#fff1e6;border:1.5px solid #e8590c;border-radius:8px;padding:3px 7px;line-height:1.3">tap: {text}</div>')
    def render(s, W, H):
        svg = f'<svg style="position:absolute;left:0;top:0;pointer-events:none;z-index:2" width="{W}" height="{H}">{"".join(s.lines)}</svg>'
        return f'<div style="position:relative;width:{W}px;height:{H}px">{"".join(s.html)}{svg}<div style="position:relative;z-index:3">{"".join(s.chips)}</div></div>'
legend = ('<div style="display:flex;gap:14px;align-items:center;font-size:13px;font-weight:700;flex-wrap:wrap">'
  + "".join(f'<span style="background:{CHIP[k][0]};color:{CHIP[k][1]};border-radius:999px;padding:2px 10px">{CHIP[k][2]}</span>' for k in ("now", "same", "changed"))
  + '<span style="color:#172742">Orange frame: the button you tap. Orange line: from that button to the screen it opens. Blue outline and yellow note: what changes. Every screen whole, top to bottom. Changes use the existing components of the app; a new design is named as new.</span></div>')


B = Board()
y0 = 50
B.label(y0 - 44, "Now, 0.2.26: the cheesecake for dinner (933 kcal), and what each way answers")
h0 = B.screen("T0", 0, y0, "Plate, the recipe on it", "t0", "now", "N4 on board PF, at 20:06 for dinner: 1 slice, PD 1.2, under 6.4. The two ways under Make it.")
yNC = y0 + TOP + ih("ns") + 110
hN = max(B.screen("NS", 1, y0, "After Add on the side", "ns", "now", "The phone shows: None of Chef Mealan's sides brings this dish to your target at a normal amount."),
         B.screen("NC", 1, yNC, "After Change the dish", "nc", "now", "The phone shows: the change didn't pass the checks, it reaches PD 4.0. Twice tried, then this message."))
B.box("WN", 2, y0 + TOP, "<b>Why the side found nothing.</b> The slice kept the whole dinner, 933 kcal, minus the side. To reach 6.4 that needs 476 g of skyr, and sides stop at 400 g.<br><br><b>Why the change gave up.</b> His version is scaled to the whole dinner. The size does not move the PD, so at 4.0 it fails both tries, and then only a message is left.")
B.edge("T0", "NS", "side", "Add on the side"); B.edge("T0", "NC", "change", "Change the dish")
y1 = max(h0, hN) + 150
B.label(y1 - 44, "New: the same screens, with the new rules for the amounts")
h1 = B.screen("T1", 0, y1, "Plate, the recipe on it", "t1", "changed", "A6 on board PF: the same buttons, worded. Change the dish is now Change the recipe; the chef hat on the two ways only.")
yC1 = y1 + TOP + ih("s1") + 110
hS = B.screen("S1", 1, y1, "After Add on the side", "s1", "changed", "The screen a side has today. ¾ slice with 280 g skyr: 547 kcal, PD 6.4. 386 kcal stay free.")
hC = B.screen("C1", 1, yC1, "After Change the recipe", "c1", "changed", "The screen a change has today. Skyr cheesecake, one slice as the recipe makes it: 249 kcal, PD 6.6.")
B.box("R1", 2, y1 + TOP, "<b>Rule 1, Add on the side.</b> The same rule as the Nutella and skyr mix tip. The side stays a real portion, at most 300 g. Code finds the biggest piece of the dish, in quarters of one slice, that the side carries to your target. The plate may be smaller than the meal; the rest of the day stays free.<br><br>Chef Mealan names the sides, as now. Code sets both amounts.")
B.box("R2", 2, yC1 + TOP, "<b>Rule 2, Change the recipe</b> (today Change the dish). Chef Mealan's version is sized like any plate: the meal size when that is close to one portion, else one portion as the recipe makes it. Never forced to the whole meal.<br><br><b>Rule 3.</b> When his version stays under your target after the second try, code adds a side to it, by rule 1, instead of the message in NC. For example one slice of his version at PD 4.0 with 100 g skyr: 341 kcal, PD 6.4.<br><br><b>Make it as it is</b> stays, always.")
B.edge("T1", "S1", "side", "Add on the side"); B.edge("T1", "C1", "change", "Change the recipe")
W = B.x(3) - GAP + 50; Hc = max(h1, hS, hC) + 30
H = min(8000, YH.get("Flow07", Hc + 260))
html = wide2("PF4. The two ways: the logic", W, H, "\n".join([
    H2("PF4. The two ways, Change the recipe and Add on the side: the logic"),
    txt("17 October 2026, design (Milan 22:29: keep the two ways, work on the logic; 22:39: draw first). The screens after a tap stay as they are in 0.2.26; only the amounts change. Top: the real 0.2.26 build, untouched, its answers as the phone shows them. Bottom: the same screens with the amounts the new rules give, marked. Values from the recipe and the Arla skyr label; the change uses Chef Mealan's example version.", 14),
    legend, B.render(W, Hc)]), "#fff")
open(f"{D}/Flow07.dc.html", "w").write(html)
cj = json.load(open(f"{D}/canvas.json"))
if "Flow07.dc.html" not in cj["order"]: cj["order"].append("Flow07.dc.html")
f6 = cj["boards"]["Flow06.dc.html"]
cj["boards"]["Flow07.dc.html"] = {"x": 0, "y": f6["y"] + f6["h"] + 120, "w": W, "h": H, "title": "PF4. The two ways: the logic"}
json.dump(cj, open(f"{D}/canvas.json", "w")); print("PF4", W, H, Hc, len(html) // 1024, "KB")
