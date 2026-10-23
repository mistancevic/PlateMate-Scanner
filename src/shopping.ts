// A shopping list from the plan (0.2.60, board SL1; Milan 15:48 to 15:50: as simple as possible, to try it). The planned
// meals of seven days from today, one portion each as the plan counts it, every food added up by name. A meal with no
// foods saved (a starter) can't be counted, so the list names it instead of leaving it out quietly.
import { plannedPortion, isBatch, type Planned, type PlannedMeal } from "./planned";
import { rawOf } from "./reference";
import { kindOf, KINDS } from "./counted";
// DT76: eggs and bananas are bought by the piece: 210 g of eggs is 4 eggs (size M), at least one. DT77: apples too, and
// a part of one is bought whole (1.7 eggs is 2); a list sums shares of many portions, so it rounds up, a little slack kept
export function shopAmount(name: string, grams: number): string {
  const k = kindOf(name);
  if (!k) return `${grams.toLocaleString("en")} g`;
  const n = Math.max(1, Math.ceil(grams / KINDS[k].sizes.M! - 0.15));
  return `${n} ${n === 1 ? KINDS[k].one : KINDS[k].many}`;
}

// SL4 (0.2.62): each food knows the meals it is for, so the list can say what it is for and show itself meal by meal
export type ShopUse = { date: string; slot: string; title: string; grams: number };
// cooked: the grams as the plan counts them, when the food is bought raw (SL7); grams and uses are then the raw grams
export type ShopLine = { key: string; name: string; brand: string; grams: number; meals: number; uses?: ShopUse[]; added?: boolean; cooked?: number };
// what a food is bought as: raw, when the plan counts it cooked and its raw form is known (SL7)
export function buyAs(name: string, brand: string, grams: number, kcal?: number | null): { name: string; brand: string; grams: number; cooked?: number } {
  const r = rawOf(name, kcal);
  return r ? { name: r.raw.en, brand: "", grams: grams * r.factor, cooked: grams } : { name, brand, grams };
}
export type ShopList = { days: string[]; meals: number; lines: ShopLine[]; without: { date: string; title: string }[]; batches?: { title: string; n: number; pieces: number; batches: number; cook?: number }[] };

// grams as a shop reads them: under 50 g to the gram, else to 10 g
export const shopGrams = (g: number) => (g < 50 ? Math.max(1, Math.round(g)) : Math.round(g / 10) * 10);

// DT81: cookOf says how many of a recipe you will cook next (Cook it on its page); the list buys for that batch
export function shoppingList(planned: Planned, days: string[], cookOf?: (mealId: string) => number | undefined): ShopList {
  const by = new Map<string, ShopLine & { seen: Set<string> }>();
  const without: ShopList["without"] = [];
  let meals = 0;
  // DT79 (Milan 23 October 11:15): a batch recipe is cooked whole. Its pieces planned in these days are added up, and the list
  // buys whole batches: 7 sarmas planned of a recipe that makes 8 is one batch; 11 is two. Each meal still says its share.
  // Only a recipe that says what it makes (8 sarmas); one the Plate divided into portions is bought as its share.
  const batch = new Map<string, { n: number; pieces: number; batches: number; title: string; items: PlannedMeal["items"]; cook?: number }>();
  for (const d of days) for (const m of Object.values(planned[d] ?? {})) {
    if (m.skipped || !isBatch(m) || !m.unit || !m.mealId || !m.items?.length) continue;
    const b = batch.get(m.mealId) ?? { n: m.servings!, pieces: 0, batches: 0, title: m.title, items: m.items };
    b.pieces += m.amount ?? 1; batch.set(m.mealId, b);
  }
  for (const [id, b] of batch) {
    b.batches = Math.max(1, Math.ceil(b.pieces / b.n - 1e-9));
    const c = cookOf?.(id);
    if (c && c >= b.pieces) b.cook = c;                                  // cooked as one batch of that size
  }
  for (const d of days) {
    for (const [slot, m] of Object.entries(planned[d] ?? {})) {
      if (m.skipped) continue;
      meals++;
      const bt = isBatch(m) && m.mealId ? batch.get(m.mealId) : undefined;
      const portion = bt ? { items: bt.items!.map((i) => ({ ...i, grams: i.grams * ((m.amount ?? 1) / bt.n) })) } : plannedPortion(m, "shop", "");
      if (!portion) { without.push({ date: d, title: m.title }); continue; }
      for (const i of portion.items) {
        if (!(i.grams > 0) || !i.food?.name) continue;
        const b = buyAs(i.food.name, i.food.brand ?? "", i.grams, i.food.calories);
        const key = `${b.name}|${b.brand}`.toLowerCase();
        const line = by.get(key) ?? { key, name: b.name, brand: b.brand, grams: 0, meals: 0, uses: [] as ShopUse[], seen: new Set<string>() };
        line.grams += b.grams;
        if (b.cooked) line.cooked = (line.cooked ?? 0) + b.cooked;
        const use = line.uses!.find((u) => u.date === d && u.slot === slot);
        if (use) use.grams += b.grams; else line.uses!.push({ date: d, slot, title: m.title, grams: b.grams });
        if (!line.seen.has(d + slot)) { line.seen.add(d + slot); line.meals++; }
        by.set(key, line);
      }
    }
  }
  // a batch's foods: what its planned pieces take, topped up to the whole batches cooked
  for (const b of batch.values()) for (const i of b.items ?? []) {
    if (!(i.grams > 0) || !i.food?.name) continue;
    const full = buyAs(i.food.name, i.food.brand ?? "", i.grams * (b.cook ? b.cook / b.n : b.batches), i.food.calories), share = buyAs(i.food.name, i.food.brand ?? "", i.grams * (b.pieces / b.n), i.food.calories);
    const line = by.get(`${full.name}|${full.brand}`.toLowerCase());
    if (!line) continue;
    line.grams += full.grams - share.grams;
    if (full.cooked && share.cooked) line.cooked = (line.cooked ?? 0) + full.cooked - share.cooked;
  }
  const batches = [...batch.values()].map((b) => ({ title: b.title, n: b.n, pieces: b.pieces, batches: b.batches, ...(b.cook ? { cook: b.cook } : {}) }));
  const lines = [...by.values()].map(({ seen, ...l }) => ({ ...l, grams: shopGrams(l.grams), ...(l.cooked ? { cooked: shopGrams(l.cooked) } : {}), uses: (l.uses ?? []).map((u) => ({ ...u, grams: shopGrams(u.grams) })) })).sort((a, b) => a.name.localeCompare(b.name));
  return { days, meals, lines, without, ...(batches.length ? { batches } : {}) };
}

// the list as text, to paste in a message or a note
export function shoppingText(list: ShopList, span: string, ticked: Set<string>): string {
  const left = list.lines.filter((l) => !ticked.has(l.key));
  return [`Shopping list, ${span}`, "", ...left.map((l) => `${l.name}${l.brand && !/typical values|generic|check your/i.test(l.brand) ? ` (${l.brand})` : ""}: ${shopAmount(l.name, l.grams)}`)].join("\n");
}

// SL3 (0.2.61, Milan 16:46 to 16:50): a list is saved, named and dated: Shopping list 1, made on a day, for the days picked.
// What is on it is what it is; a later change to the plan does not touch it. One list is open at a time. The next list starts
// the day after the last one ends, so nothing is bought twice. Finishing asks about the foods not ticked: carry them to the
// next list, or leave them. On this phone only; another phone makes its own.
// missing: the foods marked Not this time (SL4, named 20:14); they stay on the list and count as not bought
export type SavedList = { n: number; madeAt: string; from: string; to: string; meals: number; lines: ShopLine[]; without: ShopList["without"]; carried: ShopLine[]; carriedFrom: number | null; ticked: string[]; missing?: string[]; changes?: { date: string; slot: string; from: string; to: string; because?: string[] }[]; counted?: Counted[]; updatedAt?: string; doneAt?: string };
// the planned meals a list was made for (SL7): a meal is counted on one list only
export type Counted = { date: string; slot: string; title: string };
export type ShopStore = { lists: SavedList[]; carry: { from: number; lines: ShopLine[] } | null };
const LKEY = "chefmealan-shopping-lists";
export const getStore = (): ShopStore => { try { const s = JSON.parse(localStorage.getItem(LKEY) || "{}"); return { lists: Array.isArray(s.lists) ? s.lists : [], carry: s.carry ?? null }; } catch { return { lists: [], carry: null }; } };
export const putStore = (s: ShopStore) => { try { localStorage.setItem(LKEY, JSON.stringify(s)); } catch {} };
export const openList = (s: ShopStore) => s.lists.find((l) => !l.doneAt) ?? null;
const plusDay = (d: string, n: number) => { const x = new Date(`${d}T12:00:00`); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
// the next list starts where the last one ended, never before today
export function nextStart(s: ShopStore, today: string, planned?: Planned): string {
  // SL7: the first day from today with a planned meal no list has counted yet, within two weeks
  if (planned) { const days = daysFrom(today, 14); const fresh = notCounted(s, planned, days); const d = days.find((x) => Object.values(fresh[x] ?? {}).some((m) => !m.skipped)); if (d) return d; }
  const ends = s.lists.map((l) => l.to).sort();
  const after = ends.length ? plusDay(ends[ends.length - 1], 1) : today;
  return after > today ? after : today;
}
export const daysFrom = (from: string, n: number) => Array.from({ length: n }, (_, i) => plusDay(from, i));
export function makeList(s: ShopStore, planned: Planned, days: string[], madeAt: string, cookOf?: (mealId: string) => number | undefined): ShopStore {
  // only the meals no list has counted yet: a day shopped for keeps its meals off, a meal added later comes on (SL7)
  const fresh = notCounted(s, planned, days);
  const l = shoppingList(fresh, days, cookOf);
  const counted: Counted[] = days.flatMap((d) => Object.entries(fresh[d] ?? {}).filter(([, m]) => !m.skipped).map(([slot, m]) => ({ date: d, slot, title: m.title })));
  const n = s.lists.reduce((m, x) => Math.max(m, x.n), 0) + 1;
  const list: SavedList = { n, madeAt, from: days[0], to: days[days.length - 1], meals: l.meals, lines: l.lines, without: l.without, counted, carried: (s.carry?.lines ?? []).map((x) => ({ ...x, key: `c:${x.key.replace(/^c:/, "")}` })), carriedFrom: s.carry?.from ?? null, ticked: [] };
  return { lists: [list, ...s.lists], carry: null };
}
// a tap moves a food on: to buy, then in the basket, then not this time, then back to buy (SL4)
export const stateOf = (l: SavedList, key: string): "buy" | "got" | "missing" => (l.ticked.includes(key) ? "got" : (l.missing ?? []).includes(key) ? "missing" : "buy");
export const tickIn = (s: ShopStore, n: number, key: string): ShopStore => ({ ...s, lists: s.lists.map((l) => {
  if (l.n !== n) return l;
  const st = stateOf(l, key), missing = (l.missing ?? []).filter((k) => k !== key), ticked = l.ticked.filter((k) => k !== key);
  return st === "buy" ? { ...l, ticked: [...ticked, key], missing } : st === "got" ? { ...l, ticked, missing: [...missing, key] } : { ...l, ticked, missing };
}) });
// the meals a food marked Not this time leaves short, in the order of the days
export function shortMeals(l: SavedList): { date: string; slot: string; title: string; foods: string[] }[] {
  const out: { date: string; slot: string; title: string; foods: string[] }[] = [];
  for (const x of [...l.carried, ...l.lines]) {
    if (!(l.missing ?? []).includes(x.key)) continue;
    for (const u of x.uses ?? []) { const m = out.find((o) => o.date === u.date && o.slot === u.slot); if (m) m.foods.push(x.name); else out.push({ date: u.date, slot: u.slot, title: u.title, foods: [x.name] }); }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
// the list as meals: each day's planned meals with what each needs (SL4, By meal); the carried foods are not of these days
export function byMeal(l: SavedList): { date: string; slot: string; title: string; foods: { line: ShopLine; grams: number }[] }[] {
  const out: { date: string; slot: string; title: string; foods: { line: ShopLine; grams: number }[] }[] = [];
  for (const x of l.lines) for (const u of x.uses ?? []) { const m = out.find((o) => o.date === u.date && o.slot === u.slot); if (m) m.foods.push({ line: x, grams: u.grams }); else out.push({ date: u.date, slot: u.slot, title: u.title, foods: [{ line: x, grams: u.grams }] }); }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
export const notTicked = (l: SavedList) => [...l.carried, ...l.lines].filter((x) => !l.ticked.includes(x.key));
export function finishList(s: ShopStore, n: number, carry: boolean, at: string): ShopStore {
  const l = s.lists.find((x) => x.n === n);
  if (!l) return s;
  const left = notTicked(l);
  return { lists: s.lists.map((x) => (x.n === n ? { ...x, doneAt: at } : x)), carry: carry && left.length ? { from: n, lines: left } : s.carry };
}
export function listText(l: SavedList, span: string): string {
  const shown = (x: ShopLine) => `${x.name}${x.brand && !/typical values|generic|check your|estimate/i.test(x.brand) ? ` (${x.brand})` : ""}: ${shopAmount(x.name, x.grams)}${x.cooked ? ` (${x.cooked.toLocaleString("en")} g cooked)` : ""}`;
  return [`Shopping list ${l.n}, ${span}`, "", ...notTicked(l).map((x) => shown(x) + ((l.missing ?? []).includes(x.key) ? " (not bought last time)" : ""))].join("\n");
}

// SL5 (0.2.63): a short meal changed with Chef Mealan's help. The plan's meal for that slot is new, and the open list
// follows it: the old meal's foods leave that meal, the new meal's foods join, marked as added. A food already in the
// basket stays on the list even when no meal needs it now; a food marked Not this time that no meal needs now leaves the list.
export type NewFood = { name: string; brand: string; grams: number; kcal?: number | null };
export function replanMeal(s: ShopStore, n: number, date: string, slot: string, title: string, foods: NewFood[], from = "", because: string[] = [], quiet = false): ShopStore {
  return { ...s, lists: s.lists.map((l) => {
    if (l.n !== n) return l;
    // the old meal's foods leave that meal: in the foods for these days and in the foods carried from the last list
    const drop = (x: ShopLine) => {
      const uses = (x.uses ?? []).filter((u) => !(u.date === date && u.slot === slot));
      return uses.length === (x.uses ?? []).length ? x : { ...x, uses, grams: shopGrams(uses.reduce((g, u) => g + u.grams, 0)), meals: uses.length };
    };
    let lines = l.lines.map(drop), carried = l.carried.map(drop);
    for (const f0 of foods) {
      if (!(f0.grams > 0)) continue;
      const f = buyAs(f0.name, f0.brand ?? "", f0.grams, f0.kcal);
      const key = `${f.name}|${f.brand ?? ""}`.toLowerCase();
      const at = lines.findIndex((x) => x.key === key), use = { date, slot, title, grams: shopGrams(f.grams) };
      if (at >= 0) { const x = lines[at]; const uses = [...(x.uses ?? []), use]; lines[at] = { ...x, uses, grams: shopGrams(uses.reduce((g, u) => g + u.grams, 0)), meals: uses.length, ...(f.cooked ? { cooked: shopGrams((x.cooked ?? 0) + f.cooked) } : {}) }; }
      else lines.push({ key, name: f.name, brand: f.brand ?? "", grams: use.grams, meals: 1, uses: [use], added: true, ...(f.cooked ? { cooked: shopGrams(f.cooked) } : {}) });
    }
    // a food no meal needs now leaves, unless it is in the basket; the new meal's foods were matched first, so a food it
    // shares with the old meal stays as it was, not as added
    const keep = (x: ShopLine) => (x.uses ?? []).length > 0 || l.ticked.includes(x.key) || !x.uses;
    lines = lines.filter(keep); carried = carried.filter(keep);
    const needed = (k: string) => [...lines, ...carried].some((x) => x.key === k && (x.uses ?? []).length > 0);
    const missing = (l.missing ?? []).filter(needed);
    // the list counts the meal by its new name, so the plan and the list agree on what was shopped for (SL7)
    const counted = l.counted ? l.counted.map((c) => (c.date === date && c.slot === slot && foods.length ? { ...c, title } : c)) : undefined;
    if (quiet) return { ...l, lines: lines.sort((a, b) => a.name.localeCompare(b.name)), carried, missing, ...(counted ? { counted } : {}) };
    const changes = [...(l.changes ?? []).filter((c) => !(c.date === date && c.slot === slot)), { date, slot, from: (l.changes ?? []).find((c) => c.date === date && c.slot === slot)?.from ?? from, to: title, because: (l.changes ?? []).find((c) => c.date === date && c.slot === slot)?.because ?? because }];
    return { ...l, lines: lines.sort((a, b) => a.name.localeCompare(b.name)), carried, missing, changes, ...(counted ? { counted } : {}) };
  }) };
}

// 0.2.65 (Milan 20:46): the list follows the plan. A meal the list counts as short that the plan no longer has, or that no
// longer needs the food marked Not this time (changed before 0.2.64, or by hand in Plan), takes the plan's foods quietly.
export function followPlan(s: ShopStore, planned: Planned): ShopStore {
  const l = openList(s);
  if (!l) return s;
  let next = s;
  for (const m of shortMeals(l)) {
    const held = planned[m.date]?.[m.slot] ?? null;
    const portion = held ? plannedPortion(held, "list", "") : null;
    const needs = portion ? portion.items.some((i) => m.foods.some((f) => [i.food.name, buyAs(i.food.name, "", 1, i.food.calories).name].some((n) => n.toLowerCase() === f.toLowerCase()))) : false;
    if (needs) continue;
    next = replanMeal(next, l.n, m.date, m.slot, held?.title ?? m.title, (portion?.items ?? []).map((i) => ({ name: i.food.name, brand: i.food.brand ?? "", grams: i.grams, kcal: i.food.calories })), "", [], true);
  }
  return next;
}

// SL7 (0.2.66, Milan 21:14 to 21:20): a list follows the plan's changes. A new meal needs new shopping, whatever the reason
// for the change. What a list counted: its own record, or for a list made before 0.2.66, what its foods and notes say.
export function countedOf(l: SavedList): Counted[] {
  if (l.counted) return l.counted;
  const out: Counted[] = [];
  for (const x of [...l.lines, ...l.carried]) for (const u of x.uses ?? []) if (u.date >= l.from && u.date <= l.to && !out.some((c) => c.date === u.date && c.slot === u.slot)) out.push({ date: u.date, slot: u.slot, title: u.title });
  for (const w of l.without) if (!out.some((c) => c.date === w.date && c.title === w.title)) out.push({ date: w.date, slot: "", title: w.title });
  return out;
}
const isCounted = (s: ShopStore, date: string, slot: string, title: string) => s.lists.some((l) => countedOf(l).some((c) => c.date === date && (c.slot === slot || (!c.slot && c.title === title)) && c.title === title));
// the plan without the meals some list already counted
export function notCounted(s: ShopStore, planned: Planned, days: string[]): Planned {
  const out: Planned = {};
  for (const d of days) for (const [slot, m] of Object.entries(planned[d] ?? {})) if (!m.skipped && !isCounted(s, d, slot, m.title)) out[d] = { ...(out[d] ?? {}), [slot]: m };
  return out;
}
// how the plan changed for an open list's days since it was made
export type PlanChange = { date: string; slot: string; kind: "new" | "changed" | "gone"; title: string; was?: string };
export function planChanges(l: SavedList, planned: Planned): PlanChange[] {
  const counted = countedOf(l), out: PlanChange[] = [];
  for (const d of daysFrom(l.from, Math.round((new Date(`${l.to}T12:00:00`).getTime() - new Date(`${l.from}T12:00:00`).getTime()) / 864e5) + 1)) {
    const day = planned[d] ?? {};
    for (const [slot, m] of Object.entries(day)) {
      if (m.skipped) continue;
      const c = counted.find((x) => x.date === d && (x.slot === slot || (!x.slot && x.title === m.title)));
      if (!c) out.push({ date: d, slot, kind: "new", title: m.title });
      else if (c.title !== m.title) out.push({ date: d, slot, kind: "changed", title: m.title, was: c.title });
    }
    for (const c of counted.filter((x) => x.date === d && x.slot)) { const m = day[c.slot]; if (!m || m.skipped) out.push({ date: d, slot: c.slot, kind: "gone", title: c.title }); }
  }
  return out;
}
// Update the list: new and changed meals bring their foods, a meal no longer planned takes its foods off; ticks stay
export function updateList(s: ShopStore, n: number, planned: Planned, at: string): ShopStore {
  const l = s.lists.find((x) => x.n === n);
  if (!l) return s;
  let next = s;
  const changes = planChanges(l, planned);
  for (const c of changes) {
    const m = c.kind === "gone" ? null : planned[c.date]?.[c.slot] ?? null;
    const portion = m ? plannedPortion(m, "list", "") : null;
    next = replanMeal(next, n, c.date, c.slot, m?.title ?? c.title, (portion?.items ?? []).map((i) => ({ name: i.food.name, brand: i.food.brand ?? "", grams: i.grams, kcal: i.food.calories })), "", [], true);
  }
  return { ...next, lists: next.lists.map((x) => {
    if (x.n !== n) return x;
    let counted = countedOf(l).filter((c) => !changes.some((k) => k.date === c.date && (k.slot === c.slot || (!c.slot && k.title === c.title))));
    let without = x.without.filter((w) => !changes.some((k) => k.date === w.date && (k.title === w.title || k.was === w.title)));
    for (const c of changes) if (c.kind !== "gone") { counted = [...counted, { date: c.date, slot: c.slot, title: c.title }]; const m = planned[c.date]?.[c.slot]; if (m && !m.items?.length) without = [...without, { date: c.date, title: m.title }]; }
    return { ...x, counted, without, meals: counted.length, updatedAt: at };
  }) };
}
