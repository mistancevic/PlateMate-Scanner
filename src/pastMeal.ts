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

// DT285 (0.3.139, board Stories212; Coach Milan 12 November 09:44, Go): a meal about to be saved as eaten with a photo that a
// meal of that same day already has. Same photo means the same picture: the same data, or the same fingerprint. The day is the
// day of the new meal's time, on this phone's clock.
const sigOf = (x: string) => (x.startsWith("data:") ? `${x.length}:${x.slice(-32)}` : x);
export function samePhotoMeal(feedback: Feedback[], photos: (string | null | undefined)[], at: string): Feedback | null {
  const want = new Set(photos.filter((x): x is string => typeof x === "string" && x.length > 0).map(sigOf));
  if (!want.size) return null;
  const day = new Date(at).toDateString();
  return feedback.find((f) => f.status === "eaten" && new Date(f.createdAt).toDateString() === day
    && [f.photo, ...(f.photos ?? [])].some((x) => typeof x === "string" && want.has(sigOf(x)))) ?? null;
}
// Update that meal: the earlier meal takes the new one's foods and amounts (and its taste and words when given); it keeps its
// id, its time, its meal of the day and its photo
export function updateWith(earlier: Feedback, next: Partial<Feedback> & { meal: Feedback["meal"] }): Feedback {
  return { ...earlier, ...next, id: earlier.id, createdAt: earlier.createdAt, slot: earlier.slot, which: earlier.which, photo: earlier.photo ?? next.photo,
    status: "eaten", meal: { ...next.meal, portion: Math.max(1, aggregate(next.meal.items).weight) },
    taste: next.taste || earlier.taste, notes: (next.notes ?? "").trim() || earlier.notes };
}
