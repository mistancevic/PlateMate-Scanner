// R20 (0.2.48, Milan 23:34, 07:25 to 18:39, board RS19): How did it carry you? The answers shown on the meal and used by
// Chef Mealan. Per recipe. Each answer keeps its moment (the meal of the day, a training or rest day, before or after
// training) so later the data can tell the meal from the moment. Two answers that agree, and more of them than the other
// way, make the read; Fine counts as neither; only the last 5 count; answers from before the recipe's foods changed stay
// shown, marked, and stop counting.
import type { Feedback, Meal } from "./pilot";

export type CarryHow = "light" | "fine" | "heavy";
export type CarryMoment = { meal: string; day?: "training" | "rest"; training?: "before" | "after" };
export type Carry = { how: CarryHow; at: string; moment?: CarryMoment; sig?: string };
export const CARRY_WORDS: Record<CarryHow, string> = { light: "Light and awake", fine: "Fine", heavy: "Heavy, tired" };
export const CARRY_COUNTED = 5;

// the recipe's foods and grams, short: a change of a food or an amount gives another
export function recipeSig(m: Pick<Meal, "items">): string {
  const s = m.items.map((i) => `${i.food.name.trim().toLowerCase()}:${Math.round(i.grams)}`).sort().join("|");
  let h = 5381; for (let k = 0; k < s.length; k++) h = ((h * 33) ^ s.charCodeAt(k)) >>> 0;
  return h.toString(36);
}

// the moment of a meal: before or after the day's training, by the clock; a training day without a time says only that
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export function momentOf(meal: string, eatenAt: Date, day: { kind?: string; time?: string | null } | null): CarryMoment {
  if (!day || !day.kind) return { meal };
  if (day.kind === "rest") return { meal, day: "rest" };
  if (!day.time) return { meal, day: "training" };
  const t = eatenAt.getHours() * 60 + eatenAt.getMinutes();
  return { meal, day: "training", training: t < toMin(day.time) ? "before" : "after" };
}

const DAY = 86_400_000;
const ymdOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
// Thursday's dinner, after training · today's lunch, rest day · 8 October, dinner
// a meal not named (an answer from before 0.2.48, a card without its slot) says its time instead: today, 12:30
export function momentText(at: string, moment: CarryMoment | undefined, which: string, now = new Date()): string {
  const d = new Date(at), meal = (moment?.meal ?? which).toLowerCase();
  const y = new Date(now.getTime() - DAY);
  const near = ymdOf(d) === ymdOf(now) ? "today" : ymdOf(d) === ymdOf(y) ? "yesterday" : now.getTime() - d.getTime() < 6.5 * DAY ? d.toLocaleDateString("en-GB", { weekday: "long" }) : null;
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const head = !meal ? `${near ?? date}, ${time}` : near ? `${near}'s ${meal}` : `${date}, ${meal}`;
  const tail = moment?.training ? `${moment.training} training` : moment?.day === "rest" ? "rest day" : moment?.day === "training" ? "training day" : "";
  const text = tail ? `${head}, ${tail}` : head;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const cardsOfRecipe = (m: Pick<Meal, "id" | "title">, cards: Feedback[]) =>
  cards.filter((f) => f.status === "eaten" && (f.recipeId === m.id || (!f.recipeId && (f.meal?.id === m.id || f.meal?.title === m.title))));

export type CarryRow = { id: string; at: string; how: CarryHow | null; moment?: CarryMoment; before: boolean; counted: boolean };
export type CarryRead = { read: "light" | "heavy" | null; light: number; heavy: number; fine: number; rows: CarryRow[]; eaten: number };
// every eaten card of the recipe, newest first; the read from the last 5 answers given since its foods last changed
export function carryOf(m: Pick<Meal, "id" | "title" | "items">, cards: Feedback[]): CarryRead {
  const sig = recipeSig(m);
  const mine = cardsOfRecipe(m, cards).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  let n = 0;
  const rows: CarryRow[] = mine.map((f) => {
    const c = (f as { carry?: Carry }).carry;
    const before = !!c?.sig && c.sig !== sig;
    const counted = !!c && !before && n < CARRY_COUNTED; if (counted) n++;
    return { id: f.id, at: f.createdAt, how: c?.how ?? null, moment: c?.moment, before, counted };
  });
  const k = (h: CarryHow) => rows.filter((r) => r.counted && r.how === h).length;
  const light = k("light"), heavy = k("heavy"), fine = k("fine");
  const read = light >= 2 && light > heavy ? "light" : heavy >= 2 && heavy > light ? "heavy" : null;
  return { read, light, heavy, fine, rows, eaten: mine.length };
}

// the reads of every recipe, by its id, for picking and filling
export function carryReads(meals: Meal[], cards: Feedback[]): Map<string, CarryRead> {
  const out = new Map<string, CarryRead>();
  for (const m of meals) { const r = carryOf(m, cards); if (r.rows.some((x) => x.how)) out.set(m.id, r); }
  return out;
}

// for Chef Mealan's ideas: the names that kept them light and the names that left them heavy, at most 8 each
export function carriedLists(meals: Meal[], cards: Feedback[]): { light: string[]; heavy: string[] } {
  const reads = carryReads(meals, cards), light: string[] = [], heavy: string[] = [];
  for (const m of meals) { const r = reads.get(m.id)?.read; if (r === "light" && light.length < 8) light.push(m.title); if (r === "heavy" && heavy.length < 8) heavy.push(m.title); }
  return { light, heavy };
}

export const timesWord = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);
