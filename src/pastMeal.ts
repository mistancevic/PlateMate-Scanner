// DT284 (0.3.138, board Stories211; Coach Milan 12 November 08:24, Go; from a call with a tester whose meal was recorded
// twice): a past meal can be changed and deleted. A change stays the same meal at its own time, so there is one record; a
// delete takes it from its day, the recipe's lists and the coach's view at once, because they are the same record.
import { aggregate, portionsIn, uid, type Feedback, type Ingredient, type Meal, type PilotState } from "./pilot";

export type AmountChoice = { key: "half" | "one" | "halfOf" | "logged"; grams: number; items: Ingredient[] };
export type CardChange = { items?: Ingredient[]; taste?: string; notes?: string; photo?: string };

const weightOf = (items: Ingredient[]) => items.reduce((a, i) => a + (i.grams || 0), 0);
const scaled = (items: Ingredient[], k: number, fresh: boolean) => items.map((i) => ({ ...i, ...(fresh ? { id: uid() } : {}), grams: Math.round(i.grams * k * 10) / 10 }));

// How much was eaten: half a portion or one of the recipe, or as it was logged. Without a recipe: half of it, or as logged.
// A choice that weighs what was logged is left out: As logged says it, with the foods as they were.
export function amountChoices(f: Feedback, r: Meal | null): AmountChoice[] {
  const logged = weightOf(f.meal.items), out: AmountChoice[] = [];
  const whole = r ? weightOf(r.items) : 0;
  if (r && whole > 0) {
    const portion = whole / (r.makes?.n && r.makes.n > 0 ? r.makes.n : portionsIn(r));
    for (const [key, g] of [["half", portion / 2], ["one", portion]] as const) {
      if (Math.abs(Math.round(g) - Math.round(logged)) < 1) continue;
      out.push({ key, grams: Math.round(g), items: scaled(r.items, g / whole, true) });
    }
  } else if (logged > 0) out.push({ key: "halfOf", grams: Math.round(logged / 2), items: scaled(f.meal.items, 0.5, false) });
  out.push({ key: "logged", grams: Math.round(logged), items: f.meal.items });
  return out;
}

export function changeCard(s: PilotState, id: string, ch: CardChange): PilotState {
  if (!s.feedback.some((f) => f.id === id)) return s;
  return { ...s, feedback: s.feedback.map((f) => {
    if (f.id !== id) return f;
    const items = ch.items ?? f.meal.items;
    const meal = ch.items ? { ...f.meal, items, portion: Math.max(1, aggregate(items).weight) } : f.meal;
    return { ...f, meal, ...(ch.taste !== undefined ? { taste: ch.taste } : {}), ...(ch.notes !== undefined ? { notes: ch.notes } : {}), ...(ch.photo !== undefined ? { photo: ch.photo, ...(f.photos ? { photos: f.photos.filter((x) => x !== f.photo) } : {}) } : {}) };
  }) };
}

export function deleteCard(s: PilotState, id: string): PilotState {
  if (!s.feedback.some((f) => f.id === id)) return s;
  const cook = s.cook && (s.cook as { cardId?: string }).cardId === id ? { ...s.cook, cardId: undefined } : s.cook;
  return { ...s, feedback: s.feedback.filter((f) => f.id !== id), ...(cook !== s.cook ? { cook } : {}) };
}
