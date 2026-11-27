# DT312 prototype: one artboard that plays. Screens are pictures from the scratch build (protoDT312.cjs);
# the taps are real buttons over them, and the pinned main step is drawn by the artboard.
import json, os
D = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(D + "/screensProtoDT312.json")); A = json.load(open(D + "/assetsProtoDT312.json"))
for k in S: S[k]["src"] = A[k]
S["a6"]["later"] = {"label": "30 minutes pass, not eaten ›", "to": "a6q"}
for k in ("a9",): S[k]["end"] = True
PATHS = [
  {"id": "a1", "name": "A", "title": "A recipe, lunch set", "line": "Lazy Burek from My recipes, planned for lunch. Cook it, eat it, then say how it was."},
  {"id": "b1", "name": "B", "title": "A new dish, no meal set", "line": "Eggs and salmon built on the Plate, with my own steps. Today asks which meal it was."},
  {"id": "c1", "name": "C", "title": "A plate that is ready to eat", "line": "Skyr and a banana: nothing to cook, so the button says Eat it."},
]
OUT = os.environ.get("CANVAS_DIR", "/home/claude/canvas/out")
T = "DT312 prototype: the new flow, to tap through"
html = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>%s</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&amp;display=swap">
<style>
body{margin:0}
button{font-family:inherit;cursor:pointer}
</style>
</helmet>
<div style="width: 390px; height: 844px; box-sizing: border-box; background: #f4f6fa; color: #172742; font-family: 'Nunito', ui-sans-serif, system-ui, sans-serif; font-size: 15px; display: flex; flex-direction: column; overflow: hidden; position: relative">
<div style="flex: 0 0 auto; background: #172742; color: #fff; padding: 8px 10px; display: flex; align-items: center; gap: 8px">
<button onClick="{{ back }}" style="height: 44px; min-width: 64px; border-radius: 14px; border: 1px solid #6f7d99; background: transparent; color: #fff; font-size: 14px; font-weight: 700">‹ Back</button>
<div style="flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px">
<span style="font-size: 12px; font-weight: 700; color: #f6d860">{{ tag }}</span>
<span style="font-size: 14px; font-weight: 700; line-height: 1.2">{{ title }}</span>
</div>
<button onClick="{{ home }}" style="height: 44px; min-width: 64px; border-radius: 14px; border: 1px solid #6f7d99; background: transparent; color: #fff; font-size: 14px; font-weight: 700">Paths</button>
</div>
<div ref="{{ scrollRef }}" style="flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden">
<sc-if value="{{ isMenu }}" hint-placeholder-val="{{ true }}">
<div style="padding: 20px 16px; display: flex; flex-direction: column; gap: 14px">
<b style="font-size: 22px; font-weight: 900; line-height: 1.2">DT312, the new flow</b>
<span style="font-size: 15px; font-weight: 400; line-height: 1.45; color: #3d4a63">Pick a path and tap through it. The blue rings show where to tap. The screens are pictures from a scratch build, so only the ringed places answer. Nothing in the app is changed yet.</span>
<sc-for list="{{ paths }}" as="p" hint-placeholder-count="3">
<button onClick="{{ p.go }}" style="text-align: left; padding: 14px 16px; border-radius: 14px; border: 2px solid #2a72d9; background: #fff; color: #172742; display: flex; flex-direction: column; gap: 6px; min-height: 44px">
<span style="font-size: 12px; font-weight: 700; color: #2a72d9">Path {{ p.name }}</span>
<span style="font-size: 17px; font-weight: 900">{{ p.title }} ›</span>
<span style="font-size: 14px; font-weight: 400; line-height: 1.4; color: #3d4a63">{{ p.line }}</span>
</button>
</sc-for>
</div>
</sc-if>
<sc-if value="{{ isScreen }}" hint-placeholder-val="{{ false }}">
<div style="position: relative; width: 390px; height: {{ h }}px; background: #fff">
<img src="{{ src }}" alt="{{ title }}" style="display: block; width: 390px; height: {{ h }}px">
<sc-for list="{{ spots }}" as="s" hint-placeholder-count="2">
<button onClick="{{ s.go }}" aria-label="Tap" style="position: absolute; left: {{ s.x }}px; top: {{ s.y }}px; width: {{ s.w }}px; height: {{ s.h }}px; border-radius: 14px; border: 3px solid #2a72d9; background: rgba(42,114,217,0.08); box-shadow: 0 0 0 4px rgba(42,114,217,0.22); padding: 0"></button>
</sc-for>
</div>
<sc-if value="{{ hasLater }}" hint-placeholder-val="{{ false }}">
<div style="padding: 14px 16px 20px; background: #fff7d1; display: flex; flex-direction: column; gap: 8px">
<span style="font-size: 13px; font-weight: 600; line-height: 1.4; color: #5c4a00">Not a part of the app: a way to see what Chef Mealan asks when the meal still waits.</span>
<button onClick="{{ goLater }}" style="height: 48px; border-radius: 14px; border: 2px solid #2a72d9; background: #fff; color: #1f5fc7; font-size: 15px; font-weight: 700">{{ laterLabel }}</button>
</div>
</sc-if>
<sc-if value="{{ isEnd }}" hint-placeholder-val="{{ false }}">
<div style="padding: 14px 16px 20px; background: #fff7d1; display: flex; flex-direction: column; gap: 8px">
<span style="font-size: 13px; font-weight: 600; line-height: 1.4; color: #5c4a00">The end of this path.</span>
<button onClick="{{ home }}" style="height: 48px; border-radius: 14px; border: 2px solid #2a72d9; background: #fff; color: #1f5fc7; font-size: 15px; font-weight: 700">Pick another path ›</button>
</div>
</sc-if>
</sc-if>
</div>
<sc-if value="{{ hasPin }}" hint-placeholder-val="{{ false }}">
<div style="flex: 0 0 auto; background: #fff; border-top: 1px solid #dfe5ef; padding: 10px 16px 10px; display: flex; flex-direction: column; gap: 8px">
<button onClick="{{ goPin }}" style="height: 48px; border-radius: 14px; border: 0; background: #2a72d9; color: #fff; font-size: 16px; font-weight: 700; box-shadow: 0 0 0 4px rgba(42,114,217,0.22)">{{ pinLabel }}</button>
<span style="font-size: 12px; font-weight: 600; color: #6b7892; text-align: center">Pinned here, above the tab bar, while the Plate scrolls</span>
</div>
</sc-if>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":844}}'>
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { id: "menu", hist: [] };
    this.box = null;
    this.scrollRef = (el) => { this.box = el; };
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState && prevState.id !== this.state.id && this.box) this.box.scrollTop = 0;
  }
  go(to) { this.setState({ id: to, hist: this.state.hist.concat([this.state.id]) }); }
  renderVals() {
    const S = %s;
    const P = %s;
    const id = this.state.id;
    const sc = S[id];
    const paths = P.map((p) => ({ name: p.name, title: p.title, line: p.line, go: () => this.go(p.id) }));
    const back = () => { const h = this.state.hist.slice(); if (!h.length) return; const to = h.pop(); this.setState({ id: to, hist: h }); };
    const home = () => this.setState({ id: "menu", hist: [] });
    const base = { scrollRef: this.scrollRef, paths: paths, back: back, home: home };
    if (!sc) return Object.assign(base, { isMenu: true, isScreen: false, hasPin: false, hasLater: false, isEnd: false, tag: "Prototype", title: "DT312, the new flow", spots: [], h: 0, src: "", pinLabel: "", laterLabel: "" });
    const path = id.charAt(0).toUpperCase();
    return Object.assign(base, {
      isMenu: false, isScreen: true,
      tag: "Path " + path + ", screen " + id,
      title: sc.title, src: sc.src, h: sc.h,
      spots: sc.spots.map((s) => ({ x: s.x - 3, y: s.y - 3, w: s.w + 6, h: s.h + 6, go: () => this.go(s.to) })),
      hasPin: !!sc.pin, pinLabel: sc.pin ? sc.pin.label : "", goPin: () => this.go(sc.pin.to),
      hasLater: !!sc.later, laterLabel: sc.later ? sc.later.label : "", goLater: () => this.go(sc.later.to),
      isEnd: !!sc.end,
    });
  }
}
</script>
</body>
</html>
""" % (T, json.dumps(S, ensure_ascii=False), json.dumps(PATHS, ensure_ascii=False))
open(OUT + "/ProtoDT312.dc.html", "w").write(html)
print(len(html))
