# Happy paths board (canvas page Kanban, beside the Kanban). Coach Milan 2 November 01:19: the main jobs people and coaches
# want done. Each path names the walkthroughs that guard it in tests/flows; a path with no guard is checked on the phone.
import os, html, json
D = os.environ.get("CANVAS_DIR", "/home/claude/canvas/project")
FLOWS = set(f[:-4] for f in os.listdir("/home/claude/platemate-scanner/tests/flows") if f.endswith(".cjs"))
PERSON = [
  ("P1", "Get in", "Open chefmealan.com, read what it is, try the calculator, join the beta. Sign in, say I'm 18 or older, give consent, set profile and goal. The row under My goal says what is still to set.", ["home-page", "age-gate", "safety-setup", "first-goal", "setup-row", "setup-screen", "your-summary"], "sign-in and the coach code on the phone"),
  ("P2", "Know my numbers", "Goal, PD target, protein a day, the eating window; see them on Today and on Your summary; change the goal later.", ["formula", "goal-apply", "goal-open", "goal-pace", "target-analysis", "your-summary"], None),
  ("P3", "Decide at the shelf", "Scan a label or a barcode, see the letters and PD, whether it fits, Mix it with what I have, one tap to a plate.", ["camera-group", "camera-every-mode", "scan-to-card", "label-table", "mix-tip", "find-then-add", "one-bar"], None),
  ("P4", "Make a craving fit", "A craving at home: foods on the Plate, Fit to my target, Make it, eaten and saved. The Plate asks one thing at a time.", ["meal-from-empty-plate", "fab-and-fit", "plate-ask", "plate-numbers", "dish-parts", "dish-proportions", "changed-dish", "me-plate-fixes"], None),
  ("P5", "Photo of my meal", "A photo, the foods read, amounts estimated, corrected if I know better; Ate it. A wrong read can be read again (DT212).", ["meal-photo", "meal-camera", "back-and-photos", "photo-store"], "the read itself needs the AI; evals wait for weighed plates"),
  ("P6", "Keep and cook a recipe", "From the Plate, a screenshot or a link; its page with foods, nutrition and steps; Start cooking, one step at a time, read aloud, a second phone on the counter (DT211).", ["recipe-import", "recipe-after", "recipe-nutrition", "kitchens-and-steps", "steps-own-amounts", "cook-mode", "cook-ask", "second-screen", "step-pictures", "batch-cook"], None),
  ("P7", "Live the day", "Today against the plan, the slots of the week filled, quick picks, what Chef Mealan says in my context; the day set once.", ["today", "today-plan", "today-against-plan", "plan-slots", "plan-fill", "quick-picks", "chef-context", "day-adds-up", "wake-meals", "work-hours"], None),
  ("P8", "Shop and travel", "A shopping list from the week, carried on; travel mode with where I stay and what kitchen I have.", ["shopping-list", "shop-step", "setup-shop", "travel-mode", "places"], None),
  ("P9", "Out, or missing something", "I don't have it: the helper and the chat work with what I have; a craving after a chat.", ["dont-have-it", "chat-then-craving", "chat-kinds", "chat-fails"], None),
  ("P10", "Learn why", "Explorer: proteins, carbs, fats, micros and situations, in the app's letters, on the wellness line.", ["explorer", "explorer-carbs", "explorer-fats", "explorer-micros", "explorer-situations"], None),
  ("P11", "Share with my coach", "Choose what my coach sees, send a card or a recipe, see their note; or leave: export and full deletion.", ["share", "coach-badge", "safety"], "deletion needs a live account; on the phone"),
]
COACH = [
  ("C1", "Get clients in", "A coach code, codes and sign-ups on Clients, a client joins and shows up with the week's dots.", ["coach-views", "coach-week"], "the code itself on the phone"),
  ("C2", "See what waits", "Clients, the sixth tab, with the count: cards shared, replies, check-ins, numbers to approve (DT210).", ["coach-views", "coach-badge"], None),
  ("C3", "Read one client", "A client's page: Today, Week (read-only, with Suggest), Shared cards with Answer, Goal with weigh-ins and the check-in day.", ["coach-week", "coach-views", "weigh-ins", "first-two-weeks"], None),
  ("C4", "Answer and suggest", "Answer a shared card, send a note on a day, suggest for the week; approve numbers; make a client a cook.", ["coach-week", "recipe-cook", "recipe-publish"], None),
  ("C5", "Publish for members", "A recipe live on chefmealan.com, sent by a cook and approved, members' names and covers.", ["recipe-publish", "publish-names", "covers-and-members", "members-foods", "members-names", "book-page"], None),
  ("C6", "Run my own day", "The coach's own Today, Plan, Plate and Recipes are always their own; the bar has six tabs (DT210).", ["coach-views", "today", "recipes-bar"], None),
  ("C7", "Know it works", "Metrics and running costs for the owner; the walkthroughs page; evals; the rules.", ["metrics", "evals-page", "design-rules", "foundations", "built"], "the walkthroughs page waits for a publish (OP1)"),
]
def chips(gs):
    out = []
    for g in gs:
        ok = g in FLOWS
        out.append(f'<span style="display:inline-block;border-radius:6px;padding:1px 6px;font-size:11px;font-weight:700;margin:2px 3px 0 0;background:{"#e3f1ea" if ok else "#fde7e7"};color:{"#1e8e5a" if ok else "#c0392b"}">{g}</span>')
    return "".join(out)
def card(pid, name, what, guards, note):
    n = f'<div style="font-size:12px;color:#5b6b8a;margin-top:5px">On the phone: {html.escape(note)}.</div>' if note else ""
    return (f'<div style="border:1.5px solid #d1dcf0;border-radius:10px;padding:10px 12px;background:#fff;margin-bottom:8px">'
            f'<div style="display:flex;gap:8px;align-items:baseline"><b style="font-size:12.5px;color:#fff;background:#123a7a;border-radius:6px;padding:1px 7px">{pid}</b><b style="font-size:15px;color:#172742">{html.escape(name)}</b></div>'
            f'<div style="font-size:13.5px;line-height:1.45;color:#172742;margin-top:5px">{html.escape(what)}</div>'
            f'<div style="margin-top:6px">{chips(guards)}</div>{n}</div>')
def col(title, sub, rows):
    return (f'<div style="width:560px;flex:none;background:#eef3fb;border-radius:14px;padding:10px">'
            f'<div style="background:#172742;color:#fff;border-radius:10px;padding:7px 10px"><b style="font-size:15px">{title}</b> <span style="opacity:.8;font-size:13px">{len(rows)}</span><div style="font-size:11.5px;opacity:.9;line-height:1.35;margin-top:2px">{sub}</div></div>'
            f'<div style="margin-top:10px">{"".join(card(*r) for r in rows)}</div></div>')
W = 18 * 2 + 560 * 2 + 18
page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Happy paths</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&amp;display=swap">
<style>body{{margin:0}}</style>
</helmet>
<div style="width:{W}px;box-sizing:border-box;padding:18px;background:#fff;color:#172742;font-family:'Nunito',ui-sans-serif,system-ui,sans-serif;font-size:15px">
<b style="font-size:22px;font-weight:900">Happy paths: the jobs people and coaches want done</b>
<div style="font-size:14px;color:#3d4a63;font-weight:600;line-height:1.45;margin-top:4px">One card per job, in the order a person meets it. Under each, the walkthroughs in tests/flows that guard it (green: exists; red: not yet). What no walkthrough can reach is checked on the phone. A card on the Kanban names the path it serves. The old list in tests/flows/paths.cjs (PA1 to PA8, 7 October) is behind this one.</div>
<div style="display:flex;gap:18px;align-items:flex-start;margin-top:18px">{col("A person", "Someone who eats, cooks and trains; a member of a coach, or on their own.", PERSON)}{col("A coach", "Coach Milan, and coaches after him: clients first, their own day too.", COACH)}</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{W},"height":2000}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{}};
  }}
}}
</script>
</body>
</html>
'''
open(f"{D}/Paths.dc.html", "w").write(page); print("Paths.dc.html", W, len(page) // 1024, "KB")
missing = sorted(set(g for r in PERSON + COACH for g in r[3]) - FLOWS); print("missing guards:", missing)
