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

## State, 23 November 2026, 19:45

- 0.3.186 (B159) is merged into main and tagged v0.3.186 (local tag); before it 0.3.185 (DT342), 0.3.184 (DT335), 0.3.183 (DT319), 0.3.182 (DT340), 0.3.181 (B156), 0.3.180 (DT339), 0.3.179 (DT338), 0.3.178 (DT334), 0.3.177 (Srpski confirmed), 0.3.176 (DT337), 0.3.175 (B157, B158), 0.3.174 (DT336). Main is at the handover commit after it. Coach Milan starts Preview and Promote.
- Last full run on main: 0.3.184, 234 of 234 (docs/qa/runs/0.3.184.json, 25 min). built.cjs and meal-edit.cjs passed on a rerun: built read a stale dist (built before the last built-facts), meal-edit's dinner checks now read the dinner alone, because DT340 gives a past meal with nothing planned I skipped it. Since then 0.3.185: Middle plus the German sweep, 24 of 24; 0.3.186: Light plus the German sweep, 10 of 10 (docs/qa/runs/0.3.186.json); 236 walkthroughs in all now.
- Release plan (agreed): R1, R2 and R3 done. R4 done (DT335 in 0.3.184). DT342 done in 0.3.185, B159 in 0.3.186. Next, not drawn: DT344 (EU line names).
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
- DT319 done in 0.3.183 (Go 14:13, checks Light plus the German sweep, 8 of 8). src/components/PastMeal.tsx: put() copies the foods with the meal's name (state.title), clears recorded, plannedAt, photo and the meal line (setFilling(null)); a plate with foods is asked first (pastmeal.replaceAsk, Replace them, Keep my plate); pastmeal.copyLine under the buttons for a meal not from a recipe. New walkthrough tests/flows/plate-again.cjs (PORT 3608). Open: Plan's meal card has no Change it (Today's has, DT284).
- From Coach Milan's own recipe (19:03), in the backlog, Next: B160 to B164 and DT345 to DT347 (a step between steps; editing a recipe and making a new one look alike; Recipes newest first with filter chips). B161 a space at the end of a step drops the focus; B162 one part named twice shows as two parts; B163 a food name with a comma is cut in the steps, small letters; B164 the link for more recipes is almost invisible.
- B160 Next, drawn, board Stories287 on Page 6 (19:40; direction 19:12). Every logged meal keeps its own foods; Save changes on a recipe whose foods changed asks once about a meal from it logged today or yesterday (Was it made this way? Update it, the same share; Keep it as it was), one line after; older meals not asked, one line says how many keep their foods; Save as a new recipe beside Save changes; the Plate's Update my recipe too. AC1 to AC6. Open: two recent meals, one by one or once. Scratch /home/claude/work/b160 (RecipePage save, cooksOf, onCardChange). Checks proposed: Light plus the German sweep.
- B159 done in 0.3.186 (Go 17:44, checks Light plus the German sweep, 10 of 10). On a client's card, a day before the client's phone recorded activity, with nothing logged, reads o (not known; Coach Milan 17:15), never not opened; a logged day keeps its colour; the key line clientweek.keyUnknown only when an o shows. src/activity.ts: since (the first day recorded, kept beyond the 28 days; a phone from before takes its earliest day) and sinceOf; src/dayBars.ts level unknown; ClientWeek dayOf. The day squares are on the card only; the client's own page shows the week as a list (found while building, the board's AC1 says the card). coachDemo: chefmealan-coach-demo-recorded (none, or days back) for Sara. New walkthrough tests/flows/days-not-known.cjs (PORT 3611), unit tests in src/activity.test.ts.
- DT342 done in 0.3.185 (Go 16:21, checks Middle plus the German sweep, 24 of 24). src/fibre0.ts: fibreFree (whole words EN, DE, SR Latin and Cyrillic: oil, sugar, meat, fish, eggs, plain milk products, and DT336's tea, coffee, water, salt; block words always win, Serbian block stems; added fibre such as inulin and Ballaststoffen blocks, 16:20) and fibreOf. aggregate in src/pilot.ts: fiberZero names foods counted 0; with a food still missing, fiber stays null for everyone else and fiberKnown holds the rest, fiberMissing names the foods. src/letters.ts: numbersOfTotals for the Plate, Plate read and a recipe's numbers; lettersOf reads a by-nature food as 0 (fi-) and puts a * on the fibre letter with a food missing (fi*, never fi-*; Fi*, Fi+*; Coach Milan 15:45). NumbersTable: fibre X* and the lines letters.fibreAtLeast, letters.fibreZero (count words, wn). FoodCard: foodcard.fibreNone or foodcard.fibreMissing. New walkthrough tests/flows/fibre.cjs (PORT 3610), unit tests src/fibre0.test.ts. The public recipe pages keep their own fibre sum, as before.
- DT335 done in 0.3.184 (Go 14:13, checks Middle plus the German sweep, 20 of 20, docs/qa/runs/0.3.184.json). src/goalFit.ts: unfitOf (too light under WHO 18.5 for the height greys recomp and fatloss; body fat over FAT_TOP by sex and age, Gallagher 2000, greys healthy, gain, gainsteady, only when body fat is given), healthyKg, targetCheck (gain up to BMI 25, roughly 1 kg a month; loss down to BMI 18.5, 0.5 to 1 % a week, no top limit), targetProgress, whyLines (coach or no coach). goal.ts: HEALTHY (id healthy, ADJ +10 %), GOALS (the cards, Gain healthy weight after Maintain) on the goal step and the coach's goal card; BANDS stays the five, so recipe fits are unchanged. GoalScreen: greyed cards (aria-disabled, the reason in place), TargetWeight for healthy and fatloss, not with the eating flag; Personal targetKg, targetFromKg, targetFor. The goal sheet's Target weight row (targetLine in goalGuide.ts) on Me, Goal; GUIDES.healthy and the sheet words drafted for Coach Milan's look; the target on Your summary. units.ts wWhole. New walkthrough tests/flows/goal-fit.cjs (PORT 3609), unit tests src/goalFit.test.ts; first-goal and anna-day-one changed by the story (six goals). Open: the recipe fits do not name Gain healthy weight.
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
- Stories285 DT342 at x 0, y 53951, w 1750, h 4740.
- Stories286 B159 at x 0, y 58811, w 1290, h 2737.
- Stories287 B160 at x 0, y 61668, w 1750, h 5709.
- The next board on Page 6 goes at x 0, y 67497.
- A sheet that scrolls is drawn as one tall picture: shotDT339.cjs unroll() opens its scroll boxes at their real width.
- Board tools: design/boards/genDT336.py, shotDT336.cjs, ticketDT336.json; the generator writes the board to /home/claude/canvas/project/. DT336 is built, so its board pictures can now come from main itself.
- The Srpski table (0dce7ed4-62b8-4680-a346-bf82e221710a) has app-sr.json and release-pack.json of 0.3.186; the Deutsch table (b6e9715c-288c-4a19-bd6c-f8ac5a396aec) has release-pack.json of 0.3.186. One new line in 0.3.186, Srpski confirmed by Claude, German in Beta.

### Still open

- OP9 (the app sends mail), OP8 (needs a board), DT333 (later), DT332 (to draw), B152 (board).
- Open from releases: DT340's skip on Today's page; DT319's Change it on Plan's meal card; DT335's words for the new goal's sheet and page (drafted, for Coach Milan's look); whether recipe fits should name Gain healthy weight.
- Asked, no answer yet: whether the empty It makes field on Eat gets its own ticket.
- The repo tracks `node_modules` as a symlink; after `npm ci` git shows it deleted. Never commit that: add files by name.
