# Change log

One version per release since 2 October 2026. The number is in Menu, About, next to the commit; every release is a git tag `vX.Y.Z`; the full story of each is in the commit message (`git log`).

## 0.1.x, the pilot builds

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
