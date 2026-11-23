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

## State, 23 November 2026, 09:20

- 0.3.178 (DT334) is merged into main and tagged v0.3.178 (local tag); before it 0.3.177 (Srpski confirmed), 0.3.176 (DT337), 0.3.175 (B157, B158), 0.3.174 (DT336). Main is at the handover commit after it. Coach Milan starts Preview and Promote.
- Release plan (agreed): R1 done (DT336, B157, B158, DT337, DT334). R2 DT338, DT339. R3 B156, DT340. R4 DT335. DT342 (fibre) in Next, not drawn.
- A board says what the flow before is, by its version and where it is: "In main, 0.3.176, not on Preview yet", never "Today" (ticket form, rule 5). Every arrow is a tap; a screen scrolled is one tall picture (rule 2).

### Tickets from the onboarding call (all in docs/backlog.json)

- DT336 done in 0.3.174 (Go 20:47, checks Area plus the German sweep, 21 of 21 walkthroughs, docs/qa/runs/0.3.174.json). The rule is in src/obvious0.ts, with the list settled at 20:32. The server sends `categories` and `noValues` (the database has no energy, protein, fat or carbohydrate at all, so a per-100-ml record the app leaves empty is not "no values"). candidateFood marks `zeroKind` (tea, coffee, water, salt) or `dbEmpty`. The label check sets 0, drops the box, shows "Tea has almost no calories, so it is saved as 0 kcal." and "No PD: it has 0 kcal."; the card shows the same PD words. New walkthrough tests/flows/tea-zero.cjs (PORT 3601). On the Plate a food with no fibre value makes the plate read fi?; Coach Milan 22:31: fibre is super important. DT342 Next (22:51: go with the two-part proposal; no made-up numbers): 0 where it is a fact (tea, coffee, water, salt, oil, sugar, meat, fish, eggs, milk products); the rest counts what is known and says at least X g, N foods without a value. Not drawn yet.
- DT337 done in 0.3.176 (Go 23:44; Area for the Plate plus the German sweep, 33 of 33, docs/qa/runs/0.3.176.json). src/makeMeal.ts: rangeTop, aboveRange, missingOf, QUICK_BASE; solveMeal refuses an idea above the range. JourneyScreen: no meal set and the AI on, Fit opens the meal line (plate.whichMealFirst) and runs once the meal is picked; above the range goes to askChef after the fills card; an idea above the range is asked again and never shown; the quick fit adds a base to a food above the range; the ideas line shows the weight (plate.kcalGramsPd). server.ts /api/meal: rangeOf and RANGE_RULE. New walkthrough tests/flows/fit-range.cjs (PORT 3602); changed: make-meal (target 7.1), meal-line (B1, B2 with the AI off; plate157 open({ aiOff })), design-rules. Eval cases evals/meal-range-cases.json, npm run eval:meal against a server with the AI on (not run here: no AI key).
- DT334 done in 0.3.178 (Go 08:43, checks Middle plus the German sweep, 14 of 14). Up to 3 kitchens in setup's step 5 and Me (pickKitchen in src/personal.ts; the line shopp.upToThree); the server sends Chef Mealan the first 3 (kitchensOf in src/kitchensMax.ts, every ask that takes the kitchens). The chip for trying new kitchens was taken out (00:56). New walkthrough tests/flows/kitchens-three.cjs (PORT 3603); make-meal CH4 changed by the story.
- DT338 Next, drawn, board Stories279 on Page 6 (23 November 09:00). One scale (five colours, names, ranges in the person's numbers) under the PD target on Me, Goal; on the Plate a tap on the PD number opens it with a mark where the plate sits, a second tap closes it. AC1 to AC3. Open on the board: the words under the Plate's number say fits your plan in High and High+ too. Scratch build /home/claude/work/dt338 (src/components/PdScale.tsx, board-new in MenuScreen.tsx and JourneyScreen.tsx). Waiting for Go. Checks proposed: Light plus the German sweep.
- DT339 Next: a nutrition table printed in several languages shows the app's own names.
- B156 Next: Clients keeps the names it knew when the invites do not load.
- DT340 Next: the client's card shows activity: opened, active, full, last active; a client quiet for 3 days waits.
- DT335 Next: Gain healthy weight as a goal; goals that do not fit are greyed; a target body weight (roughly 1 kg a month).
- B157 done in 0.3.175 (Go 21:57 with B158). A Serbian block word blocks every word that starts with it, in Latin and Cyrillic (SR_STEMS in src/obvious0.ts), leden before čaj; Ice Tea and Icetea block the 0.
- B158 done in 0.3.175. The heads-up says "The barcode has no values for this product. Close this, then scan the nutrition table with the camera on Label." A button that opens the camera from the heads-up is left for later (21:46, an edge case). Checks: Area plus the German sweep, 21 of 21 walkthroughs (docs/qa/runs/0.3.175.json).
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
- Stories279 DT338 at x 0, y 24606, w 1750, h 3017.
- The next board on Page 6 goes at x 0, y 27743.
- Board tools: design/boards/genDT336.py, shotDT336.cjs, ticketDT336.json; the generator writes the board to /home/claude/canvas/project/. DT336 is built, so its board pictures can now come from main itself.
- The Srpski table (0dce7ed4-62b8-4680-a346-bf82e221710a) has app-sr.json and release-pack.json of 0.3.174; the Deutsch table (b6e9715c-288c-4a19-bd6c-f8ac5a396aec) has release-pack.json. Seven new lines, Srpski as drafts waiting for Confirm, German in Beta.

### Still open

- OP9 (the app sends mail), OP8 (needs a board), DT333 (later), DT332 (to draw), B152 (board), DT319 (answer).
- Asked, no answer yet: whether the empty It makes field on Eat gets its own ticket.
- The repo tracks `node_modules` as a symlink; after `npm ci` git shows it deleted. Never commit that: add files by name.
