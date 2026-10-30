// DT158 and DT159 (0.3.2): Micros against the day, and a member's own page
import { test } from "node:test";
import assert from "node:assert/strict";
import { MICRO_FOODS, MICRO_MEMBERS, MEMBER_PAGES, NRV, microCardOf, microClaims, memberDay, memberRows } from "./explorerMicros";

const card = (id: string) => microCardOf(MICRO_FOODS.find((f) => f.id === id)!);
const page = (id: string) => MEMBER_PAGES.find((m) => m.id === id)!;

test("eighteen members (DT163), each with a reference intake from Annex XIII", () => {
  assert.equal(MICRO_MEMBERS.length, 18);
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

test("DT162: vitamin A counted the EFSA way on the cards, the same number as on its page", () => {
  const sp = card("spinach"), a = page("a");
  assert.equal(Math.round(sp.amount.a!), Math.round(memberRows(a, 750).find((r) => r.food.name === "Spinach, raw")!.amount));
  assert.equal(Math.round(sp.amount.a!), 563);
});

test("DT162: A, E and K pages with both names, their values and upper limits", () => {
  assert.deepEqual(["a", "e", "k"].map((id) => [page(id).also, memberDay(page(id), "male").v, memberDay(page(id), "female").v, page(id).ul?.v ?? null]),
    [["retinol; beta-carotene from plants", 750, 650, 3000], ["tocopherol", 13, 11, 300], ["K1 phylloquinone, K2 menaquinone", 70, 70, null]]);
  assert.equal(page("a").does.length, 6); assert.equal(page("e").does.length, 1); assert.equal(page("k").does.length, 2);
  assert.ok(MICRO_MEMBERS.every((m) => m.group === "min" || m.also), "every vitamin has its second name");
});

test("DT163: B1 and B3 follow today's energy, per MJ; without a goal, the label's reference", () => {
  assert.deepEqual(memberDay(page("b1"), "male", 2600), { v: 1.1, who: "energy" });
  assert.deepEqual(memberDay(page("b3"), "female", 2600), { v: 17.4, who: "energy" });
  assert.deepEqual(memberDay(page("b3"), null, null), { v: 16, who: "label" });
  assert.equal(memberDay(page("b6"), "female").v, 1.6);
  assert.equal(page("b7").foods.length, 0); assert.ok(page("b7").gap);
  assert.equal(page("fol").ulFood, false);
  // B3 counted as niacin equivalents: chicken 13.7 mg niacin + 360 mg tryptophan / 60
  assert.equal(page("b3").foods.find((f) => f.name.startsWith("Chicken"))!.per100, 19.7);
});

test("DT165: the five minerals open; their values, limits and foods from the shared table", () => {
  const ids = ["ca", "fe", "mg", "k_", "zn"];
  assert.ok(MICRO_MEMBERS.every((m) => MEMBER_PAGES.some((p) => p.id === m.id)), "every member has its page");
  assert.deepEqual(ids.map((id) => [memberDay(page(id), "male").v, memberDay(page(id), "female").v, page(id).label, page(id).ul?.v ?? null, page(id).does.length]),
    [[950, 950, 800, 2500, 8], [11, 16, 14, null, 7], [350, 300, 375, 250, 10], [3500, 3500, 2000, null, 3], [9.4, 7.5, 10, 25, 18]]);
  assert.deepEqual(memberDay(page("ca"), "female", null, 22), { v: 1000, who: "young" });
  assert.equal(memberDay(page("ca"), "female", null, 45).v, 950);
  assert.equal(page("mg").ulFood, false);
  for (const id of ids) assert.equal(page(id).foods.length, 10, id);
  assert.deepEqual(page("ca").foods.slice(0, 2).map((f) => [f.name, f.per100, f.src]), [["Tofu, firm, set with calcium", 683, "SR Legacy, FDC 172475"], ["Sardines, canned in oil", 382, "SR Legacy, FDC 175139"]]);
  assert.equal(page("mg").foods[0].name, "Pumpkin seeds");
  assert.equal(Math.round(memberRows(page("zn"), 9.4)[0].share), 91);   // beef, 125 g: 8.55 mg
});
