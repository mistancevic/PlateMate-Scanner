# System board (canvas page Kanban, under the Kanban and Paths). Coach Milan 2 November 06:45 to 07:01: the system map, and
# every happy path step by step with what does it: Code, Rules, LLM or Human. Drawn from server.ts and src as of 0.3.50.
import os, html
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
TAG = {"code": ("#2e7be8", "Code"), "rules": ("#1e8e5a", "Rules"), "llm": ("#8e44ad", "LLM"), "human": ("#d35400", "Client"), "coach": ("#d35400", "Coach"), "owner": ("#d35400", "Owner")}
def chip(k, t): return f'<span style="display:inline-block;border-left:4px solid {TAG[k][0]};background:#f4f7fc;border-radius:6px;padding:3px 8px;font-size:12.5px;line-height:1.3;color:#172742;margin:3px 4px 0 0"><b style="color:{TAG[k][0]};font-size:11px">{TAG[k][1]}</b> {html.escape(t)}</span>'
def box(title, lines, color, w=300):
    return (f'<div style="width:{w}px;box-sizing:border-box;border:2px solid {color};border-radius:12px;padding:10px 12px;background:#fff">'
            f'<b style="font-size:15px;color:{color}">{html.escape(title)}</b>' + "".join(f'<div style="font-size:12.5px;line-height:1.45;color:#172742;margin-top:4px">{l}</div>' for l in lines) + "</div>")
def arrow(t): return f'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:70px;font-size:11px;color:#5b6b8a;text-align:center;line-height:1.3"><span style="font-size:22px;color:#172742">→</span>{t}</div>'

LEGEND = ('<div style="display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:#172742;margin-top:8px;padding:8px 10px;background:#f4f7fc;border-radius:10px">'
  '<b style="color:#5b6b8a">CODES</b>'
  '<span><b>P1 to P11</b> a person\'s happy paths</span><span><b>C1 to C7</b> a coach\'s happy paths</span>'
  '<span><b>DT</b> a design ticket (Draw, then Go)</span><span><b>HP</b> a home page ticket</span>'
  '<span><b>EX</b> Explorer, <b>EV</b> evals, <b>OP</b> operations, <b>R</b> recipes, <b>f</b> a privacy finding</span>'
  '<span><b>Stories N</b> the board on Page 2</span><span><b>v0.3.50</b> the version it shipped in</span></div>')
# ---- part 1: the system map
phone = box("The phone: chefmealan.com", [
  "A web app (React, TypeScript, Vite) installed from the browser. Works offline for the plate and the numbers.",
  "<b>Everything about the person lives on the phone first</b>: profile, goal, foods, plates, recipes, the week. Kept in localStorage, sent to the account a second after changes settle.",
  "Camera: labels, barcodes, Photo of my meal. Speech: the browser's own, for Say what you have and cooking (no AI, nothing sent).",
  "The calculator (PD, the letters, the fit, the plan): <b>code on the phone</b>, no server needed.",
  "Public pages: home, /recipes, /r/slug, /built, legal."], "#2e7be8", 330)
server = box("The server: Cloud Run, Frankfurt", [
  "Express, one process, 70 routes. Serves the app and the public pages.",
  "<b>Every AI call goes through here</b>; the phone never holds a key.",
  "Rules in code: the coach's rules (docs/rules) on plates, drinks, meals a day, the eating window, what the app may say.",
  "Counting: events, visits, the AI bill per call; Metrics and Running costs for the owner.",
  "The kitchen screen: a 4-letter code, two screens read the same session every 2 s.",
  "Deploy: ./deploy/preview.sh, then promote; one-line rollback; the version at the foot of every page."], "#172742", 330)
gemini = box("Gemini (Google)", [
  "gemini-3.8-flash first, 3.5-flash-lite and 3.6-flash as the fallbacks; the fastest answer wins.",
  "<b>What asks the model:</b> Photo of my meal (foods, grams), Scan a label (the table), Chef Mealan's questions and chat, Chef Mealan's checks on a plate, a recipe from a screenshot or a link, the steps, a swap, the tip, the cover picture, the judge in Evals.",
  "Every answer must fit a schema; a bad one is dropped, the fallback asked.",
  "Price per call counted; target under €1 per active member a month."], "#8e44ad", 330)
firebase = box("Firebase (Google)", [
  "Auth: sign in with Google. Firestore: the account's copy of the phone's data, coach and client links, shared cards, invites, waiting list, metrics.",
  "Storage: photos as files, Frankfurt. Access and deletion by the person: export, full delete."], "#1e8e5a", 330)
others = box("Also", [
  "Open Food Facts: a barcode or a search, the product's name and picture.",
  "Google Calendar: training and busy times, when switched on.",
  "GitHub: the code, design/boards, docs/rules, docs/qa/runs. Public today."], "#5b6b8a", 330)
people = box("People", [
  "<b>A person</b> on the phone. <b>A coach</b> (Milan) on the same app with a sixth tab. <b>The owner</b> (Milan) on Metrics, Running costs, Evals.",
  "<b>Testers 1 to 3</b> on preview. <b>Claude</b> builds: brainstorm, Draw, Go; tests; releases.",
  "Not yet: a second developer, a reviewer for German, a designer. The boards, the rules and this map are what they would read first."], "#d35400", 330)
quality = box("How we know it works", [
  "<b>Unit tests</b> 531, every push. <b>Walkthroughs</b> 148 in a real browser, every release, the run kept in docs/qa/runs. <b>Foundations</b>: colours, sizes, 44 px.",
  "<b>Evals</b> 90 cases in 7 sets: numbers and swaps (code, every push); photo advice (rules); the chat, the plate questions, the photo read (model, before a release, server and key needed); the judge and its agreement with the coach.",
  "<b>Missing</b>: model evals on every push; a trace per AI call (prompt, answer, cost) to read when a case fails."], "#16a085", 330)
grid = (f'<div style="display:grid;grid-template-columns:330px 70px 330px 70px 330px 70px 330px;gap:14px 0;align-items:stretch">'
        f'{people}{arrow("uses")}{phone}{arrow("HTTPS, JSON")}{server}{arrow("key on the server only")}{gemini}'
        f'<div></div><div></div><div></div><div></div>{firebase}<div></div>{others}'
        f'<div></div><div></div>{quality}<div></div><div></div><div></div><div></div></div>')

def arch():
    # the technical graph: HTML boxes (text wraps, never crosses a border) over an SVG of plain lines and triangles
    BOX = [
      ("people",20,80,230,150,"#d35400","People",["a person, a coach, the owner","Testers 1 to 3 on preview","Claude builds and tests"]),
      ("phone",330,60,300,200,"#2e7be8","Phone: chefmealan.com (PWA)",["React, TypeScript, Vite","state in localStorage, offline first","the calculator and the letters: code","camera: label, barcode, Photo of my meal","speech: the browser's own voice and ears","public pages: home, /recipes, /r/slug, /built"]),
      ("kitchen",360,370,240,80,"#2e7be8","Kitchen screen",["a second phone, /cook, 4-letter code"]),
      ("server",720,60,320,200,"#172742","Server: Cloud Run, Frankfurt",["Express, one process, 70 routes","serves the app and the public pages","the coach's rules in code (docs/rules)","every AI call, with its schema and fallbacks","events and the AI bill per call (Metrics)","deploy: preview.sh, promote, rollback"]),
      ("gemini",1130,60,300,120,"#8e44ad","Gemini (Google AI)",["gemini-3.8-flash; 3.5-flash-lite, 3.6-flash","photo read, label table, chat, checks, recipe read,","steps, swap, tip, cover, judge"]),
      ("firebase",1130,220,300,110,"#1e8e5a","Firebase (Google)",["Auth: sign in with Google","Firestore: accounts, links, cards, metrics","Storage: photos as files, Frankfurt"]),
      ("other",1130,370,300,80,"#5b6b8a","Open Food Facts · Google Calendar",["barcodes and search · training and busy times"]),
      ("github",720,370,320,80,"#16a085","GitHub: the repo",["code, boards, rules, qa runs, evals; CI: unit tests"]),
    ]
    boxes = "".join(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;box-sizing:border-box;border:2.5px solid {c};border-radius:12px;background:#fff;padding:8px 10px;overflow:hidden;text-align:center">'
                    f'<b style="display:block;font-size:14px;color:{c};line-height:1.25">{t}</b>' + "".join(f'<div style="font-size:11.5px;line-height:1.35;color:#3d4a63">{l}</div>' for l in sub) + '</div>' for _, x, y, w, h, c, t, sub in BOX)
    g = []
    def tri(x, y, d):  # a triangle pointing in direction d at the tip (x, y)
        pts = {"r": f"{x},{y} {x-10},{y-5} {x-10},{y+5}", "l": f"{x},{y} {x+10},{y-5} {x+10},{y+5}", "d": f"{x},{y} {x-5},{y-10} {x+5},{y-10}", "u": f"{x},{y} {x-5},{y+10} {x+5},{y+10}"}[d]
        return f'<polygon points="{pts}" fill="#172742"/>'
    def line(pts): return f'<polyline points="{pts}" fill="none" stroke="#172742" stroke-width="2"/>'
    def lab(x, y, t, anchor="middle"): return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-size="11" fill="#5b6b8a">{t}</text>'
    # people → phone
    g += [line("250,155 330,155"), tri(330,155,"r"), lab(290,148,"uses")]
    # phone ↔ server
    g += [line("630,160 720,160"), tri(630,160,"l"), tri(720,160,"r"), lab(675,152,"HTTPS, JSON")]
    # server ↔ gemini
    g += [line("1040,120 1130,120"), tri(1040,120,"l"), tri(1130,120,"r"), lab(1085,110,"the key")]
    # server ↔ firebase
    g += [line("1040,245 1130,245"), tri(1040,245,"l"), tri(1130,245,"r"), lab(1085,237,"admin SDK")]
    # server → open food facts, around the right of github
    g += [line("1000,260 1000,352 1090,352 1090,410 1130,410"), tri(1130,410,"r"), lab(1008,310,"fetch","start")]
    # phone ↔ kitchen
    g += [line("480,260 480,370"), tri(480,260,"u"), tri(480,370,"d"), lab(490,320,"polls every 2 s","start")]
    # server → github
    g += [line("880,260 880,370"), tri(880,370,"d"), lab(890,320,"git push, deploy","start")]
    # phone ↔ firebase, over the top and down the right side, outside Gemini
    g += [line("480,60 480,22 1460,22 1460,300 1430,300"), tri(480,60,"d"), tri(1430,300,"l"), lab(970,16,"sign in with Google, the account's copy of the phone's data, photos (Firebase SDK)")]
    svg = f'<svg width="1480" height="470" viewBox="0 0 1480 470" style="position:absolute;left:0;top:0;font-family:Nunito,ui-sans-serif,system-ui,sans-serif">{"".join(g)}</svg>'
    return f'<div style="position:relative;width:1480px;height:470px;margin-top:8px;font-family:Nunito,ui-sans-serif,system-ui,sans-serif">{svg}{boxes}</div>'

WORDS = [
  ("Unit test", "One function, one input, one expected number. Fast, runs on every push.", "src/*.test.ts, npm test, 531"),
  ("Walkthrough", "A browser drives the real app through one story and checks each screen. Deterministic.", "tests/flows/*.cjs, 148"),
  ("Happy path", "A job a person wants done, end to end. Not a test; a list of walkthroughs that together prove the job.", "paths.cjs, the Paths board"),
  ("Harness", "The machinery that runs tests and reports: lanes, a server per lane, the run file, the walkthroughs page.", "scripts/run-flows.cjs, docs/qa/runs"),
  ("Eval", "A check on something with no single right answer: an AI reply, a photo read, a swap. Cases, a bar, a human label, a judge, their agreement.", "evals/, 90 cases in 7 sets"),
  ("Golden set", "Eval cases the coach passed by hand; the answer must stay within them.", "number-cases.json, swap-golden.json"),
  ("Judge", "A second model grading the first's answer, trusted only where it agrees with the coach.", "eval:align, bar 8 of 10"),
  ("Foundations", "The design rules checked as a test: colours, sizes, weights, 44 px.", "foundations.cjs, design-rules.cjs"),
  ("Smoke test", "Build and open the main pages, nothing more.", "test:ui"),
  ("Rules", "The coach's rules, numbered, each with the code that holds it. 39 nutrition, 40 culinary.", "docs/rules/nutrition.md, culinary.md"),
  ("Safety rules", "Adults only (two checks). A declared allergy blocks the food everywhere. A declared situation gets a fixed answer, written once and approved, never improvised. No health claims in any prompt. The three gates: culinary, nutrition, your day.", "rules N1, N50 to N53, C25; src/safety.ts, gates.ts; walkthroughs safety, three-gates, age-gate"),
  ("Loop", "Fail, name the pattern, fix the prompt or the code, add it as a case, run again.", "evals/README.md, step 5"),
  ("Pilot log, outcome measures", "What testers did: accepted, completed, DaaM good. Read per identity × goal, never averaged.", "Metrics, the log"),
]
def words():
    rows = "".join(f'<tr><td style="padding:6px 8px;border-bottom:1px solid #e6edf8;font-weight:800;white-space:nowrap;vertical-align:top">{html.escape(w)}</td><td style="padding:6px 8px;border-bottom:1px solid #e6edf8;vertical-align:top">{html.escape(d)}</td><td style="padding:6px 8px;border-bottom:1px solid #e6edf8;vertical-align:top;color:#1f5fc7;font-family:ui-monospace,monospace;font-size:12px">{html.escape(h)}</td></tr>' for w, d, h in WORDS)
    return f'<table style="width:100%;border-collapse:collapse;font-size:13px;color:#172742;background:#fff;border:1.5px solid #d1dcf0;border-radius:12px"><tr><th style="text-align:left;padding:6px 8px;font-size:11.5px;color:#5b6b8a">WORD</th><th style="text-align:left;padding:6px 8px;font-size:11.5px;color:#5b6b8a">WHAT IT IS</th><th style="text-align:left;padding:6px 8px;font-size:11.5px;color:#5b6b8a">WHERE IN THE REPO</th></tr>{rows}</table>'

# ---- part 2: the paths, step by step
P = [
 ("P1 Get in", [("human","reads the home page, tries the calculator"),("code","the calculator, the letters"),("human","joins the beta, signs in with Google"),("code","Firebase Auth"),("human","I'm 18 or older, consent, profile, goal"),("rules","what each step needs; the row To set"),("code","PD target, protein a day, the window")]),
 ("P2 Know my numbers", [("code","formula from sex, age, height, weight, goal, lifestyle"),("rules","the coach's bands and paces"),("human","picks the goal, changes it later"),("code","Today and Your summary show them")]),
 ("P3 Decide at the shelf", [("human","points the camera at a label or barcode"),("code","Open Food Facts for a barcode"),("llm","reads the label's table from the photo"),("code","PD, letters, the fit against today"),("rules","what fits the moment, Mix it"),("human","checks the table the model read, corrects it"),("human","one tap to a plate")]),
 ("P4 Make a craving fit", [("human","foods onto the Plate, amounts"),("code","the numbers as you type"),("code","Fit to my target sizes the plate"),("rules","a dish keeps its proportions; portions; the plate asks one thing (DT212)"),("llm","Chef Mealan's checks: culinary, nutrition, your day"),("human","Make it, Ate it")]),
 ("P5 Photo of my meal", [("human","takes the photo"),("llm","foods read, grams estimated"),("code","names in one language, numbers"),("rules","the checks on the plate"),("human","checks the read: corrects an amount, Read it again (DT212)"),("human","Ate it"),("code","saved to the day; the eval case if weighed")]),
 ("P6 Keep and cook a recipe", [("human","saves from the Plate, or a screenshot or link"),("llm","reads the recipe from the picture or page"),("code","nutrition per serving, the makes"),("llm","drafts the steps at your amounts"),("human","checks the drafted steps"),("human","Start cooking (DT211)"),("code","read aloud and listening: the browser's own voice, no AI"),("llm","Chef, a question about this step"),("code","the kitchen screen session")]),
 ("P7 Live the day", [("code","the plan, the slots, today against it"),("rules","meals a day, the window, training days"),("human","fills slots, quick picks, says what happened"),("llm","Chef Mealan's lines in your context"),("code","the day adds up")]),
 ("P8 Shop and travel", [("code","the shopping list from the week"),("human","ticks, carries on; sets where I stay"),("rules","travel mode: what a hotel kitchen allows")]),
 ("P9 Out, or missing something", [("human","I don't have it; a question"),("code","what I have, from my foods"),("llm","the helper and the chat"),("rules","no food called good or bad, no grams in chat"),("human","a craving after the chat")]),
 ("P10 Learn why", [("code","Explorer pages, written by hand, no AI"),("rules","the wellness line: food and training, never a condition"),("human","reads, reacts (DT195, later)")]),
 ("P11 Share with my coach, or leave", [("human","chooses what the coach sees, sends a card"),("code","Firestore link coach and client"),("human","the coach's note comes back"),("human","export, delete my account"),("code","full deletion, photos included")]),
 ("C1 Get clients in", [("coach","makes a code"),("code","invites, sign-ups"),("human","the client joins")]),
 ("C2 See what waits", [("code","the count on the Clients tab (DT210)"),("coach","opens Clients")]),
 ("C3 Read one client", [("code","Today, Week, Shared, Goal from the client's shared data"),("coach","reads"),("coach","decides what to suggest")]),
 ("C4 Answer and suggest", [("coach","answers a card, a note, a suggestion"),("coach","checks and approves the client's numbers"),("code","to the client's phone"),("coach","makes a client a cook")]),
 ("C5 Publish for members", [("human","a cook sends a recipe"),("llm","the cover picture, if asked"),("coach","checks the recipe: approves or sends it back"),("code","the live page /r/slug, members' names")]),
 ("C6 Run my own day", [("code","the coach's own five tabs, always their own"),("coach","the same as a person")]),
 ("C7 Know it works", [("code","unit tests, walkthroughs, foundations, the runs"),("rules","photo advice and numbers evals"),("llm","model evals: chat, plate questions, photo read; the judge"),("owner","labels pass or fail; agreement with the judge"),("owner","reads Metrics, Running costs")]),
]
def pathCard(name, steps):
    return (f'<div style="border:1.5px solid #d1dcf0;border-radius:10px;padding:9px 11px;background:#fff;break-inside:avoid;margin-bottom:8px">'
            f'<b style="font-size:14px;color:#123a7a">{html.escape(name)}</b><div style="margin-top:2px">{"".join(chip(k, t) for k, t in steps)}</div></div>')
legend = "".join(f'<span style="display:inline-block;background:{c};color:#fff;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:800;margin-right:8px">{n}</span>' for c, n in TAG.values()) + '<span style="font-size:12px;color:#5b6b8a;font-weight:700">red = a human, by role</span>'
W = 18 * 2 + 4 * 330 + 3 * 70
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>System</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&amp;display=swap">
<style>body{{margin:0}}</style>
</helmet>
<div style="width:{W}px;box-sizing:border-box;padding:18px;background:#fff;color:#172742;font-family:'Nunito',ui-sans-serif,system-ui,sans-serif;font-size:15px">
<b style="font-size:22px;font-weight:900">Chef Mealan: the system, and who does what on every path</b>
<div style="font-size:14px;color:#3d4a63;font-weight:600;line-height:1.45;margin-top:4px">As of 0.3.50. Top: the parts and what runs where. Below: the 18 happy paths step by step, each step tagged with what does it. Code is deterministic and tested by unit tests and walkthroughs. Rules are the coach's rules written as code, tested the same way and by the rule evals. LLM is a Gemini call, tested by evals with a human label and a judge. Human is red, by role: Client, Coach, Owner. A human step that says checks, corrects or approves is a human in the loop: a person checking what code or the model produced before it counts.</div>
{LEGEND}
<div style="font-size:12px;font-weight:900;color:#5b6b8a;letter-spacing:.05em;margin:18px 0 8px">THE TECHNICAL GRAPH</div>
{arch()}
<div style="font-size:12px;font-weight:900;color:#5b6b8a;letter-spacing:.05em;margin:18px 0 8px">THE WORDS, AND WHERE EACH LIVES IN THE REPO</div>
{words()}
<div style="font-size:12px;font-weight:900;color:#5b6b8a;letter-spacing:.05em;margin:18px 0 8px">THE PARTS, IN WORDS</div>
{grid}
<div style="font-size:12px;font-weight:900;color:#5b6b8a;letter-spacing:.05em;margin:22px 0 8px">THE PATHS, STEP BY STEP &nbsp; {legend}</div>
<div style="column-count:2;column-gap:14px">{"".join(pathCard(*p) for p in P)}</div>
<div style="font-size:12.5px;color:#3d4a63;line-height:1.45;margin-top:12px"><b>Reading it:</b> an LLM chip is where an eval belongs, and a red chip that says checks should follow it, the human in the loop; a Rules chip is a line in docs/rules with a case; a Code chip is a walkthrough. A path with no LLM chip (P2, P8, P10, C2, C3, C6) works with the AI off and costs nothing to run.</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{W},"height":3400}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{}};
  }}
}}
</script>
</body>
</html>
'''
open(f"{D}/System.dc.html", "w").write(page); print("System.dc.html", W, len(page) // 1024, "KB")
