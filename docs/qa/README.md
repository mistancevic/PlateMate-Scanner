# Quality checks, kept

Everything here feeds the Walkthroughs page (`node scripts/flows-page.cjs <out.html>`).

- `runs/<version>.json`: every full walkthrough run, one file per release, written by `node scripts/run-flows.cjs`. Each walkthrough with what it covers and every check it made, passed or failed.
- `blind/<date>-<name>/`: a blind walkthrough. A reviewer who has never seen Chef Mealan plays a new member, step by step, and notes every place they hesitate. `findings.json` holds the path, the findings with a fix each, and what needed the AI; `screens/` every screenshot; `thumbs/` the small ones the page shows.

The loop: a blind walkthrough after a release that changes what a newcomer sees, and one a month. Milan picks the findings, they are drawn on the canvas, built after his Go, and the same person walks through again to show before and after.

Everything here uses test data only. Anna is made up.
