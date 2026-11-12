# Board "How Chef Mealan is built, from a phone" (canvas page System). Coach Milan 12 November 10:30 to 10:42: System and Kanban
# up to date, to show learners of the Turing College course Building with AI agents the full product cycle done from a phone,
# through chat and artifacts, with Google and GitHub. Facts as of 0.3.139 (builtFacts.json, the Preview log, docs/backlog.json).
import json, html
D = "/home/claude/canvas-live7/project"
F = json.load(open("/home/claude/platemate-scanner/src/builtFacts.json"))
W = 1566
WHO = {"milan": ("#c0392b", "Coach Milan, on his phone"), "claude": ("#8e44ad", "Claude, in a cloud workspace"), "github": ("#24292f", "GitHub"), "google": ("#1a73e8", "Google Cloud"), "people": ("#1e8e5a", "Testers and members")}
e = html.escape
def tag(k): c, n = WHO[k]; return f'<span style="display:inline-block;background:{c};color:#fff;border-radius:999px;padding:2px 9px;font-size:12px;font-weight:800;margin:2px 4px 0 0">{e(n)}</span>'
def step(n, title, who, lines, w=268):
    c = WHO[who[0]][0]
    return (f'<div style="width:{w}px;flex:none;box-sizing:border-box;border:2px solid {c};border-radius:14px;padding:10px 12px;background:#fff">'
            f'<div style="display:flex;gap:8px;align-items:center"><span style="flex:none;width:28px;height:28px;border-radius:14px;background:{c};color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:14px">{n}</span>'
            f'<b style="font-size:16px;line-height:1.25">{e(title)}</b></div><div style="margin-top:4px">{"".join(tag(k) for k in who)}</div>'
            + "".join(f'<div style="font-size:13.5px;line-height:1.45;color:#172742;margin-top:5px">{l}</div>' for l in lines) + "</div>")
ARROW = '<div style="flex:none;align-self:center;font-size:26px;color:#5b6b8a;width:22px;text-align:center">→</div>'
def section(title, sub, body): return (f'<div style="margin-top:26px"><div style="font-size:24px;font-weight:900;color:#123a7a">{e(title)}</div>'
    f'<div style="font-size:15px;line-height:1.5;color:#3d4a63;margin-top:4px;max-width:1200px">{sub}</div><div style="margin-top:12px">{body}</div></div>')
def row(cells, head=False):
    s = "font-weight:900;font-size:12.5px;letter-spacing:.04em;color:#5b6b8a;text-transform:uppercase" if head else "font-size:14px;line-height:1.45;color:#172742"
    return '<tr>' + "".join(f'<td style="padding:8px 10px;border-top:1px solid #d1dcf0;vertical-align:top;{s}">{c}</td>' for c in cells) + '</tr>'
def table(head, rows, widths):
    cols = "".join(f'<col style="width:{w}px">' for w in widths)
    return f'<table style="border-collapse:collapse;background:#fff;border:1.5px solid #d1dcf0;border-radius:12px;width:{sum(widths)}px"><colgroup>{cols}</colgroup>{row(head, True)}{"".join(row(r) for r in rows)}</table>'
def box(title, color, lines, w=360):
    return (f'<div style="width:{w}px;flex:none;box-sizing:border-box;border:2px solid {color};border-radius:12px;padding:10px 12px;background:#fff">'
            f'<b style="font-size:15px;color:{color}">{e(title)}</b>' + "".join(f'<div style="font-size:13.5px;line-height:1.45;color:#172742;margin-top:4px">{l}</div>' for l in lines) + "</div>")

legend = '<div style="display:flex;flex-wrap:wrap;gap:4px 6px;margin-top:10px">' + "".join(tag(k) for k in WHO) + '</div>'
facts = [("Version", F["version"]), ("Releases", f'{F["releases"]} since 2 October, about {F["perDay"]} a day'), ("Walkthroughs", f'{F["walkthroughs"]}, each one a person in a real browser, before every release'),
         ("Unit tests", str(F["unitTests"])), ("Evals", f'{F["evalCases"]} cases in {F["evalSets"]} sets, for the AI'), ("Languages", "English, Srpski, German in every release"), ("Live since", "30 September 2026, chefmealan.com"), ("Testers", "4 in the beta, by number in the public repo")]
factrow = '<div style="display:flex;flex-wrap:wrap;gap:10px">' + "".join(f'<div style="width:176px;flex:none;background:#eef3fb;border-radius:12px;padding:10px 12px"><div style="font-size:12px;font-weight:900;color:#5b6b8a;text-transform:uppercase;letter-spacing:.04em">{e(k)}</div><div style="font-size:14.5px;font-weight:700;line-height:1.35;color:#172742;margin-top:3px">{e(v)}</div></div>' for k, v in facts) + '</div>'

loop1 = '<div style="display:flex;gap:6px;align-items:stretch">' + ARROW.join([
  step(1, "An idea or a finding", ["milan", "people"], ["A message in the chat, a screenshot from the app, a call with a tester.", "Work is named by number: DT for a design, B for a bug."]),
  step(2, "Brainstorm", ["milan", "claude"], ["Talked through in the chat. Text only, nothing drawn.", "Open questions asked one at a time."]),
  step(3, "Draw", ["claude", "milan"], ["Claude draws a board on the canvas: the app as it is today, beside the change, with the story.", "The screens are the real app, run and photographed in the cloud."]),
  step(4, "Prototype, when it helps", ["claude", "milan"], ["For a flow of 3 or more screens: a page that clicks through the screens like the app.", "Milan taps through it on the phone."]),
  step(5, "Go", ["milan"], ["One word in the chat. Only an approved board is built, exactly as drawn.", "A bug: Reproduce, then Go, then Fix."]),
]) + '</div>'
loop2 = '<div style="display:flex;gap:6px;align-items:stretch;margin-top:12px">' + ARROW.join([
  step(6, "Build and test", ["claude"], ["A branch in the repo. The code, the unit tests, the walkthroughs, the Srpski and German lines, a version number.", f'All {F["walkthroughs"]} walkthroughs run before it merges.']),
  step(7, "Merge", ["claude", "github"], ["Into main on GitHub, with a note of what changed and why.", "The language tables are published for Milan to confirm Srpski."]),
  step(8, "Preview", ["github", "google"], ["Run workflow on GitHub Actions. GitHub signs in to Google Cloud with no key and puts the build on Cloud Run as a preview link."]),
  step(9, "Check on the phone", ["milan", "people"], ["Milan opens the preview link, tries the change, sends what is wrong.", "Back to 3 if the design was wrong, to 6 if the code was."]),
  step(10, "Promote, or roll back", ["milan", "github", "google"], ["Milan taps Promote on GitHub: the preview becomes chefmealan.com. Rollback is one tap too.", "Only Milan does this step."]),
]) + '</div>'
loopnote = '<div style="font-size:14px;line-height:1.5;color:#3d4a63;margin-top:10px">Each chat ends with a handover note in the Claude Project, so the next chat starts from it, not from memory. The Kanban on the canvas shows every card by its state; the running costs doc lists every service and its price.</div>'

tools = table(["Tool", "What it does for Chef Mealan", "Where it runs", "Who uses it"], [
  ["<b>The phone</b>: Chrome and the Claude app", "Everything Milan does: chat, boards, prototypes, the preview, GitHub's buttons, Google Cloud's console", "Milan's phone", tag("milan")],
  ["<b>Claude</b> (Claude Code in a cloud workspace)", "Writes and tests the code, runs the walkthroughs, draws the boards and prototypes, drafts Srpski and German", "Anthropic's cloud: a Linux workspace with the repo, Node, a headless Chromium", tag("claude")],
  ["<b>Design canvas</b> (a Claude artifact)", "The boards for Draw; the Kanban; this board", "claude.ai, opened on the phone", tag("claude") + tag("milan")],
  ["<b>Clickable prototypes</b> (Claude artifacts)", "Phone-sized pages made of the app's own screens, with taps and swipes", "claude.ai", tag("claude") + tag("milan")],
  ["<b>Language tables</b> (Claude artifacts)", "Srpski to confirm line by line; German as Beta", "claude.ai", tag("milan")],
  ["<b>Claude Docs and Claude Project</b>", "Plans, running costs, rules; the handover notes between chats", "claude.ai", tag("claude") + tag("milan")],
  ["<b>GitHub</b>", "The code (public), the history, and the Preview, Promote and Rollback buttons (Actions)", "github.com", tag("github") + tag("milan")],
  ["<b>Google Cloud</b>", "Cloud Run (the server, Belgium), Firestore (the data, Belgium), Cloud Storage (photos, Frankfurt), Identity Platform (sign-in), Secret Manager (the AI key), Logging, Cloud Build", "Google Cloud, EU regions", tag("google")],
  ["<b>Gemini</b>", "Reads photos, labels and menus; the chat with Chef Mealan; recipe steps; drawn covers", "Google, called only from the server", tag("google")],
  ["<b>Playwright with Chromium</b>", f'The {F["walkthroughs"]} walkthroughs, and the screenshots for boards and prototypes', "Claude's cloud workspace", tag("claude")],
  ["<b>Open Food Facts, Google Calendar</b>", "Barcodes and products; the meals in a calendar", "Their own services", tag("google")],
], [280, 540, 340, 354])

compare = table(["What a course setup uses", "What this project uses instead"], [
  ["A laptop with a terminal", "A phone and the Claude app. The terminal is Claude's cloud workspace."],
  ["A code editor and local files", "The repo on GitHub. Milan reads boards and prototypes, not code."],
  ["Commands to deploy", "Buttons on GitHub: Preview, Promote, Rollback."],
  ["Vercel for hosting", "Google Cloud: Cloud Run, Firestore, Storage, sign-in, in EU regions."],
  ["Notes and screenshots by hand", "The canvas, prototypes, docs and the Project's handover notes, all in claude.ai."],
], [500, 1014])

app = '<div style="display:flex;gap:16px;flex-wrap:wrap">' + "".join([
  box("The phone: chefmealan.com", "#2e7be8", ["A web app (React, TypeScript, Vite) installed from the browser.", "The person's data lives on the phone first, then in the account.", "The numbers (PD, the letters, the fit, the plan) are code on the phone. Voice is the browser's own."]),
  box("The server: Cloud Run, Belgium", "#1a73e8", ["Express, one process. Serves the app and the public pages.", "Every AI call goes through it; the phone never holds a key.", "The coach's rules in code: what a plate may hold, what the app may say."]),
  box("The AI: Gemini", "#8e44ad", ["3.8 Flash first, 3.6 Flash when it fails, Flash-Lite for small tasks, Flash Image for covers.", "Each answer checked by code before it reaches the person."]),
  box("The account: Firebase", "#d35400", ["Firestore in Belgium; photos as files in Frankfurt; a backup every day.", "Sign-in with Google or an email link. Security rules decide who reads what."]),
]) + '</div>'

body = (f'<div style="width:{W}px;box-sizing:border-box;padding:22px 26px;background:#fff;color:#172742;font-family:Nunito,ui-sans-serif,system-ui,sans-serif">'
  f'<div style="font-size:30px;font-weight:900;line-height:1.2">How Chef Mealan is built, from a phone</div>'
  f'<div style="font-size:16px;line-height:1.5;color:#3d4a63;margin-top:6px;max-width:1300px">A production app built as a product team would build it, by one product manager and Claude. Coach Milan works on his phone only. Everything else runs in the cloud: Claude, GitHub and Google. As of {F["version"]}, 12 November 2026.</div>'
  + legend + '<div style="margin-top:16px">' + factrow + '</div>'
  + section("One change, from idea to live", "Ten steps, the same for every change. Steps 1 to 5 decide what to build; steps 6 to 10 build it and put it live. Nothing is built before Go, and nothing goes live without Milan's tap.", loop1 + loop2 + loopnote)
  + section("The tools, and where each runs", "Nothing runs on a laptop. Every tool is opened from the phone, or runs in the cloud on Claude's side or Google's.", tools)
  + section("A course setup, and this project", "The Turing College course Building with AI agents teaches a laptop setup. This project does the same cycle without one.", compare)
  + section("The app, as it runs", "Four parts. The person's phone holds the app and their data first; the server holds the AI key and the rules.", app)
  + '</div>')
H = 2290
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>How Chef Mealan is built, from a phone</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&amp;display=swap">
<style>body{{margin:0}}</style>
</helmet>
{body}
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
open(f"{D}/Build.dc.html", "w").write(page); print("Build.dc.html", len(page) // 1024, "KB")
