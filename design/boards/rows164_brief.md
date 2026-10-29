Read exact USDA FoodData Central values per 100 g from getfoodfacts.com pages, for a nutrition app where every number must match its source.

Rules:
- Use only getfoodfacts.com. URL form https://getfoodfacts.com/food/<slug>-<fdcid>. Find each page with WebSearch, or through the site's overview pages such as https://getfoodfacts.com/nutrition/<food>. Use exactly the FDC id given; if the site shows a different name for that id, keep the id and say so.
- WebFetch each page and ask it to quote the "Per 100 g" table rows verbatim. Fetch twice if a value looks odd.
- Never estimate, convert or fill from memory. A value not on the page is null. A value the page shows as 0 is 0.
- Do NOT use triagemethod.com or any other site.

Write one JSON file (path given below) as an object keyed by the food key, each value:
{ "fdc": <id>, "dataset": "SR Legacy" | "Foundation", "name": "<full name on page>", "url": "<page url>",
  "kcal": , "protein": , "fat": , "carb": , "fibre": , "sugar": ,
  "sfa": , "mufa": , "pufa": , "trans": , "la": <PUFA 18:2 g>, "ala": <PUFA 18:3 g>, "epa": <20:5 n-3 g>, "dpa": <22:5 n-3 g>, "dha": <22:6 n-3 g>,
  "aa": { "his": , "ile": , "leu": , "lys": , "met": , "cys": , "phe": , "tyr": , "thr": , "trp": , "val":  },   (g; cystine is cys)
  "retinol": , "bcar": <carotene, beta µg>, "acar": <carotene, alpha µg>, "bcrypt": <cryptoxanthin, beta µg>, "vitD": <Vitamin D (D2 + D3) µg>, "vitE": <alpha-tocopherol mg>, "vitK": <phylloquinone µg>, "vitC": <mg>,
  "b1": <thiamin mg>, "b2": <riboflavin mg>, "b3": <niacin mg>, "b5": <pantothenic acid mg>, "b6": <mg>, "b7": <biotin µg>, "fol": <Folate, DFE µg; if no DFE row, Folate, total, and say so>, "b12": <µg>,
  "ca": <calcium mg>, "fe": <iron mg>, "mg": <magnesium mg>, "k": <potassium mg>, "zn": <zinc mg> }
All numbers plain (no units), per 100 g, exactly as shown. Then in your final message list every null and anything odd (a value the page shows twice, a name mismatch, a dataset that isn't SR Legacy).
