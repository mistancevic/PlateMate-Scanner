# Change log

One version per release since 2 October 2026. The number is in Menu, About, next to the commit; every release is a git tag `vX.Y.Z`; the full story of each is in the commit message (`git log`).

## 0.1.x, the pilot builds

- **v0.1.65** · 2026-10-07 · never an empty screen while opening: the logo and "Opening your account…"; after 10 seconds, Try again or Open with what's on this phone; photos and plate cards load after the app opens; the account load has a 20-second limit, then the app opens on the phone's copy, keeps what is changed there, and tries the account again every half minute.
- **v0.1.64** · 2026-10-07 · Today shows the day's PD target, not the plate's: a moment picked on the Plate (Before training aims at PD 3) changed the Today card and the Foods chips too; now only the Plate follows the moment.
- **v0.1.63** · 2026-10-06 · the link preview when chefmealan.com is shared, as approved on the canvas (board P1): the home page headline, a plain description, Coach Milan's photo instead of an old app screen, no brand names, Closed pilot.
- **v0.1.62** · 2026-10-06 · goals and protein explained (canvas boards G1, G2): the five goals as cards that say what happens to your weight and food, Recomposition first; protein in the middle of the range, at the top when losing fat, eating mostly plants or over 60, with the reason shown and a card that explains the range, the portion per meal and protein quality. Home page Try it for Recomposition only, You crave, butter biscuits and a croissant, the total weight on the plate, a smaller amount suggested for a very big bowl, no photo of the plate.
- **v0.1.61** · 2026-10-06 · the home page, chefmealan.com, as approved on the canvas: plain sentences, Chef Mealan and Coach Milan named, no cities, a generic chocolate spread instead of a brand; How it works in three steps, Plan your usual week once, Try it with the app's own math, What is PD, With your coach, How the numbers work (AI reads, a calculator decides), Who it's for with the school version, Ask for an invite with Which fits you.
- **v0.1.60** · 2026-10-06 · on the Goal card the goal's name sits on its own line, its description under it; the back link's arrow sits beside its word. Every main screen checked for text that runs together or off the screen.
- **v0.1.59** · 2026-10-06 · choices look different from actions, everywhere (canvas board B1): an option you pick is small and light and gets a tick when picked; an action is solid blue with squarer corners; the main action on a card is wide, at the bottom under a line, with Cancel as plain text under it.
- **v0.1.58** · 2026-10-06 · as approved on the canvas: weeks with dates for everyone (By date and Usual week; a change belongs to its date; earlier weeks and what was eaten on a past day); school kids under 18 (School instead of Work, sport at school, club training and matches by sport, no alcohol and no eating window, resting burn from the Schofield equations); the Today card leads with the goal in large type, a small line says whose goal and who set it, fat and carbs as their own numbers.
- **v0.1.57** · 2026-10-06 · the release as approved on the canvas: Lifestyle (Nutrition, Work, Recovery; alcohol only from 18, in every country) and Weekly plan (seven days, one activity each, how hard, when, how long) replace My week; each day's calories are resting burn × work plus that day's activity; the goal table shows your seven days when calculated and Rest, Light, Moderate, Hard for your own numbers; Today reads the plan, shows today's numbers and Change today's plan, or asks the day when there is no plan; the goal line says Your goal or Coach Milan's goal correctly; old days and My week move over.
- **v0.1.56** · 2026-10-06 · the energy finding in plain English, as on the canvas: "This looks more like building than maintaining".
- **v0.1.55** · 2026-10-06 · as approved on the canvas: the goal as the headline in Me, Goal; own numbers with all four fields per day, a blank one filled and saying so, a row that does not add up saying what it comes to; Target analysis in place, findings under the day or the week with Keep, on purpose or Change it, in range in one green line, Save saying how many are kept; what is kept goes to the coach: To approve on Clients with a note, Approve or Ask to change; the client sees Waiting, Approved, or the note with Change my numbers and Reply; names Coach Milan, Chef Mealan, Client Mia.
- **v0.1.54** · 2026-10-06 · Goal and days, as approved on the canvas: Calculate for me or My own numbers; five goals (Lose fat, Recomposition, Maintain, Build muscle, Performance), protein following whether you train; life set once in My week, training chosen per day (Rest passive, Rest active, Training easy, Training hard); Every day the same or Each day its own; the four days as one table with kcal, protein, fat, carbs and How for every calculated number; the week's average from My week; own numbers typed per day, empty days calculated; Not now on the first open, back to Me from Goal; Today picks the training day.
- **v0.1.53** · 2026-10-05 · Follow my day shows the four days on the goal screen and in Me, Goal: the usual day is the goal's calories, rest, training and very active by rule, each settable by hand ("set by you"), with Back to the rule; Today uses them; protein and fat stay, carbs take the difference. The calculated way had lost its day choice; it is back.
- **v0.1.52** · 2026-10-05 · no blank screen during a deploy: a code file the server does not have is a 404, never the page sent again; and if the app's code does not start, the page says "Chef Mealan is updating", reloads once by itself, then offers a Reload button. Fonts from outside do not count.
- **v0.1.51** · 2026-10-05 · one tap never removes a photo: close is a button top right and a tap on the photo; Remove sits top left, the first tap arms it ("Tap again to remove", red, three seconds), the second hides the photo with "Photo removed. Undo" for eight seconds; only then, or when the card closes, is it removed for real.
- **v0.1.50** · 2026-10-05 · the logo opens Today, closing any open panel or chat on the way.
- **v0.1.49** · 2026-10-05 · never a white screen: if the app fails to draw, it says so, shows the version and the error, and offers Try again, Save this phone's copy as a file, and Open from the account copy (the phone's copy set aside, not deleted).
- **v0.1.48** · 2026-10-05 · the end of a search: a card in plain words, "Can't find what you want? Add it yourself, \"kupus\" comes with you." with Type and Scan, or "Nothing found for ..." when nothing was; Add all on the Without a label group; a name is not repeated on a row.
- **v0.1.47** · 2026-10-05 · merged or removed foods stay gone: every food that leaves the library is remembered on the phone and in the account and filtered out of any copy that still has it; on opening, the newer copy wins, so a change made on this phone after the account's last save is kept and sent up instead of being overwritten.
- **v0.1.46** · 2026-10-05 · Add moves to the top right of Find a food; tapping it opens Type and Scan under the header, the Find box stays as it was; the tinted Add strip is gone. A selected chip has a white ring and a ring in its own colour, with room so it is never cut.
- **v0.1.45** · 2026-10-05 · chips show their state on a phone: none on, all full colour; one on, that one full with a ring and the rest faded; tapping it again brings all back. The phone's sticky hover no longer keeps a chip lit.
- **v0.1.44** · 2026-10-05 · Find reads a food's other names: a food without a label saved under the shop's name (Weißkohl in Munich) is found as Kupus, Купус or Cabbage, including ones saved before today, by their notes; Without a label no longer offers a food already in my foods under another name; a chip that hides search matches says "1 more in your foods under On plan · Show all".
- **v0.1.43** · 2026-10-05 · the line under the chips is one line in every case: "Tap a chip to see its PD range." idle, and "Low−: PD under 3.2 · your target 5.3" on a tap; no pairing advice, that is Mix it's job.
- **v0.1.42** · 2026-10-05 · the chips on one axis: Low−, Low, On plan, High, High+; a line under them, always there so nothing jumps, says "Tap a chip to filter, and to see what it means for your target", and on a tap the band's range for this target and what it pairs with; no text selection on a chip.
- **v0.1.41** · 2026-10-05 · five PD bands, every edge a multiple of the target: Below under 0.6 T (red), Close 0.6 to 0.9 T (orange), On plan 0.9 to 1.5 T (blue), High 1.5 to 2.5 T (green), High+ from 2.5 T (deep green); the Foods chips, the PD badges, the plate readout and the food card use them; In meal removed; the five chips fit one row.
- **v0.1.40** · 2026-10-05 · Find a food finds a food wherever it is, in three labelled groups: In your foods, Without a label, In the product database. By what was typed: one letter, my foods by word start; two, plus foods without a label; three or more, plus the product database by name, top five for the country where you shop; a barcode, my food or the one database product. Add to my foods on an outside row: a food without a label goes straight in, a database product opens the sheet titled Add to my foods. Nothing anywhere says so, and Type keeps what was typed.
- **v0.1.39** · 2026-10-05 · the camera's top bar is the close button and the switch again, the act "Add a food · Scan" a slim pill under it; adding is Type or Scan, no separate Barcode chip: the barcode number with Look up lives inside the Type form, with the name, brand and the full table; digits typed in Find ride into that field.
- **v0.1.38** · 2026-10-05 · Foods: finding and adding are two things. Find a food on top with the count, searching only my foods, letters or a saved barcode, never adding; Add a food right under it, one row, Type, Barcode, Scan; nothing found says so and the text rides into Type or Barcode; the Barcode sheet; every sheet titled by the word tapped under a small ADD A FOOD or ADD TO PLATE line; the camera header the same; Check the label retired as a title; the Plate chip Type it is Type; the old chips, the loose barcode field and the no-label block in the search are gone.
- **v0.1.37** · 2026-10-05 · a food added from the reference table lacked its basis field, so the whole stored record failed validation and the app started empty ("Stored pilot data could not be read"); the field is set, and a stored record is repaired on read so one missing field can never hide a person's data again; the preserved record comes back on the next open.
- **v0.1.36** · 2026-10-05 · the third tab goes: foods without a label live behind the one search box, under my foods, marked "no label", with the same two actions as any row, Add to meal and Save; a link under the search, and on an empty library, opens the whole table in groups; "basic" is gone from the app.
- **v0.1.35** · 2026-10-05 · Basic foods: the reference table as the third part of Foods, grouped (vegetables, fruit, eggs meat and fish, dairy, grains bread and legumes, nuts seeds and oils, basics), searchable, local names, one tap to add, what is already in the library marked.
- **v0.1.34** · 2026-10-05 · the reference table: 125 basic foods with no label or barcode (vegetables, fruit, eggs, meat, fish, dairy, grains, legumes, nuts, oils, basics), values per 100 g from USDA FoodData Central, names in English, German and Serbian in both scripts; "tikvice" finds the courgette from the Foods search (one tap to add) and from the name field on the label check (values fill in); the local name follows where the person shops; a link inside a panel that changes the tab now closes the panel first.
- **v0.1.33** · 2026-10-05 · tabs sorted: four places, every screen under one. Me holds the person (Profile with the door, Goal, My days, Where I shop, My coach, Account, shared cards); Foods holds my foods and my recipes as two parts; Plate keeps its steps; Today keeps the day. The hamburger is housekeeping only: Support, About, Evals for coaches, the legal pages, sign out. More and its leftovers removed; nothing lights a tab it is not under.
- **v0.1.32** · 2026-10-05 · Saved recipes reachable: a row at the top of Settings for everyone, and a button on Today once there is one; before, only the coach tools linked to it.
- **v0.1.31** · 2026-10-05 · the white button: a primary pill inside the plan card was painted white by a card rule, so "Work it out, or change it" had white text on white; fixed for every primary pill in a plan card; the duplicate "Your days" block on the goal screen removed; "A rough goal" only offered when there is no body data, and it says it never follows your weight; the source line names the way in plain words.
- **v0.1.30** · 2026-10-04 · from Davorka's call: Delete my account asks for a fresh sign-in when Firebase requires one and wipes the phone once the data is gone; the Coach card shows who the coach is (name, email, photo, since when) and what they see and never see; the first screen asks every day the same or follow my day; buttons keep their colours on browsers without @layer; access requests one line per person.
- **v0.1.30** · 2026-10-04 · Delete my account runs on the server with admin rights: record, photos, cards, recipes, access requests and invites by email, then the sign-in, no second sign-in; the phone wipes its copy so nothing comes back; the day mode (every day the same, follow my day) on every way of the goal screen; "Your day is set. This is Today." after setting; the coach named and tappable on the Today card.
- **v0.1.29** · 2026-10-04 · the first screen works the day out: body data behind consent, the goal band, four numbers as you type (calories, protein, fat, carbs); a rough goal and own numbers are the other ways; fat 30 percent of energy by rule, carbs the rest and moving with the day; the Goal panel and the Today card carry the four; walkthrough first-goal.cjs.
- **v0.1.28** · 2026-10-04 · the coach's confirm shows at once on the client sheet, no refresh needed.
- **v0.1.27** · 2026-10-04 · allergies under the tick, the fourteen EU allergens as chips plus a free line; the public legal pages, Impressum, Privacy notice, Disclaimer and Who's behind it, at their own addresses, linked from the landing page, About and the consent card; Milan's lines in brackets.
- **v0.1.27** · 2026-10-04 · allergies field opens under its tick, with the fourteen EU allergens as chips plus a free line; legal pages readable without signing in: /impressum, /privacy, /disclaimer, /about, linked from the landing page and About; lines in brackets are Milan's to fill.
- **v0.1.26** · 2026-10-04 · the door's answer reaches the account (the cloud save had not been watching the safety record, so the account's older copy could overwrite a fresh answer on the next open); the newer answer wins on load; None of these sits below the allergies, set apart on a tint.
- **v0.1.25** · 2026-10-04 · the door saves on the tick: no Save button, a tick or an allergy typed is the answer, the line under it says when it was answered.
- **v0.1.24** · 2026-10-03 · version numbers: the app shows its version next to the commit, every release is tagged, this log is kept.
- **v0.1.23** · 2026-10-03 · `3502871` · The door is a gate: None of these applies to me, Save shut until answered, the chat waits for the answer, asked again yearly.
- **v0.1.22** · 2026-10-03 · `02cfae6` · Consent visible with its date; the door says Mealan is an AI chef that can be wrong; pregnancy not asked of a man; dated history of declarations; Settings chain Profile, Goal, My week, Where I shop, Coach.
- **v0.1.21** · 2026-10-03 · `25facd7` · S2 + S5: consent before body data, the door with five situations and allergies, the AI switch for disordered eating and minors with coach confirmation, fixed responses, code signals, allergy filtering, coach flag, export and full delete, landing line.
- **v0.1.20** · 2026-10-03 · `c5ffc9b` · QA pass on request: npm run qa:paths, one verdict per happy path.
- **v0.1.19** · 2026-10-03 · `96215b4` · Servings: counted foods, whole bars, PD as its own line on the label check.
- **v0.1.18** · 2026-10-03 · `4843d01` · Release script sets the account and project itself.
- **v0.1.17** · 2026-10-03 · `4291ede` · Scan opens the single-product camera; Several products is the explicit choice.
- **v0.1.16** · 2026-10-03 · `a36d18e` · Fit to my target keeps the person's foods; ideas from the Out chat are a different plate.
- **v0.1.15** · 2026-10-03 · `95db8d4` · Fitness rules v1 with sources: pre-training carbs by the day's load, post-training protein floor.
- **v0.1.14** · 2026-10-03 · `81120e1` · Less-than label values fill the field with the printed bound.
- **v0.1.13** · 2026-10-03 · `910a71d` · Sauce category; what Mealan moves is a real portion; helper stays open after Add; white text on the cards.
- **v0.1.12** · 2026-10-02 · `698d6af` · Quiet build log.
- **v0.1.11** · 2026-10-02 · `6d4da0e` · Label check and Food card named by the job.
- **v0.1.10** · 2026-10-02 · `08cd3cb` · Culinary rules v1 in code: sweet with dairy, savoury with meal grains, dairy both ways, spreads need a carrier, whey a dessert ingredient, drinks never.
- **v0.1.9** · 2026-10-02 · `e4a1979` · How it fits on the label check; Tell Mealan without the reviewed tick.
- **v0.1.8** · 2026-10-02 · `1104366` · Front photo first in every scan; every printed line for one product; Tell Mealan on the label check.
- **v0.1.7** · 2026-10-02 · `4352925` · Several photos in every mode; barcode stays open for the pack's photos.
- **v0.1.6** · 2026-10-02 · `63ccc57` · Scan sets the camera mode itself, never the last one used.
- **v0.1.5** · 2026-10-02 · `87f3192` · QA rule: journey invariants never rewritten to fit a change.
- **v0.1.4** · 2026-10-02 · `02c81d0` · Mix it on the label check; Scan always the several-photos camera.
- **v0.1.3** · 2026-10-02 · `a1aa280` · Mix it: up to three mixes that follow the moment, one tap to the plate, Not quite? Tell Mealan, everything logged.
- **v0.1.2** · 2026-10-02 · `caf767a` · Plate first step: Products in, Mealan does the amounts; Scan, Type it, Empty plate.
- **v0.1.1** · 2026-10-02 · `bc677be` · Today card: the day set once, read all day; goal source as a link; Usual day.

## 0.3.0 — Mealan client pilot

Scope: update the existing scanner into a bounded, testable food-to-meal workflow. No business-model documents or published PRD were changed. This branch is not a production rollout or a claim that every PRD feature is complete.

### Added

- A mobile-first workspace with My meal, Saved foods, and Recipes & taste.
- Explicit user-entered daily energy and macro references; unset targets stay unknown.
- PD, FD, CD and FiD terminology; Mealan with selected-portion amounts and daily percentages.
- Manual review/edit before food data can enter the saved library.
- Deterministic ingredient solver: preserve fixed foods, adjust one supporting food, respect supplied whole-recipe constraints, explain infeasibility, recalculate after rounding.
- Ready-to-eat ingredient confirmation; AI ranking of already calculated alternatives using explicit preferences/feedback.
- Saved recipe snapshots, separate preparation/eating feedback, versioned local backup export/import.
- Configurable model ID, pilot server access key, rate limits, model-output runtime checks and narrow API payloads.
- Calculation regression tests, host setup instructions and a real-product/client walkthrough.

### Corrected

- Missing/trace nutrient values no longer become zero; decimal extraction is requested.
- Calories/unknown quantities are no longer coerced into a misleading density of zero.
- Classification uses unrounded density; display rounding occurs at the presentation boundary.
- Uploaded barcode images are actually decoded; decoding no longer relies on an empty camera canvas or browser-only BarcodeDetector support.
- Photo loading registers handlers before setting the source. Group capture limits the batch and lets users remove individual staged images.
- Model JSON mode is supplemented with a schema and runtime validation; client-supplied prompts cannot replace the extraction instructions.
- Per-volume/per-serving OCR output does not silently become per-100-g data.
- Existing insecure arbitrary Airtable query proxies were replaced by a bounded explicit food-sync action. Targets and client feedback are kept local.
- Dependency lockfile repaired; React type definitions supplied; test/dev scripts avoid unnecessary CLI IPC; production start explicitly selects production mode.
- Page title and metadata use current terminology.

### Preserved

- React/Vite/TypeScript/Express stack and Gemini server-side integration.
- Barcode, label and group capture modes; image resizing; camera/gallery entry; multi-angle staging.
- Unknown group products require separate nutrition review rather than invented macros.
- Open Food Facts lookup and optional Airtable connection (reviewed raw food data only).
- Basic density math, ingredient mass scaling, familiar calories/grams, recipe composition and source traceability.
- Original Git history and original browser-storage key; no silent destructive migration.

### Replaced or deferred explicitly

- Fixed named diet-profile thresholds are replaced by the person's entered daily reference. No preset implies a prescribed diet.
- Old details and cart components are replaced by reviewed-food and portion-aware meal views; their obsolete types/calculation module are removed.
- Automatic cloud matching/saving is replaced by local review and an explicit sync button. Previous derived score columns are not trusted.
- Combined MD and negligible letter thresholds remain inactive, as in the PRD's pilot boundary.
- No multi-client account system, automatic daily intake ledger, full conversational recipe generation, medical targeting or cooked-yield calculation is claimed.

### Verification

Verified in this workspace:

- TypeScript check and production build pass.
- Eight calculation/validation tests pass, including unknown nutrients, portion scaling, notation, fixed-ingredient solving and infeasibility.
- The production-browser workflow check passes on phone and desktop viewport sizes: recipe calculation, selected portion, recipe saving, feedback persistence, manual decimal entry, API access/input checks and no horizontal overflow or browser errors.
- A generated EAN-13 image decodes through the actual uploaded-image path; the product lookup is mocked for that check.
- Phone and desktop screenshots were visually inspected.

Not verified: real mobile camera permissions, live label OCR quality, the host's selected model/account, Open Food Facts availability for the client's products, or Airtable credentials/field configuration. The build reports a non-blocking bundle-size warning. No live app or main branch is changed merely by creating this pilot branch.
