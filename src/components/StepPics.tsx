// DT175a (0.3.18, board Stories123 v2; Coach Milan 30 October 20:16 Go): pictures for each step, Beta. A picture comes from
// the camera or the gallery (a photo while cooking, or one made in ChatGPT or Gemini with the Step Picture Checks prompts);
// who made it is asked, and the checks show before it is kept. Watch the steps plays them, made on the phone from the
// pictures: no video file. Labels sit under a picture, never on it; nothing under 12 px; every button 44 px or more.
import { w, wn, wIn, wordV, type Val, type WordKey } from "../words";
import { ChefLine } from "./ChefLine";
import { say } from "../chefScript";
import { useEffect, useRef, useState } from "react";
import type { Ingredient } from "../pilot";
import { stepParts } from "../steps";
import { tempsIn } from "../units";
import { resizeImageBase64 } from "../utils/image";
import { secondsIn, clock } from "../cook";
import type { StepPic } from "../photos";

// a line of its own as a value in another line, in that line's language (or null, and the whole line stays English)
const lineV = (k: WordKey, v?: Record<string, Val>): Val => (l) => wIn(l, k, v);
const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });
const words = (step: string, items: Ingredient[]) => stepParts(tempsIn(step), items).map((p, j) => ("text" in p ? p.text : <b key={j} className="st-amt">{p.label}</b>));
export const picLabel = (p: StepPic) => (p.by === "ai" ? w("steppics.pictureDrawnByAiBeta") : w("steppics.yourPhoto"));

// DT211 v8 (0.3.53, board Stories158): on the recipe a step shows its photo, from cooking; no + slot. A tap changes or removes it
export function StepPicShown({ pic, k, onOpen, more = 0 }: { pic: StepPic | null; k: number; onOpen: () => void; more?: number }) {
  if (!pic) return null;
  return (
    <div className="rq-step-pic">
      {/* DT276 step 2 (0.3.129): the first picture, and how many more the step has */}
      <button type="button" onClick={onOpen} aria-label={w("steppics.changeOrRemoveThePhoto", { n: k + 1 })}><img src={pic.src} alt="" />{more > 0 && <span className="more">+{more}</span>}</button>
      <small>{pic.by === "ai" ? w("steppics.aiBeta") : w("steppics.yours")}</small>
    </div>
  );
}
// DT281 (0.3.131, board Stories208; Coach Milan 11 November 08:12 to 17:39, Go): photo first. On the recipe page a step's
// photo comes before its words, wide, as in a post: see it, then read what to do. Two or more: 1 of 2 shows the next one.
// A tap on the photo opens the step's photos. A step with no photo shows nothing here, so it reads as it always did.
export function StepPicWide({ pics, k, onOpen }: { pics: StepPic[]; k: number; onOpen: (src: string) => void }) {
  const [n, setN] = useState(0);
  if (!pics.length) return null;
  const i = Math.min(n, pics.length - 1), pic = pics[i];
  return (
    <div className="rq-step-wide">
      <button type="button" className="rq-step-wide-pic" onClick={() => onOpen(pic.src)} aria-label={w("steppics.changeOrRemoveThePhoto", { n: k + 1 })}><img src={pic.src} alt="" /></button>
      {pics.length > 1 && <button type="button" className="rq-step-wide-next" aria-label={w("cookmode.nextPhoto")} onClick={() => setN((i + 1) % pics.length)}>{w("cookmode.picNOf", { k: i + 1, n: pics.length })} ›</button>}
      {pic.by === "ai" && <small className="rq-step-wide-ai">{w("steppics.aiBeta")}</small>}
    </div>
  );
}
// the picture beside a step on the recipe, or the place to add one
export function StepPicSlot({ pic, k, onOpen }: { pic: StepPic | null; k: number; onOpen: () => void }) {
  return (
    <div className="rq-step-pic">
      <button type="button" onClick={onOpen} aria-label={pic ? w("steppics.changeThePictureOf", { n: k + 1 }) : w("steppics.addAPictureTo", { n: k + 1 })}>
        {pic ? <img src={pic.src} alt="" /> : <span className="add">{w("steppics.addPicture")}</span>}
      </button>
      {pic && <small>{pic.by === "ai" ? w("steppics.aiBeta") : w("steppics.yours")}</small>}
    </div>
  );
}

// adding or changing a step's picture: camera or gallery, who made it, the checks, then Keep it
export function StepPicSheet({ k, step, items, pic, onKeep, onRemove, onClose, fromCooks = [], all = [], onFirst }: {
  k: number; step: string; items: Ingredient[]; pic: StepPic | null; fromCooks?: string[];
  // DT276 step 2 (0.3.129): every picture of the step, the first first; Keep it adds a new one, Remove takes the shown one off
  all?: StepPic[]; onFirst?: (src: string) => void;
  onKeep: (p: StepPic) => void; onRemove: (src?: string) => void; onClose: () => void;
}) {
  const [src, setSrc] = useState<string | null>(pic?.src ?? null);
  const [by, setBy] = useState<"me" | "ai" | null>(pic?.by ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const cam = useRef<HTMLInputElement>(null), gal = useRef<HTMLInputElement>(null);
  const take = async (f?: File) => {
    if (!f) return; setBusy(true); setErr("");
    try { const raw = await readFile(f); const small = await resizeImageBase64(raw, 960, 960).catch(() => raw); setSrc(small); if (!pic) setBy(null); }
    catch { setErr(w("steppics.thatPictureDidnTOpen")); } finally { setBusy(false); }
  };
  return (
    <div className="sp-sheet" role="dialog" aria-label={w("steppics.pictureForStep", { n: k + 1 })}>
      <div className="cook-top"><button className="pill pill-small" style={{ height: 44 }} onClick={onClose}>{w("steppics.close")}</button><b className="cook-title">{w("steppics.pictureForStep", { n: k + 1 })}</b><span /></div>
      <small className="sp-step" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45 }}>{words(step, items)}</small>
      {all.length > 1 && <>
        <b>{w("steppics.thisStepsPhotos")}</b>
        <div className="sp-all">{all.map((x, i) => <button key={i} type="button" className={`publish-photo${src === x.src ? " on" : ""}`} aria-pressed={src === x.src} aria-label={w("steppics.photoNOfStep", { k: i + 1, n: k + 1 })} onClick={() => { setSrc(x.src); setBy(x.by); }}><img src={x.src} alt="" /></button>)}</div>
        {src && all.findIndex((x) => x.src === src) > 0 && onFirst && <button className="pill pill-small" style={{ alignSelf: "flex-start", minHeight: 44 }} onClick={() => onFirst(src)}>{w("steppics.makeItFirst")}</button>}
        <small className="muted">{w("steppics.firstPhotoWhy")}</small>
      </>}
      <div className="sp-grid">
        <button className="pill" disabled={busy} onClick={() => cam.current?.click()}>{w("steppics.takeAPhoto")}</button>
        <button className={`pill ${src ? "" : "pill-primary"}`} disabled={busy} onClick={() => gal.current?.click()}>{w("steppics.fromMyGallery")}</button>
      </div>
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void take(f); }} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; void take(f); }} />
      {/* DT211 v8 (0.3.53): the photos taken on this step while cooking it; one can be the step's photo */}
      {fromCooks.length > 0 && <>
        <b>{w("steppics.fromYourCooks")}</b>
        <div className="sp-cooks">{fromCooks.slice(0, 8).map((x, i) => <button key={i} type="button" className={`publish-photo${src === x ? " on" : ""}`} aria-label={w("steppics.photoFromYourCooks", { n: i + 1 })} onClick={() => { setSrc(x); setBy("me"); }}><img src={x} alt="" /></button>)}</div>
      </>}
      {err && <small className="error">{err}</small>}
      {src && <>
        <img className="sp-preview" src={src} alt={w("steppics.thePictureForStep", { n: k + 1 })} />
        <ChefLine text={say("whoMadePhoto")} />
        <div className="sp-grid">
          <button className={`choice ${by === "me" ? "on" : ""}`} aria-pressed={by === "me"} onClick={() => setBy("me")}>{w("steppics.myPhoto")}</button>
          <button className={`choice ${by === "ai" ? "on" : ""}`} aria-pressed={by === "ai"} onClick={() => setBy("ai")}>{w("steppics.drawnByAi")}</button>
        </div>
        <div className="sp-checks">
          <b>{w("steppics.beforeYouKeepIt")}</b>
          <ul>
            <li>{w("steppics.itShowsThisStepAnd")}</li>
            <li>{w("steppics.everyFoodIsFromThe")}</li>
            <li>{w("steppics.meatRawBeforeCookingCooked")}</li>
            <li>{w("steppics.theAmountsLookLikeThe")}</li>
            <li>{w("steppics.aRealCookWouldDo")}</li>
          </ul>
        </div>
        <div className="sp-grid">
          <button className="pill pill-primary" disabled={!by || busy} onClick={() => by && onKeep({ src, by })}>{w("steppics.keepIt")}</button>
          <button className="pill" disabled={busy} onClick={() => gal.current?.click()}>{w("steppics.chooseAnother")}</button>
        </div>
        {!by && <small className="muted">{w("steppics.sayWhoMadeItFirst")}</small>}
        <small className="muted">{w("steppics.drawnByAiSaysSo")}</small>
      </>}
      {pic && (!all.length || all.some((x) => x.src === src)) && <button className="link" style={{ alignSelf: "flex-start", minHeight: 44 }} onClick={() => onRemove(src ?? undefined)}>{w("steppics.removeThisPicture")}</button>}
      <small className="muted">{w("steppics.yourPicturesStayWithYour")}</small>
    </div>
  );
}

// DT276 step 3 (0.3.130, board Stories205; Coach Milan 10 November 22:37, Go): several photos picked at once, each on its
// step, to check before saving. The photos sit on the steps in the order they were taken, one per step from step 1; a tap on
// a photo moves it to another step or to no step. A photo on no step is kept in the recipe's photos while there is room.
// The pictures a step already has stay. Nothing is saved until Save.
export function StepPhotosPlace({ title, steps, items, has, photos, room, onSave, onClose }: {
  title: string; steps: string[]; items: Ingredient[]; has: StepPic[][]; photos: string[]; room: number;
  onSave: (place: (number | null)[]) => void; onClose: () => void;
}) {
  const [place, setPlace] = useState<(number | null)[]>(() => photos.map((_, i) => (i < steps.length ? i : null)));
  const [sel, setSel] = useState<number | null>(null);
  const loose = place.map((k, i) => (k === null ? i : -1)).filter((i) => i >= 0), lost = Math.max(0, loose.length - room);
  const thumb = (i: number) => <button key={i} type="button" className={`publish-photo${sel === i ? " on" : ""}`} aria-pressed={sel === i} aria-label={w("steppics.newPhotoN", { n: i + 1 })} onClick={() => setSel(sel === i ? null : i)}><img src={photos[i]} alt="" /></button>;
  const mover = sel !== null && (
    <div className="spp-move" role="group" aria-label={w("steppics.moveThisPhotoTo")}>
      <b>{w("steppics.moveThisPhotoTo")}</b>
      <div>{steps.map((_, k) => <button key={k} type="button" className={`pill pill-small${place[sel] === k ? " pill-primary" : ""}`} aria-pressed={place[sel] === k} aria-label={w("steppics.stepN", { n: k + 1 })} onClick={() => { setPlace((x) => x.map((y, i) => (i === sel ? k : y))); setSel(null); }}>{k + 1}</button>)}
        <button type="button" className={`pill pill-small${place[sel] === null ? " pill-primary" : ""}`} aria-pressed={place[sel] === null} onClick={() => { setPlace((x) => x.map((y, i) => (i === sel ? null : y))); setSel(null); }}>{w("steppics.noStep")}</button></div>
    </div>);
  return (
    <div className="sp-sheet spp" role="dialog" aria-label={w("steppics.photosOnTheSteps")}>
      <div className="cook-top"><button className="pill pill-small" style={{ height: 44 }} onClick={onClose}>{w("steppics.close")}</button><b className="cook-title">{title}</b><span /></div>
      <b className="spp-title">{w("steppics.photosOnTheSteps")}</b>
      <small className="muted">{w("steppics.placedInOrder")}</small>
      <div className="spp-list">
        {steps.map((t, k) => { const mine = place.map((x, i) => (x === k ? i : -1)).filter((i) => i >= 0); return (
          <div key={k} className="spp-step">
            <div className="spp-head"><span>{k + 1}</span><small>{words(t, items)}</small></div>
            <div className="spp-pics">
              {has[k]?.map((x, i) => <img key={`h${i}`} className="spp-has" src={x.src} alt={w("steppics.alreadyOnStep", { n: k + 1 })} />)}
              {mine.map(thumb)}
              {!has[k]?.length && !mine.length && <small className="muted">{w("steppics.noPictureYet")}</small>}
            </div>
            {sel !== null && place[sel] === k && mover}
          </div>); })}
        <div className="spp-step">
          <b>{w("steppics.onNoStep")}</b>
          <small className="muted">{lost ? w("steppics.recipePhotosFull") : w("steppics.keptInRecipePhotos")}</small>
          <div className="spp-pics">{loose.map(thumb)}</div>
          {sel !== null && place[sel] === null && mover}
        </div>
      </div>
      {/* DT280 (0.3.132): how many are on no step, so none is left there by accident */}
      {loose.length > 0 && <p className="spp-loose">{wn("steppics.onNoStepCount", loose.length, { n: loose.length })}</p>}
      <button className="pill pill-primary pill-wide" onClick={() => onSave(place)}>{w("steppics.saveThePhotos")}</button>
      <button className="link" style={{ alignSelf: "flex-start", minHeight: 44 }} onClick={onClose}>{w("steppics.cancel")}</button>
    </div>
  );
}

// Watch the steps: the step pictures one after another, about 5 seconds each, the words and the timer under the picture
export function StepPlayer({ title, steps, items, pics, onClose, onCook }: {
  title: string; steps: string[]; items: Ingredient[]; pics: StepPic[];
  onClose: () => void; onCook: (() => void) | null;
}) {
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const PER = 5;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((x) => x + 0.25), 250);
    return () => clearInterval(id);
  }, [playing]);
  useEffect(() => {
    if (t < PER) return;
    if (k >= steps.length - 1) { setPlaying(false); setT(PER); return; }
    setK(k + 1); setT(0);
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = (j: number) => { setK(Math.max(0, Math.min(steps.length - 1, j))); setT(0); };
  const sec = secondsIn(steps[k]);
  const elapsed = Math.round(k * PER + Math.min(t, PER));
  return (
    <div className="cook-mode sp-player" role="dialog" aria-label={w("steppics.watchTheStepsOf", { title })}>
      <div className="cook-top">
        <button className="pill pill-small" style={{ height: 44 }} onClick={onClose}>{w("steppics.close")}</button>
        <b className="cook-title">{title}</b>
        <small className="cook-count">{clock(elapsed)}</small>
      </div>
      <div className="cook-steps" role="tablist" aria-label={w("steppics.steps")}>{steps.map((_, j) => (
        <button key={j} role="tab" aria-selected={j === k} aria-label={w("steppics.stepN", { n: j + 1 })} className={`cook-step-btn${j === k ? " on" : ""}`} onClick={() => go(j)}>{j + 1}</button>))}</div>
      <section className="cook-card sp-frame" aria-live="polite">
        <img src={pics[k].src} alt={w("steppics.stepN", { n: k + 1 })} />
        <div className="sp-words">
          <small style={{ fontWeight: 800, color: "var(--muted)", letterSpacing: ".04em" }}>{w("steppics.stepOf", { n: k + 1, of: steps.length, timer: sec ? lineV("steppics.timer", { time: clock(sec) }) : "" })}</small>
          <div className="cook-text">{words(steps[k], items)}</div>
          <small className="muted" style={{ fontSize: 13, fontWeight: 700 }}>{picLabel(pics[k])}</small>
        </div>
      </section>
      <div className="sp-controls">
        <button className="pill" disabled={k === 0} onClick={() => go(k - 1)}>{w("steppics.stepBack", { n: Math.max(1, k) })}</button>
        <button className="pill pill-primary" onClick={() => { if (!playing && k >= steps.length - 1 && t >= PER) { go(0); setPlaying(true); } else setPlaying(!playing); }}>{playing ? w("steppics.pause") : k >= steps.length - 1 && t >= PER ? w("steppics.again") : w("steppics.play")}</button>
        <button className="pill" disabled={k >= steps.length - 1} onClick={() => go(k + 1)}>{w("steppics.stepNext", { n: Math.min(steps.length, k + 2) })}</button>
      </div>
      {onCook && <button className="pill pill-wide" style={{ height: 52 }} onClick={onCook}>{w("steppics.startCooking")}</button>}
      <small className="muted cook-under">{w("steppics.madeOnYourPhoneFrom")}</small>
    </div>
  );
}

// DT254 (0.3.105, board Stories187; Coach Milan 7 November 12:16 to 13:24, Go): the cover is the recipe's video. A recipe whose
// every step has a picture: the page opens and the cover plays the steps once, one picture every 5 seconds, without sound, then
// rests on the cover with ▶ in the middle; a tap on ▶ plays it again. Under the picture, never on it: the steps as a thin bar
// and which step. A tap while it plays opens the player with the words. A phone set to reduce motion does not play by itself.
const calm = () => { try { return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false; } catch { return false; } };
export function CoverVideo({ title, pics, cover, coverAlt, marks, onWords }: {
  title: string; pics: StepPic[]; cover: string; coverAlt: string; marks?: React.ReactNode; onWords: () => void;
}) {
  const PER = 5;
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(() => !calm());
  const [t, setT] = useState(0);
  useEffect(() => { if (!playing) return; const id = setInterval(() => setT((x) => x + 0.25), 250); return () => clearInterval(id); }, [playing]);
  useEffect(() => { if (t < PER) return; if (k >= pics.length - 1) { setPlaying(false); setT(0); setK(0); return; } setK(k + 1); setT(0); }, [t]); // eslint-disable-line react-hooks/exhaustive-deps
  const play = () => { setK(0); setT(0); setPlaying(true); };
  return (
    <div className={`rq-video${playing ? " playing" : ""}`}>
      <figure className="rq-hero rq-hero-video">
        {playing
          ? <button type="button" className="rq-video-pic" onClick={() => { setPlaying(false); setT(0); setK(0); onWords(); }} aria-label={w("recipe.videoTapWords", { title })}><img src={pics[k].src} alt={w("steppics.stepN", { n: k + 1 })} /></button>
          : <button type="button" className="rq-video-pic" onClick={play} aria-label={w("recipe.videoPlay", { title })}><img src={cover} alt={coverAlt} /><span className="watch-play" aria-hidden="true">▶</span></button>}
        {!playing && marks}
      </figure>
      <div className="rq-video-under">
        <div className="rq-video-bar" aria-hidden="true">{pics.map((_, j) => <span key={j} className={j < k || !playing ? "on" : ""} style={playing && j === k ? { background: `linear-gradient(90deg, var(--brand) ${Math.round((t / PER) * 100)}%, var(--line) ${Math.round((t / PER) * 100)}%)` } : undefined} />)}</div>
        {playing
          ? <small className="rq-video-step" aria-live="polite">{w("recipe.videoStepOf", { n: k + 1, of: pics.length })}</small>
          : <div className="rq-video-rest"><button type="button" className="link" onClick={onWords}>{w("recipe.videoWatchWords")}</button><small className="muted">{w("recipe.watchStepsLength", { n: pics.length, seconds: pics.length * PER, ai: pics.some((p) => p.by === "ai") ? wordV("recipe.watchStepsAi") : "" })}</small></div>}
      </div>
    </div>
  );
}
