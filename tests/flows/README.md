# Walkthroughs: what they protect

Two kinds of checks live here, and the difference is the rule.

**Journey invariants.** The paths a person takes, in order, screen by screen. They never change to fit a code change. If a change makes one fail, the change broke the journey; it goes back as a story, or the story names the journey it changes before any code. Lines marked `JOURNEY INVARIANT` in a walkthrough are these.

- At the shop: Plate, Scan, the group camera opens, several sides of one product, Analyze, the review sheet with the name read, Mix it on the sheet, one tap and the plate is the mix. (`camera-group.cjs`, `mix-tip.cjs`)
- Several photos in every mode: the mode decides how a picture is read, never how many can be taken. Label stages two shots and sends them as one scan; Barcode reads the code, stays open for the pack's photos, and Analyze sends the code with them. (`camera-every-mode.cjs`)
- A craving at home: Plate, pick a moment, foods in, Fit to my target, Make it, how was it, saved. (`meal-from-empty-plate.cjs`)
- A missing food: the plate helper offers swaps from the library, never the missing food. (`dont-have-it.cjs`)
- A barcode scanned twice opens the existing food, never a duplicate. (`duplicates-merge.cjs`)
- Today: the day set once, read all day; the actions directly under the plan. (`today.cjs`)

**Control checks.** Where a button is, what a label says. These follow the story that changes them.

The rule that was missing on 2 October 2026, and is now the rule: a walkthrough is only edited when the story names it. Changing `Photo` to `Scan` in three walkthroughs because the chip was renamed is editing the test to match the change. The journey behind it, several photos of one product from the plate, had no line of its own, so nothing failed when Scan started opening the wrong camera. The line is there now.

The camera and the model do not run in the sandbox. The entry mode is asserted, the model's reading is not; Milan checks that on the phone.
