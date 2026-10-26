# Evals for Chef Mealan

The method is the one from the Product Faculty AI Build Labs, applied per carrier.

1. **Dimensions first.** A domain expert (the coach) names what changes the right answer. Ours are the five axes of a person
   (identity, goal, stage, situation, context) plus the plate and the kind of question. See `dimensions.md`.
2. **Cases from combinations.** Pick combinations of dimensions that matter, write one case each. Real questions from the
   log join the set once reviewed; synthetic ones fill the gaps, and every synthetic case names the combination it covers.
3. **Run.** Code checks run on every push. Model checks run before every release.
4. **Label by hand, then judge.** The coach labels a sample as pass or fail with a reason. A second model grades the same
   answers. We track how often the two agree, and trust the judge only where they do.
5. **Failure modes.** Read the fails, name the patterns, fix the prompt or the code, add the fail as a new case, run again.

## Adapted for the real app (7 October 2026)

Chef Mealan is a real app with a calculator at its heart, not only a model, so the method runs per carrier. The numbers
are deterministic: they get code checks and the coach's label, no judge model. The coach passes or fails each person on
Menu, Evals, can type the calories and protein they'd expect, and exports the CSV; passed cases go into
`number-cases.json` as `coach`, and from then on every push checks against them. A change to the calculation that moves
the numbers is shown to the coach first, then recorded with `npm run eval:numbers -- --update`.

## What runs

| Carrier | File | Command | Bar |
|---|---|---|---|
| Code | `swap-golden.json` | `npm run eval:code` | 10/10 feasible, never the missing food; coach pick in top 3 for 8/10 |
| Numbers | `number-cases.json`, `number-snapshot.json` | `npm test` (every push), `npm run eval:numbers` | every check holds; numbers as recorded; a case the coach passed stays within 5 % of the coach's calories and 10 g of the coach's protein |
| Goal chat | `chat-goal-cases.json` | Menu, Evals, goal chat (server running, key set) | answered; no food called good or bad, no guilt, no crash advice; at most three sentences; no grams; under 8 s; the coach labels whether the advice matches About your goal |
| Model | `plate-questions.jsonl` | `npm run eval:model` (server running, key set) | grounded 100 %, shape 100 %, forbidden 0, relevance ≥ 4, p50 < 5 s |
| Photo advice (code) | `photo-advice-cases.json` | `npm test` (every push), `npm run eval:advice` | 20 of 20 as the coach's rules say; a case marked open names a decision that waits for the coach |
| Photo read (model) | `photo-cases.json`, `photos/` (weighed plates, kept off git) | `npm run eval:photo` (server running, key set) | foods found ≥ 90 %, invented ≤ 1 per 10 plates, weighed grams in the read's range ≥ 80 %, plate kcal within 20 % for ≥ 80 % of plates, p50 < 8 s |
| Human vs judge | `results/*.csv` | `npm run eval:align` (photo runs too: `-- photo-<time>.csv`) | agreement ≥ 8 of 10 |

The same scenarios run on a page in the app: Menu, Evals (coach accounts). Run one or all, see the output and the checks, the judge's score and reason, mark pass or fail with a reason, export as CSV. The summary shows run, checks passed, judge average, how often you and the judge agree, and the median time.
| Behaviour | `tests/flows/*.cjs` | `npm run test:flows` | every step as expected |

Outcome measures (acceptance, completion, DaaM good after a swap, repeat questions) come from the pilot log, read per
identity × goal, never averaged.

## Photo of my meal (26 October 2026, Milan 23:51: evals are the next step)

The feature has three parts and each gets its own carrier. The read (the AI names the foods and guesses the grams) is a
model: weighed plates and code checks, then a judge on the names that the coach labels. The advice (eat it, eat half, add a
protein side, a snack) is code: 20 plates, one per combination of plate size, the nutrition rules, your day, the dish check
and whose plate, each with the line the coach's rules expect. The flow is behaviour: tests/flows/meal-photo.cjs and
meal-camera.cjs, with a stand-in read. First run of the advice: 18 of 20, 2 open (a plate of 3 dinners told to eat half;
50.2 percent fat shown as 50 percent under More than half). It also found two text faults, fixed the same night: a line
that went on in lower case after a full stop (About), and kcal over 1,000 without the comma.
