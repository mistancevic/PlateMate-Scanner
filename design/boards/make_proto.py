# Builds a prototype page from a shot folder: spots.json + <screen>.png + top.png + nav.png -> <dir>/site
# Usage: python3 make_proto.py <dir> "<title>" '<json titles by screen>'
import json, sys, os, re
from PIL import Image
d, title, titles = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
spots = json.load(open(f"{d}/spots.json"))
os.makedirs(f"{d}/site/screens", exist_ok=True)
for k in list(spots) + [f"{x}_{c}" for x in spots for c in ("top", "nav")]:
    Image.open(f"{d}/{k}.png").convert("RGB").save(f"{d}/site/screens/{k}.webp", "WEBP", quality=74)
for k in spots: spots[k]["title"] = titles[k]
t = open("/home/claude/boards/proto_template.html").read()
t = re.sub(r"const S = \{.*?\};\n", lambda m: "const S = " + json.dumps(spots) + ";\n", t, count=1, flags=re.S)
t = t.replace("<title>DT284 Prototype</title>", f"<title>{title}</title>").replace("<b>DT284 prototype</b>", f"<b>{title}</b>")
open(f"{d}/site/index.html", "w").write(t)
print("built", d, len(spots), "screens")
