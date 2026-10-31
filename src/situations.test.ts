import test from "node:test";
import assert from "node:assert/strict";
import { sleepCase, eveningOf } from "./situations";
import { buildIndex, searchIndex, SLEEP_PAGE } from "./explorerBody";
import type { Personal } from "./personal";
import type { Feedback } from "./pilot";

const personal = { lifestyle: { meals: 3, wake: "early", bed: "mid", weekdays: "work", hours: "fixed", slot: "9-5" }, plan: [{ work: true, kind: "strength", intensity: "hard", at: "17:30" }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: true, kind: "rest" }, { work: false, kind: "rest" }, { work: false, kind: "rest" }] } as unknown as Personal;
const eaten = (date: string, time: string, title: string, which = "", foods: string[] = []): Feedback => ({ id: `${date}${time}`, status: "eaten", createdAt: `${date}T${time}:00`, which, taste: "", notes: "", meal: { id: "m", title, items: foods.map((n) => ({ id: n, grams: 100, locked: false, food: { id: n, name: n, calories: 100, protein: 5, carbs: 10, fats: 2 } as any })), portion: 100, savedAt: "" } as any });
const monday = new Date("2026-11-02T08:00:00");

test("DT180: the evening of a date from the record: late meals, the dinner's clock, coffee after 14:00, a drink", () => {
  const fb = [eaten("2026-11-01", "20:10", "Chicken rice bowl", "dinner"), eaten("2026-11-01", "22:40", "Chocolate"), eaten("2026-11-01", "16:30", "Coffee", "", ["Coffee, black"]), eaten("2026-11-01", "20:10", "Beer", "", ["Beer, lager"])];
  assert.deepEqual(eveningOf(fb, "2026-11-01"), { late: 1, dinner: "20:10", coffeeLate: true, drink: true });
  assert.deepEqual(eveningOf(fb, "2026-11-02"), { late: 0, dinner: null, coffeeLate: false, drink: false });
});

test("DT180: your case, five parts, from the settings and the week", () => {
  const fb = [eaten("2026-10-30", "20:00", "Bowl", "dinner"), eaten("2026-10-31", "20:30", "Bowl", "dinner"), eaten("2026-11-01", "21:40", "Bowl", "dinner"), eaten("2026-10-31", "22:30", "Chocolate"), eaten("2026-11-01", "22:30", "Chocolate")];
  const c = sleepCase(personal, fb, monday);
  assert.equal(c.parts.length, 5);
  assert.match(c.parts[0].body, /Bed 22:00 to midnight, up before 6:00/);
  assert.match(c.parts[0].body, /Training today: Strength, hard, at 17:30/);
  assert.match(c.parts[1].body, /Dinner eaten at 20:00, 20:30, 21:40/);
  assert.match(c.parts[1].body, /after 21:30 on 2 evenings/);
  assert.match(c.parts[2].body, /last night was short/);
  assert.match(c.parts[4].body, /Bed by 23:00/);
  // the trend: 50 minutes a day, carried on; the trajectory: bed by 23:00; the gap: dinner back at 20:00
  assert.match(c.trend!, /about 50 minutes later each day/);
  assert.match(c.trend!, /bed by 23:00/);
  assert.match(c.trend!, /dinner back at 20:00/);
  assert.deepEqual(c.taps.map((t) => t.id), ["protein", "snack", "easy"]);
  assert.match(c.taps[2].label, /easy, or a walk/);
  assert.equal(c.hasSnackSlot, false);
  assert.equal(c.weekQuestion, false);
});

test("DT180: three late nights make it a week question; an empty record says so", () => {
  const fb = ["2026-10-28", "2026-10-30", "2026-11-01"].map((d) => eaten(d, "22:45", "Snack"));
  assert.equal(sleepCase(personal, fb, monday).weekQuestion, true);
  const c = sleepCase(personal, [], monday);
  assert.match(c.parts[1].body, /Nothing in the record points at the evenings/);
  assert.equal(c.trend, null);
});

test("DT180: every line with a number names its paper; the wellness line is on the page", () => {
  for (const l of [...SLEEP_PAGE.effects, ...SLEEP_PAGE.causes]) if (/\d/.test(l.text)) assert.ok(l.src, l.title);
  assert.match(SLEEP_PAGE.line, /see your doctor/);
  assert.doesNotMatch(JSON.stringify(SLEEP_PAGE), /insomnia|depress|anxiety|diabet/i);
});

test("Explorer search: a food, a member, a situation, a line, a claim; the title first", () => {
  const index = buildIndex({ nutrients: [{ family: "protein", name: "Protein", hint: "Not all proteins are equal", members: ["Leucine"], foods: ["Chicken breast", "Lentils"] }] });
  assert.equal(searchIndex(index, "leuc")[0].title, "Leucine");
  assert.equal(searchIndex(index, "lentil")[0].kind, "food");
  assert.equal(searchIndex(index, "sleep")[0].title, "A bad night's sleep");
  assert.ok(searchIndex(index, "385").some((h) => h.title.includes("385 kcal")));
  assert.ok(searchIndex(index, "coffee").some((h) => h.title === "Coffee after 14:00"));
  assert.ok(searchIndex(index, "gut").some((h) => h.title === "The gut"));
  assert.equal(searchIndex(index, "x").length, 0);
  assert.ok(searchIndex(index, "a bad night").length <= 12);
});

// 0.3.26 (DT181 v2, DT183 to DT186 the body's first pages): glucose, glycogen, the fat store, fat burning
import { glucoseCase, glycogenCase, fatCase } from "./situations";
import { BODY_PAGES, HORMONE_MEMBERS, FATBURN_PAGE, SITUATION_PAGES, BODY_FAMILIES, SITUATIONS } from "./explorerBody";

test("0.3.26: the three body pages and the fat burning situation exist, with sources and the when rows", () => {
  for (const k of ["glucose", "glycogen", "fat"]) { const pg = BODY_PAGES[k]; assert.ok(pg && pg.sections.length >= 1 && pg.when.length >= 3 && /Educational/.test(pg.sources) && pg.chips.length === 3, k); }
  assert.equal(BODY_PAGES.glucose.family, "hormones");
  assert.ok(HORMONE_MEMBERS.find((m) => m.page === "glucose") && HORMONE_MEMBERS.some((m) => /testosterone/i.test(m.name)) && HORMONE_MEMBERS.some((m) => /oestrogen/i.test(m.name)));
  assert.equal(SITUATION_PAGES.fatburn, FATBURN_PAGE);
  assert.ok(FATBURN_PAGE.when.length >= 3 && FATBURN_PAGE.effects.length >= 3);
  assert.deepEqual(BODY_FAMILIES.filter((b) => b.state === "page").map((b) => b.id), ["muscle", "fat", "glycogen", "bone", "hormones"]);
  assert.equal(SITUATIONS.find((s) => s.id === "fatburn")!.state, "page");
});

test("0.3.26: the search finds the body pages' lines and opens the member", () => {
  const idx = buildIndex({ nutrients: [] });
  const hit = searchIndex(idx, "insulin")[0];
  assert.ok(hit && hit.part === "body" && hit.go.body === "hormones" && hit.go.member === "glucose", JSON.stringify(hit));
  const gly = searchIndex(idx, "glycogen").find((h) => h.kind === "page" || h.kind === "family");
  assert.ok(gly && gly.go.body === "glycogen");
  assert.ok(searchIndex(idx, "ketone").some((h) => h.go.body === "fat" || h.go.situation === "fatburn"));
});

const numbers = () => ({ kcal: 2400, protein: 150, fats: 80, carbs: 270 });
test("0.3.26: glucose case: the next meal by the clock, its letters and GI, the hard day's carbs after the session", () => {
  const planned = { "2026-11-02": { lunch: { id: "x", title: "Rice bowl", items: [{ id: "r", grams: 300, locked: false, food: { id: "r", name: "Rice, white, cooked", calories: 130, protein: 2.7, carbs: 28, fats: 0.3 } as any }], portion: 300, savedAt: "" } } } as any;
  const c = glucoseCase({ personal, feedback: [], planned, numbersFor: numbers, pdRef: null, giOf: (n) => (/rice/i.test(n) ? 73 : null) }, new Date("2026-11-02T11:30:00"));
  assert.equal(c.parts.length, 5);
  assert.match(c.parts[0].body, /3 meals a day, lunch at/);
  assert.match(c.parts[2].body, /Rice bowl, planned/);
  assert.match(c.parts[2].body, /Rice GI about 73/);
  assert.match(c.parts[2].body, /hard training day/);
  assert.ok(c.taps.some((t) => t.id === "protein") && c.taps.some((t) => t.id === "dinner"), JSON.stringify(c.taps));
  assert.equal(c.trend, null);
});

test("0.3.26: glycogen case: rest day, training day, tomorrow", () => {
  const rest = glycogenCase(personal, new Date("2026-11-03T08:00:00"));
  assert.match(rest.parts[0].body, /A training day, hard/);
  assert.match(rest.parts[2].body, /A rest day/);
  const train = glycogenCase(personal, monday);
  assert.match(train.parts[2].body, /Muscle glycogen will be used/);
  assert.ok(train.taps.some((t) => t.id === "dinner" && /after the session/.test(t.label)));
  assert.ok(train.taps.some((t) => /Tomorrow, a rest day/.test(t.label)));
});

test("0.3.26: fat case: the goal, the week by the plan, the trend against what the goal expects", () => {
  const p = { ...personal, weightKg: 85, trainingAge: "some", weighIns: [{ date: "2026-10-05", kg: 86.0 }, { date: "2026-10-12", kg: 85.6 }, { date: "2026-10-19", kg: 85.3 }, { date: "2026-10-26", kg: 85.0 }, { date: "2026-11-02", kg: 84.8 }] } as unknown as Personal;
  const c = fatCase({ personal: p, feedback: [], planned: {}, band: "lose", goalSetAt: "2026-10-05T10:00:00Z", numbersFor: numbers }, monday);
  assert.match(c.parts[0].title, /set 5 October/);
  assert.match(c.parts[1].body, /of 7 days by the plan/);
  assert.match(c.parts[2].body, /Trend: (down|too few)/);
  assert.ok(c.taps.some((t) => t.id === "easy") && c.taps.some((t) => t.id === "protein"));
  assert.ok(c.parts[4].body.includes("six of seven days by the plan"));
});

// 0.3.27: Hormones' other four
import { hormoneCase } from "./situations";
import { HORMONE_PAGES } from "./explorerBody";
test("0.3.27: the four hormone pages exist, with their papers, and every member has a page", () => {
  for (const k of ["hunger", "cortisol", "testosterone", "oestrogen"]) { const pg = HORMONE_PAGES[k]; assert.ok(pg && pg.family === "hormones" && pg.when.length >= 4 && pg.chips.length === 3 && /Educational/.test(pg.sources), k); assert.equal(BODY_PAGES[k], pg); }
  assert.ok(HORMONE_MEMBERS.every((m) => m.page));
  assert.match(HORMONE_PAGES.testosterone.sections[0].lines[0].text, /10 to 15 %/);
  assert.match(HORMONE_PAGES.hunger.sections[0].lines[0].text, /18 % lower and ghrelin 28 % higher/);
  assert.match(HORMONE_PAGES.cortisol.sections[0].lines[0].text, /37 % higher/);
  const idx = buildIndex({ nutrients: [] });
  const hit = searchIndex(idx, "ghrelin")[0];
  assert.ok(hit && hit.go.body === "hormones" && hit.go.member === "hunger", JSON.stringify(hit));
});
test("0.3.27: the hormone cases read the week's evenings, the training week and the goal", () => {
  const fb = [eaten("2026-10-31", "22:30", "Chocolate"), eaten("2026-11-01", "22:30", "Chocolate"), eaten("2026-11-01", "16:30", "Coffee", "", ["Coffee, black"]), eaten("2026-10-30", "16:30", "Coffee", "", ["Coffee, black"]), eaten("2026-10-29", "15:30", "Coffee", "", ["Coffee, black"])];
  const x = { personal: { ...personal, weightKg: 85 } as Personal, feedback: fb, planned: {}, band: "fatloss", numbersFor: () => ({ kcal: 2000, protein: 150 }), pdRef: null };
  const h = hormoneCase("hunger", x, monday);
  assert.match(h.parts[1].body, /after 21:30 on 2 of six evenings/);
  assert.match(h.parts[2].body, /ghrelin rises/);
  assert.ok(h.taps.some((t) => t.id === "protein") && h.taps.some((t) => t.id === "sleep"));
  const c = hormoneCase("cortisol", x, monday);
  assert.match(c.parts[1].body, /Coffee after 14:00 on 3 of six days/);
  assert.ok(c.taps.some((t) => t.id === "plan" && /Coffee before 14:00/.test(t.label)));
  assert.match(c.trend ?? "", /last coffee before 14:00/);
  const t = hormoneCase("testosterone", x, monday);
  assert.match(t.parts[0].body, /Strength 1 day a week/);
  assert.ok(t.taps.some((tp) => /Keep the strength day/.test(tp.label)) && t.taps.some((tp) => tp.id === "sleep"));
  const o = hormoneCase("oestrogen", x, monday);
  assert.match(o.parts[2].body, /energy left after training/);
  assert.match(o.parts[4].title, /check-in/);
});
import { expectedWords } from "./situations";
test("0.3.27: the expected change in words, never a minus sign", () => {
  assert.equal(expectedWords([-0.5, 0.5]), "within 0.5 kg either way");
  assert.equal(expectedWords([-2, -1]), "down 1 to 2 kg");
  assert.equal(expectedWords([0.5, 1]), "up 0.5 to 1 kg");
});

// 0.3.28: Muscle and Bone
import { muscleCase, boneCase } from "./situations";
import { MUSCLE_PAGE, BONE_PAGE } from "./explorerBody";
test("0.3.28: Muscle and Bone pages exist with their papers; the families open a page", () => {
  assert.equal(BODY_PAGES.muscle, MUSCLE_PAGE); assert.equal(BODY_PAGES.bone, BONE_PAGE);
  assert.match(MUSCLE_PAGE.sections[0].lines[0].text, /0\.4 g of protein per kg/);
  assert.match(MUSCLE_PAGE.sections[0].lines[3].text, /8 % smaller, 23 % weaker/);
  assert.match(BONE_PAGE.sections[0].lines[1].text, /2\.9 %/);
  assert.ok(BODY_FAMILIES.find((b) => b.id === "muscle")!.state === "page" && BODY_FAMILIES.find((b) => b.id === "bone")!.state === "page");
  const idx = buildIndex({ nutrients: [] });
  assert.ok(searchIndex(idx, "leucine").some((h) => h.go.body === "muscle"));
  assert.ok(searchIndex(idx, "calcium").some((h) => h.go.body === "bone"));
});
test("0.3.28: the muscle case finds the meal below the per-meal dose; the bone case counts calcium portions", () => {
  const p = { ...personal, weightKg: 85, sex: "male", birthYear: 1981 } as unknown as Personal;
  const food = (n: string, protein: number) => eaten("2026-11-01", "08:00", n, "breakfast", [n]);
  const fb: Feedback[] = [];
  for (const d of ["2026-10-30", "2026-10-31", "2026-11-01"]) {
    fb.push({ ...eaten(d, "08:00", "Oats", "breakfast", ["Oats"]), meal: { ...eaten(d, "08:00", "Oats", "breakfast", ["Oats"]).meal, items: [{ id: "o", grams: 100, locked: false, food: { id: "o", name: "Oats", calories: 370, protein: 13, carbs: 60, fats: 7 } as any }] } } as Feedback);
    fb.push({ ...eaten(d, "13:00", "Chicken", "lunch", ["Chicken"]), meal: { ...eaten(d, "13:00", "Chicken", "lunch", ["Chicken"]).meal, items: [{ id: "c", grams: 200, locked: false, food: { id: "c", name: "Chicken breast", calories: 165, protein: 31, carbs: 0, fats: 3.6 } as any }, { id: "y", grams: 150, locked: false, food: { id: "y", name: "Skyr, plain", calories: 60, protein: 11, carbs: 4, fats: 0.2 } as any }] } } as Feedback);
  }
  void food;
  const x = { personal: p, feedback: fb, planned: {}, band: "maintain", numbersFor: () => ({ kcal: 2400, protein: 150 }), pdRef: null };
  const m = muscleCase(x, monday);
  assert.match(m.parts[0].body, /about 34 g a meal/);
  assert.match(m.parts[2].body, /Breakfast is the meal below 34 g/);
  assert.ok(m.taps.some((t) => /Breakfast to 34 g of protein/.test(t.label)));
  assert.match(m.trend ?? "", /below the range by 58 g/);
  const b = boneCase(x, monday);
  assert.match(b.parts[0].body, /Calcium 950 mg a day/);
  assert.match(b.parts[1].body, /about 1 portion a day/);
  assert.ok(b.taps.some((t) => /One more calcium portion/.test(t.label)) && b.taps.some((t) => /Vitamin D in the dark months/.test(t.label)));
});
