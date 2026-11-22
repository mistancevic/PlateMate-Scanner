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
- Checks are agreed before code: Light, Area or Full.
- You never start a workflow. Coach Milan starts Preview and Promote.
- Every merge report starts with "X is merged into main as 0.3.NNN - <commit>" and ends with https://github.com/mistancevic/PlateMate-Scanner/actions/workflows/preview.yml and "The last line of the Preview step should say version 0.3.NNN - <commit>".
- Never say what is on Preview or live.
- Coach Milan may share his screen: no tester names or contact details in replies, say "a tester". Testers are never named in this public repo.
- A ticket keeps its scope. Nothing drawn goes away unless Coach Milan says. Move means move.
- One board per ticket, named by id. Boards are drawn as a prototype: the current flow whole, the new flow whole, No change marks, a blue outline for what is new, yellow notes, screen ids like DT336.2b. A time strip only when time matters.
- Long runs: a message at 50% and at 90%.
- Writing: plain English, light style. No en or em dashes. Never the words floor, lamp, corridor. "Calculate", not "work out". Commands in code blocks.

## Release steps (short)

Branch pmNNN, bump package.json; words via `npx tsx scripts/lang-release.ts` then `apply <drafts>`; built-facts, words-baseline, app-sr scripts; `npm test`; `npm run build`; walkthroughs `LANES=n node scripts/run-flows.cjs [names]` (REDUCED="why" for Area); commit the qa run separately; push the branch; `git merge --no-ff` into main; tag; a line in docs/versions.md (10-character hash); docs/backlog.json (version first in the list, ticket done with its version); Kanban `KANBAN_H=17330 python3 design/boards/genKanban.py`; publish Kanban and boards to the canvas; Srpski and Deutsch tables; this handover.

Commit trailer:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

## State, 22 November 2026, 20:15

- Main at 9af1820. App 0.3.173 - fa1d659. No new version since.
- Release plan (agreed): R1 DT336, DT337, DT334. R2 DT338, DT339. R3 B156, DT340. R4 DT335.

### Tickets from the onboarding call (all in docs/backlog.json)

- DT336 Next, drawn, board Stories274 on Page 6. A tea, coffee, herbal tea, water or salt with no values is saved as 0 with no question. Any other product with no values gets an amber heads-up (the warn-box look of The plate is not empty, with the warning triangle): "The name is read, but the database has no values for this product. Type them from the nutrition table on the pack, then save." Saving it empty still stops. AC7 matches. Open point on the ticket: which words or categories make a product obviously 0. Waiting for Go. Checks proposed: Area plus the German sweep.
- DT337 Next: Fit to my target lands in the target's range and adds what the meal is missing. Follow the user's target range, no new formula.
- DT334 Next: up to 3 kitchens you cook, plus a chip for trying new kitchens. Coach Milan asks testers who picked 4 or more to reduce; no code for that.
- DT338 Next: what the PD colours mean, one scale on the Goal page and behind the PD number on the Plate.
- DT339 Next: a nutrition table printed in several languages shows the app's own names.
- B156 Next: Clients keeps the names it knew when the invites do not load.
- DT340 Next: the client's card shows activity: opened, active, full, last active; a client quiet for 3 days waits.
- DT335 Next: Gain healthy weight as a goal; goals that do not fit are greyed; a target body weight (roughly 1 kg a month).
- DT341 Later: drinks in millilitres, shown and typed in ml, calculated in grams. Not urgent.
- A cook mode issue a tester saw: not reproduced; Coach Milan checks with the tester. No ticket.

### Canvas

- Design artifact e64aff2b-3860-4382-bfce-7c39eba82b65 (https://claude.ai/artifact/VSNwRoRQqpi7S6NXdCnFhe). Always read the live version first; Coach Milan edits it too.
- project/canvas.json is pretty-printed, one key per line. Add a board as an entry in "boards" and its file name in "order".
- Page 5 (page-v31x6j) is full. Page 6 is page-p475ue. On Page 6: an empty Artboard 1 (Artboard-9s4q, x 0 y 0, 800 x 600; leave it unless Coach Milan says), and Stories274 DT336 at x 0, y 720, h 4312.
- The next board on Page 6 goes at x 0, y 5152.
- Board tools: design/boards/genDT336.py, shotDT336.cjs, ticketDT336.json; the generator writes the board to /home/claude/canvas/project/. Pictures need a scratch build of main with the new screens behind localStorage "board-new"; rebuild it if the work folder is gone.

### To fix in the next build

- `tsc --noEmit` fails in src/applications.test.ts (Property 'invite' does not exist). Test typing only.

### Still open

- OP9 (the app sends mail), OP8 (needs a board), DT333 (later), DT332 (to draw), B152 (board), DT319 (answer).
- Asked, no answer yet: whether the empty It makes field on Eat gets its own ticket.
