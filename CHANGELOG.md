# Change log

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
