# Design rules

Version 1, 16 November 2026. Written down from the walkthrough that guards them (tests/flows/design-rules.cjs, boards DS1, DS2, DS4, DS5; Milan, 20 October 2026) and from the rules Coach Milan repeats in every session. Added on 16 November with DT305 (boards Stories230 and Stories231): D6 and D7. Added on 25 November with DT349 (board B168 and DT349, canvas Page 6): D14.

## Buttons and answers

D1. One filled, wide button per screen: the main step. Every other action is outlined. Guarded: design-rules.cjs, rule A.

D2. A card's buttons share one row, under everything else in the card. Guarded: design-rules.cjs, rule B.

D3. An answer is a chip, never a button. Guarded: design-rules.cjs, rule C.

D4. Today has no wide button. Guarded: design-rules.cjs, rule D.

D5. Back sits top left, above the step bar, and says where it goes. A page's title comes first, under Back. Guarded: design-rules.cjs, rule E and the lines of DS4 and DS5.

D6. An answer to tick always sits under its question, in its own block. A chip is white until it is chosen, and blue with a check mark once it is. A filled button never stands for an answer: filled reads as chosen. Guarded: photo-read.cjs (the read: Did you eat it?).

D7. The buttons of a section sit under the whole section, in one row, side by side: the second action on the left with the blue border, the main action on the right, filled. They do not sit inside the block of one question. Guarded: photo-read.cjs (the read: Save in My recipes, Done).

## Cards

D14. Every PD card is one component, PdCard (src/components/PdCard.tsx): the Plate's, a recipe page's and any new one. Each label heads its own column: on the left, under PD, the number and the short words against the target; on the right, under the title, Energy, Weight and Protein. A long line takes the full width under both. The letters under them. The card's numbers open under the card, never inside it. Coach Milan 24 November 2026, 07:42 (the same PD card on the Plate and in the design system); 25 November 13:16 (the columns), 14:26 (variation B). Guarded: design-rules.cjs, rule I.

## Standing rules, not yet guarded by a walkthrough of their own

D8. The main action is on the right.

D9. Actions are buttons: the main one filled blue, the second white with a blue border, a delete white with a red border. Text links only navigate.

D10. A button is 44 px high or more, and says what the tap does.

D11. The chef's hat marks what Chef Mealan does himself: Fit to my target, Find ideas.

D12. A box keeps its grey text inside. It says what to put in, and never looks like typed information.

D13. Plain, light text. No food is good or bad.
