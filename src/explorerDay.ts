// DT160 (0.3.3, canvas Page 2, board Stories112 version 2; Coach Milan 29 October 18:02 to 19:30): Your day, the ranges each
// family opens with, calculated for the person. Protein: their range, the same every day. Fat: 20 to 35 % of the week's average
// energy, because the day's fat is set on it (src/personal.ts); saturated fat under 10 % of it. Carbs: 45 to 60 % of today's
// energy, and the week's span from the lightest day to the hardest, today marked; the days below 45 % named. Free sugars under
// 10 % of today's energy. Every day's numbers come from the app's own numbersFor, the same as Today and Plan.
// Sources: EFSA, dietary reference values, press release of 26 March 2010 (fat 20 to 35 %, carbohydrate 45 to 60 %, fibre 25 g)
// and the 2017 summary report; fat 20 to 35 % also AND, DC and ACSM 2016; WHO 2023 (saturated fat); WHO 2015 (free sugars).
import { FAT_RANGE, CARB_RANGE } from "./personal";
import { WEEKDAY_NAMES } from "./plan";

export type DayN = { kcal: number; protein: number; fats: number; carbs: number };
export type WeekDay = { name: string; date: Date; n: DayN };

// Monday to Sunday of the week `today` is in, each with its numbers; days without numbers are left out
export function weekNumbers(numbersFor: (d: Date) => DayN | null, today: Date): WeekDay[] {
  const mon = new Date(today); mon.setHours(12, 0, 0, 0); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const n = numbersFor(d); return n ? { name: WEEKDAY_NAMES[i], date: d, n } : null; })
    .filter((x): x is WeekDay => x !== null);
}

export type YourDay = {
  avgKcal: number;
  fat: { lo: number; hi: number; you: number; pct: number };
  satUnder: number;
  carbs: { lo: number; hi: number; you: number; pct: number };
  span: { lo: number; loName: string; hi: number; hiName: string } | null;   // null when every day has the same carbs
  below: string[];                                                           // the days with carbs under 45 % of the energy
  sugarsUnder: number;
};
// avg: the week's average the fat was set on, when the app calculated it (src/personal.ts rounds it to 50 kcal); else the mean of
// this week's days
export function yourDay(today: DayN, week: WeekDay[], avg?: number | null): YourDay {
  const days = week.length ? week : [{ name: "Today", date: new Date(), n: today }];
  const avgKcal = avg ?? Math.round(days.reduce((a, d) => a + d.n.kcal, 0) / days.length);
  const byCarbs = [...days].sort((a, b) => a.n.carbs - b.n.carbs);
  const lo = byCarbs[0], hi = byCarbs[byCarbs.length - 1];
  return {
    avgKcal,
    fat: { lo: Math.round((avgKcal * FAT_RANGE.lo) / 9), hi: Math.round((avgKcal * FAT_RANGE.hi) / 9), you: today.fats, pct: Math.round((today.fats * 900) / avgKcal) },
    satUnder: Math.round((avgKcal * 0.1) / 9),
    carbs: { lo: Math.round((today.kcal * CARB_RANGE.lo) / 4), hi: Math.round((today.kcal * CARB_RANGE.hi) / 4), you: today.carbs, pct: Math.round((today.carbs * 400) / today.kcal) },
    span: lo.n.carbs === hi.n.carbs ? null : { lo: lo.n.carbs, loName: lo.name, hi: hi.n.carbs, hiName: hi.name },
    below: days.filter((d) => d.n.kcal > 0 && (d.n.carbs * 4) / d.n.kcal < CARB_RANGE.lo).map((d) => d.name),
    sugarsUnder: Math.round((today.kcal * 0.1) / 4),
  };
}
// "Wednesday, Saturday and Sunday"; "every day" when all seven
export function dayList(names: string[], of: number, week: string[] = []): string {
  if (names.length === of && of > 1) return "every day";
  // most of the week: say the days that are not, "every day but Monday"
  if (of === 7 && week.length === 7 && names.length >= 5) { const not = week.filter((d) => !names.includes(d)); return `every day but ${not.length === 1 ? not[0] : `${not[0]} and ${not[1]}`}`; }
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
