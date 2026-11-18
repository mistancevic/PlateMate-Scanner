# The ticket form

Decided by Coach Milan on 18 November 2026, 12:41. Used from the next ticket on, a DT or any other type, and improved as we go. The worked example is DT311: the board DT311 on canvas Page 5. Older tickets are not rewritten.

## Where a ticket lives

- The Kanban card is short: id, title, one line, and a label that links to the ticket's board.
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
