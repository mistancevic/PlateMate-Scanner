# Walkthroughs: what they protect

Two kinds of checks live here, and the difference is the rule.

**Journey invariants.** The paths a person takes, in order, screen by screen. They never change to fit a code change. If a change makes one fail, the change broke the journey; it goes back as a story, or the story names the journey it changes before any code. Lines marked `JOURNEY INVARIANT` in a walkthrough are these.

- At the shop: Plate, Scan, the single-product camera opens (Label; Several products is the explicit choice, never the default), several sides of one product stage, Analyze, the label check with the name read, Mix it on the label check, one tap and the plate is the mix. (`camera-group.cjs`, `camera-every-mode.cjs`, `mix-tip.cjs`)
- Several photos in every mode: the mode decides how a picture is read, never how many can be taken. Label stages two shots and sends them as one scan; Barcode reads the code, stays open for the pack's photos, and Analyze sends the code with them. (`camera-every-mode.cjs`)
- A craving at home: Plate, pick a moment, foods in, Fit to my target, Make it, how was it, saved. (`meal-from-empty-plate.cjs`)
- A missing food: the plate helper offers swaps from the library, never the missing food. (`dont-have-it.cjs`)
- A barcode scanned twice opens the existing food, never a duplicate. (`duplicates-merge.cjs`)
- Today: the day set once, read all day; the actions directly under the plan. (`today.cjs`)

**The happy paths.** The eight paths a person takes to get a job done, with the outcome they perceive and where a safety rule sits, are in the Worth Building doc, tab "Happy paths". `npm run qa:paths` runs the walkthroughs that guard each path and prints one line per path; P1, P7 and P8 have no guard in the sandbox and are checked on the phone.

**Control checks.** Where a button is, what a label says. These follow the story that changes them.

The rule that was missing on 2 October 2026, and is now the rule: a walkthrough is only edited when the story names it. Changing `Photo` to `Scan` in three walkthroughs because the chip was renamed is editing the test to match the change. The journey behind it, several photos of one product from the plate, had no line of its own, so nothing failed when Scan started opening the wrong camera. The line is there now.

The camera and the model do not run in the sandbox. The entry mode is asserted, the model's reading is not; Milan checks that on the phone.
