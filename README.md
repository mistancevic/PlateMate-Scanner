# PlateMate · Mealan client pilot

A small, supervised pilot for real food labels, one person's daily reference, and enjoyable ready-to-eat meal combinations. Based on Mealan App PRD v0.2.0. This is a pilot implementation, not the entire PRD or a validated nutrition service.

[View the tested mobile interface](docs/pilot-preview.png) · [Exact changelog](CHANGELOG.md)

## Quick start

Use Node.js 22 or later.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:3000`. Manual entry, local saved foods, goals, Mealan, recipe solving, feedback, and backup export/import work without AI or Airtable credentials. Barcode lookup needs internet access to Open Food Facts. Label/group photos and AI taste ranking need a configured Gemini key and model.

Production:

```sh
npm run lint
npm test
npm run build
npm start
```

`npm start` explicitly sets production mode. Serve over HTTPS for a phone camera (localhost also works on the same computer). A phone visiting your computer's plain HTTP LAN address is not the same secure context as localhost.

## Configure external services

Keep values server-side. Do not put API tokens in source code or any public frontend environment variable.

| Variable                               | Purpose                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`                       | Optional label/group extraction and AI preference ranking                                            |
| `GEMINI_MODEL`                         | Actual model ID available to the host's account; configurable independently of the development agent |
| `PILOT_ACCESS_KEY`                     | Required in production if AI or Airtable is enabled; enter it through **Server access** in the app   |
| `AIRTABLE_BASE_ID`, `AIRTABLE_API_KEY` | Optional explicit sync of reviewed food data to the existing `Scans` table                           |
| `PORT`                                 | Hosting port; default 3000                                                                           |

The configured model default is retained from the original app. No model availability or quality has been verified with your credentials. There is no silent fallback to a different model. AI errors preserve the working recipe and offer manual entry.

Airtable uses `Product Name`, `Brand`, `Calories`, `Protein`, `Fats`, `Carbs`, `Fiber`, and optionally `Barcode`. Missing values clear the corresponding field rather than becoming zero. Existing matching records are updated on an explicit sync; recipes keep their own snapshots. Density scores and Mealan are derived locally, so obsolete derived columns in an existing base are neither read nor rewritten. No personal targets, feedback or client records are uploaded to Airtable by this pilot.

The pilot access key is shared server access, not a user-account/coach-permission system. Each browser keeps its own client data. Use separate browser profiles/devices for coach and client; do not treat this as a multi-client platform. Sessions store the access key until the browser session ends. Change the host key to revoke access.

## First real-product test

1. Set **Daily reference** to the client's existing coach-agreed targets. No targets are prescribed by this app.
2. In **Saved foods**, scan a barcode, photograph a nutrition label, or choose **Add manually**.
3. Review the actual product variant, decimals and per-100-g basis. Carbohydrate must exclude fibre. Unknown nutrient fields stay blank. Record less-than/trace declarations in notes; do not turn them into zero.
4. Mark a food ready for cold mixing only when appropriate. Check ingredients and exclusions yourself; the app does not establish allergen suitability.
5. Save the reviewed food locally and add it to **My meal**. The initial 100 g is a starting amount, not an inferred portion. Set the actual grams.
6. Add a supporting food. Keep the desired ingredient locked. Unlock and select only the ingredient whose amount the Chef may change.
7. Optionally enter whole-recipe size, minimum protein and maximum-calorie constraints. Select **Find a mix**. The solver returns feasible quantities or explains failure.
8. Review the whole recipe and your selected portion. A smaller homogeneous portion has the same density and proportionally smaller nutrient amounts.
9. Save the recipe. Record **prepared**, **eaten**, or **not used** separately in **Recipes & taste**, with taste/portion feedback.
10. Export a backup before changing devices or collecting the pilot results. Record where the user needed coaching, misread a number, disliked a portion, or preferred their existing method.

The optional **Personalize with AI** action sends the calculated candidates and selected taste history to Gemini. It ranks feasible choices and explains taste trade-offs. It cannot change the deterministic ingredient quantities, nutrient values or daily goals. This is bounded assistance, not an autonomous general-purpose cooking agent.

## Worked example

The empty meal screen offers an explicit illustrative fixture. It uses a UK Nutella label and invented yogurt data; it is not a food recommendation. It provides a quick calculation sanity check, then must be replaced by the actual products used.

- Fixed 50 g Nutella: 269.5 kcal, 3.15 g protein.
- Illustrative yogurt per 100 g: 60 kcal, 7.2 g protein.
- Target PD 6: exact yogurt amount 361.6667 g; practical rounded amount 362 g.
- Recalculated 412 g bowl: 486.7 kcal, 29.214 g protein, PD 6.0024656.
- A 300 g maximum bowl cannot meet that target with those two ingredients and fixed Nutella amount.

Numbers are calculated in `src/pilot.ts` and verified in `src/pilot.test.ts`. Nutella source: https://www.nutella.com/uk/en/products/nutella (UK data; confirm the actual label).

## Interpretation and boundaries

- **DS** names the metric family. **PD/FD/CD/FiD** are grams of each nutrient per 100 kcal.
- **Mealan** combines reference-relative nutrient letters with the selected portion's daily contribution percentages. `F+` means relatively fat-dense, not that the daily budget is exceeded.
- The pilot letter rule is below 90%, within 90–110%, or above 110% of the plan's nutrient density. These are proposed interface thresholds, not physiological thresholds. The negligible category is inactive pending its definition; unknown remains `?`.
- Experimental **MD** is not used to rate meals.
- Matching density does not establish adequate serving protein, meal completeness, health, MPS, or effects on performance/longevity.
- This first implementation handles per-100-g foods and homogeneous cold mixtures. It deliberately requests manual conversion for per-volume/per-serving labels. It does not infer cooking yields.
- It does not provide remaining-day intake accounting, target prescription, cross-device accounts, coach administration, automatic meal logging, general recipe generation, or a clinical diet service.
- Group photos identify candidate products only. Nutrient records and quantities still need individual review. No automatic fuzzy match can approve food data.

## Data and existing prototype

New browser storage key: `platemate-pilot-v1`. Original `nutrition-scanner-v2` data is left untouched and is not silently migrated because unknown values were previously recorded as zero. Re-review existing product labels before using them in the pilot. Editing a saved food does not rewrite an existing meal or feedback snapshot; add the revised food to a new meal explicitly.

Export/import is a versioned JSON backup. Import validates the structure before asking to replace local data. Treat exports as private: they contain personal targets and taste/meal notes. Deleting a saved food does not delete snapshots embedded in recipes; deleting a recipe does not delete feedback snapshots. Delete each relevant record or clear the site's browser data when the full local record should be removed.

## Architecture and checks

- `src/pilot.ts`: deterministic calculation, notation, solver, record and backup validation.
- `src/App.tsx`: daily reference, reviewed food library, meal assembly, constrained Chef, recipe and feedback workflows.
- `src/components/CameraView.tsx`: retained camera UI with corrected uploaded-barcode decoding and staged image review.
- `server.ts`: server-owned extraction prompts, JSON schema plus runtime validation, product lookup, bounded AI ranking, explicit Airtable sync, access protection and rate limiting.

Run `npm run lint`, `npm test`, and `npm run build` before deploying. See `CHANGELOG.md` for changed and preserved behaviour. Actual mobile camera permissions, real OCR quality, the host's selected model, and Airtable credentials still require on-device/service testing.

Primary implementation references:

- Gemini structured outputs: https://ai.google.dev/gemini-api/docs/structured-output
- Open Food Facts API and data/license conditions: https://openfoodfacts.github.io/openfoodfacts-server/api/
- Open Food Facts database is community supplied; verify records. Attribution is included in the interface; consult its database/content/image license terms before a broader commercial deployment.

### Browser workflow check

```sh
npx playwright install chromium
npm run test:ui
```

The script starts an isolated local production server, checks API access and input validation, exercises the worked recipe, selected portions, persistence, infeasible constraints and manual review, then decodes a synthetic barcode image. The barcode lookup response is mocked; this checks the image/decoder/review path, not Open Food Facts coverage. Screenshots are written to `tests/screenshots/`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` optionally selects an installed Chromium executable. This does not replace a live camera/OCR/Airtable check on the host's device.
