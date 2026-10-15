// The coach's week on this phone only (0.2.6): without accounts (local runs and the walkthroughs) Clients can open with two
// example clients, so the coach's pages can be seen and tested. Off on the live app: it needs accounts there.
import { cloudEnabled, type ClientRow } from "./cloud";
import { dayLineOf, type DayLine } from "./dayLines";
import { slotsOf } from "./slots";
import { isoWeek, ymd } from "./plan";
import type { CoachNote } from "./coachNotes";
import { measure, startOf, daysFromLines, addDays } from "./measured";

const FLAG = "chefmealan-coach-demo";
export function coachDemoOn(): boolean {
  if (cloudEnabled || typeof window === "undefined") return false;
  try { if (/[?&]coachdemo\b/.test(location.search)) localStorage.setItem(FLAG, "1"); return localStorage.getItem(FLAG) === "1"; } catch { return false; }
}
const food = (id: string, name: string, kcal: number, protein: number) => ({ id, name, brand: "", basis: "100g", source: "label", notes: "", reviewedAt: "", calories: kcal, protein, fats: 5, carbs: 10, fiber: null });
const card = (id: string, title: string, kcal: number, protein: number, at: Date, slot?: { date: string; slotId: string }, mealId = id, extra: Record<string, unknown> = {}) =>
  ({ id, status: "eaten", taste: "", notes: "", createdAt: at.toISOString(), slot, meal: { id: mealId, title, savedAt: at.toISOString(), portion: 100, items: [{ id: id + "i", food: food(id + "f", title, kcal, protein), grams: 100, locked: false }] }, ...extra }) as any;
const MEALS = { breakfast: ["b", "Oats, skyr and banana", 472, 36], lunch: ["l", "Sarma with skyr", 602, 68], dinner: ["d", "Chicken, rice and greens", 640, 52] } as const;

export function demoRows(): ClientRow[] {
  const slots = slotsOf({ meals: 3, window: null });
  const now = new Date(), today = ymd(now), monday = isoWeek(now).monday;
  const held = Object.fromEntries(Object.entries(MEALS).map(([k, [id, title, kcal, protein]]) => [k, { title, kcal, protein, source: k === "dinner" ? "coach" : "mine", mealId: id }])) as any;
  const days: Record<string, DayLine> = {};
  const shared: any[] = [];
  for (let i = -14; i <= 6; i++) {
    const d = new Date(monday); d.setDate(d.getDate() + i); d.setHours(12, 0, 0, 0);
    const key = ymd(d); if (key > ymd(new Date(now.getTime() + 2 * 864e5))) continue;
    const at = (h: number) => { const x = new Date(d); x.setHours(h, 0, 0, 0); return x; };
    const slot = (s: string) => ({ date: key, slotId: s });
    const wd = (d.getDay() + 6) % 7;
    let logged: any[] = [];
    if (key < today) {
      if (wd === 2) logged = [card(`b${key}`, MEALS.breakfast[1], 472, 36, at(7), slot("breakfast"), "b"), card(`w${key}`, "Chicken wrap, canteen", 610, 38, at(13), slot("lunch")), card(`p${key}`, "Pizza, 3 slices", 1180, 46, at(20), undefined, `p${key}`, { notes: "team dinner, couldn't skip it", shared: { reason: "look" } })];
      else logged = (["breakfast", "lunch", "dinner"] as const).map((s, n) => card(`${s}${key}`, MEALS[s][1], wd === 0 && s === "dinner" ? 922 : MEALS[s][2] + 150, MEALS[s][3] + 4, at(7 + n * 6), slot(s), MEALS[s][0]));
      if (wd === 0) logged.push(card(`c${key}`, "Birthday cake, a small piece", 250, 4, at(15)));
    } else if (key === today) logged = (["breakfast", "lunch"] as const).map((s, n) => card(`${s}${key}`, MEALS[s][1], MEALS[s][2] + 60, MEALS[s][3] + 4, at(7 + n * 6), slot(s), MEALS[s][0]));
    if (wd === 1 && key < today) shared.push({ ...logged[1], taste: "DaaM good" });
    shared.push(...logged.filter((c) => c.shared));
    days[key] = dayLineOf({ date: key, today, slots, held, logged, target: { kcal: 2200, protein: 180 }, training: wd === 0 || wd === 3 ? "strength, 60 min" : null });
  }
  const weighIns = Array.from({ length: 24 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - i); return { date: ymd(d), kg: Math.round((77.9 + i * 0.03) * 10) / 10 }; }).filter((_, i) => i % 2 === 0).reverse();
  const lastFriday = new Date(monday); lastFriday.setDate(lastFriday.getDate() - 3); lastFriday.setHours(18, 10, 0, 0);
  const notes: CoachNote[] = [{ at: lastFriday.toISOString(), by: "coach", name: "Milan", week: ymd(new Date(monday.getTime() - 7 * 864e5)), verdict: "approved", text: "Strong start. Two meals a day by the plan is a win.", readAt: lastFriday.toISOString() }];
  const since = new Date(now); since.setDate(since.getDate() - 17);
  const base = { review: null, foods: 58, updatedAt: now.toISOString(), goalLog: [], formula: null, pdUnit: "pd" as const, flags: [], birthYear: 1985, aiConfirmedAt: null, consentBy: "self", trainingAge: "1to3", coachGoal: null, nextGoal: null };
  // the first two weeks and the measured burn (0.2.7, board FT, FT6 and FT7): Davorka measured, Lena on day 6 of 14
  const dStart = ymd(since), lStartD = new Date(now.getTime() - 5 * 864e5), lStart = ymd(lStartD);
  const dMeasured = { ...measure({ days: daysFromLines(days), weighIns, today, start: startOf({ setAt: since.toISOString() }, []) }), formulaKcal: 2000 };
  void dStart;
  const lDays = Object.fromEntries([1, 2, 3, 4, 5].map((k) => [addDays(lStart, k - 1), { kcal: 2600, full: k !== 3, logged: true }]));
  const lMeasured = { ...measure({ days: lDays, weighIns: [{ date: addDays(lStart, 4), kg: 64.2 }, { date: addDays(lStart, 5), kg: 64.1 }], today, start: lStart }), formulaKcal: 2450 };
  return [
    { ...base, uid: "demo-davorka", measured: dMeasured, name: "Davorka", goal: { band: "fatloss", setBy: "coach", coachName: "Milan", setAt: since.toISOString(), source: "coach" }, goalsNow: { calories: 2200, protein: 180 }, days, feedback: shared, notes, checkinDay: (now.getDay() + 6) % 7, weightKg: 78, weighIns },
    { ...base, uid: "demo-lena", measured: lMeasured, name: "Lena", goal: { band: "gainsteady", setBy: "you", setAt: new Date(now.getTime() - 5 * 864e5).toISOString(), source: "profile" }, goalsNow: { calories: 2700, protein: 150 }, days: {}, feedback: [], notes: [], checkinDay: 0, weightKg: 64, weighIns: [] },
  ];
}
