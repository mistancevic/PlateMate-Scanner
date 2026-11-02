# Storage rules

What a phone sends to the account (Firestore) must be something the account keeps. The walkthroughs run without an account,
so these rules are checked in code.

## S1. Nothing the account refuses (Coach Milan, 2 November 2026, 18:19)

0.3.56 kept a recipe's moves as a list of lists. Firestore refused the save with "Nested arrays are not supported", and no
test saw it, because no walkthrough has an account.

- The account refuses: a list inside a list, a map nested deeper than 20, a field name that is empty or `__like_this__`,
  a number that is not finite, a document past 1 MiB.
- The check: `src/saveShape.ts` builds every write a phone would make (the block and its private part, each food, recipe and
  card) with the app's own code, and names each problem with its path. `scripts/save-check.cjs` runs it at the end of every
  walkthrough in `scripts/run-flows.cjs`; a problem is a FAIL line like any other check. Unit tests: `src/saveShape.test.ts`.
- Review rule: a new field kept in the phone's state, a recipe, a food or a card gets one walkthrough that fills it the way
  the app does, so the save check sees it, before the branch is merged. A list of lists becomes a list of maps, as moves did
  in 0.3.57: `[{ m: [...] }]`.

## Changelog

- 2 November 2026: S1 written; the save check added in 0.3.58.
