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

## S2. The account's copy stays small (Coach Milan, 3 November 2026, 07:55)

The account is charged per write, 1 KB a unit, and the free amount is 40,000 units a day. On 2 November the app passed it:
the autosave wrote the whole copy a second after every change, with the plate's and the cook's photos inside as text.

- A photo never rides as text. Foods, recipes and cards have their own photo files; every other photo (the plate's photo
  and its other photos, the cook's step and meal photos, the plates saved for later) is a loose file, `loose:<id>`, and the
  copy holds `pf:<id>` in its place (`src/photos.ts`). The phone that took it keeps it; another phone fetches the file.
- The autosave writes only the part that changed since this phone last wrote it, and nothing when neither changed. It
  runs 3 seconds after a change settles, and at once when the app goes to the back.
- The check: S1's save check also fails on a photo as text (2 KB or more) anywhere in a write, and on the account's copy
  (the main record or its private part, as it stays once the records moved) past 50 KB.
- Settings, Dev data (the admin only, DT231 in 0.3.70; About until then) shows the size of the last save and today's saves from this phone.
- 0.3.68 (Coach Milan 10:15, after About showed 457 KB): once the records moved, the copy holds only the plate and settings,
  with no 30 days' backup of the foods and recipes; and the private part lives only in the private record, on the preview too.

## S3. The live app reads what the preview writes (Coach Milan, 3 November 2026, 13:24)

The preview and chefmealan.com share one account. 0.3.67 wrote the plate's photo as a name (pf:<id>) on the preview; production,
still 0.3.52, read the name and showed an empty frame.

- A change to what goes into the account (a new shape, a field moved, a photo made a file) says, in its release note to Coach
  Milan, whether the live version reads it. If it doesn't, the release says so before the preview is run, and the promote
  follows the same day.

## Changelog

- 2 November 2026: S1 written; the save check added in 0.3.58.
- 3 November 2026: S2 written; loose photos, the only-changed save and the size check in 0.3.67.
- 3 November 2026: 0.3.68, the backup ended early and the preview's second copy dropped.
- 3 November 2026: S3 written, after the plate photo showed empty on production.
