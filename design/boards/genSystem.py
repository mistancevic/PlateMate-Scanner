# System board (canvas page Kanban, under the Kanban and Paths). Coach Milan 2 November 06:45 to 07:01: the system map, and
# every happy path step by step with what does it: Code, Rules, LLM or Human. Drawn from server.ts and src as of 0.3.50.
import os, html
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
TAG = {"code": ("#2e7be8", "Code"), "rules": ("#1e8e5a", "Rules"), "llm": ("#8e44ad", "LLM"), "human": ("#d35400", "Human")}
def chip(k, t): return f'<span style="display:inline-block;border-left:4px solid {TAG[k][0]};background:#f4f7fc;border-radius:6px;padding:3px 8px;font-size:12.5px;line-height:1.3;color:#172742;margin:3px 4px 0 0"><b style="color:{TAG[k][0]};font-size:11px">{TAG[k][1]}</b> {html.escape(t)}</span>'
def box(title, lines, color, w=300):
    return (f'<div style="width:{w}px;box-sizing:border-box;border:2px solid {color};border-radius:12px;padding:10px 12px;background:#fff">'
            f'<b style="font-size:15px;color:{color}">{html.escape(title)}</b>' + "".join(f'<div style="font-size:12.5px;line-height:1.45;color:#172742;margin-top:4px">{l}</div>' for l in lines) + "</div>")
def arrow(t): return f'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:70px;font-size:11px;color:#5b6b8a;text-align:center;line-height:1.3"><span style="font-size:22px;color:#172742">→</span>{t}</div>'

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
# ---- part 2: the paths, step by step
P = [
 ("P1 Get in", [("human","reads the home page, tries the calculator"),("code","the calculator, the letters"),("human","joins the beta, signs in with Google"),("code","Firebase Auth"),("human","I'm 18 or older, consent, profile, goal"),("rules","what each step needs; the row To set"),("code","PD target, protein a day, the window")]),
 ("P2 Know my numbers", [("code","formula from sex, age, height, weight, goal, lifestyle"),("rules","the coach's bands and paces"),("human","picks the goal, changes it later"),("code","Today and Your summary show them")]),
 ("P3 Decide at the shelf", [("human","points the camera at a label or barcode"),("code","Open Food Facts for a barcode"),("llm","reads the label's table from the photo"),("code","PD, letters, the fit against today"),("rules","what fits the moment, Mix it"),("human","one tap to a plate")]),
 ("P4 Make a craving fit", [("human","foods onto the Plate, amounts"),("code","the numbers as you type"),("code","Fit to my target sizes the plate"),("rules","a dish keeps its proportions; portions; the plate asks one thing (DT212)"),("llm","Chef Mealan's checks: culinary, nutrition, your day"),("human","Make it, Ate it")]),
 ("P5 Photo of my meal", [("human","takes the photo"),("llm","foods read, grams estimated"),("code","names in one language, numbers"),("rules","the checks on the plate"),("human","corrects an amount, Read it again (DT212), Ate it"),("code","saved to the day; the eval case if weighed")]),
 ("P6 Keep and cook a recipe", [("human","saves from the Plate, or a screenshot or link"),("llm","reads the recipe from the picture or page"),("code","nutrition per serving, the makes"),("llm","drafts the steps at your amounts"),("human","checks the steps, Start cooking (DT211)"),("code","read aloud and listening: the browser's own voice, no AI"),("llm","Chef, a question about this step"),("code","the kitchen screen session")]),
 ("P7 Live the day", [("code","the plan, the slots, today against it"),("rules","meals a day, the window, training days"),("human","fills slots, quick picks, says what happened"),("llm","Chef Mealan's lines in your context"),("code","the day adds up")]),
 ("P8 Shop and travel", [("code","the shopping list from the week"),("human","ticks, carries on; sets where I stay"),("rules","travel mode: what a hotel kitchen allows")]),
 ("P9 Out, or missing something", [("human","I don't have it; a question"),("code","what I have, from my foods"),("llm","the helper and the chat"),("rules","no food called good or bad, no grams in chat"),("human","a craving after the chat")]),
 ("P10 Learn why", [("code","Explorer pages, written by hand, no AI"),("rules","the wellness line: food and training, never a condition"),("human","reads, reacts (DT195, later)")]),
 ("P11 Share with my coach, or leave", [("human","chooses what the coach sees, sends a card"),("code","Firestore link coach and client"),("human","the coach's note comes back"),("human","export, delete my account"),("code","full deletion, photos included")]),
 ("C1 Get clients in", [("human","the coach makes a code"),("code","invites, sign-ups"),("human","the client joins")]),
 ("C2 See what waits", [("code","the count on the Clients tab (DT210)"),("human","opens Clients")]),
 ("C3 Read one client", [("code","Today, Week, Shared, Goal from the client's shared data"),("human","reads, decides")]),
 ("C4 Answer and suggest", [("human","answers a card, a note, a suggestion, approves numbers"),("code","to the client's phone"),("human","makes a client a cook")]),
 ("C5 Publish for members", [("human","a cook sends a recipe"),("llm","the cover picture, if asked"),("human","the coach approves or sends it back"),("code","the live page /r/slug, members' names")]),
 ("C6 Run my own day", [("code","the coach's own five tabs, always their own"),("human","the same as a person")]),
 ("C7 Know it works", [("code","unit tests, walkthroughs, foundations, the runs"),("rules","photo advice and numbers evals"),("llm","model evals: chat, plate questions, photo read; the judge"),("human","the coach labels pass or fail; agreement with the judge"),("code","Metrics, Running costs")]),
]
def pathCard(name, steps):
    return (f'<div style="border:1.5px solid #d1dcf0;border-radius:10px;padding:9px 11px;background:#fff;break-inside:avoid;margin-bottom:8px">'
            f'<b style="font-size:14px;color:#123a7a">{html.escape(name)}</b><div style="margin-top:2px">{"".join(chip(k, t) for k, t in steps)}</div></div>')
legend = "".join(f'<span style="display:inline-block;background:{c};color:#fff;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:800;margin-right:8px">{n}</span>' for c, n in TAG.values())
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
<div style="font-size:14px;color:#3d4a63;font-weight:600;line-height:1.45;margin-top:4px">As of 0.3.50. Top: the parts and what runs where. Below: the 18 happy paths step by step, each step tagged with what does it. Code is deterministic and tested by unit tests and walkthroughs. Rules are the coach's rules written as code, tested the same way and by the rule evals. LLM is a Gemini call, tested by evals with a human label and a judge. Human is where a person or the coach decides.</div>
<div style="font-size:12px;font-weight:900;color:#5b6b8a;letter-spacing:.05em;margin:18px 0 8px">THE SYSTEM</div>
{grid}
<div style="font-size:12px;font-weight:900;color:#5b6b8a;letter-spacing:.05em;margin:22px 0 8px">THE PATHS, STEP BY STEP &nbsp; {legend}</div>
<div style="column-count:2;column-gap:14px">{"".join(pathCard(*p) for p in P)}</div>
<div style="font-size:12.5px;color:#3d4a63;line-height:1.45;margin-top:12px"><b>Reading it:</b> an LLM chip is where an eval belongs and where a person can still correct the answer on the screen; a Rules chip is a line in docs/rules with a case; a Code chip is a walkthrough. A path with no LLM chip (P2, P8, P10, C2, C3, C6) works with the AI off and costs nothing to run.</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{W},"height":2400}}}}'>
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
