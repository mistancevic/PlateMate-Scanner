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
  const dummy: Record<string, unknown[]> = { scanWhileCooking: ["a", "b"], useInCook: ["a", "b"], carryNow: [5], didTryWork: ["side"] };
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
  const keep = { u: { ...sr.chef.useInCook }, w: { ...sr.chef.whatMoment }, e: { ...sr.safety.eating } };
  try {
    sr.chef.useInCook.checked = true; sr.chef.whatMoment.checked = true; sr.safety.eating.checked = true;
    assert.equal(say("useInCook", "Jaje", "palačinke"), CHEF.useInCook("Jaje", "palačinke"), "English while English is chosen");
    setLang("sr-Latn");
    assert.equal(say("useInCook", "Jaje", "palačinke"), fill(sr.chef.useInCook.text, { food: "Jaje", dish: "palačinke" }));
    assert.equal(say("whatMoment"), sr.chef.whatMoment.text);
    assert.equal(fixedLine("eating"), sr.safety.eating.text, "a ticked safety line in Serbian");
    assert.equal(fixedLine("diabetes"), FIXED.diabetes, "an unticked safety line stays English");
    sr.chef.photoWhose.checked = true;
    assert.equal(say("photoWhose", "Read from the photo."), CHEF.photoWhose("Read from the photo."), "a line waiting for the screens stays English even ticked");
    sr.chef.photoWhose.checked = false;
  } finally {
    setLang("en"); Object.assign(sr.chef.useInCook, keep.u); Object.assign(sr.chef.whatMoment, keep.w); Object.assign(sr.safety.eating, keep.e);
  }
});
