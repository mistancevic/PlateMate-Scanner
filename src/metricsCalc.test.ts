import { test } from "node:test";
import assert from "node:assert/strict";
import { weekStats, livedByPlan, mondayOf, type Ev } from "./metricsCalc";

const X = { hp: { hp_visit: 214, hp_calc: 61, hp_try: 18 }, asked: 6, joined: 3, flags: { total: 0, answered: 0 }, bills: { ai: 0.41, cloud: 0.83 }, monthActive: 2 };
const open = (m: string, day: string): Ev => ({ m, e: "app_open", day });
const closed = (m: string, day: string, d: Record<string, unknown>): Ev => ({ m, e: "day_closed", day, d });

test("a day is lived by the plan: every planned meal closed, protein at least 90 %, energy within 10 %", () => {
  assert.equal(livedByPlan({ planned: 3, open: 0, kcal: 2100, protein: 170 }, { kcal: 2200, protein: 180 }).lived, true);
  assert.equal(livedByPlan({ planned: 3, open: 1, kcal: 2100, protein: 170 }, { kcal: 2200, protein: 180 }).lived, false, "a meal still open");
  assert.equal(livedByPlan({ planned: 3, open: 0, kcal: 2500, protein: 170 }, { kcal: 2200, protein: 180 }).lived, false, "energy 114 %");
  assert.equal(livedByPlan({ planned: 3, open: 0, kcal: 2100, protein: 150 }, { kcal: 2200, protein: 180 }).lived, false, "protein 83 %");
  assert.equal(livedByPlan({ planned: 0, open: 0, kcal: 2100, protein: 170 }, { kcal: 2200, protein: 180 }).lived, false, "nothing planned");
  assert.equal(livedByPlan({ planned: 3, open: 0, kcal: 2100, protein: 170 }, null).lived, false, "no target, no claim");
});
test("the North Star: days lived by the plan per active member, in the week", () => {
  const from = "2026-10-12";
  const evs = [open("a", "2026-10-12"), open("a", "2026-10-13"), open("a", "2026-10-14"), open("b", "2026-10-13"),
    closed("a", "2026-10-12", { planned: 3, lived: true, byPlan: 3, extras: 0 }), closed("a", "2026-10-13", { planned: 3, lived: true, byPlan: 2, extras: 1, swapped: 1 }),
    closed("a", "2026-10-13", { planned: 3, lived: true, byPlan: 2, extras: 1, swapped: 1 }), // sent twice: counted once
    closed("b", "2026-10-13", { planned: 3, lived: false, byPlan: 1, extras: 1 }), closed("b", "2026-10-05", { planned: 3, lived: true, byPlan: 3 })];
  const s = weekStats(evs, from, X);
  assert.equal(s.active, 2); assert.equal(s.lived, 2); assert.equal(s.northStar, 1);
  assert.equal(s.weeklyActive, 1, "only a opened Today on 3 days");
  assert.equal(s.mealsByPlan, 75, "6 by the plan of 8 eaten");
  assert.equal(s.daysSaved, 1);
  assert.equal(s.cost.perActive, 0.62);
  assert.equal(mondayOf("2026-10-18"), "2026-10-12");
});
test("week-4 retention and the first planned day count the right people", () => {
  const from = "2026-10-12";
  const evs = [open("old", "2026-09-22"), open("old", "2026-10-13"), open("gone", "2026-09-23"),
    open("new", "2026-09-30"), closed("new", "2026-10-02", { planned: 3 }), open("slow", "2026-10-01")];
  const s = weekStats(evs, from, X);
  assert.deepEqual(s.retention, { n: 1, of: 2 }, "old came back, gone did not");
  assert.deepEqual(s.firstPlanned, { n: 1, of: 4 }, "new planned a day within 7 days; old, gone and slow did not");
});
test("what leaves the phone: codes and numbers only, never free text, food names or a health situation", async () => {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
  const { stripped } = await import("./metrics");
  assert.equal(stripped("plate_question", { q: "can I eat nutella", plate: ["Nutella"] }), null, "a question never leaves");
  const s = stripped("safety_flag", { situation: "eating", source: "code", reasons: ["skips meals"] })!;
  assert.deepEqual(s.d, { source: "code" }, "the source only, not the situation");
  const m = stripped("mix_taken", { food: "Nutella", partners: ["Skyr"], kind: "dessert", pd: 6.1, kcal: 320 })!;
  assert.deepEqual(m.d, { kind: "dessert", pd: 6.1, kcal: 320 }, "no food names");
  const d = stripped("day_closed", { date: "2026-10-12", planned: 3, byPlan: 3, extras: 0, swapped: 1, lived: true, proteinPct: 96, energyPct: 104 })!;
  assert.equal(d.d.lived, true); assert.equal(d.d.date, "2026-10-12");
});
test("covers and Members: drawn covers, the ones replaced by a real photo, and what members did (0.2.15)", () => {
  const ev = (e: string, how: string, day = "2026-10-14"): Ev => ({ m: "a", e, day, d: { how } });
  const s = weekStats([open("a", "2026-10-12"), ev("cover", "drawn"), ev("cover", "drawn"), ev("cover", "real"), ev("cover", "drawn", "2026-10-01"),
    ev("members", "open"), ev("members", "open"), ev("members", "make"), ev("members", "keep"), ev("members", "share")], "2026-10-12", X);
  assert.deepEqual(s.covers, { drawn: 2, real: 1 });
  assert.deepEqual(s.members, { open: 2, make: 1, keep: 1, share: 1 });
});

test("BK69: visits from a book address count per book in the way in, and none counts as none", () => {
  const w = weekStats([], "2026-10-19", { ...X, hp: { ...X.hp, book_worthy_numbers: 4, book_worthy_numbers__qr: 3, book_worthy_numbers__li: 1 } }).wayIn;
  assert.deepEqual(w.books, [{ name: "Worthy Numbers", n: 4, by: [{ name: "QR", n: 3 }, { name: "LinkedIn", n: 1 }] }]); assert.equal(w.visits, 214);
  assert.equal(weekStats([], "2026-10-19", X).wayIn.books[0].n, 0);
});
test("BK69: only a known book's address is a book page", async () => {
  const { bookOfPath, bookHit } = await import("./bookPages");
  assert.equal(bookOfPath("/worthy-numbers"), "worthy-numbers"); assert.equal(bookOfPath("/worthy-numbers/"), "worthy-numbers");
  assert.equal(bookOfPath("/book"), null); assert.equal(bookOfPath("/foods"), null); assert.equal(bookOfPath("/worthy-numbers/x"), null);
  assert.equal(bookHit("worthy-numbers"), "book_worthy_numbers");
  // BP70: a link's ending says where the reader came from, from a fixed list only
  const { sourceOf, bookHit: hitOf, BOOK_HITS } = await import("./bookPages");
  assert.equal(sourceOf("?from=qr"), "qr"); assert.equal(sourceOf("?from=li&x=1"), "li");
  assert.equal(sourceOf("?from=spam"), null); assert.equal(sourceOf(""), null);
  assert.equal(hitOf("worthy-numbers", "qr"), "book_worthy_numbers__qr"); assert.ok(BOOK_HITS.includes("book_worthy_numbers__hp"));
});

// SH73 (Milan 23:42): a code lowers Beta spots left by one; the home page QR counts as QR under Home page visits
import { spotsAfterInvite, SHARE_TARGETS, inviteUrl } from "./share";
test("SH73: a code lowers the spots by one, never below 0; no number stays no number", () => {
  assert.equal(spotsAfterInvite(3), 2); assert.equal(spotsAfterInvite(1), 0); assert.equal(spotsAfterInvite(0), 0);
  assert.equal(spotsAfterInvite(null), null); assert.equal(spotsAfterInvite(undefined), null); assert.equal(spotsAfterInvite("3"), null);
});
test("SH73: both QR codes are counted as QR, and an invite opens the home page with the code", () => {
  assert.deepEqual(SHARE_TARGETS.map((t) => t.url), ["https://chefmealan.com/?from=qr", "https://chefmealan.com/worthy-numbers?from=qr"]);
  assert.equal(inviteUrl("K7Q2MX"), "https://chefmealan.com/?code=K7Q2MX");
  assert.equal(weekStats([], "2026-10-19", { ...X, hp: { ...X.hp, hp_qr: 5 } }).wayIn.qr, 5);
  assert.equal(weekStats([], "2026-10-19", X).wayIn.qr, 0);
});
