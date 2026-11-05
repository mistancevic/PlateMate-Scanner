// DT238 (0.3.92, board Stories179; Coach Milan 5 November 11:36, Go): the release check for Deutsch (Beta). Every line of the
// app has its German, every line fits its slots and forms, and the German shows when Deutsch is chosen.
import { test } from "node:test";
import assert from "node:assert/strict";
import enLines from "./i18n/en.json" with { type: "json" };
import deLines from "./i18n/de.json" with { type: "json" };
import { CHEF, slotProblems } from "./chefScript";
import { FIXED } from "./safety";
import { screenProblems } from "./words";

const de = deLines as unknown as { chef: Record<string, { text: string; checked: boolean }>; safety: Record<string, { text: string; checked: boolean }>; screens: Record<string, { text: string; checked: boolean }> };
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };

test("every screen line, every line of his script and every safety line is in the German file", () => {
  assert.deepEqual(Object.keys(de.screens).sort(), Object.keys(enLines).sort());
  assert.deepEqual(Object.keys(de.chef).sort(), Object.keys(CHEF).sort());
  assert.deepEqual(Object.keys(de.safety).sort(), Object.keys(FIXED).sort());
});

test("every German line fits its slots and forms; no dash as punctuation", () => {
  for (const [k, l] of Object.entries(de.screens)) {
    assert.deepEqual(screenProblems(k, l.text, "de"), [], `${k}: ${l.text}`);
    assert.ok(!/[–—]| - /.test(l.text), `${k} has a dash: ${l.text}`);
  }
  for (const [k, l] of Object.entries(de.chef)) assert.deepEqual(slotProblems(k, l.text), [], `${k}: ${l.text}`);
  assert.deepEqual(screenProblems("ago.hours", "vor {n} Stunde|vor {n} Stunden|vor {n} Stunden", "de"), ["Two forms are needed: one|other"]);
});

test("Deutsch: the words, counts, numbers, dates and meal names in German", async () => {
  const { setLang } = await import("./lang");
  const { w, wn, numText, dec, mealName, dateText } = await import("./words");
  setLang("de");
  try {
    assert.equal(w("tab.plate"), "Teller");
    assert.equal(wn("ago.hours", 1), "vor 1 Stunde");
    assert.equal(wn("ago.hours", 3), "vor 3 Stunden");
    assert.equal(numText(2450), "2.450");
    assert.equal(dec(5.53, 1), "5,5");
    assert.equal(mealName("lunch", true), "Mittagessen", "German nouns keep their capital");
    assert.equal(dateText(new Date("2026-11-05T12:00:00"), { weekday: "long" }), "Donnerstag");
    setLang("sr-Latn"); assert.equal(mealName("lunch", true), "ručak", "Srpski as before");
  } finally { setLang("en"); }
  assert.equal(w("tab.plate"), "Plate");
});

test("Deutsch: Chef Mealan's lines and the safety answers", async () => {
  const { setLang } = await import("./lang");
  const { say } = await import("./chefScript");
  const { fixedLine } = await import("./safety");
  setLang("de");
  try {
    assert.equal(say("howTaste"), de.chef.howTaste.text);
    assert.equal(say("carryNow", 30), "Wie ist es dir bekommen? Antworte jetzt oder in 30 Minuten, wenn ich frage.");
    assert.equal(fixedLine("diabetes"), de.safety.diabetes.text);
  } finally { setLang("en"); }
  assert.equal(say("howTaste"), CHEF.howTaste());
});

test("cook mode hears German words", async () => {
  const { parseCommand } = await import("./cook");
  assert.equal(parseCommand("weiter").kind, "next");
  assert.equal(parseCommand("zurück").kind, "back");
  assert.equal(parseCommand("nochmal").kind, "repeat");
  assert.equal(parseCommand("stopp").kind, "stop");
  const q = parseCommand("Koch, geht das ohne Eier?") as { kind: string; question?: string };
  assert.equal(q.kind, "ask"); assert.equal(q.question, "geht das ohne eier");
  const m = parseCommand("wie viel Mehl") as { kind: string; food?: string };
  assert.equal(m.kind, "howMuch"); assert.equal(m.food, "mehl");
  assert.equal(parseCommand("dalje").kind, "next", "Srpski still works");
  assert.equal(parseCommand("next").kind, "next", "English still works");
});
