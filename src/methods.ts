// Ways to eat the same amounts. Rule-based from the roles on the plate; a person's confirmed recipes will replace these.
import { density, type Ingredient } from "./pilot";
import { fmt } from "./ui";
import { w } from "./words";
export type Method = { id: string; name: string; why: string; steps: string[] };
const CRUNCH = /keks|biscuit|cookie|cracker|knäcke|müsli|muesli|granola|oat|hafer|nuss|nut|mandel|almond|cornflake|brot|bread|toast/i;
export function methodsFor(items: Ingredient[]): Method[] {
  if (items.length < 2) return [];
  const byPd = [...items].sort((a, b) => (density(b.food.protein, b.food.calories) ?? -1) - (density(a.food.protein, a.food.calories) ?? -1));
  const base = byPd[0];
  const rest = items.filter((i) => i.id !== base.id);
  const crunch = rest.find((i) => CRUNCH.test(i.food.name)) ?? null;
  const flavours = rest.filter((i) => i.id !== crunch?.id);
  // DT243 part two: the words in src/i18n/en.json (make.method.*), in the app's language when the ways are made
  const g = (i: Ingredient) => `${fmt(i.grams, 0)} g ${i.food.name}`;
  const list = (xs: Ingredient[]) => xs.map(g).reduce((a, b) => w("make.method.and", { a, b }));
  const out: Method[] = [];
  out.push({
    id: "mixed", name: w("make.method.mixed"), why: w("make.method.mixedWhy"),
    steps: [
      w("make.method.putInBowl", { food: g(base) }),
      ...(flavours.length ? [w("make.method.addAndStir", { foods: list(flavours) })] : []),
      ...(crunch ? [w("make.method.crumble", { food: g(crunch) })] : []),
    ],
  });
  if (crunch && flavours.length)
    out.push({
      id: "topped", name: w("make.method.topped"), why: w("make.method.toppedCrunchWhy"),
      steps: [
        w("make.method.spreadOn", { foods: list(flavours), food: g(crunch) }),
        w("make.method.putInSmallBowl", { food: g(base) }),
        w("make.method.eatTogether"),
      ],
    });
  else if (flavours.length)
    out.push({
      id: "topped", name: w("make.method.topped"), why: w("make.method.toppedWhy"),
      steps: [w("make.method.putInBowl", { food: g(base) }), w("make.method.dropOnTop", { foods: list(flavours) })],
    });
  out.push({
    id: "base-first", name: w("make.method.baseFirst"), why: w("make.method.baseFirstWhy"),
    steps: [
      w("make.method.eatFirst", { food: g(base) }),
      w("make.method.thenSlowly", { foods: list(rest) }),
    ],
  });
  return out;
}
