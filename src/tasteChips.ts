// R22 (0.2.50, Milan 22:58 to 23:15, board RS21): your taste on Me as chips, each one fixed meaning Chef Mealan reads the same
// way every time; your own words stay for what no chip says, read as extra, never over a chip, your allergies or your numbers.
// Vanilla and chocolate, the two tastes most people name (Milan 23:15).
export const TASTE_CHIPS = {
  like: ["Creamy", "Crunchy", "Chocolate", "Vanilla", "Fruity", "Spicy", "Fresh herbs"],
  not: ["Sour", "Very sweet", "Spicy", "Bitter", "Fishy"],
  how: ["Small portions", "Big plates, more volume", "Quick to make"],
} as const;
export type TasteGroup = keyof typeof TASTE_CHIPS;
export type TasteChips = { like: string[]; not: string[]; how: string[] };
export const NO_CHIPS: TasteChips = { like: [], not: [], how: [] };

// a tap turns a chip on or off; a taste liked is never also rather not, and Small portions is never Big plates too
export function toggleChip(c: TasteChips | undefined, group: TasteGroup, chip: string): TasteChips {
  const cur = { like: [...(c?.like ?? [])], not: [...(c?.not ?? [])], how: [...(c?.how ?? [])] };
  const on = cur[group].includes(chip);
  cur[group] = on ? cur[group].filter((x) => x !== chip) : [...cur[group], chip];
  if (!on && group === "like") cur.not = cur.not.filter((x) => x !== chip);
  if (!on && group === "not") cur.like = cur.like.filter((x) => x !== chip);
  if (!on && group === "how" && chip === "Small portions") cur.how = cur.how.filter((x) => x !== "Big plates, more volume");
  if (!on && group === "how" && chip === "Big plates, more volume") cur.how = cur.how.filter((x) => x !== "Small portions");
  return cur;
}

// only the fixed chips go out, in their fixed words; your own words go as their own field
export function tasteForReq(c: TasteChips | undefined, words: string | undefined): { likes: string[]; rather_not: string[]; how_they_eat: string[]; own_words: string } {
  const keep = (g: TasteGroup) => (c?.[g] ?? []).filter((x) => (TASTE_CHIPS[g] as readonly string[]).includes(x));
  return { likes: keep("like"), rather_not: keep("not"), how_they_eat: keep("how"), own_words: String(words ?? "").replace(/\s+/g, " ").trim().slice(0, 300) };
}
