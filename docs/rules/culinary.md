# Chef Mealan: culinary rules

Version 1, 24 October 2026. Drafted from the code as it is in 0.2.88, plus the culinary gate added that afternoon. Milan asked for this on 18 October: written culinary rules and nutrition rules, kept as a document that new stories check against. The nutrition rules are a sister file, docs/rules/nutrition.md.

How to read it. Every rule has a number, one line that says who enforces it, and where. Three kinds:

- Code: decided without taste, tested, never argued. The file is named.
- Chef Mealan: a cook's judgment, asked of the model. The prompt that carries it is named.
- Both: code holds the basics, Chef Mealan the rest, and he is told what code decided.

A story that touches food on the Plate names the rules it changes. A rule nobody enforces yet says so.

The standing principles behind every rule (Milan, 7 and 18 October): no food is good or bad by itself, only against the person and the moment; what can be added follows culinary logic, and the whole dish decides, never one layer; a mapped recipe follows the original, and from there we play around.

## 1. What a food is

C1. Every food has a kind: sweet, fruit, spread, dairy, cottage, supplement, meat (every savoury protein), breakfast grain (oats, bread, muesli), meal grain (rice, pasta, potatoes), nut, vegetable, fat, sauce, drink, other. Code, from the name and the food's job: `catOf` in src/mixtip.ts.

C2. Every food has a job on a plate: Protein base, Flavour food, Carb base, Fat source, Volume food, Drink, Mixed. Code, from its numbers and name: `jobOf` in src/foodjob.ts. A person can set the job on their own food, and that wins.

C3. A food's name carries its state after a comma, as the database writes it: Penne, dry; Chicken breast, cooked; Chickpeas, drained. The screens show the short name and how to weigh it under it (weigh it dry). Code: `cookName`, `weighLine` in src/cookWords.ts.

C4. A food that goes in the pot raw or dry is cooked by the steps: raw meat and fish, dry pasta and grains, potatoes, pulses, eggs. Raw almonds and dry oats are ready foods. Code: `needsCooking` in src/cookWords.ts.

C5. A cooked meat, pasta or grain on the plate says about how much that is raw or dry: meat loses about a quarter of its weight when cooked, pasta takes up water to about 2.4 times its dry weight, rice and grains about 2.5 times. Shown for these only. Code: `rawHint` in src/cookWords.ts.

C6. Some foods are ingredients, not food: yeast, flour, baking powder, raw egg, a stock cube. They need a dish around them. Chef Mealan, in the dish check (rule C20). Not yet in code.

C7. Whole eggs and bananas are counted, by size, never in grams on the screen; the grams stay the truth for the numbers. Eggs by the EU grades, bananas by the USDA sizes. A pack that prints a piece (1 bar 45 g) is counted in pieces. Code: src/counted.ts.

C8. A can packed in a liquid is a bundle: the drained food at the drained weight, and the liquid you pour off (none, a spoon, all), set by the person. Water and brine add nothing. Syrup waits for a value. Code: src/canned.ts.

## 2. Portions

C10. Every food has a normal portion, a range in grams, by its name first, then a pack's piece, then its job. Examples: a bar 35 to 100 g (one bar about 50 g), yeast 3 to 10 g, protein powder 20 to 40 g (a scoop about 30 g), nut butter 15 to 40 g, oil 5 to 25 g, nuts 15 to 50 g, cheese 20 to 80 g, meat and fish 80 to 300 g, dry pasta and grains 40 to 120 g, cooked grains 100 to 300 g, bread 30 to 150 g, potatoes 100 to 400 g, skyr and quark 100 to 400 g. By job when no name matches: a protein base 80 to 300 g, a flavour food 10 to 50 g, a carb base 40 to 250 g, a fat 5 to 40 g, a volume food 50 to 400 g. Code: `portionOf` in src/foodjob.ts.

C11. A food outside its portion gets a line under it on the Plate, in red: 150 g is 3 bars. One bar is about 50 g. The line says the range when there is no piece. The person may keep it; the app only says. Code: `portionLine` in src/foodjob.ts.

C12. Fit never moves a food past its portion. When the food it moves hits its portion before the target, the line under it says so (Fit set 10 g active dry yeast, the most for a portion, it asked for 158 g), and the plate offers three ways: Add foods for a lunch, Swap a food, Ask Chef Mealan. Code: the Plate in src/screens/JourneyScreen.tsx.

C13. The least a moved food can be and still be a portion: 80 g for a protein base, 50 g for a carb base, 10 g for a flavour food, 5 g for a fat, 20 g for a supplement. A plate that reaches its target with less lands on the minimum, above the target. Code: `minPortionOf` in src/foodjob.ts, used by Fit.

C14. The base of a meal Chef Mealan builds stays a normal portion: dry pasta 70 to 110 g, raw potatoes 200 to 400 g, dry grains 60 to 100 g, cooked grains 150 to 250 g, bread 50 to 150 g; other bases from their minimum to 300 g. The other foods he added are sized with it, from half to twice his amounts. Code: `baseRange` in src/cookWords.ts, `solveMeal` in src/makeMeal.ts.

C15. Small amounts are set to the gram, the rest to 5 g. Code: `solveMeal`.

## 3. What goes together

C20. Who goes with whom, by kind. Sweet, fruit, spread, nut and supplement go with dairy, cottage cheese, breakfast grains and each other. Meat, meal grain, vegetable, fat and sauce go with each other. Cottage cheese goes both ways. A sauce goes on a meal, never alone with dairy or a sweet. A drink goes with nothing: it is never a swap and never a partner. Code: `GOES`, `goesWith`, `plateOk` in src/mixtip.ts.

C21. A spread needs a carrier: bread, oats, dairy or cottage cheese. Fruit alone is not a carrier. Code: `spreadWithoutCarrier` in src/mixtip.ts.

C22. A dish is sweet or savoury, set by the foods that define it; fruit, vegetables and basics (flour, butter, eggs, milk, yogurt, salt, yeast) fit both. A food the dish's taste rejects is not offered, and the line says why: Chicken breast is in your foods, but it doesn't go with this dessert. The whole dish decides, never one layer, so a food that does not suit the glaze may suit another layer of the same dessert. Both, or neither: nothing is held back. Code: src/dishTaste.ts. Chef Mealan gets the same reading in his prompts.

C23. A food the rules cannot place is let through: a wrong block hides a good food, a wrong pass only offers one too many. Code, the stance of src/dishTaste.ts.

C24. What is it? A savoury meal holds sweet foods back, a sweet meal (a DaaM, Dessert as a Meal) holds savoury ones back, Both holds nothing back and puts a savoury main and a sweet finish on the plate as two parts. A small thing is a snack. Code: src/dishTaste.ts and the Plate's line.

C25. A declared allergy or intolerance blocks the food everywhere: never a partner, never a swap, never in Chef Mealan's ideas, whatever else says. Code: `blockedByAllergy` in src/safety.ts, checked in every offer; the prompts are told too.

## 4. What makes a meal

C30. The culinary gate. Once a plate has two or more foods, Chef Mealan reads them once per set of foods and says whether they make the meal the plate is for, as a cook would judge it: do they go together, is anything an ingredient that needs a dish around it, is anything a snack that does not belong in a cooked meal. He ignores the amounts; code checks those. A plain meal counts: bread, cheese and a tomato is a lunch; skyr and a banana is a breakfast. When they do not make the meal, a card says why in one sentence and offers: Make it a lunch around the main food, Make it a snack, Keep it as it is. When they do, one line says what the dish is. Chef Mealan: /api/dish in server.ts. Changing an amount does not ask again; adding or swapping a food does. Not asked for a recipe, for Chef Mealan's own dinner, or with the AI off.

C31. A plate far over its meal is not that meal yet. More than 1.4 times the meal's energy: the readout says not a lunch yet, about 2 lunches. Code: the Plate, with the NEAR rule from src/makeMeal.ts.

C32. A meal Chef Mealan builds keeps every food already on the plate, adds the foods the dish needs so a cook can make it (onion, garlic, a vegetable, a sauce are foods with grams when the dish uses them), each as it goes in the pot (raw meat, dry pasta, drained pulses), and names the herbs, spices, salt and pepper as For cooking, not counted. One added food is the base that carries the energy. Chef Mealan: /api/meal in server.ts, the prompt. Code sizes it (C14) and checks C25 and the range (nutrition rules).

C33. Three ideas, one per kitchen the person cooks, or the plate's own kitchen with the dish varied. An idea that fails the checks goes back to him once with why; one that still misses is shown with why, instead of disappearing. An idea that clashes with an allergy is never shown. Chef Mealan and code: /api/meal, the Plate.

C34. The kitchens a person cooks are sixteen, each with three dishes Chef Mealan would cook, written once in the app, not by the AI. He cooks toward the dishes kept and leaves out the ones swapped away. Code: src/kitchens.ts.

C35. A recipe from a screenshot or a link follows the original: its foods, its amounts, its method. From there we play around: Change the recipe (swap foods or use less) or Add on the side (a high protein side next to the piece), both aimed at the target, and the original stays. Code: src/recipeIn.ts; Chef Mealan: /api/recipe/read, /api/recipe/fit.

C36. A side Chef Mealan names goes with the dish by the same rules as every offer (C20 to C25). Code checks after he answers.

## 5. How it is cooked

C40. A plate with a food you cook gets steps, never the bowl ways. The bowl ways (All in one, Topped, Protein first) are for ready foods only, such as skyr with fruit. Code: `needsCooking`, the Plate.

C41. Chef Mealan writes the method: three to eight steps, in the order a cook works, what to prepare first, the heat, the time, how to tell it is done, how to serve. Heat in °C, time in minutes. One or two short sentences per step, second person. Chef Mealan: /api/steps in server.ts.

C42. The steps name every food of the recipe and no other, except salt, pepper, water and what For cooking names. Never an amount in the words: the app shows each food's amount from the recipe, so the steps follow a swap or a change of grams. A draft that breaks this goes back once with why. Code: `fromDraft` in src/steps.ts.

C43. A food whose name says raw is cooked through in the steps (meat until no pink is left, with the time); one that says dry is cooked in water; one that says cooked is warmed. Chef Mealan: /api/steps, the prompt.

C44. The steps are written for what the person cooks with: oven, stovetop, microwave, air fryer, blender, Thermomix, scale. A dish that needs something they do not have is adapted with its own heat and time, and the line says so; when no sensible way exists, he says why and gives no steps. Chef Mealan: /api/steps.

C45. A recipe's own method is followed: its order, heat and times. Each step is marked same, adapted (units, portion or equipment changed it) or added (the original does not say it). Chef Mealan: /api/steps; code keeps the marks.

C46. Oil is counted, but never more than the food can take up. A splash in a pan is all eaten and counted in full. When a recipe fries, the oil it cooks in is capped at what the fried food takes up, an estimate of 15 % of the food's weight (USDA, the glazed doughnut). The recipe still lists the whole pot. Butter is never a frying oil. Code: src/frying.ts.

C47. A recipe that makes several pieces is made whole; the steps are for the whole recipe or for just your plate, at those amounts; a recipe that makes two starts with just yours. Code: the How to make it screen in src/screens/JourneyScreen.tsx.

C48. An optional food is never numbered in the steps; it is named in words, once, where it goes, as "if you add it". Chef Mealan: /api/steps; code: `fromDraft`.

## 6. Not yet a rule, open

- Cuisines, heat and timings as a table code could check (3 October: "wait for the session").
- A meal needs a base, a protein and something fresh: true for most lunches and dinners, false for a bowl of skyr; not a rule until Milan says where it holds.
- Which ingredients are ingredients (C6) as a code list, so the gate does not depend on the model for yeast and flour.
- Fruit in syrup: the can bundle waits for a value for the syrup (C8).
- Cook mode, hands free, with the steps spoken: in the backlog.

## What changed and when

- 3 October 2026: C1, C20, C21 (culinary rules, version 1, in code).
- 17 October: C7.
- 18 October: C22, C23, C35, C45, C46. Milan asked for this document.
- 23 October: C8.
- 24 October: C3, C4, C5, C14, C15, C32, C33, C40, C43 (0.2.87); C10 to C13, C30, C31 (0.2.88). First draft of this file.
