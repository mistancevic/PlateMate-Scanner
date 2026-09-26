// Ways to eat the same amounts. Rule-based from the roles on the plate; a person's confirmed recipes will replace these.
import { density, type Ingredient } from "./pilot";
import { fmt } from "./ui";
export type Method = { id: string; name: string; why: string; steps: string[] };
const CRUNCH = /keks|biscuit|cookie|cracker|knäcke|müsli|muesli|granola|oat|hafer|nuss|nut|mandel|almond|cornflake|brot|bread|toast/i;
export function methodsFor(items: Ingredient[]): Method[] {
  if (items.length < 2) return [];
  const byPd = [...items].sort((a, b) => (density(b.food.protein, b.food.calories) ?? -1) - (density(a.food.protein, a.food.calories) ?? -1));
  const base = byPd[0];
  const rest = items.filter((i) => i.id !== base.id);
  const crunch = rest.find((i) => CRUNCH.test(i.food.name)) ?? null;
  const flavours = rest.filter((i) => i.id !== crunch?.id);
  const g = (i: Ingredient) => `${fmt(i.grams, 0)} g ${i.food.name}`;
  const list = (xs: Ingredient[]) => xs.map(g).join(" and ");
  const out: Method[] = [];
  out.push({
    id: "mixed", name: "All in one", why: "One bowl, one spoon. The taste is even from the first bite to the last.",
    steps: [
      `Put ${g(base)} in a bowl.`,
      ...(flavours.length ? [`Add ${list(flavours)} and stir until it's one colour.`] : []),
      ...(crunch ? [`Crumble ${g(crunch)} over the top, or fold it in if you like it soft.`] : []),
    ],
  });
  if (crunch && flavours.length)
    out.push({
      id: "topped", name: "Topped", why: "The crunch stays crunchy and the flavour sits where you taste it most.",
      steps: [
        `Spread ${list(flavours)} on ${g(crunch)}.`,
        `Put ${g(base)} in a small bowl next to it.`,
        `Eat them together, a bite of each.`,
      ],
    });
  else if (flavours.length)
    out.push({
      id: "topped", name: "Topped", why: "The flavour stays on top, so every spoon starts with it.",
      steps: [`Put ${g(base)} in a bowl.`, `Drop ${list(flavours)} on top. Don't stir.`],
    });
  out.push({
    id: "base-first", name: "Protein first", why: "The base fills you up before the treat, so the treat stays the size it is.",
    steps: [
      `Eat ${g(base)} first, plain or with a pinch of cinnamon.`,
      `Then ${list(rest)}, slowly.`,
    ],
  });
  return out;
}
