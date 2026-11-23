# The ticket form

Decided by Coach Milan on 18 November 2026, 12:41. Used from the next ticket on, a DT or any other type, and improved as we go. The worked example is DT311: the board DT311 on canvas Page 5. Older tickets are not rewritten.

## Where a ticket lives

- The Kanban card is short: id, title, one line, and a label that names the ticket's board, for example "Board: DT311, canvas Page 5". The label is text, not a link; the board's first line names the ticket and its Kanban column the same way.
- The ticket's board on the canvas carries the weight. Its title starts with the ticket id. A board is named by its ticket id, never by its file name.
- The data is in `docs/backlog.json`: `opportunity`, `problem`, `story`, `ac`, `unchanged`, `board`, `where`.

## The board has three parts

**The vertical card, the page.** Top to bottom, in the order things happened.

1. The request
   - Opportunity, why we act: where it comes from (a tester in a test, or Coach Milan's own look, said as it is), the job, what stood in the way, why now. Kinds of what stood in the way: could not do it, a bug; could not do it, the feature is missing; too many steps; did not find it or did not understand it; a risk of a wrong tap; looks broken.
   - Problem: the pain today. No solution in it.
   - Story: what the person wants to be able to do, and why. One thought. It still holds if the design changes.
   - Coach Milan's words, with the time, when the request came from him.
2. The solution and the decision: now, proposed, what was looked at and not chosen, the decision with its time.

**The screens, the design.** The step before first, then the app as it is, then the change.

**The wide block at the bottom, the agreement.** What gets built. Empty until the decision stands.

- One line: what it is, and the release.
- Acceptance criteria, what is new, as a table: #, Scenario, Given, When, Then. Only behaviour this ticket adds or changes. One behaviour per row. A concrete example. No pixels. A walkthrough check names its criterion, for example "DT311 AC1".
- Already works, must not change: preconditions, not requirements. Their walkthroughs pass untouched.
- Design details for the build.

Nothing stands twice: what is in the block is not in the card.

The generators: `design/boards/genDT308d.py` (the DT311 board) and `design/boards/genKanban.py`.

## How the screens are drawn (the house style; Coach Milan 20 November 2026, 10:37)

Coach Milan, 10:37: "From what we have Now leads towards what is the plan to be New, with remarks in yellow and arrows showing what leads to what and where to." It had to be said many times because each new board was made by copying the nearest recent board script, and the recent ones had lost the style. From now on every board follows this list, whatever script it starts from.

1. **Two whole flows, one under the other, like a prototype** (Coach Milan 20 November 2026, 16:08: "Note that as a rule!"). Top row: the current flow from its beginning to its end, every screen, left to right. Under it: the new flow, also from its beginning to its end. A screen that stays the same is drawn again in the new flow and labelled No change. A screen that changes is changed there. A screen the new flow needs is inserted where it comes in the flow. Read left to right, each row is one path a person taps through, so it can be followed like a prototype. Never only the changed screens, never Now, New, Now.
2. **Arrows between the steps of each row**, showing what was tapped and where it leads. The first screen of each row is the step before, the screen where the person starts. Every arrow is a tap. A screen scrolled further down is the same screen: one tall picture, never two pictures with an arrow (Coach Milan 22 November 2026, 23:04, after DT337.3c and 3d).
3. **The change is drawn into the New screen**: a blue outline around what changes, and a yellow note (background #fff8d6, blue outline) next to it, saying in one or two plain lines what is new. Helpers: MARK and NOTE in `design/boards/shotB150e.cjs`; the DT331 board is the newest example.
4. **The screens are the real app** (the release as it is, and a scratch build for New), never a mockup, at 390 px, with what a signed-in phone shows (Sign out, the real commit). When a local run cannot show something, the scratch build shows it as the phone does, and the board says so in Design details.
5. **Labels on each screen**: As it is today (grey), New, drawn for your approval (blue), No change (grey). The flow before names where it is, by its version: "In main, 0.3.175, not on Preview yet", never "Today", when main is ahead of Preview (Coach Milan 22 November 2026, 21:56).
6. **Media go in as canvas assets**, never inside the board file (a 7.9 MB board did not show on the phone, 19 November).
7. **Move means move** (20 November, DT331): when something moves, the board also shows the old place new, without it.
8. **When the day matters, the board says which day it is drawn on** (20 November, B153): a yellow strip on top of every screen with the date and time, and yellow date labels under days and bars. The labels are on the board only.
9. **Every screen carries its id** (Coach Milan 20 November 2026, 19:44: "IDs of each screen, we had it before"): the ticket id, the flow's number and a letter, in the screen's title: B151.1a, B151.1b for the current flow, B151.2a for the first new flow, and so on. The row's title carries the flow's id (B151.2). So a screen can be named in one word when something on it needs a change.

## Checks: agreed before the code (Coach Milan 20 November 2026, 15:38)

Coach Milan, 15:38: "we should discuss about walkthroughs and testing before you start working on the code part ... Not every code change requires that deep testing as it doesn't touch every file."

1. **The board's agreement block has a line "Checks"**, next to the acceptance criteria. Claude proposes the level and says in one line why. The Go agrees to it. A Go without a Checks line means: ask about the checks first, then code.
2. **Always, whatever the level:** the unit tests, the build, and the new walkthrough for the ticket's criteria. When on-screen words change, the German sweep runs too.
3. **Three levels:**
   - **Light:** one screen, and nothing changes in what the app does (words, layout, a line moved). Also run the walkthroughs that open that screen. About 5 to 10 minutes. Example: DT331.
   - **Middle** (called Area until 23 November 2026; Coach Milan 08:37): a behaviour changes in one area (Clients, the Plate, Plan, Recipes). Also run every walkthrough of that area and of the code files the change touches. About 10 to 20 minutes. Example: B153, the Clients card and the client's page.
   - **Full:** all walkthroughs, about 41 minutes. For shared code everything uses (the plate and meal model, the culinary and nutrition rules, storage and sync, navigation, languages), and for a release with several tickets.
4. **If something outside the agreed set looks touched while coding**, Claude stops and asks before widening the run. Claude does not widen it silently.
5. **The merge report says the level that ran**, and the run record in `docs/qa/runs/<version>.json` says it too (`reduced` with the reason).
6. **A full run at the end of a day when lighter runs were merged that day**, so nothing the lighter sets skipped stays unseen for long. It is proposed in one line, like any other check.
