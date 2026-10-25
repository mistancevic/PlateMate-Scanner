# Chef Mealan: nutrition rules

Version 1, 24 October 2026. Drafted from the code as it is in 0.2.88. The sister file of docs/rules/culinary.md; read that file's head for how the rules are written. Every number here has its source next to it in the code, and this file names the file.

The standing principles (Milan, 7 and 21 October): no food is good or bad by itself, only against the person and the moment; PD is one number that supports decisions and helps read the others; targets are something to land around, not an exact number; code decides the numbers, the model is told, never asked.

## 1. The person

N1. Chef Mealan is for adults, 18 and over, because the AI it uses is only allowed for adults. Two checks: the tap on the welcome screen, and the birth year on the profile, counted by year. A birth year under 18 keeps the AI off. Code: src/safety.ts.

N2. Resting burn by Mifflin St Jeor (sex, age, height, weight) by default; Katch McArdle when a body fat figure exists; Schofield when a coach pins it. The coach's pin wins, then the person's pick. Code: src/personal.ts.

N3. The day's energy is resting burn times life (physical activity levels after FAO, WHO and UNU 2004: sitting, on my feet, and so on), plus that day's training (Compendium of Physical Activities 2024), then the goal: Lose fat 20 % less, Recomposition 10 % less, Maintain the same, Build muscle steady 5 % more and faster 10 % more, Performance 5 % more. Code: src/personal.ts, `ADJ`.

N4. Protein follows whether you train, not the goal: 1.6 to 2.2 g per kg with two or more sessions a week (ISSN 2017; Morton et al. 2018), else 1.2 to 1.6 (US Dietary Guidelines 2025 to 2030). Fat is 30 % of the average day, 25 % for Performance; carbs are the rest. Code: src/personal.ts.

N5. Five goals, locked 6 October: Recomposition PD 5.5 to 7, Lose fat PD 6.5 to 9, Maintain PD 4 to 5.5, Build muscle PD 3.5 to 4.5 (faster) or 4 to 5 (steady), Performance PD 2.5 to 4. The middle of the band is the working number; exact numbers can be set on Me, and a coach can set them. Code: src/goal.ts.

N6. PD is protein in grams per 100 kcal. The day's PD is the day's protein over the day's energy. A rest day and a training day each have their own numbers; a plate aims at the target of the day it is for, never at today's by mistake. Code: src/pilot.ts `density`; the Plate uses the slot's day.

N7. The person's own numbers are checked against their goal and body by code, never by the model: energy against the formula, protein against the range, fat against 20 to 35 % of energy, carbs on a training day, the spread between rest and training days. Every finding has a source; nothing is blocked; a finding kept on purpose is remembered. Code: src/analysis.ts.

## 2. The day

N10. The day has its meals from the meals a day setting (breakfast, lunch, dinner, snacks if set), and the training slot from the week, so a slot knows what the meal is for. Code: src/slots.ts.

N11. A meal's size is what is left of the day shared over the meals still to come, this one included; a snack counts half. A meal already eaten, skipped on purpose, or eaten off the plan near its time is closed. Code: `mealShare`, `closedSlots` in src/makeMeal.ts.

N12. A meal lands in its range: within 10 % of its size (840 to 1,026 kcal for a 933 kcal dinner). The same measure Metrics uses for a day lived by the plan: every planned meal closed, protein at least 90 % of the day's target, energy within 10 % of it. Code: `mealRange` in src/makeMeal.ts; src/metricsCalc.ts.

N13. A dessert takes about a tenth of the day, from what is left of it, never under 100 kcal so a real portion fits. Fit brings it down to that. Code: `dessertKcal` in src/App.tsx.

N14. A meal above 2,000 kcal, or above the whole day, is asked about once before it is logged. Code: `BIG_MEAL` in src/screens/JourneyScreen.tsx.

N15. A plate far over its meal, more than 1.4 times its energy, is not that meal yet; the readout says so (also C31). A plate between 60 % and 140 % of the meal's energy is near enough to be the meal. Code: `NEAR` in src/makeMeal.ts.

N16. Today shows only what counts towards the target, sorted by time and importance; the last two days stay visible, older days belong to the plan review. Code: src/screens/HomeScreen.tsx.

## 3. The target on the Plate

N20. Fit to my target keeps the person's foods. A plate already on or above the target moves nothing and swaps nothing, and says so. Code: `mixWith` in src/App.tsx; the Plate.

N21. Fit moves one food, the densest free food, to the grams that reach the target, within its portion (C12) and never under its smallest portion (C13); a counted food lands on whole pieces. Everything the person kept, or typed, stays. Code: `solveIngredient` in src/pilot.ts; the Plate.

N22. When the foods cannot reach the target, code offers three foods from the person's own library that lift the plate most, a normal portion each, with the PD the plate would reach; when none reaches it, the line says so and Chef Mealan can be asked. Code: the tip in src/mixtip.ts; the Plate.

N23. A swap is offered only when it goes with the rest of the plate by the culinary rules (C20), sorted by how well it brings the plate to the target; a drink never. Code: src/swaps.ts.

N24. A meal Chef Mealan builds is checked by code after he answers: every added food has numbers, the allergy block (C25), the base in its portion (C14), the meal in its range (N12), the PD at or above the target. An idea that fails goes back once with why. Code: `solveMeal` in src/makeMeal.ts.

N25. Numbers come from the foods and their grams; each value is the food's label or a typical value, marked estimate. A new food Chef Mealan names gets his estimate for a common product sold where the person shops, marked as such. Code: src/pilot.ts `aggregate`; the recipe page's line.

N26. Four letters read a food, a plate or a recipe against the person's day, in the EU label order: F fat, C carbohydrate, Fi fibre, P protein. Each letter reads the macro's grams per 100 kcal against the day's rate, with the PD bands (N12): capital with a plus from 1.5 times the rate (High, High+), capital from 0.9 (On plan), small from 0.6 (Low), small with a minus under that (Low−), a question mark when the food has no value for it. Protein's letter never disagrees with its PD band. The rates come from the plan: protein from the PD target, fat and carbs from the day's numbers (fat 30 percent of energy, carbs the rest), fibre 14 g per 1,000 kcal (Dietary Guidelines for Americans 2020 to 2025) until the plan has its own. A letter says the level, never good or bad. Code: src/letters.ts; shown on the Plate's readout, each food row and the food card (DT108, 0.2.92). From the first version of 21 September (XP, XF, XC, XFi and the string [ P | f | C | fi ]).

N27. The nutrition gate, fat: more than half of a meal's energy from fat fails the gate (a snack or a dessert is not held to it). The line says the share and the grams. Code: `nutritionGate` in src/gates.ts (DT116, 0.2.98).

N28. The nutrition gate, a supplement: more than half of the plate's protein from foods of the kind supplement (whey, a protein powder, a shake) fails the gate, once the plate has 15 g protein or more: a shake with biscuits is not a lunch. Code: `nutritionGate`.

N29. The nutrition gate, carbs before training: for the meal before training, carbs under 10 percent of the energy fail the gate; elsewhere a low-carb plate is a choice, not a fault. Fibre under a few grams is not a check yet: too many foods have no value (0.2.98). Code: `nutritionGate`.

N30. Your day, version 1: the third gate reads the plate against the moment and the time of day. Before training, a meeting or travel: nothing to cook. Before training: under 600 kcal. After training: protein first, 15 g at least (N40 to N42 behind it). Outside the eating window from Lifestyle, a plate of 300 kcal or more sits on tomorrow. The week, budget and where you eat wait for version 2. Code: `dayGate` in src/gates.ts.

## 4. What is counted

N30. Oil taken up in frying: 15 % of the fried food's weight, an estimate, never the whole pot (C46). Code: src/frying.ts.

N31. A can: the drained food at the drained weight with the label's values, plus the liquid the person pours off (none, a spoon, all); water and brine add nothing (C8). Code: src/canned.ts.

N32. An optional food of a recipe is left out of the numbers until it is added, as the recipe's own numbers leave it out. Code: the recipe page and the Plate.

N33. Herbs, spices, salt, pepper, lemon juice and vinegar that a dish uses are For cooking, not counted (C32). Code: `cooking` on the plate and the recipe.

N34. A recipe that makes several pieces keeps the whole recipe's numbers; one piece is its share; what the person ate is counted in pieces, and the rest is not followed (it may go to the family or to work). Code: the How did making it go screen; src/recipeIn.ts.

N35. A recipe's own numbers per serving, when it gives them, are shown next to ours, and the app says whether they agree. Code: `stated` on the recipe.

## 5. Training

N40. After training, a protein dose in grams, not only a density: 0.3 g per kg, kept between 20 and 40 g, 30 g without a weight on the profile (ISSN 2017). Code: `proteinFloor` in src/fitness.ts.

N41. Before training, the carbohydrate the session asks for: 0.5 g per kg on a rest or active day, 1 g on an easy training day, 1.5 g on a hard one (Academy of Nutrition and Dietetics, Dietitians of Canada and ACSM, 2016), the low end of the range for a snack close to the session. A carb food carries at least half its energy as carbohydrate. Code: src/fitness.ts.

N42. Fitness decides what the plate needs; the culinary rules decide what goes together to get it. They never contradict. Code: the comment at the head of src/fitness.ts, and the order of the checks.

## 6. Safety

N50. A declared allergy or intolerance matches the food's name, its label lines and its notes, in the languages the pilot sees; the fourteen EU allergens are chips. A blocked food is never offered, swapped or named by Chef Mealan (C25). Code: src/safety.ts.

N51. Everyone ticks a situation or None of these applies to me before Chef Mealan's chat is on; the answer is dated, visible, and asked again once a year. Code: src/safety.ts, the door.

N52. For a declared situation Chef Mealan gives the fixed answer, written once and approved by Milan on 7 October, never improvised: he stays a chef, names who to talk to, and says what the plate still does. Signs of disordered eating keep the AI off until a coach confirms. Code: `FIXED` in src/safety.ts.

N53. The app tells people Chef Mealan is an AI chef that can make mistakes: check numbers against the pack, and health matters with a professional. No health claims in any prompt. Code and the prompts in server.ts.

## 7. Not yet a rule, open

- The nutrition gate's fibre check (N29) waits for fibre values in the catalogue.

- The nutrition gate proper. A plate the numbers alone pass, but a person should not eat as a meal: the make-up is off (a lunch that is three quarters fat, a meal with no fibre, a dinner of protein powder and oil). Today only the size is caught (N15) and the PD. Proposed: a few plain checks by code on the plate as it stands, each with a line in words and never a block: fat over 50 % of the meal's energy; carbs under 10 % on a training day; fibre under a few grams where the foods have a table; more than half the protein from a supplement. Milan decides which hold.
- Micronutrients: nothing in the app yet; a plate's sugars, saturates and salt are shown for information where the foods have a full table.
- Under 18: excluded for now; the logic for a teen's protein range (1.3 to 1.8 g per kg for adolescent athletes) is noted, not built.
- A day that goes differently: a skipped breakfast moves its share to the meals to come (N11); a meal eaten off the plan closes the nearest slot. Whether a big late meal should move tomorrow's numbers is open.

## What changed and when

- 4 October 2026: N40 to N42 (fitness rules, version 1), N50 to N53 (safety rules, version 1).
- 6 and 7 October: N1, N5, N13, N52.
- 10 to 13 October: N10, N11, N12 (Metrics), N20 to N23.
- 15 and 16 October: N11 closed meals, N15, N24.
- 23 October: N14, N31, N34.
- 24 October: N12 for a meal, N24 the range, N33. First draft of this file.
- 24 October, night: N26, the four letters (0.2.92).
- 25 October: N27 to N30, the nutrition gate and Your day (0.2.98).
