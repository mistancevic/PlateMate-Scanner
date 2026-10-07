import { test } from "node:test";
import assert from "node:assert/strict";
import { calculate } from "./personal";
import { loadOf, planFromCounts, countsOf, type Plan } from "./plan";

// The worked example from the canvas, 6 October 2026: 95 kg, 182 cm, born 1981, desk job, Maintain.
const plan: Plan = [
  { work: true, kind: "strength", intensity: "hard", when: "evening", minutes: 60 },
  { work: true, kind: "rest" },
  { work: true, kind: "cardio", intensity: "moderate", when: "morning", minutes: 45 },
  { work: true, kind: "yoga", intensity: "easy", when: "evening", minutes: 30 },
  { work: true, kind: "strength", intensity: "moderate", when: "morning", minutes: 60 },
  { work: false, kind: "walk", intensity: "easy", when: "day", minutes: 60 },
  { work: false, kind: "rest" },
];
const me: any = { sex: "male", birthYear: 1981, heightCm: 182, weightKg: 95, lifestyle: { hours: "fixed", slot: "9-5", move: "sitting" }, plan };

test("each day of the plan: resting burn x the work baseline, plus its activity at its intensity", () => {
  const c = calculate(me, "maintain")!;
  // since 7 October 2026 a saved length counts as the middle of its range: 60 min as 55 (45–60), 45 as 40 (30–45)
  assert.deepEqual(c.weekdays!.map((d) => d.kcal), [2850, 2450, 2800, 2500, 2800, 2650, 2450]);
  assert.equal(c.kcal, 2650, "the week's average is the mean of the seven days");
  assert.equal(c.protein, 180, "two or more moderate or hard days: 1.6 to 2.2 g per kg, middle 1.9 x 95");
  assert.equal(c.fats, Math.round((2650 * 0.3) / 9));
  assert.equal(c.weekdays![0].carbs, Math.round((2850 - 180 * 4 - c.fats * 9) / 4));
  assert.ok(c.weekdays![0].how.some((l) => /55 min strength, hard \(6 METs × 95 kg × 0.92 h/.test(l)), c.weekdays![0].how.join(" | "));
});

test("load: rest, light, moderate, hard; counts follow the plan", () => {
  assert.deepEqual(plan.map(loadOf), ["hard", "passive", "easy", "active", "easy", "active", "passive"]);
  assert.deepEqual(countsOf(plan), { passive: 2, active: 2, easy: 2, hard: 1 });
});

test("the old My week counts become a starting plan, work Monday to Friday", () => {
  const p = planFromCounts({ passive: 2, active: 1, easy: 2, hard: 2 });
  assert.deepEqual(countsOf(p), { passive: 2, active: 1, easy: 2, hard: 2 });
  assert.deepEqual(p.map((d) => d.work), [true, true, true, true, true, false, false]);
});

test("ISO weeks: 5 to 11 October 2026 is week 41; 22 to 28 June is week 26; 27 July is week 31", async () => {
  const { isoWeek, datesOfWeek } = await import("./plan");
  assert.equal(isoWeek(new Date(2026, 9, 6)).week, 41);
  assert.equal(isoWeek(new Date(2026, 5, 24)).week, 26);
  assert.equal(isoWeek(new Date(2026, 6, 27)).week, 31);
  const days = datesOfWeek(isoWeek(new Date(2026, 9, 6)).monday);
  assert.equal(days[0].getDate(), 5); assert.equal(days[6].getDate(), 11);
});

test("a change for one date never touches the usual week, and can be taken back", async () => {
  const { withDated, dayFor } = await import("./personal");
  const plan = Array.from({ length: 7 }, (_, i) => ({ work: i < 5, kind: "rest" as const }));
  const p0: any = { plan };
  const sat = new Date(2026, 9, 17);
  const p1 = withDated(p0, sat, { work: false, kind: "match", sport: "football", intensity: "hard" });
  assert.equal(dayFor(p1, sat)!.day.kind, "match"); assert.equal(dayFor(p1, sat)!.changed, true);
  assert.equal(dayFor(p1, new Date(2026, 9, 24))!.day.kind, "rest", "the next Saturday follows the usual week");
  assert.equal(p1.plan, plan, "the usual week is the same object");
  const p2 = withDated(p1, sat, null);
  assert.equal(dayFor(p2, sat)!.changed, false);
});

test("under 18: Schofield, the way to school, sport at school and a football training add up", async () => {
  const { calculate } = await import("./personal");
  const year = new Date().getFullYear();
  const p: any = { sex: "female", birthYear: year - 17, heightCm: 168, weightKg: 60, lifestyle: { commute: "bike" },
    plan: Array.from({ length: 7 }, (_, i) => ({ work: i < 5, kind: "rest" })) };
  const c = calculate(p, "maintain")!;
  // Schofield for girls 10 to 18: 13.384 x 60 + 692.6 = 1,495.6
  assert.equal(c.bmr, 1496);
  const day = { work: true, kind: "club", sport: "football", intensity: "hard", when: "lateafternoon", minutes: 90, pe: true } as const;
  const n = c.numbersOf(day as any);
  // 1,495.6 x 1.3 = 1,944; + bike 30 min (3 x 60 x 0.5 = 90); + sport at school 45 min (3 x 60 x 0.75 = 135); + football hard 90 min (8.5 x 60 x 1.5 = 765)
  assert.equal(n.kcal, 2950);
  assert.ok(n.how.some((x) => /Schofield/.test(x)) && n.how.some((x) => /sport at school/.test(x)) && n.how.some((x) => /cycling there and back/.test(x)), n.how.join(" | "));
  // a calorie cut is never applied under 18
  assert.equal(calculate(p, "fatloss")!.numbersOf(day as any).kcal, 2950);
});

// Release B (7 October 2026, canvas B0 to B3): work, study, or both, for any adult; At home counts every day as a day at home.
test("an apprentice: a work day on her feet, a study day sitting with the bike ride, a day off sitting", async () => {
  const { dayKindOf, studyLine } = await import("./plan");
  const p: any = { sex: "female", birthYear: 2004, heightCm: 168, weightKg: 60, lifestyle: { weekdays: "both", hours: "fixed", move: "feet", commute: "bike", peWeek: "none" } };
  const c = calculate(p, "maintain")!;
  const bmr = 10 * 60 + 6.25 * 168 - 5 * (new Date().getFullYear() - 2004) - 161;
  const work = c.numbersOf({ work: true, kind: "rest" }), study = c.numbersOf({ work: true, study: true, kind: "rest" }), off = c.numbersOf({ work: false, kind: "rest" });
  assert.equal(work.kcal, Math.round((bmr * 1.55) / 50) * 50, work.how.join(" | "));
  assert.equal(study.kcal, Math.round((bmr * 1.3 + 3 * 60 * 0.5) / 50) * 50, study.how.join(" | "));
  assert.ok(study.how.some((x) => /a study day, mostly sitting/.test(x)) && study.how.some((x) => /cycling there and back/.test(x)), study.how.join(" | "));
  assert.equal(off.kcal, Math.round((bmr * 1.3) / 50) * 50);
  assert.equal(dayKindOf({ work: true, study: true, kind: "rest" }, p.lifestyle), "study");
  assert.equal(studyLine({ work: true, study: true, kind: "team", intensity: "moderate", when: "evening" }), "Study day, then team sport in the evening");
});

test("study only: a weekday is a study day; sport in class adds 45 minutes at 4 METs; At home: every day is a day at home", async () => {
  const { dayKindOf, weekdaysOf } = await import("./plan");
  const s: any = { sex: "male", birthYear: 1990, heightCm: 180, weightKg: 80, lifestyle: { weekdays: "study", move: "physical", commute: "bus", peWeek: "1" } };
  const day = calculate(s, "maintain")!.numbersOf({ work: true, kind: "rest", pe: true });
  assert.ok(day.how.some((x) => /× 1.3 for a study day/.test(x)) && day.how.some((x) => /sport in class/.test(x)), day.how.join(" | "));
  assert.equal(dayKindOf({ work: true, kind: "rest" }, s.lifestyle), "study", "an older plan's weekday counts as a study day");
  const h: any = { ...s, lifestyle: { weekdays: "home", move: "physical" } };
  assert.ok(calculate(h, "maintain")!.numbersOf({ work: true, kind: "rest" }).how.some((x) => /× 1.3 for a day at home/.test(x)));
  assert.equal(weekdaysOf({ hours: "none" }), "home", "No fixed work from before Release B is At home");
  assert.equal(weekdaysOf({ hours: "fixed" }), "work");
});

// Calculate for me, 7 October 2026 (canvas boards T1 and T3): your everyday, then your training.
test("training week: + turns a day without training into one, − turns the last back; + stops at 7; lengths are ranges", async () => {
  const { withTraining, withLength, trainingCounts, levelMinutes, lengthOf, planFromCounts } = await import("./plan");
  let pl = planFromCounts({ passive: 7, active: 0, easy: 0, hard: 0 });
  assert.deepEqual(trainingCounts(pl), { easy: 0, moderate: 0, hard: 0 }, "a new week has no training");
  pl = withTraining(pl, "hard", 1); pl = withTraining(pl, "moderate", 1); pl = withTraining(pl, "easy", 1);
  assert.deepEqual(trainingCounts(pl), { easy: 1, moderate: 1, hard: 1 });
  assert.equal(levelMinutes(pl, "easy"), 40, "Light starts at 30–45"); assert.equal(levelMinutes(pl, "moderate"), 55, "Moderate at 45–60"); assert.equal(levelMinutes(pl, "hard"), 75, "Hard at 60–90");
  for (let i = 0; i < 6; i++) pl = withTraining(pl, "hard", 1);
  assert.equal(pl.filter((d) => d.kind !== "rest").length, 7, "+ stops at 7 training days");
  pl = withTraining(pl, "hard", -1);
  assert.equal(pl.filter((d) => d.kind === "rest").length, 1, "a − gives a day back");
  assert.ok(pl.every((d, i) => d.work === i < 5), "the days keep their work days");
  pl = withLength(pl, "hard", 25);
  assert.ok(pl.filter((d) => d.intensity === "hard").every((d) => d.minutes === 25), "a length sets every day of that kind");
  assert.deepEqual([30, 45, 60, 75, 90, 120].map((m) => lengthOf(m).id), ["15-30", "30-45", "45-60", "60-90", "60-90", "90+"], "a saved length falls in the range it ends in");
});
test("steps count on every day, above what the work covers: 8,000–12,000 at 96 kg sitting adds about 200 kcal", async () => {
  const { calculate } = await import("./personal");
  const plan: any = Array.from({ length: 7 }, (_, i) => ({ work: i < 5, kind: "rest" }));
  const me: any = { sex: "male", birthYear: 1981, heightCm: 182, weightKg: 96, lifestyle: { hours: "fixed", move: "sitting" }, plan };
  const none = calculate(me, "maintain")!, walk = calculate({ ...me, steps: "8to12" }, "maintain")!;
  const diff = walk.weekdays![0].kcal - none.weekdays![0].kcal;
  assert.ok(diff >= 150 && diff <= 250, `rest days count the steps too: ${diff}`);
  assert.ok(walk.weekdays![0].how.some((l) => /for your steps, about 50 min of walking/.test(l)), walk.weekdays![0].how.join(" | "));
  const feet = calculate({ ...me, steps: "8to12", lifestyle: { hours: "fixed", move: "feet" } }, "maintain")!;
  assert.ok(!feet.weekdays![0].how.some((l) => /for your steps/.test(l)), "on your feet, 10,000 steps are already covered on a work day");
});
test("your work in the goal setup writes the Lifestyle the numbers read", async () => {
  const { withWork, workOf } = await import("./personal");
  const p: any = { lifestyle: { weekdays: "work", hours: "flexible", move: "sitting" } };
  const q = withWork(p, "feet");
  assert.equal(workOf(q), "feet"); assert.equal(q.lifestyle!.move, "feet"); assert.equal(q.lifestyle!.hours, "flexible", "hours stay");
  assert.equal(workOf(withWork(q, "shift")), "shift");
});
