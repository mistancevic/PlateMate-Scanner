# Chef Mealan: culinary rules

Version 1, 24 October 2026. Drafted from the code as it is in 0.2.88, plus the culinary gate added that afternoon; section 6 and C6 in code since 0.2.91. Milan asked for this on 18 October: written culinary rules and nutrition rules, kept as a document that new stories check against. The nutrition rules are a sister file, docs/rules/nutrition.md.

How to read it. Every rule has a number, one line that says who enforces it, and where. Three kinds:

- Code: decided without taste, tested, never argued. The file is named.
- Chef Mealan: a cook's judgment, asked of the model. The prompt that carries it is named.
- Both: code holds the basics, Chef Mealan the rest, and he is told what code decided.

A story that touches food on the Plate names the rules it changes. A rule nobody enforces yet says so.

The process rule (Milan, 24 October 20:48, after one bar on the plate got a spoon of oil as the tip): the rules live in one module, src/mixtip.ts with src/foodjob.ts and src/dishTaste.ts behind it, and every place that puts a food in front of a person calls it. No screen gets food logic of its own. Section 7 lists the places; a story that adds a place adds a row, and names the rules it goes through, before it is drawn as finished. One walkthrough per touched rule, so a rule that stops working fails a test and not a plate.

The standing principles behind every rule (Milan, 7 and 18 October): no food is good or bad by itself, only against the person and the moment; what can be added follows culinary logic, and the whole dish decides, never one layer; a mapped recipe follows the original, and from there we play around.

## 1. What a food is

C1. Every food has a kind: sweet, fruit, spread, dairy, cottage, supplement, meat (every savoury protein), breakfast grain (oats, bread, muesli), meal grain (rice, pasta, potatoes), nut, vegetable, fat, sauce, drink, other. Code, from the name and the food's job: `catOf` in src/mixtip.ts.

C2. Every food has a job on a plate: Protein base, Flavour food, Carb base, Fat source, Volume food, Drink, Mixed. Code, from its numbers and name: `jobOf` in src/foodjob.ts. A person can set the job on their own food, and that wins.

C3. A food's name carries its state after a comma, as the database writes it: Penne, dry; Chicken breast, cooked; Chickpeas, drained. The screens show the short name and how to weigh it under it (weigh it dry). Code: `cookName`, `weighLine` in src/cookWords.ts.

C4. A food that goes in the pot raw or dry is cooked by the steps: raw meat and fish, dry pasta and grains, potatoes, pulses, eggs. Raw almonds and dry oats are ready foods. Code: `needsCooking` in src/cookWords.ts.

C5. A cooked meat, pasta or grain on the plate says about how much that is raw or dry: meat loses about a quarter of its weight when cooked, pasta takes up water to about 2.4 times its dry weight, rice and grains about 2.5 times. Shown for these only. Code: `rawHint` in src/cookWords.ts.

C6. Some foods are ingredients, not food: yeast, flour, baking powder, a stock cube, oil, sugar, salt, spices, vinegar, starch, a sauce base (soy sauce, tomato paste, mustard). They need a dish around them, so on their own they are never a quick pick, never a tip, never a partner, never a swap. A food named by a generic word is one only when that word names it (Olive oil, Sugar); Sardines in olive oil and Low sugar yogurt stay food. An egg is not an ingredient: it is cooked and eaten as it is (C7). Code: `isIngredient` in src/mixtip.ts, one list (DT103, 0.2.91). On the plate, the gate says it at once, by code, before any read (DT105, 0.2.92). A food read from a photo of the meal (DT127, 0.2.108) is part of the dish in front of the person, the oil in a dressing or the butter in a sauce, so the gate does not fire on it.

C7. Whole eggs and bananas are counted, by size, never in grams on the screen; the grams stay the truth for the numbers. Eggs by the EU grades, bananas by the USDA sizes. A pack that prints a piece (1 bar 45 g) is counted in pieces. Code: src/counted.ts.

C8. A can packed in a liquid is a bundle: the drained food at the drained weight, and the liquid you pour off (none, a spoon, all), set by the person. Water and brine add nothing. Syrup waits for a value. Code: src/canned.ts.

## 2. Portions

C10. Every food has a normal portion, a range in grams, and Add puts it on the plate at that portion: a piece when the pack has one, one M egg or banana when counted, else the middle of the range (`startGrams`, 0.2.89). The range is by its name first, then a pack's piece, then its job. Examples: a bar 35 to 100 g (one bar about 50 g), yeast 3 to 10 g, protein powder 20 to 40 g (a scoop about 30 g), nut butter 15 to 40 g, oil 5 to 25 g, nuts 15 to 50 g, cheese 20 to 80 g, meat and fish 80 to 300 g, dry pasta and grains 40 to 120 g, cooked grains 100 to 300 g, bread 30 to 150 g, potatoes 100 to 400 g, skyr and quark 100 to 400 g. By job when no name matches: a protein base 80 to 300 g, a flavour food 10 to 50 g, a carb base 40 to 250 g, a fat 5 to 40 g, a volume food 50 to 400 g. Code: `portionOf` in src/foodjob.ts. A salad is a salad by its name, dressed or not: 50 to 300 g (0.2.115; its oil had made a dressed salad read as a fat source, 5 to 40 g).

C49. A food's portion grows with the meal (DT135, 0.2.116; Milan 27 October 15:34). The ranges in C10 and C14 are for a meal of a day of three meals. The most of each food is multiplied by the meal's energy over a third of the day, from 1 to 3 times: one meal a day 3 times (pasta up to 900 g cooked, cheese up to 240 g), two meals about 1.5 times, three or more meals as C10. The least stays. Yeast, baking powder, salt and pepper keep their ranges: a dough does not grow with the meal. A food counted in pieces keeps whole pieces, up to 3 times as many. The line says "over your meal's portion" when the range grew. Add starts in the middle of the grown range; Fit, Shrink it to one portion and Chef Mealan's ideas use the same ranges. Code: `mealScale` and `portionOf(f, scale)` in src/foodjob.ts; `solveMeal(..., scale)` in src/makeMeal.ts.

C50. A sweet pepper is a vegetable, not the spice (0.2.118; Milan 27 October 18:23, "Fix Paprika"). Bell pepper, red pepper, peppers, Paprika (the German and Serbian word for the vegetable), Paprikaschote, babura: a portion of 50 to 300 g, a vegetable in the taste of a dish, never an ingredient. The spice says so: black pepper, pepper alone, pepper flakes, ground pepper, peppercorns, Paprikapulver, smoked or sweet paprika, aleva paprika: 1 to 5 g, an ingredient, not grown with the meal (C49). Before, Bell pepper, red, raw and Paprika, rot read as the spice: 1 to 5 g, a red line at 150 g, and "an ingredient, not a food". Code: `isVegPepper` in src/foodjob.ts, asked by `portionOf`, `isIngredient` in src/mixtip.ts and `tasteOf` in src/dishTaste.ts.

C52. A dish keeps its proportions (DT150, 0.2.131; Coach Milan 29 October 00:19: cooking, layered meals and desserts are not just nutrition math). A plate is a mix (ready foods in any combination, mixed, topped or spread) or a dish (cooked together, in parts). On a plate in parts, Fit sizes the part that can lift the plate as a whole: every free food in it by the same factor, between half and twice, no food past its portion (C12, C49), so a filling keeps its quark to egg; the other parts stay. A cooked plate of your own with three foods or more and no parts asks once, Is this one dish?, with the parts suggested by what each food is (sweet: base, filling, topping; savoury: main, side). In a dish an egg, flour or butter is cooked into it, so who goes with whom (C20) reads the other foods: an egg in a cheesecake filling does not make it savoury. Chef Mealan's idea comes with its parts. The steps say when the foods changed after they were written, with Redraft; a change of amounts keeps them, they never say an amount (C42). Code: `fitPart` in src/foodjob.ts, `suggestParts` in src/mixtip.ts; the proportions a cook needs (egg to set a baked filling, liquid for grains, fat to bind a base) are Chef Mealan's, in the culinary gate, read with the amounts and the parts once the plate is in parts (any other plate keeps one read per set of foods, DT93). Later: ratios per kind of dish as code (batter, dough, custard, crumble, cheesecake, a gelatin set).

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

C51. A swap keeps the dish (DT148, 0.2.129; Tester 3 swapped Quark and was offered Quark again, then any food by PD). The same food under another name is no swap (Quark, low fat and Quark, low fat (Magerquark)). The same food in another state leads (tuna in water for tuna in olive oil, DT115). Then the same kind of food (soft dairy for quark: yogurt, cottage cheese), your foods first, then the ones that would join them; then how well each brings the plate to the target. Other kinds wait behind one line. The list holds only foods sold where you shop: yours, the members' seen there, and the basic foods sold there, a Cypriot yoghurt in Limassol; one picked joins your foods. Code: `swapKind` and `sameFoodName` in src/mixtip.ts, used by `rankSwaps` in src/swaps.ts; `basicsHere` in src/places.ts.

C25. A declared allergy or intolerance blocks the food everywhere: never a partner, never a swap, never in Chef Mealan's ideas, whatever else says. Code: `blockedByAllergy` in src/safety.ts, checked in every offer; the prompts are told too.

## 4. What makes a meal

C30. The culinary gate. Once a plate has two or more foods, Chef Mealan reads them once per set of foods and says whether they make the meal the plate is for, as a cook would judge it: do they go together, is anything an ingredient that needs a dish around it, is anything a snack that does not belong in a cooked meal. He ignores the amounts; code checks those. A plain meal counts: bread, cheese and a tomato is a lunch; skyr and a banana is a breakfast. When they do not make the meal, a card says why in one sentence and offers: Make it a lunch around the main food, Make it a snack, Keep it as it is. When they do, one line says what the dish is. Chef Mealan: /api/dish in server.ts. Changing an amount does not ask again; adding or swapping a food does. Not asked for a recipe, for Chef Mealan's own dinner, or with the AI off.

C31. A plate far over its meal is not that meal yet. Counted in portions of the meal (its share of what is left of the day, from the plan): over 1.5 portions the readout says not a lunch yet, the card says about 3 lunch portions with Make it 3 portions, Shrink it to one portion, Keep it as it is, and no DaaM Good spot (DT133, 0.2.113). 1.3 to 1.5 portions is on the edge, an amber line (DT132). Changed from more than 1.4 times. Code: `sizeOf` in src/gates.ts, read by the Plate and `mealsOn` in src/mealPhoto.ts.

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

## 6. Where the rules are applied

Every place that offers, accepts or moves a food, and the rules it goes through. Code first, Chef Mealan after.

| Place | What it does | Rules | Code |
|---|---|---|---|
| Add, the food list and search | puts a food on the plate at its start amount, in the middle of the meal's range | C10, C49 | `startGrams` in src/foodjob.ts, `add` in src/App.tsx |
| Quick picks | the eight foods you reach for | C6, C25 | `quickPicks` in src/quick.ts |
| The tip under the plate | up to three foods from your foods that lift the plate | C6, C20, C21, C22, C23, C10 | `fitsPlate` in src/mixtip.ts, `lifts` in src/screens/JourneyScreen.tsx |
| The mix tip on a food card | partners for a scanned food, by moment and job | C2, C6, C20, C22, C25, N-rules for the moment | `mixTip`, `candidates` in src/mixtip.ts |
| Swap a food on the plate | foods that can take this one's place: the same kind first, sold where you shop, the basic foods sold there too; the food swapped away under another name never comes back (DT148) | C6, C20, C21, C25, C51, C52 | `mixWith` in src/App.tsx; `rankSwaps` in src/swaps.ts with `fitsPlate`, `swapKind` and `sameFoodName` (src/mixtip.ts), `basicsHere` (src/places.ts) |
| Members' foods | the catalogue in Find a food, the barcode scan and the swap list; your market first, a member's food copied into your library when taken (DT115) | C6, C20, C21 through the swap list; the catalogue itself holds no rule | src/memberFoods.ts, /api/members/foods in server.ts |
| One food list | Find a food and the Plate search read one list: yours, the members', the basic foods, the product database behind a line; one identity, one row, every name behind it; on the Plate the rows pass the dish's taste like your own foods (DT125) | C6, C20 through `goesInDish`; the job and the kind read the English name (`englishName`), never a name in another language | `identityOf`, `foodHit` in src/foodId.ts; `oneList` in src/oneList.ts; FoodsScreen, `plateOthers` in src/screens/JourneyScreen.tsx |
| The recipes bar | Recipes is one list under one bar, no tabs: one search over the title, the foods (every language) and the cook; Made by and Kitchen drop-downs with counts; Fits my day, No cooking (no food that needs a pot, no step that cooks), With my foods; a sort (DT126, DT126c) | C6 through `needsCooking`; the allergy filter before it, silent and always on | `applyFilters`, `recipeHit`, `groupRows` in src/recipeFilter.ts; src/components/RecipeBar.tsx; src/screens/RecipesScreen.tsx |
| A photo of the meal | the read names the foods and guesses the amounts; the rows land as estimates (~, a range), the gates read them, Chef Mealan's line is code: eat it, eat half, add protein, a snack (DT127) | C6 with a note: a food read from the photo is part of the dish (oil in a dressing), so the ingredient line does not fire on it; C10, C30, C31; N27 to N29; Your day v1 | /api/plate-photo in server.ts; `itemsOfRead`, `photoAdvice` in src/mealPhoto.ts; the Plate in src/screens/JourneyScreen.tsx |
| Fit | moves the densest free food within its portion; on a plate in parts, sizes the part that lifts the plate as a whole and keeps its proportions (DT150) | C10, C12, C13, C49, C52 | `fit` in src/screens/JourneyScreen.tsx, src/foodjob.ts (`fitPart`) |
| The portion line | red line under a food outside its portion; over your meal's portion when the meal is bigger than one of three (DT135) | C10, C11, C49, C50 | `portionLine` in src/foodjob.ts |
| The culinary gate | reads two or more foods, says whether they make the meal; a failed read says so, with Try again (DT104); a dish cooked together is read with its amounts and parts, and says when its proportions do not hold and how to fix it (DT150) | C24, C30, C31, C52 | /api/dish in server.ts, the Plate |
| The three gates | Chef Mealan's card: Culinary (C30 with C6 and C31 in front), Nutrition (N27 to N29), Your day (N30); the sweet spot when all three hold (DT116) | C30, C6, C31; N27 to N30 | `gateLine` in src/screens/JourneyScreen.tsx, src/gates.ts |
| A plate over its meal | says it is about two breakfasts and offers Make it two, Shrink it to one, Keep it; never the ideas (DT110) | C31, C10, C49 | `bigPlate`, `makeItN`, `shrinkToOne` in src/screens/JourneyScreen.tsx |
| A plate that has foods | a photo read, Make it from Recipes or a meal from Plan waits for one answer: Add to my plate, or Start a new plate; Keep my plate (or Drop the photo) leaves it as it is; never on an empty plate, never for one food (DT131) | none change; the gates read the plate after the tap | `askPlate` in src/App.tsx, the card on the Plate |
| The ingredient line | an ingredient on the plate gets a line at once, by code, before any read: Take it out, Ask Chef Mealan for a dish around it (DT105) | C6 | `isIngredient`, the gate card in src/screens/JourneyScreen.tsx |
| A chat answer | the foods Chef Mealan names become rows: + Add, Take it out, Scan it; a name the rules refuse is no row (DT106) | C6, C20, C21, C10 | `chatRows` in src/chatFoods.ts, `fitsPlate` |
| Is this one dish? | a cooked plate of your own with no parts: the parts suggested, Group it like this, Change the parts, No, separate foods (DT150) | C52 | `suggestParts` in src/mixtip.ts, the Plate |
| Chef Mealan's ideas | three dishes around the plate, by kitchen | C14, C49, C15, C20, C25, C32, C33, C34, C36 | /api/meal in server.ts, `solveMeal` in src/makeMeal.ts |
| The steps | the method for a plate you cook; out of date when the foods change, with Redraft (DT150) | C3, C4, C5, C40 to C48, C52 | /api/steps in server.ts, src/draftSteps.ts, src/cookWords.ts, `stepsHold` in src/screens/JourneyScreen.tsx |
| A recipe from a link or screenshot | the original, then your changes | C35, C45, C46, C47, C48 | /api/recipe/* in server.ts |
| Counted foods and cans | eggs, bananas, pieces; a can and its liquid | C7, C8 | src/counted.ts, src/canned.ts |
| What a dish brings with it | the recipe's link, its cooking foods, its optional and left-out foods: they belong to the dish and leave the plate with it (DT102, DT109) | C30 | `recipeStillOn`, `cookingOn` in src/screens/JourneyScreen.tsx |

A row that names a rule the code does not call is a gap and goes to section 7. Checked for 0.2.91: the tip and quick picks were the gaps (DT101, DT103). 0.2.92: the gate gets C6 by code (DT105) and the chat's answer gets a row (DT106).

## 7. Not yet a rule, open

- Cuisines, heat and timings as a table code could check (3 October: "wait for the session").
- A meal needs a base, a protein and something fresh: true for most lunches and dinners, false for a bowl of skyr; not a rule until Milan says where it holds.
- Fruit in syrup: the can bundle waits for a value for the syrup (C8).
- Cook mode, hands free, with the steps spoken: in the backlog.

## What changed and when

- 3 October 2026: C1, C20, C21 (culinary rules, version 1, in code).
- 17 October: C7.
- 18 October: C22, C23, C35, C45, C46. Milan asked for this document.
- 23 October: C8.
- 24 October: C3, C4, C5, C14, C15, C32, C33, C40, C43 (0.2.87); C10 to C13, C30, C31 (0.2.88); C10 the start amount (0.2.89). First draft of this file.
- 24 October, evening: C6 in code; the tip, quick picks, swaps and partners all go through the one module; section 6, where each rule is applied, and the process rule (0.2.91, DT101 to DT103).
- 24 October, night: C6 in the gate by code, a failed read says so, the chat's answer as rows (0.2.92, DT104 to DT107); a recipe leaves the plate with its foods (0.2.93, DT109).
- 25 October: C31 in the gate, a plate over its meal never goes to the ideas (0.2.94, DT110).
- 27 October: C49, a food's portion grows with the meal (0.2.116, DT135). The walkthrough is tests/flows/meal-portion.cjs.
- 27 October, evening: C50, a sweet pepper is a vegetable (0.2.118). The walkthrough is tests/flows/paprika.cjs.
- 28 October, night: C51, a swap keeps the dish: the same kind first, sold where you shop, never the same food under another name; + Add a food under the foods; the idea to read, then the Plate (0.2.129, DT148). The walkthrough is tests/flows/idea-and-swap.cjs.
- 29 October: C52, a dish keeps its proportions: Fit sizes a part as a whole, Is this one dish?, the steps say when they are out of date, the culinary gate reads a cooked dish with its amounts (0.2.131, DT150). The walkthrough is tests/flows/dish-proportions.cjs.
