// DT339 (0.3.180, board Stories280; Go 23 November 2026, 11:53, option A): a table printed in several languages shows
// the app's own names. Each line is recognised in every language it is printed in, and shown once.
import { test } from "node:test";
import assert from "node:assert/strict";
import { recognise, displayRows, rowsFromRaw } from "./labeltable";
import { appName, shownName, printedUnder } from "./labelNames";

// the pack from the onboarding call, every line in Czech, Croatian, Bulgarian and Greek
const PACK: [string, string][] = [
  ["Energetická hodnota/Energetska vrijednost/Енергийна стойност/Ενέργεια", "energy"],
  ["Tuky/Masti/Мазнини/Λιπαρά", "fat"],
  ["z toho nasycené mastné kyseliny/od kojih zasićene masne kiseline/от които наситени мастни киселини/εκ των οποίων κορεσμένα", "saturates"],
  ["Sacharidy/Ugljikohidrati/Въглехидрати/Υδατάνθρακες", "carbohydrate"],
  ["z toho cukry/od kojih šećeri/от които захари/εκ των οποίων σάκχαρα", "sugars"],
  ["Vláknina/Vlakna/Влакнини/Φυτικές ίνες", "fibre"],
  ["Bílkoviny/Bjelančevine/Белтъчини/Πρωτεΐνες", "protein"],
  ["Sůl/Sol/Сол/Αλάτι", "salt"],
  ["Vápník/Kalcij/Калций/Ασβέστιο", "micro:calcium"],
];

test("DT339 AC1: every line of a four-language pack is recognised", () => {
  for (const [name, key] of PACK) assert.equal(recognise(name), key, name);
});

test("DT339: each language on its own", () => {
  const one: [string, string][] = [["Tuky", "fat"], ["Мазнини", "fat"], ["Λιπαρά", "fat"], ["Tłuszcz", "fat"], ["Zsír", "fat"], ["Grăsimi", "fat"], ["Maščobe", "fat"],
    ["Sacharidy", "carbohydrate"], ["Въглехидрати", "carbohydrate"], ["Υδατάνθρακες", "carbohydrate"], ["Węglowodany", "carbohydrate"], ["Szénhidrát", "carbohydrate"],
    ["Bílkoviny", "protein"], ["Bielkoviny", "protein"], ["Белтъчини", "protein"], ["Πρωτεΐνες", "protein"], ["Białko", "protein"], ["Fehérje", "protein"], ["Beljakovine", "protein"],
    ["Sůl", "salt"], ["Soľ", "salt"], ["Сол", "salt"], ["Αλάτι", "salt"], ["Sól", "salt"], ["Só", "salt"], ["Sare", "salt"],
    ["Vláknina", "fibre"], ["Błonnik", "fibre"], ["Φυτικές ίνες", "fibre"], ["Ενέργεια", "energy"], ["Wartość energetyczna", "energy"],
    ["w tym cukry", "sugars"], ["ebből cukrok", "sugars"], ["εκ των οποίων σάκχαρα", "sugars"], ["od tega nasičene maščobe", "saturates"]];
  for (const [name, key] of one) assert.equal(recognise(name), key, name);
});

test("DT339: the lines the app knew before are read as before", () => {
  const old: [string, string][] = [["Energie", "energy"], ["Fett", "fat"], ["davon gesättigte Fettsäuren", "saturates"], ["Kohlenhydrate", "carbohydrate"], ["davon Zucker", "sugars"],
    ["Ballaststoffe", "fibre"], ["Eiweiß", "protein"], ["Salz", "salt"], ["Masti", "fat"], ["Ugljeni hidrati", "carbohydrate"], ["davon einfach ungesättigte Fettsäuren", "mono"], ["Natrium", "sodium"]];
  for (const [name, key] of old) assert.equal(recognise(name), key, name);
});

test("DT339: a short word needs a word end, and a line it does not know stays as printed (AC5)", () => {
  assert.notEqual(recognise("Solubilní vláknina"), "salt");
  assert.ok(recognise("Taurin").startsWith("other:"));
  assert.equal(appName(recognise("Taurin")), null);
  assert.equal(shownName({ key: recognise("Taurin"), name: "Taurin" }), "Taurin");
});

test("DT339: vitamins and minerals by name", () => {
  assert.equal(recognise("Vitamin C"), "micro:vitc");
  assert.equal(recognise("Vitamín B12/Витамин B12/Βιταμίνη B12"), "micro:vitb12");
  assert.equal(recognise("Witamina D"), "micro:vitd");
  assert.equal(appName("micro:vitb12"), "Vitamin B12");
  assert.equal(recognise("Železo/Желязо/Σίδηρος"), "micro:iron");
  assert.equal(appName("micro:calcium"), "Calcium");
});

test("DT339 AC1, AC5: the app's name, the printed one under it only when it differs", () => {
  assert.equal(shownName({ key: "fat", name: "Tuky/Masti/Мазнини/Λιπαρά" }), "Fat");
  assert.equal(printedUnder({ key: "fat", name: "Tuky/Masti/Мазнини/Λιπαρά" }), "Tuky/Masti/Мазнини/Λιπαρά");
  assert.equal(printedUnder({ key: "protein", name: "Protein" }), null);
});

test("DT339 AC2: each line once, the printed amounts", () => {
  const amounts = [520, 28, 9.5, 58, 35, 3, 7, 0.3, 120];
  const table = rowsFromRaw(PACK.map(([name], i) => ({ name, amount: amounts[i], unit: i === 0 ? "kcal" : i === 8 ? "mg" : "g", sub: i === 2 || i === 4 })), "label");
  const rows = displayRows({ table, calories: 520, fats: 28, carbs: 58, fiber: 3, protein: 7 });
  assert.equal(rows.length, 9, rows.map((r) => r.key).join());
  for (const k of ["fat", "carbohydrate", "protein"]) assert.equal(rows.filter((r) => r.key === k).length, 1, k);
  assert.equal(rows.find((r) => r.key === "fat")!.amount, 28);
});

test("DT339 AC6: a pack saved before, with lines it did not know, is read again when shown", () => {
  const table = [{ key: "other:tuky/masti/мазнини/λιπαρά", name: "Tuky/Masti/Мазнини/Λιπαρά", amount: 28, unit: "g" as const, sub: false, source: "label" as const },
    { key: "micro:vápníkkalcijкалцийασβέστιο", name: "Vápník/Kalcij/Калций/Ασβέστιο", amount: 120, unit: "mg" as const, sub: false, source: "label" as const }];
  const rows = displayRows({ table, calories: 520, fats: 28, carbs: 58, fiber: 3, protein: 7 });
  assert.equal(rows.filter((r) => r.key === "fat").length, 1);
  assert.ok(rows.some((r) => r.key === "micro:calcium"));
});
