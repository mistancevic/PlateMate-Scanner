# Chef Mealan handover

The latest handover lives here, in the repo, so a new chat can start from it with the repo alone. Each new handover replaces this file. Older handovers stay in git history.

## Start of a new chat

1. Read this file, docs/ticket-form.md and docs/backlog.json.
2. Ask for write access to this repo (push). Without it nothing can be committed, merged or drawn into the repo. If it is refused, say so at once, before any other work.
3. Work from the state below. Do not ask again what this file answers.

## Standing rules (Coach Milan)

- Boards are the truth. A Go needs a board Coach Milan has seen. Draw before code, bugs too.
- Talk by ticket id. Short plain replies, read on a phone. One question at a time. Ask, don't report.
- Flow per ticket: Brainstorm, Draw (board on the canvas), Go, build, checks, merge into main, merge report.
- Checks are agreed before code: Light, Middle or Full (Middle was called Area until 23 November, Coach Milan 08:37).
- You never start a workflow. Coach Milan starts Preview and Promote.
- Every merge report starts with "X is merged into main as 0.3.NNN - <commit>" and ends with https://github.com/mistancevic/PlateMate-Scanner/actions/workflows/preview.yml and "The last line of the Preview step should say version 0.3.NNN - <commit>".
- Never say what is on Preview or live.
- Coach Milan may share his screen: no tester names or contact details in replies, say "a tester". Testers are never named in this public repo.
- A ticket keeps its scope. Nothing drawn goes away unless Coach Milan says. Move means move.
- One board per ticket, named by id. Boards are drawn as a prototype: the current flow whole, the new flow whole, No change marks, a blue outline for what is new, yellow notes, screen ids like DT336.2b. A time strip only when time matters.
- Long runs: a message at 50% and at 90%.
- Writing: plain English, light style. No en or em dashes. Never the words floor, lamp, corridor. "Calculate", not "work out". Commands in code blocks.

## Release steps (short)

Branch pmNNN, bump package.json; words via `npx tsx scripts/lang-release.ts` then `apply <drafts>` (Srpski goes in confirmed: Claude translates and confirms it, the app shows it at once; Coach Milan 23 November 00:19); built-facts, words-baseline, app-sr scripts; `npm test`; `npm run build`; walkthroughs `LANES=n node scripts/run-flows.cjs [names]` (REDUCED="why" for Light and Middle); commit the qa run separately; push the branch; `git merge --no-ff` into main; tag; a line in docs/versions.md (10-character hash); docs/backlog.json (version first in the list, ticket done with its version); Kanban `KANBAN_H=17330 python3 design/boards/genKanban.py`; publish Kanban and boards to the canvas; Srpski and Deutsch tables; this handover.

Commit trailer:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

## State, 23 November 2026, 13:55

- 0.3.182 (DT340) is merged into main and tagged v0.3.182 (local tag); before it 0.3.181 (B156), 0.3.180 (DT339), 0.3.179 (DT338), 0.3.178 (DT334), 0.3.177 (Srpski confirmed), 0.3.176 (DT337), 0.3.175 (B157, B158), 0.3.174 (DT336). Main is at the handover commit after it. Coach Milan starts Preview and Promote.
- Last full run on main: 0.3.178, 228 of 228. Since then: 0.3.179 Light plus the German sweep 23 of 23; 0.3.180 Middle plus the German sweep 25 of 25; 0.3.181 Light 10 of 10; 0.3.182 Middle plus the German sweep 26 of 26 (docs/qa/runs/0.3.182.json). 232 walkthroughs in all now. A full run is due.
- Release plan (agreed): R1 done (DT336, B157, B158, DT337, DT334). R2 done (DT338, DT339). R3 done (B156, DT340). R4 DT335 drawn, waiting for Go. DT319 drawn, waiting for Go. Next also DT342 (fibre) and DT344 (EU line names), not drawn.
- Never `git stash` in this repo: the stash put the tracked node_modules link back over the installed packages (23 November, 0.3.181); `rm node_modules && npm ci` fixed it.
- A board says what the flow before is, by its version and where it is: "In main, 0.3.176, not on Preview yet", never "Today" (ticket form, rule 5). Every arrow is a tap; a screen scrolled is one tall picture (rule 2).

### Tickets from the onboarding call (all in docs/backlog.json)

- DT336 done in 0.3.174 (Go 20:47, checks Area plus the German sweep, 21 of 21 walkthroughs, docs/qa/runs/0.3.174.json). The rule is in src/obvious0.ts, with the list settled at 20:32. The server sends `categories` and `noValues` (the database has no energy, protein, fat or carbohydrate at all, so a per-100-ml record the app leaves empty is not "no values"). candidateFood marks `zeroKind` (tea, coffee, water, salt) or `dbEmpty`. The label check sets 0, drops the box, shows "Tea has almost no calories, so it is saved as 0 kcal." and "No PD: it has 0 kcal."; the card shows the same PD words. New walkthrough tests/flows/tea-zero.cjs (PORT 3601). On the Plate a food with no fibre value makes the plate read fi?; Coach Milan 22:31: fibre is super important. DT342 Next (22:51: go with the two-part proposal; no made-up numbers): 0 where it is a fact (tea, coffee, water, salt, oil, sugar, meat, fish, eggs, milk products); the rest counts what is known and says at least X g, N foods without a value. Not drawn yet.
- DT337 done in 0.3.176 (Go 23:44; Area for the Plate plus the German sweep, 33 of 33, docs/qa/runs/0.3.176.json). src/makeMeal.ts: rangeTop, aboveRange, missingOf, QUICK_BASE; solveMeal refuses an idea above the range. JourneyScreen: no meal set and the AI on, Fit opens the meal line (plate.whichMealFirst) and runs once the meal is picked; above the range goes to askChef after the fills card; an idea above the range is asked again and never shown; the quick fit adds a base to a food above the range; the ideas line shows the weight (plate.kcalGramsPd). server.ts /api/meal: rangeOf and RANGE_RULE. New walkthrough tests/flows/fit-range.cjs (PORT 3602); changed: make-meal (target 7.1), meal-line (B1, B2 with the AI off; plate157 open({ aiOff })), design-rules. Eval cases evals/meal-range-cases.json, npm run eval:meal against a server with the AI on (not run here: no AI key).
- DT334 done in 0.3.178 (Go 08:43, checks Middle plus the German sweep, 14 of 14). Up to 3 kitchens in setup's step 5 and Me (pickKitchen in src/personal.ts; the line shopp.upToThree); the server sends Chef Mealan the first 3 (kitchensOf in src/kitchensMax.ts, every ask that takes the kitchens). The chip for trying new kitchens was taken out (00:56). New walkthrough tests/flows/kitchens-three.cjs (PORT 3603); make-meal CH4 changed by the story.
- DT338 done in 0.3.179 (Go 10:42 with AC5; checks Light plus the German sweep, 23 of 23). src/components/PdScale.tsx: five colours, names, ranges in the person's numbers (bandRange); scaleAt and SCALE_BANDS in src/goal.ts place the mark (each band a fifth of the bar, High+ drawn to 3.5 times the target). On Me, Goal under the PD target (goal.pdScaleTitle); on the Plate a tap or Enter on the PD number opens it (plate.pdScaleTitle, aria-expanded), a second closes it. Above On plan the words say plate.highPlan or plate.topPlan. Fit to my target stays at the target to 1.5 times it (Coach Milan 10:42). AC5 on the board: Recomposition (target 6.3, On plan 5.7 to 9.5) and Build muscle, Steady (target 5.0, On plan 4.5 to 7.5); the same egg at PD 8.4 is On plan for one and High for the other. The scale's text needs `.pd-scale .pd-scale-title` and `.pd-scale .pd-scale-range`, because `.readout small` is white. New walkthrough tests/flows/pd-scale.cjs (PORT 3604), unit tests src/pdScale.test.ts; plate-landing changed by AC4.
- DT339 done in 0.3.180 (option A 11:52, Go 11:53; checks Middle plus the German sweep, 25 of 25). src/labelNames.ts: stems for Czech, Slovak, Polish, Hungarian, Romanian, Slovenian, Bulgarian, Greek; the of-which words; vitamins by letter and six minerals; appName from nutrition.row* and the new label.line.* words. recognise in src/labeltable.ts reads the whole name, then each part between slashes; displayRows reads a line saved as other: (or an unknown micro:) again (AC6). The card and Review the label show shownName with the printed name in .lt-printed under it; the field's label is the app's name. Option B (behind a tap, DT339.4) looked at, not chosen. New walkthrough tests/flows/label-names.cjs (PORT 3605), unit tests src/labelNames.test.ts.
- B156 done in 0.3.181 (Go 12:43, checks Light, 10 of 10). src/clientName.ts: joinedNames keeps the last good /api/invites answer per coach (localStorage chefmealan-joined-<uid>, cleared with the phone at sign-out), asks once more after RETRY_MS (3 s) and hands that answer to onLate, so the cards are drawn again without a third request; firstOf keeps No name yet whole (ClientWeek, CoachScreen, coachNotes). listClients(coachUid, onLate, known). The example coach gets a third client with an empty Profile name only with chefmealan-coach-demo-invite (demoWithInvite in src/coachDemo.ts). New walkthrough tests/flows/client-names.cjs (PORT 3606), unit tests src/clientNames.test.ts.
- DT340 done in 0.3.182 (Go 13:15, checks Middle plus the German sweep, 26 of 26). src/activity.ts: the phone keeps chefmealan-activity (days opened or active, lastActiveAt, lastOpenAt, 28 days), markOpened on open and on coming back, markActive when a meal is logged, the plan changes, a weigh-in or a reply to the coach; activityOut rides in the account's main record (activity), so the coach reads it (ClientRow.activity). src/dayBars.ts levelOf and levelCell; ClientWeek draws lvl-full, lvl-active, lvl-opened, lvl-empty, lvl-todo, is-today, and Last active (src/activityWords.ts). waitingFor puts quiet clients first (quietDays, QUIET_AFTER 3). fullOf: with or without a plan, something eaten, every slot accounted for. Plan: I skipped it for a meal with nothing planned (a skip with no title; Undo removes it). The privacy notice has the line (updated 23 November). The example coach has activity; Sara, quiet, only with chefmealan-coach-demo-quiet. The week's line counts full days. New walkthrough tests/flows/day-levels.cjs (PORT 3607), unit tests src/activity.test.ts; coach-phase-today and coach-week changed by the story. Open: Today's page skip; the minimum for Active.
- DT319 Next, drawn, board Stories283 on Page 6 (meaning 13:13: Put it on the Plate again is a copy for a new meal). A line says so, the name comes along, a plate with foods is asked first (Replace them, Keep my plate). AC1 to AC4. Open: Plan's meal card has no Change it (Today's has, DT284). Scratch build /home/claude/work/dt319 (PastMeal.tsx behind board-new). Checks proposed: Light plus the German sweep.
- DT335 Next, drawn, board Stories284 on Page 6 (23 November 14:10). Gain healthy weight after Maintain; too light (under the WHO 18.5 line for the height) greys Recomposition and Lose fat; body fat over the Gallagher 2000 line by sex and age (women 33, 34, 36 %; men 20, 22, 25 %) greys Gain healthy weight and Build muscle, only when body fat is given; the reason opens in place, coach or no coach; a target body weight for Gain healthy weight (up to BMI 25, roughly 1 kg a month) and Lose fat (down to BMI 18.5, 0.5 to 1 % a week); the target and progress on the goal sheet; none with the eating flag. Sources in the board's design details (WHO, Eurostat, EC Knowledge for Policy, Gallagher 2000, EASO 2024). AC1 to AC8. Open: the words for the new goal's sheet and page. Scratch build /home/claude/work/dt335 (HEALTHY in goal.ts, GoalScreen.tsx and GoalSheet.tsx behind board-new; words.ts tolerates the missing words). Checks proposed: Middle plus the German sweep. Waiting for Go.
- B157 done in 0.3.175 (Go 21:57 with B158). A Serbian block word blocks every word that starts with it, in Latin and Cyrillic (SR_STEMS in src/obvious0.ts), leden before čaj; Ice Tea and Icetea block the 0.
- B158 done in 0.3.175. The heads-up says "The barcode has no values for this product. Close this, then scan the nutrition table with the camera on Label." A button that opens the camera from the heads-up is left for later (21:46, an edge case). Checks: Area plus the German sweep, 21 of 21 walkthroughs (docs/qa/runs/0.3.175.json).
- DT343 Later (12:20, scope 12:43): a product's name in my language, the printed name kept; for travel mode and local packs without translations. The translation travels with the food in Members' foods (toShare in src/memberFoods.ts). Not drawn.
- DT344 Next (12:43): the table's line names in every EU language (Finnish, Danish, Estonian, Latvian, Lithuanian, Irish, Maltese, the rest of Swedish). Not drawn.
- DT341 Later: drinks in millilitres, shown and typed in ml, calculated in grams. Not urgent.
- A cook mode issue a tester saw: not reproduced; Coach Milan checks with the tester. No ticket.

### Canvas

- Design artifact e64aff2b-3860-4382-bfce-7c39eba82b65 (https://claude.ai/artifact/VSNwRoRQqpi7S6NXdCnFhe). Always read the live version first; Coach Milan edits it too.
- project/canvas.json is pretty-printed, one key per line. Add a board as an entry in "boards" and its file name in "order".
- Page 5 (page-v31x6j) is full. Page 6 is page-p475ue. On Page 6: an empty Artboard 1 (Artboard-9s4q, x 0 y 0, 800 x 600; leave it unless Coach Milan says), and Stories274 DT336 at x 0, y 720, h 4592 (taller since the list of what counts as 0).
- Stories275 B157 at x 0, y 5432, h 4341.
- Stories276 B158 at x 0, y 9893, h 2862.
- Stories277 DT337 at x 0, y 12875, w 2670, h 5962.
- Stories278 DT334 at x 0, y 18957, w 1290, h 5529.
- Stories279 DT338 at x 0, y 24606, w 1750, h 5728 (taller with AC5 and the table of three goals).
- Stories280 DT339 at x 0, y 30454, w 1750, h 6853 (with option B).
- Stories281 B156 at x 0, y 37427, w 1750, h 3417.
- Stories282 DT340 at x 0, y 40964, w 1750, h 4289.
- Stories283 DT319 at x 0, y 45373, w 1750, h 3511.
- Stories284 DT335 at x 0, y 49004, w 1750, h 4827.
- The next board on Page 6 goes at x 0, y 53951.
- A sheet that scrolls is drawn as one tall picture: shotDT339.cjs unroll() opens its scroll boxes at their real width.
- Board tools: design/boards/genDT336.py, shotDT336.cjs, ticketDT336.json; the generator writes the board to /home/claude/canvas/project/. DT336 is built, so its board pictures can now come from main itself.
- The Srpski table (0dce7ed4-62b8-4680-a346-bf82e221710a) has app-sr.json and release-pack.json of 0.3.182; the Deutsch table (b6e9715c-288c-4a19-bd6c-f8ac5a396aec) has release-pack.json of 0.3.182. Thirteen lines in 0.3.182 (eleven new, two changed), Srpski confirmed by Claude, German in Beta.

### Still open

- OP9 (the app sends mail), OP8 (needs a board), DT333 (later), DT332 (to draw), B152 (board), DT319 (answer).
- Asked, no answer yet: whether the empty It makes field on Eat gets its own ticket.
- The repo tracks `node_modules` as a symlink; after `npm ci` git shows it deleted. Never commit that: add files by name.
