# The weighed plates for Eval 2 and 3 (Photo of my meal)

The photos stay on your machine: this folder is not in git, except this note.

1. Put the plate together on the kitchen scale, one food at a time. Write each food's grams.
2. Take the photo as a member would: from above, the whole plate in, at the table.
3. Save it here as p01.jpg, p02.jpg and so on.
4. Add the plate to `evals/photo-cases.json`: the foods, other names they go by, the grams, and the kcal per 100 g when you know it.

Aim for 20 plates: your own and Tester 3's. Mix them: one food and many, a sauce, a dressing with oil, a restaurant plate,
a bowl where foods hide under others, breakfast, lunch and dinner. Oil in a dressing or a pan counts: weigh it and list it, or the read that names it counts as invented.

Run, with the server running locally and the AI key set (the same as `npm run eval:model`):

    GEMINI_API_KEY=... npm run dev          # in one terminal
    npm run eval:photo                      # in another

Then open the CSV in `evals/results`, write pass or fail in coach_label for at least 10 plates (did it name the foods as you
would?), and run `npm run eval:align -- photo-<time>.csv` to see how often the judge agrees with you.
