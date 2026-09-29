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

## What runs

| Carrier | File | Command | Bar |
|---|---|---|---|
| Code | `swap-golden.json` | `npm run eval:code` | 10/10 feasible, never the missing food; coach pick in top 3 for 8/10 |
| Model | `plate-questions.jsonl` | `npm run eval:model` (server running, key set) | grounded 100 %, shape 100 %, forbidden 0, relevance ≥ 4, p50 < 5 s |
| Human vs judge | `results/*.csv` | `npm run eval:align` | agreement ≥ 8 of 10 |
| Behaviour | `tests/flows/*.cjs` | `npm run test:flows` | every step as expected |

Outcome measures (acceptance, completion, DaaM good after a swap, repeat questions) come from the pilot log, read per
identity × goal, never averaged.
