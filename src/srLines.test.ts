// DT203 (0.3.76, board Stories175 v2): the release check for Chef Mealan's Serbian lines. A line Milan ticked goes into the app;
// the check stops on a slot that does not match, and on a safety line or a line of his script missing from the file.
import { test } from "node:test";
import assert from "node:assert/strict";
import srLines from "./i18n/sr-Latn.json" with { type: "json" };
import { CHEF, SR_ALLOWED, SR_SLOTS, SR_LATER, slotProblems, srLine, fill, say } from "./chefScript";
import { FIXED } from "./safety";
import { srCount } from "./lang";

const sr = srLines as unknown as { chef: Record<string, { text: string; checked: boolean }>; safety: Record<string, { text: string; checked: boolean }> };

test("every line of his script is in the Serbian file, and nothing else", () => {
  assert.deepEqual(Object.keys(sr.chef).sort(), Object.keys(CHEF).sort());
});

test("every safety line is in the Serbian file", () => {
  assert.deepEqual(Object.keys(sr.safety).sort(), Object.keys(FIXED).sort());
  for (const [k, l] of Object.entries(sr.safety)) assert.ok(l.text.trim().length > 20, `safety ${k} has words`);
});

test("each Serbian line names exactly the slots the app fills", () => {
  for (const [k, l] of Object.entries(sr.chef)) assert.deepEqual(slotProblems(k, l.text), [], `${k}: ${l.text}`);
});

test("the slots the app fills match the slots each line is allowed", () => {
  const dummy: Record<string, unknown[]> = { cookOpen: ["a", "b"], recipeOther: ["sr-Latn", "en"], cookOther: ["sr-Latn", "en"], plateFills: ["Dinner", "700"], secondDish: ["a", 5, "b", "Dinner"], scanWhileCooking: ["a", "b"], useInCook: ["a", "b"], carryNow: [5], didTryWork: ["side"], plateOldAte: [new Date(), () => "x"], plateOldBeforeCook: [new Date(), () => "x"], plateSaveOrClear: [2, new Date(), "x"], photoWhose: ["A photo."], plateAddOrNew: [2, "", "x"], plateAddPhoto: [2, "t", "x"], busyMeal: ["Lunch", "12:30", "b", "Sunday"], busyLate: ["18:30", "Dinner", "19:00", 30, "dinner"], busyLateAhead: ["18:30", "Dinner", "19:00", 30, "dinner", "Saturday"], busyCarry: ["b", "lunch"], busyTraining: ["12:30", "b", "Sunday"], resume: ["d", ""], howManyAte: ["4"] };
  for (const [k, f] of Object.entries(SR_SLOTS)) {
    if (k === "didTryWork") continue; // a choice of two lines, not a slot
    assert.deepEqual(Object.keys(f!(...dummy[k])).sort(), [...(SR_ALLOWED[k as keyof typeof CHEF] ?? [])].sort(), k);
  }
  for (const k of SR_LATER) assert.ok(SR_ALLOWED[k], `${k} has its slots named`);
});

test("a slot problem is said plainly", () => {
  assert.deepEqual(slotProblems("useInCook", "{food}: šta menja?"), ["{dish} is missing"]);
  assert.deepEqual(slotProblems("whatMoment", "Kakav je {trenutak}?"), ["{trenutak} is not a slot here"]);
  assert.deepEqual(slotProblems("useInCook", "U {dish}: {food}?"), [], "the slots move anywhere in the sentence");
  assert.deepEqual(slotProblems("didTryWork", "Da li je zamena uspela?"), ["Two lines are needed, split by |"]);
});

test("an unticked line stays English; English stays the default", () => {
  for (const [k, l] of Object.entries(sr.chef)) if (!l.checked) assert.equal(srLine(k as keyof typeof CHEF, ["a", "b"]), null, k);
  assert.equal(say("whatMoment"), CHEF.whatMoment());
});

test("Serbian counts and filling", () => {
  assert.equal(srCount(1, "minut", "minuta", "minuta"), "1 minut");
  assert.equal(srCount(3, "namirnica", "namirnice", "namirnica"), "3 namirnice");
  assert.equal(srCount(12, "namirnica", "namirnice", "namirnica"), "12 namirnica");
  assert.equal(srCount(21, "minut", "minuta", "minuta"), "21 minut");
  assert.equal(fill("U {dish} ide {food}", { dish: "palačinke", food: "jaje" }), "U palačinke ide jaje");
});

test("cook mode hears Serbian words", async () => {
  const { parseCommand } = await import("./cook");
  assert.equal(parseCommand("dalje").kind, "next");
  assert.equal(parseCommand("sledeći korak").kind, "next");
  assert.equal(parseCommand("nazad").kind, "back");
  assert.equal(parseCommand("ponovi").kind, "repeat");
  assert.equal(parseCommand("stani").kind, "stop");
  const k = parseCommand("koliko brašna") as { kind: string; food?: string };
  assert.equal(k.kind, "howMuch"); assert.equal(k.food, "brašna");
  const q = parseCommand("kuvaru, da li mogu bez jaja") as { kind: string; question?: string };
  assert.equal(q.kind, "ask"); assert.equal(q.question, "da li mogu bez jaja");
  assert.equal(parseCommand("next").kind, "next", "English still works");
});

test("a ticked line shows in Serbian when Srpski is chosen; its slots filled", async () => {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
  const { setLang } = await import("./lang");
  const { fixedLine } = await import("./safety");
  const keep = { u: { ...sr.chef.useInCook }, w: { ...sr.chef.whatMoment }, e: { ...sr.safety.eating }, d: { ...sr.safety.diabetes } };
  try {
    sr.chef.useInCook.checked = true; sr.chef.whatMoment.checked = true; sr.safety.eating.checked = true;
    sr.safety.diabetes.checked = false; // 0.3.81: Milan ticks lines in the table; the test sets its own ticks
    assert.equal(say("useInCook", "Jaje", "palačinke"), CHEF.useInCook("Jaje", "palačinke"), "English while English is chosen");
    setLang("sr-Latn");
    assert.equal(say("useInCook", "Jaje", "palačinke"), fill(sr.chef.useInCook.text, { food: "Jaje", dish: "palačinke" }));
    assert.equal(say("whatMoment"), sr.chef.whatMoment.text);
    assert.equal(fixedLine("eating"), sr.safety.eating.text.split("|")[0], "a ticked safety line in Serbian, his form with no profile");
    // 0.3.91: the safety lines with two forms follow the profile's sex, as the screen lines do
    localStorage.setItem("chefmealan-personal", JSON.stringify({ sex: "female" }));
    assert.equal(fixedLine("eating"), sr.safety.eating.text.split("|")[1], "her form");
    assert.ok(/si mi to rekla/.test(fixedLine("eating")) && /si navela/.test(fixedLine("allergies")) || !sr.safety.allergies.checked, "rekla, navela");
    localStorage.removeItem("chefmealan-personal");
    assert.equal(fixedLine("diabetes"), FIXED.diabetes, "an unticked safety line stays English");
    sr.chef.photoWhose.checked = true;
    // DT258 (0.3.112): no line waits for the screens any more; a ticked one is in Srpski, its slot filled
    assert.equal(say("photoWhose", "Read from the photo."), "Read from the photo. Čiji je ovo tanjir, i kada?", "a ticked line in Srpski");
    sr.chef.photoWhose.checked = false;
  } finally {
    setLang("en"); Object.assign(sr.chef.useInCook, keep.u); Object.assign(sr.chef.whatMoment, keep.w); Object.assign(sr.safety.eating, keep.e); Object.assign(sr.safety.diabetes, keep.d);
  }
});

test("screens: every English line has its Serbian draft, and each draft fits its slots and forms", async () => {
  const en = (await import("./i18n/en.json", { with: { type: "json" } })).default as Record<string, unknown>;
  const { screenProblems } = await import("./words");
  const scr = (srLines as unknown as { screens: Record<string, { text: string; checked: boolean }> }).screens;
  assert.deepEqual(Object.keys(scr).sort(), Object.keys(en).sort());
  for (const [k, l] of Object.entries(scr)) assert.deepEqual(screenProblems(k, l.text), [], `${k}: ${l.text}`);
});

test("screens: a ticked line shows in Srpski; a value without its Serbian keeps the line English; numbers follow", async () => {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
  const { setLang } = await import("./lang");
  const { w, wn, dec, mealV } = await import("./words");
  const { agoIn } = await import("./cooking");
  const scr = (srLines as unknown as { screens: Record<string, { text: string; checked: boolean }> }).screens;
  const keep = JSON.parse(JSON.stringify(scr));
  try {
    // 0.3.81: the test sets its own ticks; Milan's are in the file
    for (const k of ["plate.ateIt", "meal.dinner", "ago.hours"]) scr[k].checked = false;
    assert.equal(w("plate.ateIt"), "Ate it");
    setLang("sr-Latn");
    assert.equal(w("plate.ateIt"), "Ate it", "unticked: English");
    assert.equal(dec(5.53, 1), "5,5");
    scr["plate.ateIt"].checked = true; scr["plate.seeAll"].checked = true; scr["plate.byClock"].checked = true;
    assert.equal(w("plate.ateIt"), "Pojeo sam");
    store["chefmealan-personal"] = JSON.stringify({ sex: "female" });
    assert.equal(w("plate.ateIt"), "Pojela sam", "she: the second form");
    assert.equal(wn("plate.seeAll", 3), "Pogledaj sve 3 namirnice");
    assert.equal(wn("plate.seeAll", 20), "Pogledaj svih 20 namirnica");
    assert.equal(w("plate.byClock", { meal: mealV("Dinner"), time: "20:00" }), "Dinner, 20:00 by the clock", "the meal's word not ticked: the line stays English");
    scr["meal.dinner"].checked = true;
    assert.equal(w("plate.byClock", { meal: mealV("Dinner"), time: "20:00" }), "Večera, 20:00 po satu");
    scr["ago.hours"].checked = true;
    assert.equal(agoIn("sr-Latn", new Date(Date.now() - 3 * 3600000)), "pre 3 sata");
    assert.equal(agoIn("sr-Latn", new Date(Date.now() - 5 * 3600000)), "pre 5 sati");
  } finally {
    setLang("en"); delete store["chefmealan-personal"]; for (const k of Object.keys(scr)) Object.assign(scr[k], keep[k]);
  }
  assert.equal(dec(5.53, 1), "5.5", "English: a point");
});
