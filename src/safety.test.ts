import test from "node:test";
import assert from "node:assert/strict";
import { aiState, ageBand, addFlag, allergyHits, blockedByAllergy, goalSignals, takeModelFlag, coachView, EMPTY_SAFETY, FIXED, type Safety } from "./safety";
import { mixTip } from "./mixtip";
import { STARTER_FOODS } from "./starter";

const Y = new Date("2026-10-04");
const byName = (n: string) => STARTER_FOODS.find((f) => f.name === n)!;
// every case has been through the door: it was answered on the day, with none ticked unless a situation is given
const S = (x: Partial<Safety> = {}): Safety => ({ ...EMPTY_SAFETY, declaredAt: "2026-10-04T09:30:00Z", none: !(x.situations && x.situations.length), ...x });

test("case 1: an adult who answered none, the chat is on", () => {
  assert.equal(aiState(S(), 1981, true, Y).on, true);
  assert.equal(aiState(S(), null, false, Y).on, true, "no birth year on the profile is not a minor");
});

test("case 2: signs of disordered eating switch the chat off until a coach confirms; the plate stays", () => {
  const s = addFlag(S(), "eating", "door", Y);
  const off = aiState(s, 1981, true, Y);
  assert.equal(off.on, false); assert.equal(off.blocked, false); assert.match(off.why, /until your coach confirms/);
  const on = aiState({ ...s, aiConfirmedAt: "2026-10-04T10:00:00Z" }, 1981, true, Y);
  assert.equal(on.on, true);
  assert.match(FIXED.eating, /doctor or a therapist/);
});

test("case 3: 17, consents herself, coach attached, coach confirms: on; without the coach's confirmation: off", () => {
  assert.equal(ageBand(2009, Y), "teen");
  const s = S({ consentBodyAt: "2026-10-04T10:00:00Z", consentBy: "self" });
  assert.equal(aiState(s, 2009, true, Y).on, false);
  assert.equal(aiState({ ...s, aiConfirmedAt: "2026-10-04T11:00:00Z" }, 2009, true, Y).on, true);
});

test("case 4: 13, a parent consents, coach attached, confirmed: on; self-consent is not enough under 16", () => {
  assert.equal(ageBand(2013, Y), "young");
  const self = S({ consentBodyAt: "2026-10-04T10:00:00Z", consentBy: "self", aiConfirmedAt: "2026-10-04T11:00:00Z" });
  const r = aiState(self, 2013, true, Y);
  assert.equal(r.on, false); assert.equal(r.needsParent, true); assert.match(r.why, /parent/);
  const parent = { ...self, consentBy: "parent" as const };
  assert.equal(aiState(parent, 2013, true, Y).on, true);
});

test("case 5: a minor with no coach or parent attached never gets the chat; under 13 no account", () => {
  const s = S({ consentBodyAt: "2026-10-04T10:00:00Z", consentBy: "parent", aiConfirmedAt: "2026-10-04T11:00:00Z" });
  assert.equal(aiState(s, 2010, false, Y).on, false);
  assert.equal(ageBand(2015, Y), "child");
  const c = aiState(s, 2015, true, Y);
  assert.equal(c.blocked, true); assert.equal(c.on, false);
});

test("case 6: pregnancy, diabetes and medication change the answer and keep the chat on", () => {
  for (const id of ["pregnancy", "diabetes", "medication"] as const) {
    const s = addFlag(S(), id, "door", Y);
    assert.equal(aiState(s, 1981, true, Y).on, true, `${id}: chat stays on`);
    assert.ok(FIXED[id].length > 40);
  }
  assert.match(FIXED.diabetes, /doses or timing/);
  assert.match(FIXED.pregnancy, /midwife/);
});

test("case 7: a declared allergy blocks the food by name, by label line and by its family, in the pilot's languages", () => {
  const skyr = byName("Skyr, natural"), chicken = byName("Chicken breast, cooked");
  assert.deepEqual(allergyHits(skyr, ["milk"]), ["milk"]);
  assert.deepEqual(allergyHits(chicken, ["milk"]), []);
  const bar = { ...skyr, name: "Protein bar", table: [{ key: "x", name: "Molkenprotein", amount: 20, unit: "g", sub: false }] } as any;
  assert.equal(blockedByAllergy(bar, ["Milch"]), true, "Molke on the label trips a German milk allergy");
  assert.equal(blockedByAllergy(byName("Peanut butter"), ["Erdnuss"]), true);
  assert.equal(blockedByAllergy(byName("Oats"), ["gluten"]), false, "oats are not wheat");
  assert.equal(blockedByAllergy(byName("Wholegrain bread"), ["gluten"]), true);
});

test("case 8: Mix it never offers a partner that trips a declared allergy", () => {
  const t = mixTip(byName("Nutella"), "regular", 6.3, [], STARTER_FOODS, 1200, { allergies: ["milk"] });
  for (const m of t.mixes) for (const p of m.partners) assert.equal(blockedByAllergy(p, ["milk"]), false, `${p.name} offered to someone avoiding milk`);
  assert.equal(t.mixes.length, 0, "sweet wants dairy; with milk out there is no mix, and that is the honest answer");
  const n = mixTip({ ...byName("Rice, cooked"), name: "Instant noodles", calories: 461, protein: 9.8, fats: 20, carbs: 59 }, "regular", 6.3, [], STARTER_FOODS, 1200, { allergies: ["egg"] });
  assert.ok(n.mixes.length >= 1);
  for (const m of n.mixes) for (const p of m.partners) assert.ok(!/egg/i.test(p.name), `${p.name} offered to someone avoiding egg`);
});

test("case 9: the code signals: a custom goal under the resting burn, or a loss over 1 percent a week", () => {
  assert.equal(goalSignals(false, 1200, 1800, 2800, 95).flag, false, "a band goal never flags");
  assert.equal(goalSignals(true, 1200, 1800, 2800, 95).flag, true, "1200 against 1800 at rest");
  assert.equal(goalSignals(true, 1700, 1800, 2800, 95).flag, true, "1,100 kcal a day gap is a kilo a week on 95 kg");
  assert.equal(goalSignals(true, 2300, 1800, 2800, 95).flag, false, "500 a day is within 1 percent");
});

test("case 10, adversarial: a model flag is taken and never shown; the coach sees situation and date only; a repeat flag does not pile up", () => {
  const r = takeModelFlag("Skyr with oats works here.\nFLAG: pregnancy");
  assert.equal(r.flag, "pregnancy"); assert.equal(r.text, "Skyr with oats works here.");
  assert.equal(takeModelFlag("Nothing to flag here, FLAG is just a word").flag, null);
  let s = addFlag(S(), "diabetes", "model", Y); s = addFlag(s, "diabetes", "model", Y);
  assert.equal(s.flags.length, 1); assert.deepEqual(s.situations, ["diabetes"]);
  const v = coachView(s);
  assert.deepEqual(Object.keys(v[0]), ["situation", "at"]); assert.equal(v[0].at, "2026-10-04");
});

test("the door keeps a dated history, only when something changed; pregnancy is not asked of a man", async () => {
  const { recordDeclaration, EMPTY_SAFETY, SITUATION_FOR } = await import("./safety");
  let s = recordDeclaration({ ...EMPTY_SAFETY }, [], ["milk"], new Date("2026-10-04T10:00:00Z"));
  s = recordDeclaration(s, [], ["milk"], new Date("2026-10-05T10:00:00Z"));
  assert.equal(s.declarations!.length, 1, "the same answer again is not a new entry");
  s = recordDeclaration(s, ["eating"], ["milk"], new Date("2026-10-06T10:00:00Z"));
  assert.equal(s.declarations!.length, 2);
  assert.deepEqual(s.declarations![1].situations, ["eating"]);
  assert.equal(SITUATION_FOR.pregnancy, "female");
});

test("an unanswered door is not a no: the chat waits; none applies is an answer, and it ages out after a year", async () => {
  const { aiState, doorAnswered, EMPTY_SAFETY } = await import("./safety");
  const now = new Date("2026-10-04T10:00:00Z");
  const fresh = { ...EMPTY_SAFETY, consentBodyAt: "2026-10-04T09:00:00Z", consentBy: "self" as const };
  assert.equal(doorAnswered(fresh, now), false);
  assert.equal(aiState(fresh, 1981, true, now).on, false);
  assert.ok(/Answer the question/.test(aiState(fresh, 1981, true, now).why));
  const none = { ...fresh, none: true, declaredAt: "2026-10-04T09:30:00Z" };
  assert.equal(doorAnswered(none, now), true);
  assert.equal(aiState(none, 1981, true, now).on, true);
  const old = { ...none, declaredAt: "2025-09-01T09:30:00Z" };
  assert.equal(doorAnswered(old, now), false, "asked again after a year");
  const ticked = { ...fresh, situations: ["diabetes" as const], declaredAt: "2026-10-04T09:30:00Z" };
  assert.equal(aiState(ticked, 1981, true, now).on, true, "a situation that only changes the answer leaves the chat on");
});
