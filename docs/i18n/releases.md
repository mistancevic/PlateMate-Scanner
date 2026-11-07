# Languages in every release (DT239, 0.3.95)

Coach Milan, 5 November 15:16 to 15:32, Go 6 November 12:24. Design and copy stay in English; every release ships in English, Srpski and Deutsch (Beta).

1. Build the release in English.
2. `npx tsx scripts/lang-release.ts` lists what the release brings in `docs/i18n/release-todo.json`: new lines, and lines whose English changed since their translation (`src/i18n/made-for.json` keeps the English each translation was made for).
3. Claude drafts Srpski and German for each, in a file `{"<id>": {"sr": "...", "de": "..."}}`, then runs `npx tsx scripts/lang-release.ts apply <file>`. A wrong slot or form, or a dash, stops it and nothing is written.
   - Srpski goes in as a draft: the app shows the English until Coach Milan confirms it in his table.
   - German goes in as Beta.
4. Publish `docs/i18n/release-pack.json` as `release-pack.json` to both tables. Both show the group "New in 0.3.xx" first, with the English before for a changed line. Once confirmed, a line goes back to its area.
5. Run `node scripts/app-sr.cjs` and publish `docs/i18n/app-sr.json` as `app-sr.json` to the Srpski table (Coach Milan 7 November 19:39). Each card then says whether the app holds it as written: In the app, Confirmed for the next release, or Waiting for your Confirm. Every release with lines left to confirm is its own group, and the release chips show one release at a time.
5. `npm test` stops the release when a line has no Srpski or no German, or its English changed without step 2 (`src/langRelease.test.ts`).
6. The German sweep at 390 and 360 px runs with every release.
