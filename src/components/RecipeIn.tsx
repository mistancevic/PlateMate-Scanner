import { useState } from "react";
import { X } from "lucide-react";
import type { ReadRecipe } from "../recipeIn";
import { MAX_SHOTS, statedDiffers } from "../recipeIn";
import { fmt, pdText } from "../ui";
import { iconFor } from "../icons";
import { CHEF_NAME } from "./Mark";

// A recipe from screenshots or a link (0.2.16, canvas board IM, IM2, IM2b, IM3, IM7). The plate card gives way to these
// while a recipe comes in; Put it on my plate hands it back to the plate.
export type InFlow =
  | { kind: "shots"; shots: string[]; reading?: boolean }
  | { kind: "link"; url: string; reading?: boolean }
  | { kind: "read"; recipe: ReadRecipe; shots: string[]; url?: string; note?: string }
  | { kind: "error"; code: string; message: string; back: "shots" | "link"; shots: string[]; url: string };

const Thumb = ({ src, n, onRemove }: { src: string; n: number; onRemove?: () => void }) => (
  <span className="in-thumb"><img src={src} alt={`Screenshot ${n}`} />{onRemove && <button type="button" className="in-thumb-x" aria-label={`Remove screenshot ${n}`} onClick={onRemove}><X size={14} /></button>}<small>{n}</small></span>
);

// IM2: the pictures, in the order they are read
export function ShotsCard({ shots, reading, add, remove, read, cancel }: { shots: string[]; reading?: boolean; add: (files: FileList | null) => void; remove: (n: number) => void; read: () => void; cancel: () => void }) {
  return (
    <section className="card plate-card in-card">
      <div className="card-top"><span>A recipe from screenshots</span><button className="link" onClick={cancel}>Cancel</button></div>
      <small className="muted">{shots.length} {shots.length === 1 ? "picture" : "pictures"}, read in this order: the dish, then the ingredients. Up to {MAX_SHOTS}.</small>
      <div className="in-thumbs">
        {shots.map((s, n) => <Thumb key={n} src={s} n={n + 1} onRemove={reading ? undefined : () => remove(n)} />)}
        {shots.length < MAX_SHOTS && !reading && <label className="in-thumb in-add"><span>+ Add</span><input type="file" accept="image/*" multiple onChange={(e) => { add(e.target.files); e.target.value = ""; }} /></label>}
      </div>
      <button className="pill pill-primary pill-wide" disabled={!shots.length || reading} onClick={read}>{reading ? `${CHEF_NAME} is reading…` : shots.length === 1 ? "Read it" : "Read them"}</button>
      <small className="muted">{CHEF_NAME} reads the foods, the amounts and where the recipe came from. The pictures stay with the recipe, for you only.</small>
    </section>
  );
}

// IM2b: a recipe page's address
export function LinkCard({ url, reading, setUrl, read, cancel }: { url: string; reading?: boolean; setUrl: (v: string) => void; read: () => void; cancel: () => void }) {
  return (
    <section className="card plate-card in-card">
      <div className="card-top"><span>A recipe from a link</span><button className="link" onClick={cancel}>Cancel</button></div>
      <input className="search" type="url" inputMode="url" aria-label="Link to a recipe" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} disabled={reading} />
      <button className="pill pill-primary pill-wide" disabled={!/^https?:\/\/\S+\.\S+/i.test(url.trim()) || reading} onClick={read}>{reading ? `${CHEF_NAME} is reading…` : "Read it"}</button>
      <small className="muted">A recipe page from a website. Instagram and TikTok links need a login, so they don't open for us: use Screenshot there.</small>
      <small className="muted">The link stays with the recipe, so you can always go back to the original.</small>
    </section>
  );
}

// IM3: what Chef Mealan read. Every line says where its amount came from; how many it makes can be changed.
export function ReadCard({ flow, setSource, setServings, toggle, put, again, cancel }: {
  flow: Extract<InFlow, { kind: "read" }>; setSource: (v: string) => void; setServings: (n: number) => void; toggle: (k: number) => void; put: () => void; again: () => void; cancel: () => void;
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
  return (
    <section className="card plate-card in-card">
      <div className="card-top"><span>{r.title}</span><button className="link" onClick={cancel}>Cancel</button></div>
      {editing
        ? <input className="search" aria-label="Where it came from" autoFocus value={r.source} placeholder="@account on Instagram, or the site" onChange={(e) => setSource(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={(e) => { if (e.key === "Enter") setEditing(false); }} />
        : <small className="muted">{r.source ? <>From {r.source}, {from}</> : <>Where it came from isn't shown, {from}</>} · <button className="link in-inline" onClick={() => setEditing(true)}>{r.source ? "Change" : "Add it"}</button></small>}
      <div className="in-makes">
        <small className="in-strong">Makes</small>
        <span className="in-stepper"><button type="button" aria-label="One less" onClick={() => setServings(Math.max(1, r.servings - 1))}>−</button><b>{r.servings}</b><button type="button" aria-label="One more" onClick={() => setServings(Math.min(24, r.servings + 1))}>+</button></span>
        <small className="in-strong">{r.servings === 1 ? one : r.servingsUnit}</small>
        <small className="muted">· {r.servingsHow === "recipe" ? "on the recipe" : <span className="in-tag">guessed</span>}</small>
      </div>
      <small className="in-strong in-per">One {one}: {fmt(mine, 0)} kcal · {fmt(allP / r.servings, 0)} g protein · {pdText(pd(all, allP))}</small>
      {st && <small className={`in-stated ${statedDiffers(st, mine) ? "differs" : ""}`}>The recipe says: {fmt(st.kcal, 0)} kcal · {fmt(st.protein, 1)} g protein · {pdText(pd(st.kcal, st.protein))} per {one}.{statedDiffers(st, mine) ? ` Our estimate is ${Math.round(Math.abs(mine - st.kcal) / st.kcal * 100)}% ${mine > st.kcal ? "higher" : "lower"}: the recipe may use other products. The plate uses ours; change any food to match yours.` : " Our estimate agrees."}</small>}
      <div className="rows">
        {r.items.map((i, k) => (
          <div className={`row ${on(i) ? "" : "in-off"}`} key={k}>
            <span className="thumb thumb-sm">{iconFor(i.name)}</span>
            <div className="row-text"><b>{i.name}</b><small>{i.written ? `${i.written} on the recipe` : "no amount on the recipe"}{i.how !== "recipe" && <> · <span className="in-tag">{i.how}</span></>}{i.optional && <> · <span className="in-tag in-opt">optional</span> <button className="link in-inline" onClick={() => toggle(k)}>{on(i) ? "Leave it out" : "Add it"}</button></>}</small></div>
            <b className="row-num">{fmt(i.grams, 0)} g</b>
          </div>
        ))}
      </div>
      {flow.note && <small className="in-note">{flow.note}</small>}
      <small className="muted">The whole recipe: {fmt(all, 0)} kcal · {fmt(allP, 0)} g protein · {pdText(pd(all, allP))}.{left.length ? ` Left out: ${left.length} optional, as the recipe's numbers do; Add it puts one in.` : ""} Values are typical values, marked estimate; tap a food on the plate to check or change it.</small>
      <button className="pill pill-primary pill-wide" onClick={put}>Put it on my plate</button>
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
