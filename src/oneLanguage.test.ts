// DT258 (0.3.112, board Stories193; Coach Milan Go 8 November 08:21): Chef Mealan speaks one language. His eight lines that
// waited for the screens now take their words in the phone's language: no English left in a Srpski or German line.
import { test } from "node:test";
import assert from "node:assert/strict";
const ls: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => ls[k] ?? null, setItem: (k: string, v: string) => { ls[k] = v; }, removeItem: (k: string) => { delete ls[k]; } };
const { inLang } = await import("./lang");
const { say, dayIn, mealAcc } = await import("./chefScript");

const lines = () => [
  say("photoWhose", "Fotografija od danas, u 12:40."),
  say("plateAddOrNew", 1, "", "Skyr."), say("plateAddPhoto", 2, "Doručak", "Skyr."),
  say("busyMeal", "Lunch", "12:30", "12:00 do 14:00", "Sunday"), say("busyLate", "18:30", "Dinner", "19:00", 0, "dinner"),
  say("busyLateAhead", "18:30", "Dinner", "19:00", 30, "dinner", "Saturday"), say("busyCarry", "12:00 do 14:00", "lunch"),
  say("busyTraining", "12:30", "12:00 do 14:00", "Wednesday"), say("resume", "Pancake", ""), say("howManyAte", "4"),
];
const ENGLISH = /\b(Your plate|Whose|Busy|Booked|Move it|Training at|You were|You made|How many|Lunch|Dinner|Sunday|Saturday|Wednesday|minutes)\b/;

test("the eight lines carry no English in Srpski or German", () => {
  for (const l of ["sr-Latn", "de"] as const) for (const x of inLang(l, lines)) assert.doesNotMatch(x, ENGLISH, `${l}: ${x}`);
});

test("Srpski: the words take the form the sentence needs, and her form", () => {
  ls["chefmealan-personal"] = JSON.stringify({ sex: "male" });
  const he = inLang("sr-Latn", lines);
  assert.equal(he[1], "Tvoj tanjir već ima 1 namirnicu. Skyr. Da počneš nov tanjir s tim, ili da ga dodaš svom?");
  assert.equal(he[5], "Zauzet si do 18:30. Večera u 19:00 ostavlja 30 minuta za kuvanje. Nešto brzo za večeru, ili da skuvaš u subotu i podgreješ?");
  assert.equal(he[3], "Ručak u 12:30 pada u zauzet blok, 12:00 do 14:00. Da ga pomerim za nedelju?");
  assert.equal(he[8], "Kuvanje: Pancake. Da nastaviš gde si stao?");
  ls["chefmealan-personal"] = JSON.stringify({ sex: "female" });
  const she = inLang("sr-Latn", lines);
  assert.equal(she[9], "Napravila si 4. Koliko si pojela?");
  assert.match(she[6], /^Zauzeta si od 12:00 do 14:00\. Da poneseš ručak\?$/);
  assert.equal(dayIn("sr-Latn", "Monday"), "ponedeljak");
  assert.equal(mealAcc("sr-Latn", "Pre treninga"), "pre treninga", "a name of your own keeps its words, small in the middle of a sentence as in English");
});

test("German: no colon without a plate name, keine Zeit, and the cook ahead", () => {
  const de = inLang("de", lines);
  assert.equal(de[1], "Dein Teller hat schon 1 Lebensmittel. Skyr. Einen neuen Teller damit beginnen oder zu deinem hinzufügen?");
  assert.match(de[4], /lässt dir keine Zeit zum Kochen\. Etwas Schnelles zum Abendessen\?$/);
  assert.match(de[5], /oder am Samstag kochen und aufwärmen\?$/);
  assert.equal(de[8], "Du hast Pancake gekocht. Da weitermachen, wo du aufgehört hast?");
});

test("English stays as it was", () => {
  const en = inLang("en", lines);
  assert.equal(en[5], "Busy until 18:30. Dinner at 19:00 leaves 30 minutes to cook. A quick dinner, or cook on Saturday and warm it up?");
  assert.equal(en[2], "Your plate already has 2 foods: Doručak. Skyr. Add them to yours, or start a new plate with them?");
});
