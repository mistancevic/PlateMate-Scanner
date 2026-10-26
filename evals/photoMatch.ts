// Eval 2 for Photo of my meal: how a read is scored against a weighed plate, by code. The coach weighs every food before the
// photo and writes its name, other names it goes by, the grams and, when known, the kcal per 100 g.
export type TruthFood = { name: string; also?: string[]; grams: number; calories?: number | null };
export type ReadFood = { name: string; grams: number; low: number; high: number; calories: number | null };
export type PlateScore = { foods: number; found: number; invented: number; inRange: number; matched: number; kcalTrue: number | null; kcalRead: number; kcalOk: boolean | null; pairs: { truth: string; read: string | null; grams: number; readGrams: number | null; inRange: boolean | null }[]; extra: string[] };

const words = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z]+/).filter((w) => w.length > 2);
const stem = (w: string) => w.replace(/(es|s)$/, "");
// a read name matches a weighed food when the main word of any of its names is in the read name (Chicken breast, grilled
// matches chicken; Rice, cooked matches rice); the closest read food is taken once
function matches(t: TruthFood, r: ReadFood): number {
  const rw = new Set(words(r.name).map(stem));
  let best = 0;
  for (const n of [t.name, ...(t.also ?? [])]) {
    const tw = words(n).map(stem); if (!tw.length) continue;
    const hit = tw.filter((w) => rw.has(w)).length;
    if (rw.has(tw[0])) best = Math.max(best, 1 + hit / tw.length); else if (hit) best = Math.max(best, hit / tw.length / 2);
  }
  return best >= 0.5 ? best : 0;
}

export function scorePlate(truth: TruthFood[], read: ReadFood[]): PlateScore {
  const left = [...read.keys()];
  const pairs = truth.map((t) => {
    let at = -1, best = 0;
    for (const k of left) { const s = matches(t, read[k]); if (s > best) { best = s; at = k; } }
    if (at < 0) return { truth: t.name, read: null, grams: t.grams, readGrams: null, inRange: null };
    left.splice(left.indexOf(at), 1);
    const r = read[at];
    return { truth: t.name, read: r.name, grams: t.grams, readGrams: r.grams, inRange: t.grams >= r.low && t.grams <= r.high };
  });
  const matched = pairs.filter((p) => p.read !== null);
  const known = truth.every((t) => typeof t.calories === "number");
  const kcalTrue = known ? Math.round(truth.reduce((n, t) => n + (t.grams * (t.calories as number)) / 100, 0)) : null;
  const kcalRead = Math.round(read.reduce((n, r) => n + (r.grams * (r.calories ?? 0)) / 100, 0));
  return { foods: truth.length, found: matched.length, invented: left.length, inRange: matched.filter((p) => p.inRange).length, matched: matched.length,
    kcalTrue, kcalRead, kcalOk: kcalTrue === null ? null : Math.abs(kcalRead - kcalTrue) <= kcalTrue * 0.2, pairs, extra: left.map((k) => read[k].name) };
}
