# Translating in context: the editing ladder (DT234)

Brainstorm with Coach Milan, 4 November 2026, 05:17 to 06:09. Nothing drawn, nothing built. Built after the 8 phases of
DT203 release 2, unless Milan says otherwise.

The problem: a line read alone on a card can be translated literally and still read badly on the screen. The translator
needs the screen around the word.

Each step has value on its own. Each later step builds on the one before it. The last step is the best final version.

## Step A. Drafts on the preview, with tags (option 2)
- Dev data, only for the owner: Show Serbian drafts. Every moved word shows its Serbian draft, ticked or not.
- A small grey tag beside each word gives its key (plate.fit). Words with no tag are still in the code.
- Value: Milan reads the real screens in Serbian on his phone, and finds a bad line's card in the table by its tag.
- Needs: the tag mode in src/words.ts (each w() result marked with its key). About half a phase.

## Step B. From the table to the page, with "When it shows"
- Each card: Show in app opens the preview at that page, scrolls to the word, outlines it in blue.
- Each card: When it shows, in four groups:
  1. On the screen now: the link scrolls to it.
  2. Shows after something you do: the card says the step (Fit again: put foods on the Plate, tap Fit to my target).
  3. Shows only in a moment hard to make (an old plate, a coach's note, a failed photo, the first day): the link opens a
     staged view with example data, in that tab only, nothing saved. The setups come from the walkthroughs.
  4. Never shown, only read aloud (labels for screen readers): the card says so.
- Value: every line can be checked where it lives. Needs the tags from step A.

## Step C. A picture on every card (option 1)
- A script opens each area in Serbian, finds each tagged word, and crops the screen around it, outlined.
- The crops go onto the table cards. Made again for each area, automatically.
- Value: most lines can be judged in the table alone, without opening the app. Needs the tags and the staged moments.
- About one phase to build, then minutes per area.

## Step D. The change log
- The table keeps every save: when, before, after, ticked or not. A History link per card and a Changes page, filter
  since the last release, one tap brings an older wording back.
- At each release the script also writes what changed into the repo (version, key, before, after).
- Each card says where its text stands: Ticked, goes out in the next release; or Live since 0.3.xx.

## Step E. Edit on the page (option 3)
- In draft mode, a tap on a tagged word opens a box to change it in place. Saved for the owner only.
- Edits still reach the app through the table and a release. About one phase with step A done.

## Step F. Live lines from the database: the best final version
- The app reads approved lines from the database, not from a file in the app. A fix shows at once, with no release.
- Two states per line: draft (only the translator sees it, on preview and live) and live (everyone).
- Slots and forms are checked when a line is saved, since the release checks no longer see it.
- A copy on the phone for offline. The change log (step D) is the record and the way back.
- Worth it once German comes and more people translate.

## Order and timing
A, then B, C, D in any order, then E, then F. Coach Milan 06:09: start after the 8 phases; A could start earlier for the
areas already moved (the Plate, Today) if he says so.
