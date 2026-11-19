// Chef Mealan's own checks about a photo's read (DT318, 0.3.160, board DT318; Go 19 November 01:00): the few questions he
// has about an amount or about what a food is, with their answers and Skip. They stand under the chips on the read and,
// as before, on the Plate's screen: a check not answered on the read goes along to the Plate.
// New with DT318: a food is settled in two checks. First what it is (he suggests similar foods, as before). Then, for a
// type whose kinds differ, which one: real foods of that kind by their full name, your own first, then members' foods,
// then the app's basic foods. An answer that would be a guess says estimate.
// A plain function the Plate screen and the read call while they draw; all state stays in the Plate screen.
import type { Dispatch, SetStateAction } from "react";
import { w } from "../words";
import { foodOfRead } from "../mealPhoto";
import { foodName, REFERENCE, referenceFood } from "../reference";
import { basicOf } from "../foodId";
import { kindOf } from "../swap";
import { asMine, type MemberFood } from "../memberFoods";
import type { Food, Ingredient, PilotState } from "../pilot";

export type WhichOne = { itemId: string; kind: string; options: { food: Food; from: "yours" | "member" | "basic" }[] };
export type PlateChecksIn = {
  items: Ingredient[];
  memberFoods: (q: string) => Promise<MemberFood[]>;
  region: string | null | undefined;
  setState: Dispatch<SetStateAction<PilotState>>;
  state: PilotState;
  uid: () => string;
  updateItem: (id: string, patch: Partial<Ingredient>) => void;
};
const same = (a: string | undefined, b: string | undefined) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
// a real food: of your list (not a guess from a photo) or of the app's basic foods
const isGuess = (f: Food) => f.source === "estimate" || f.brand === "estimate";
// would this answer land as a real food, by its name?
export const answerIsReal = (name: string, library: Food[]) => library.some((x) => !isGuess(x) && (same(x.name, name) || (x.aliases ?? []).some((a) => same(a, name)))) || !!basicOf({ name });
// the same kind, by a word of the name: yogurt in Yogurt, 10% fat, in Greek yogurt, 2 % and in a brand's yogurt. The kind's
// word is the first word of the food's name without its state, in English and in the language shown.
const fold = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const wordsOf = (x: string) => fold(x).replace(/[(),.%\d]/g, " ").split(/\s+/).filter(Boolean);
export const kinWords = (f: Pick<Food, "name" | "aliases">, shown?: string) => new Set([kindOf(f.name), ...(f.aliases ?? []).map(kindOf), ...(shown ? [kindOf(shown)] : [])].filter((k) => k.length > 2));
export const isKin = (kin: Set<string>, c: { name: string; aliases?: string[] }) => [c.name, ...(c.aliases ?? [])].some((n) => wordsOf(n).some((x) => kin.has(x)));
// the foods of the same kind as this one: yours first, then the app's basic foods; at most four, each name once
export function kindOptions(food: Food, library: Food[], region: string | null | undefined, uid: () => string): WhichOne["options"] {
  const out: WhichOne["options"] = [], seen = new Set<string>(), kin = kinWords(food, foodName(food));
  const add = (f: Food, from: WhichOne["options"][number]["from"]) => { const k = f.name.toLowerCase(); if (seen.has(k) || out.length >= 4) return; seen.add(k); out.push({ food: f, from }); };
  for (const f of library) if (!isGuess(f) && !f.refId && isKin(kin, f)) add(f, "yours");
  for (const f of library) if (!isGuess(f) && f.refId && isKin(kin, f)) add(f, "basic");
  for (const r of REFERENCE) if (!library.some((x) => x.refId === r.id)) { const rf = referenceFood(r, region, uid); if (isKin(kin, rf)) add(rf, "basic"); }
  return out;
}

export function plateChecks(given: PlateChecksIn) {
  const { items, memberFoods, region, setState, state, uid, updateItem } = given;
  const ph = state.photo;
  if (!ph) return null;
  const unmark = (s: PilotState): PilotState => (s.photo?.did ? { ...s, photo: { ...s.photo, did: { ...s.photo.did, fresh: [], changed: [] } } } : s);
  // ---- what is it: a food whose kind the read could not tell; a tap changes the food, its grams stay
  const wh = ph.which && items.some((i) => same(i.food.name, ph.which!.name)) ? ph.which : null;
  const whichEl = wh ? (() => {
    const it = items.find((i) => same(i.food.name, wh.name))!;
    const pick = (o: typeof wh.options[number] | null) => {
      if (!o) { setState((st) => unmark({ ...st, photo: st.photo ? { ...st.photo, which: null } : st.photo })); return; }
      const keepIt = same(o.name, it.food.name);
      const got = keepIt ? { food: it.food, fresh: false } : foodOfRead({ name: o.name, grams: it.grams, low: it.est?.low ?? it.grams, high: it.est?.high ?? it.grams, calories: o.calories, protein: o.protein, fats: o.fats, carbs: o.carbs, fiber: o.fiber, confidence: "medium" }, state.foods, region, uid);
      const options = kindOptions(got.food, state.foods, region, uid);
      // which one follows only for a type whose kinds differ: at least two real foods of that kind
      const one: WhichOne | null = options.length >= 2 ? { itemId: it.id, kind: o.name.split(",")[0].toLowerCase(), options } : null;
      setState((st) => unmark({ ...st, foods: got.fresh && !st.foods.some((f) => f.id === got.food.id) ? [...st.foods, got.food] : st.foods, items: st.items.map((x) => (x.id === it.id ? { ...x, food: got.food, checked: true } : x)), portion: null, photo: st.photo ? { ...st.photo, which: null, whichOne: one } : st.photo }));
      // members' foods of that kind join the answers when they arrive, after yours and before the basic foods
      void memberFoods(o.name.split(",")[0]).then((ms) => {
        const kin = kinWords(got.food, foodName(got.food)); const more = ms.filter((m) => isKin(kin, m)).slice(0, 2).map((m) => ({ food: { ...asMine(m, uid), id: `mf:${m.key}` } as Food, from: "member" as const }));
        if (!more.length) return;
        setState((st) => { const cur = st.photo?.whichOne; if (!cur || cur.itemId !== it.id) return st;
          const yours = cur.options.filter((x) => x.from === "yours"), rest = cur.options.filter((x) => x.from !== "yours" && x.from !== "member");
          const all = [...yours, ...more.filter((m) => !cur.options.some((x) => same(x.food.name, m.food.name))), ...rest].slice(0, 4);
          return { ...st, photo: { ...st.photo!, whichOne: { ...cur, options: all } } }; });
      }).catch(() => {});
    };
    return (
      <div className="mp-ask mp-which" role="group" aria-label={w("make.oneThingTheReadCannot")}>
        <small><b>{w("plate.oneThingCannotTell")}</b> {wh.question}</small>
        <div className="button-row mp-which-opts">
          {wh.options.map((o) => <button key={o.name} type="button" className={`choice${same(o.name, it.food.name) ? " on" : ""}`} onClick={() => pick(o)}>{o.name.split(",")[0]}{answerIsReal(o.name, state.foods) ? "" : ` · ${w("plate.estimate")}`}</button>)}
          <button type="button" className="pill pill-small pill-action" onClick={() => pick(null)}>{w("make.skip")}</button>
        </div>
        <small className="muted">{w("make.aTapChangesTheFood")}</small>
      </div>
    );
  })() : null;
  // ---- which one: real foods of that kind that differ; a tap takes that food, with its label and all its values
  const one = !wh && ph.whichOne && items.some((i) => i.id === ph.whichOne!.itemId) ? ph.whichOne : null;
  const oneEl = one ? (() => {
    const it = items.find((i) => i.id === one.itemId)!;
    const pick = (o: WhichOne["options"][number] | null) => {
      if (!o) { setState((st) => unmark({ ...st, photo: st.photo ? { ...st.photo, whichOne: null } : st.photo })); return; }
      const joins = !state.foods.some((f) => f.id === o.food.id), mine = joins ? { ...o.food, id: uid(), reviewedAt: new Date().toISOString() } : o.food;
      setState((st) => unmark({ ...st, foods: joins ? [mine, ...st.foods] : st.foods, items: st.items.map((x) => (x.id === it.id ? { ...x, food: mine, checked: true } : x)), portion: null, photo: st.photo ? { ...st.photo, whichOne: null } : st.photo }));
    };
    return (
      <div className="mp-ask mp-which mp-which-one" role="group" aria-label={w("plate.whichOneAria")}>
        <small><b>{w("plate.oneThingCannotTell")}</b> {w("plate.whichOneIs", { food: one.kind })}</small>
        <div className="button-row mp-which-opts">
          {one.options.map((o) => <button key={o.food.id} type="button" className={`choice${o.food.id === it.food.id ? " on" : ""}`} onClick={() => pick(o)}>{foodName(o.food)}{o.from === "yours" ? ` · ${w("plate.yoursLow")}` : ""}</button>)}
          <button type="button" className="pill pill-small pill-action" onClick={() => pick(null)}>{w("make.skip")}</button>
        </div>
      </div>
    );
  })() : null;
  // ---- how much: one amount the read is least sure about, with two amounts a person can tell apart by eye
  const un = ph.unsure && items.some((i) => same(i.food.name, ph.unsure!.name) && i.est) ? ph.unsure : null;
  const unsureEl = un ? (() => {
    const it = items.find((i) => same(i.food.name, un.name))!;
    const pick = (g: number | null) => { if (g !== null) updateItem(it.id, { grams: g, est: undefined }); setState((st) => unmark({ ...st, photo: st.photo ? { ...st.photo, unsure: null } : st.photo })); };
    return (
      <div className="mp-ask" role="group" aria-label={w("make.oneThingTheReadIs")}>
        <small><b>{w("plate.oneThingCannotTell")}</b> {w("plate.isTheAbout", { food: it.food.name.split(",")[0].toLowerCase(), a: un.options[0], b: un.options[1] })}</small>
        <div className="button-row">
          <button type="button" className="choice" onClick={() => pick(un.options[0])}>~{un.options[0]} g</button>
          <button type="button" className="choice" onClick={() => pick(un.options[1])}>~{un.options[1]} g</button>
          <button type="button" className="pill pill-small pill-action" onClick={() => pick(null)}>{w("make.skip")}</button>
        </div>
      </div>
    );
  })() : null;
  if (!whichEl && !oneEl && !unsureEl) return null;
  return <>{unsureEl}{whichEl}{oneEl}</>;
}
