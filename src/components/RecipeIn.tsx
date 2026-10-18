import { useState } from "react";
import { X } from "lucide-react";
import type { ReadRecipe } from "../recipeIn";
import { MAX_SHOTS, statedDiffers } from "../recipeIn";
import { fmt, pdText } from "../ui";
import { iconFor } from "../icons";
import { CHEF_NAME } from "./Mark";
import { countLabel, type Count } from "../counted";
import { OriginalSteps } from "./StepsView";
import { countedLine } from "../frying";
import { NutritionCard } from "./NutritionCard";
import type { Food } from "../pilot";

// A recipe from screenshots or a link (0.2.16, canvas board IM, IM2, IM2b, IM3, IM7). The plate card gives way to these
// while a recipe comes in; Put it on my plate hands it back to the plate.
export type InFlow =
  | { kind: "shots"; shots: string[]; reading?: boolean }
  | { kind: "link"; url: string; reading?: boolean }
  | { kind: "read"; recipe: ReadRecipe; shots: string[]; url?: string; note?: string; photo?: string }
  | { kind: "error"; code: string; message: string; back: "shots" | "link"; shots: string[]; url: string };

const Thumb = ({ src, n, onRemove }: { src: string; n: number; onRemove?: () => void }) => (
  <span className="in-thumb"><img src={src} alt={`Screenshot ${n}`} />{onRemove && <button type="button" className="in-thumb-x" aria-label={`Remove screenshot ${n}`} onClick={onRemove}><X size={14} /></button>}<small>{n}</small></span>
);

// IM2: the pictures, in the order they are read
// CT (0.2.24): a counted food, the count large, the size and the grams small
export function CountNum({ c, grams }: { c: Count; grams: number }) {
  const l = countLabel(c, grams);
  return <span className="ct-num"><b>{l.main}</b><small>{l.small}</small></span>;
}
// IM23d (0.2.23): a read that takes longer than 20 seconds says so
const SLOW = `This page takes longer than most. ${CHEF_NAME} keeps reading: up to two minutes.`;
export function ShotsCard({ shots, reading, slow, add, remove, read, cancel }: { shots: string[]; reading?: boolean; slow?: boolean; add: (files: FileList | null) => void; remove: (n: number) => void; read: () => void; cancel: () => void }) {
  return (
    <section className="card plate-card in-card">
      <div className="card-top"><span>A recipe from screenshots</span><button className="link" onClick={cancel}>Cancel</button></div>
      <small className="muted">{shots.length} {shots.length === 1 ? "picture" : "pictures"}, read in this order: the dish, then the ingredients. Up to {MAX_SHOTS}.</small>
      <div className="in-thumbs">
        {shots.map((s, n) => <Thumb key={n} src={s} n={n + 1} onRemove={reading ? undefined : () => remove(n)} />)}
        {shots.length < MAX_SHOTS && !reading && <label className="in-thumb in-add"><span>+ Add</span><input type="file" accept="image/*" multiple onChange={(e) => { add(e.target.files); e.target.value = ""; }} /></label>}
      </div>
      <button className="pill pill-primary pill-wide" disabled={!shots.length || reading} onClick={read}>{reading ? `${CHEF_NAME} is reading…` : shots.length === 1 ? "Read it" : "Read them"}</button>
      {reading && slow && <small className="rq-drafting in-slow" role="status">{SLOW.replace("This page takes", shots.length === 1 ? "This picture takes" : "These pictures take")}</small>}
      <small className="muted">{CHEF_NAME} reads the foods, the amounts and where the recipe came from. The pictures stay with the recipe, for you only.</small>
    </section>
  );
}

// IM2b: a recipe page's address
export function LinkCard({ url, reading, slow, setUrl, read, cancel }: { url: string; reading?: boolean; slow?: boolean; setUrl: (v: string) => void; read: () => void; cancel: () => void }) {
  return (
    <section className="card plate-card in-card">
      <div className="card-top"><span>A recipe from a link</span><button className="link" onClick={cancel}>Cancel</button></div>
      <input className="search" type="url" inputMode="url" aria-label="Link to a recipe" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} disabled={reading} />
      <button className="pill pill-primary pill-wide" disabled={!/^https?:\/\/\S+\.\S+/i.test(url.trim()) || reading} onClick={read}>{reading ? `${CHEF_NAME} is reading…` : "Read it"}</button>
      {reading && slow && <small className="rq-drafting in-slow" role="status">{SLOW}</small>}
      <small className="muted">A recipe page from a website. Instagram and TikTok links need a login, so they don't open for us: use Screenshot there.</small>
      <small className="muted">The link stays with the recipe, so you can always go back to the original.</small>
    </section>
  );
}

// IM3: what Chef Mealan read. Every line says where its amount came from; how many it makes can be changed.
export function ReadCard({ flow, setSource, setServings, toggle, put, again, cancel, putLabel, pdRef, fitPd }: {
  flow: Extract<InFlow, { kind: "read" }>; setSource: (v: string) => void; setServings: (n: number) => void; toggle: (k: number) => void; put: () => void; again: () => void; cancel: () => void; putLabel?: string; pdRef?: number | null; fitPd?: (pd: number | null) => string;
}) {
  const r = flow.recipe;
  const [editing, setEditing] = useState(false);
  // optional ingredients stay out of the numbers until added, as the recipe's own numbers leave them out (0.2.17)
  const on = (i: ReadRecipe["items"][number]) => i.on ?? !i.optional;
  const used = r.items.filter(on), left = r.items.filter((i) => !on(i) && i.optional);
  const all = used.reduce((n, i) => n + (i.calories * i.grams) / 100, 0), allP = used.reduce((n, i) => n + (i.protein * i.grams) / 100, 0);
  const pd = (k: number, p: number) => (k > 0 ? (100 * p) / k : null);
  const st = r.stated, mine = all / r.servings;
  const from = flow.url ? "from the link" : `read from your ${flow.shots.length === 1 ? "screenshot" : `${flow.shots.length} screenshots`}`;
  const one = r.servingsUnit.replace(/s$/, "");
  // R16 (0.2.44, board RS15): the foods as the table and the PD block count them; the dish's picture: your first screenshot,
  // else the page's own photo (for you only, never published); a picture that does not load leaves no gap
  const asItems = used.map((i, k) => ({ id: `r${k}`, grams: i.grams, locked: true, ...(i.part ? { part: i.part } : {}), food: { id: `r${k}`, name: i.name, brand: "", basis: "100g", source: "estimate", notes: "", reviewedAt: "", readyToEat: true, calories: i.calories, protein: i.protein, fats: i.fats, carbs: i.carbs, fiber: null } as Food }));
  const picture = flow.shots[0] ?? flow.photo ?? null;
  const [noPicture, setNoPicture] = useState(false);
  const row = (i: ReadRecipe["items"][number], k: number) => (
    <div className={`row ${on(i) ? "" : "in-off"}`} key={k}>
            <span className="thumb thumb-sm">{iconFor(i.name)}</span>
            <div className="row-text"><b>{i.name}</b><small>{i.written ? `${i.written} on the recipe` : "no amount on the recipe"}{i.count ? <> · counted, size {i.count.size}</> : i.fry ? <> · <span className="in-tag in-opt">for frying</span> {countedLine(`${fmt(i.grams, 0)} g`)}</> : i.how !== "recipe" && <> · <span className="in-tag">{i.how}</span></>}{i.optional && <> · <span className="in-tag in-opt">optional</span> <button className="link in-inline" onClick={() => toggle(k)}>{on(i) ? "Leave it out" : "Add it"}</button></>}</small></div>
            {i.count ? <CountNum c={i.count} grams={i.grams} /> : <b className="row-num">{fmt(i.fry ? i.fry.pot : i.grams, 0)} g</b>}
          </div>
  );
  // the recipe's groups, in the order it lists them; a food counts in its group's numbers as it counts in the recipe's
  const groups = r.items.some((i) => i.part) ? r.items.reduce((l, i, k) => {
    const name = i.part || "Other"; let g = l.find((x) => x.part === name);
    if (!g) { g = { part: name, rows: [], kcal: 0, prot: 0 }; l.push(g); }
    g.rows.push({ i, k }); if (on(i)) { g.kcal += (i.calories * i.grams) / 100; g.prot += (i.protein * i.grams) / 100; }
    return l;
  }, [] as { part: string; rows: { i: ReadRecipe["items"][number]; k: number }[]; kcal: number; prot: number }[]) : null;
  return (
    <section className="card plate-card in-card">
      <div className="card-top"><span>{r.title}</span><button className="link" onClick={cancel}>Cancel</button></div>
      {picture && !noPicture && <img className="in-picture" src={picture} alt="" referrerPolicy="no-referrer" onError={() => setNoPicture(true)} />}
      {editing
        ? <input className="search" aria-label="Where it came from" autoFocus value={r.source} placeholder="@account on Instagram, or the site" onChange={(e) => setSource(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={(e) => { if (e.key === "Enter") setEditing(false); }} />
        : <small className="muted">{r.source ? <>From {r.source}, {from}</> : <>Where it came from isn't shown, {from}</>} · <button className="link in-inline" onClick={() => setEditing(true)}>{r.source ? "Change" : "Add it"}</button></small>}
      <div className="in-makes">
        <small className="in-strong">Makes</small>
        <span className="in-stepper"><button type="button" aria-label="One less" onClick={() => setServings(Math.max(1, r.servings - 1))}>−</button><b>{r.servings}</b><button type="button" aria-label="One more" onClick={() => setServings(Math.min(24, r.servings + 1))}>+</button></span>
        <small className="in-strong">{r.servings === 1 ? one : r.servingsUnit}</small>
        <small className="muted">· {r.servingsHow === "recipe" ? "on the recipe" : <span className="in-tag">guessed</span>}</small>
      </div>
      <NutritionCard readoutOnly items={asItems} serves={r.servings} one={one} all={r.servingsUnit} stated={null} pdRef={pdRef ?? null} fitPd={fitPd} />
      {st && <small className={`in-stated ${statedDiffers(st, mine) ? "differs" : ""}`}>The recipe says: {fmt(st.kcal, 0)} kcal · {fmt(st.protein, 1)} g protein · {pdText(pd(st.kcal, st.protein))} per {one}.{statedDiffers(st, mine) ? ` Our estimate is ${Math.round(Math.abs(mine - st.kcal) / st.kcal * 100)}% ${mine > st.kcal ? "higher" : "lower"}: the recipe may use other products. The plate uses ours; change any food to match yours.` : " Our estimate agrees."}</small>}
      {/* R2 (0.2.32, Milan 10:08): the foods under the recipe's own groups, with the plate's part heading; no groups, one list */}
      <div className="rows">
        {groups ? groups.map((g) => (
          <div className="pt-group" key={g.part}>
            <div className="pt-h" aria-label={`Part: ${g.part}`}><span><b>{g.part}</b><small>{g.rows.length} {g.rows.length === 1 ? "food" : "foods"} · {fmt(g.kcal, 0)} kcal{g.kcal > 0 ? ` · ${pdText(pd(g.kcal, g.prot))}` : ""}</small></span></div>
            {g.rows.map(({ i, k }) => row(i, k))}
          </div>
        )) : r.items.map((i, k) => row(i, k))}
      </div>
      {r.items.some((i) => i.fry) && <small className="muted in-fry">The frying oil: the recipe needs the whole pot; the numbers count what the food takes up. That amount is an estimate, 15% of the fried food, from a glazed doughnut's fat (USDA).</small>}
      {/* R6 (0.2.43, board RS14): the Nutrition table after the foods, as on the recipe page, to check what the recipe says */}
      <NutritionCard tableOnly items={asItems} serves={r.servings} one={one} all={r.servingsUnit} stated={null} pdRef={null} />
      {flow.note && <small className="in-note">{flow.note}</small>}
      {/* RP1 (0.2.25, Milan 18:05 and 19:43): the original's steps came with the read, so they show with the foods */}
      <div className="in-steps">
        <b>Steps</b>
        {r.steps?.length ? <><small className="muted">{flow.url ? "As the page writes them" : "As the recipe writes them"}, for the whole recipe.</small><OriginalSteps steps={r.steps} /></>
          : <small className="muted">The {flow.url ? "page" : "screenshot"} shows no steps. {CHEF_NAME} can draft them on the recipe page.</small>}
      </div>
      <small className="muted">The whole recipe: {fmt(all, 0)} kcal · {fmt(allP, 0)} g protein · {pdText(pd(all, allP))}.{left.length ? ` Left out: ${left.length} optional, as the recipe's numbers do; Add it puts one in.` : ""} Values are typical values, marked estimate; tap a food on the plate to check or change it.</small>
      <button className="pill pill-primary pill-wide" onClick={put}>{putLabel ?? "Put it on my plate"}</button>
      <button className="link" style={{ alignSelf: "center" }} onClick={again}>Not right? Read it again</button>
    </section>
  );
}

// IM7: plain answers, each with the next step
export function ErrorCard({ flow, next, cancel }: { flow: Extract<InFlow, { kind: "error" }>; next: (to: "shots" | "link") => void; cancel: () => void }) {
  const title = flow.code === "login" || flow.code === "fetch" ? "This link didn't open for us." : flow.code === "no-recipe" ? "No recipe on this page." : flow.code === "not-recipe" ? "This doesn't look like a recipe." : "That didn't work.";
  const button = flow.code === "login" ? "Use Screenshot" : flow.code === "no-recipe" || flow.code === "fetch" ? "Try a screenshot" : flow.code === "not-recipe" ? "Choose other pictures" : "Try again";
  const to: "shots" | "link" = flow.code === "login" || flow.code === "no-recipe" || flow.code === "fetch" || flow.code === "not-recipe" ? "shots" : flow.back;
  return (
    <section className="card plate-card in-card">
      <div className="card-top"><span>{title}</span><button className="link" onClick={cancel}>Cancel</button></div>
      <small className="muted">{flow.message.replace(/^This link didn't open for us\. |^No recipe on this page\. /, "")}</small>
      <button className="pill pill-small" style={{ alignSelf: "flex-start" }} onClick={() => next(to)}>{button}</button>
    </section>
  );
}
