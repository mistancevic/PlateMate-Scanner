# Design boards

The boards on the Chef Mealan design canvas (claude.ai, the Design artifact) are made by these scripts. Nothing here is part
of the app or its build.

## How a board is made

1. Screens: a Playwright script drives the app and takes screenshots into a folder of shots (`rs/` by default).
   - "Now" screens come from main, built in a separate worktree, so the live state is what is shown.
   - "New" screens, before Milan approves a design, are drawn: the same real page, with the change put into the page in the
     browser (see `shotDT8485new.cjs`). Nothing in the repo changes for a drawing.
   - "Built" screens come from the branch after approval.
   - A screen that needs a person with a coach uses a drawing copy of the app whose profile reads a `draw-coach` flag
     (`shotDT86.cjs` says how); that copy is never committed.
2. The board: a Python script per board (`genDT8485.py` is the latest example) builds one HTML board from the story cards
   and the shots, and writes it next to `canvas.json` (folder `/home/claude/canvas/project` by default, see `genRC.py`).
   `genRS.py` holds the helpers: `storyCard`, `Board.screen`, `rowEnd`, `board`. It loads the older layers
   (`genTW.py`, `genRG.py`, `genB.py`, `genRC.py`, `genT.py`) by reading them from the same folder.
3. Publish: read the live `canvas.json` first and build on it (Milan edits the canvas too), then publish `canvas.json` and the
   board file. Boards from DT84 on live on Page 2: give the board `"page": "<Page 2 id>"` in `canvas.json`.

## Rules for boards

- At most 8000 px tall.
- Every screen carries an ID, and the story card names who said what, when.
- Whole screens, never cut; Now first, then New.
- Plain words; no dashes as punctuation; "calculate", never "work out"; Coach Milan, Chef Mealan.

## Running

Put these files in one folder (or set `BOARDS_DIR`), the shots in `rs/` there (or set `BOARDS_SHOTS`), and the app to shoot in
`APP_DIR` for the shot scripts. Then `node shotXX.cjs` and `python3 genXX.py`.
