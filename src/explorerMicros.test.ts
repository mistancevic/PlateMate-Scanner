// DT158 and DT159 (0.3.2): Micros against the day, and a member's own page
import { test } from "node:test";
import assert from "node:assert/strict";
import { MICRO_FOODS, MICRO_MEMBERS, MEMBER_PAGES, NRV, microCardOf, microClaims, memberDay, memberRows } from "./explorerMicros";

const card = (id: string) => microCardOf(MICRO_FOODS.find((f) => f.id === id)!);
const page = (id: string) => MEMBER_PAGES.find((m) => m.id === id)!;

test("twelve members, each with a reference intake from Annex XIII", () => {
  assert.equal(MICRO_MEMBERS.length, 12);
  for (const m of MICRO_MEMBERS) assert.ok(NRV[m.id] > 0, m.id);
  assert.equal(NRV.d, 5); assert.equal(NRV.c, 80); assert.equal(NRV.fe, 14);
});

test("spinach: vitamin K for almost four days, more than half the day's folate", () => {
  const c = card("spinach");
  assert.equal(c.share.k, 386);
  assert.equal(c.top[0], "k");
  assert.ok(c.share.fol! > 50);
});

test("salmon: four times the label's vitamin D, and against EFSA 131 %", () => {
  const c = card("salmon");
  assert.equal(c.share.d, 393);
  assert.equal(c.dEfsa, 131);
  assert.ok(c.top.includes("b12"));
});

test("a value the row doesn't report stays not reported", () => {
  const c = card("milk");
  assert.equal(c.amount.k, null); assert.equal(c.share.c, null);
});

test("label claims: 15 % per 100 g, 7.5 % per 100 ml for a drink, high in at twice", () => {
  const pepper = microClaims(MICRO_FOODS.find((f) => f.id === "pepper")!);
  assert.deepEqual(pepper.find((x) => x.id === "c"), { id: "c", name: "Vitamin C", high: true });
  const milk = microClaims(MICRO_FOODS.find((f) => f.id === "milk")!);
  // calcium 126 mg per 100 ml is 15.75 % of 800: a drink needs 7.5 %, so high in at 15 %
  assert.equal(milk.find((x) => x.id === "ca")?.high, true);
  // as a solid the same 15.75 % would only be a source
  assert.equal(microClaims({ v: MICRO_FOODS.find((f) => f.id === "milk")!.v }).find((x) => x.id === "ca")?.high, false);
});

test("Vitamin D page: one portion against EFSA's 15 µg", () => {
  const rows = memberRows(page("d"), memberDay(page("d")).v);
  assert.deepEqual(rows.map((r) => r.share), [175, 131, 29, 18, 13, 1, 1]);
  assert.equal(page("d").ul?.v, 100);
});

test("Vitamin C page: your day by sex, a man's when the profile doesn't say; no upper limit", () => {
  assert.equal(memberDay(page("c"), "female").v, 95);
  assert.equal(memberDay(page("c"), "male").v, 110);
  assert.equal(memberDay(page("c")).v, 110);
  assert.equal(page("c").ul, null);
  assert.equal(memberRows(page("c"), 110)[0].share, 140);
});

test("the same food is the same row on both pages", () => {
  const pepper = MICRO_FOODS.find((f) => f.id === "pepper")!, milk = MICRO_FOODS.find((f) => f.id === "milk")!;
  assert.equal(page("c").foods[0].per100, pepper.v.c);
  assert.equal(page("d").foods.find((f) => f.name.startsWith("Milk"))!.per100, milk.v.d);
});
