# Rules for the home page clips

Milan, 27 October 2026 16:11: the clips on the home page show the real app, and a visitor must be able to follow every step.
These rules are checked by `scripts/record-home-clips.cjs`. A rule that fails stops the run with a list of what failed; no
clip is replaced until every rule passes.

HC1. Every tap shows. A ring appears where the finger lands, for every tap; every scroll shows as a finger swiping. Check: the
number of rings drawn equals the number of taps made, the swipes drawn equal the scrolls made.

HC2. The camera reads what the clip says it reads. In the barcode clip the app's own scanner reads the code from the camera
picture, with no typing; the barcode sits inside the frame and under the scan line. Check: "Code read" appears with the code
printed on the pack, and nothing was typed.

HC3. The result is the app's, not the photo again. After a label is read the clip shows the app's own nutrition table, filled
from the read, then the food on the plate with its PD. Check: the table's energy field holds the label's value; the food is a
row on the plate at the end.

HC4. A group is a group. The camera picture in the group clip holds several packs, and the clip ends with each of them found.
Check: three packs in the picture, three products named at the end.

HC5. Real photos only. The photo of a meal and every recipe's photo are photos (AI made is fine), never a drawing. They live in
`design/home-clips/`: `meal.jpg`, and one per recipe shown. Check: the files exist; every recipe tile in the clip shows its photo.

HC6. No real brands. Packs in the clips are made up (Fjell, Kornfeld, Nusshof). Check: the names on the packs are from that list.

HC7. The loop is clean. Each clip ends on a settled screen held for at least 1.5 seconds, and fades in and out to the page's
background, so the jump back to the first frame reads as a new start, not a glitch. Check: at least 1.5 seconds after the last
action; the fades are in the encode.

HC8. Short. Each clip runs 6 to 12 seconds. Check: the length.

HC9. Honest. The section says the clips are the app on test data with made-up packs. Check: the note is in LandingScreen.tsx.
