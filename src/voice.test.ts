// DT248 (0.3.98, board Stories184; Coach Milan 7 November, Go 06:14): voice in the app's language. Cook mode says its own lines
// in the app's language; a step's own words are read in the recipe's language, found by its common words.
import { test } from "node:test";
import assert from "node:assert/strict";
const store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };

test("the language a recipe is written in", async () => {
  const { textLang, langScore } = await import("./lang");
  assert.equal(textLang("Cook the rice in salted water for 12 minutes."), "en");
  assert.equal(textLang("Skuvaj pirinač u slanoj vodi 12 minuta, pa ga ocedi."), "sr-Latn");
  assert.equal(textLang("Den Reis in Salzwasser 12 Minuten kochen und dann abgießen."), "de");
  assert.equal(textLang("200 g"), "en", "no words: English");
  assert.ok(langScore("Sorry, say that again?", "en") > langScore("Sorry, say that again?", "sr-Latn"), "an English line is seen as English");
  assert.equal(langScore("Izvini, ponovi?", "en"), 0);
});

test("cook mode's own lines in the app's language", async () => {
  const { setLang } = await import("./lang");
  const { sayAgain, timeSaid, leftSay } = await import("./cook");
  setLang("de");
  try {
    assert.equal(sayAgain(), "Entschuldige, sag das noch mal?");
    assert.equal(timeSaid(720), "12 Minuten");
    assert.equal(timeSaid(90), "1 Minute 30 Sekunden");
    assert.equal(leftSay(1, ["a", "b"], []).head, "Das ist der letzte Schritt.");
  } finally { setLang("en"); }
  assert.equal(sayAgain(), "Sorry, say that again?");
  assert.equal(timeSaid(60), "1 minute");
  assert.deepEqual(leftSay(0, ["Rinse the rice.", "Cook it."], []), { head: "1 step after this one. Next:", next: "Cook it." });
});
