// The Plate's photo screen: the card that asks about a photo before it is read, the warning that your plate is not
// empty, and the two blocks under a photo after the read (what you said, and Help Chef Mealan read it).
// 0.3.156: moved out of JourneyScreen.tsx as it was. platePhotoWaits and platePhotoCard are plain functions the Plate
// screen calls while it draws; the photo, its title and every effect stay in the Plate screen and are handed in.
// PhotoSaid and HelpRead were components of their own before the move and are the same components here.
import { useState, useEffect } from "react";
import { TriangleAlert, Mic } from "lucide-react";
import { w, mealV } from "../words";
import { getLang, speechLang } from "../lang";
import { holdsMore } from "../mealPhoto";
import { PhotoAsk, PotRows, dishWord } from "../components/PhotoAsk";
import type { Ingredient } from "../pilot";
import { thumbnailBase64 } from "../utils/image";
import { slotsOn, slotAt } from "../slots";
import { lifestyleOf } from "../personal";
import { ymd } from "../plan";
import type { AppApi } from "./api";

export function platePhotoWaits(given: { items: Ingredient[]; photoScreen: boolean; plateHas: string }) {
  const { items, photoScreen, plateHas } = given;
  return (
    <>
      {/* B146: your plate is not empty: a warning before the read that a decision comes after it */}
      {photoScreen && items.length > 0 && (
        <div className="warn-box plate-waits" role="note"><TriangleAlert size={20} aria-hidden="true" /><div><b>{w("plate.notEmptyLine")}</b>{w("plate.notEmptyAfter", { plate: plateHas })}</div></div>)}
    </>
  );
}

export function platePhotoCard(given: { p: AppApi; photoTitle: string }) {
  const { p, photoTitle } = given;
  return (
    <section className="card plate-card photo-screen">
      <PhotoAsk key={p.photoAsk!.at + p.photoAsk!.image.length} image={p.photoAsk!.image} at={p.photoAsk!.at} taken={p.photoAsk!.taken} drop={p.dropPhotoAsk} exploring={p.pick === "exploring"}
        mealAt={(d) => { const sl = slotAt(slotsOn(lifestyleOf(p.personal), p.personal.timesOn, ymd(d)), `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`); return sl ? sl.name.toLowerCase() : null; }}
        look={p.lookAtPhoto} read={(x) => { void p.readMealPhoto(p.photoAsk!.image, { ...x, ...(p.photoAsk!.more?.length ? { more: p.photoAsk!.more } : {}), ...(photoTitle.trim() ? { title: photoTitle.trim() } : {}) }); }} />
    </section>
  );
}

// B144 (0.3.150, board Stories225): under the photo, what you chose and what you said stay in view
export function PhotoSaid({ photo, meal }: { photo: NonNullable<import("../pilot").PilotState["photo"]>; meal: string | null }) {
  const how = holdsMore(photo.vessel) && photo.share ? w(photo.share === "portion" ? "photoask.myPortion" : photo.vessel === "tray" ? "photoask.wholeTray" : "photoask.wholePot") : "";
  const what = photo.dish && meal ? w("photo.dishOfMeal", { dish: photo.dish === "main" ? w("photoask.dishMain") : dishWord(photo.dish), meal: mealV(meal, true) }) : "";
  if (!how && !what && !photo.note) return null;
  return (
    <div className="mp-said">
      {(how || what) && <small className="mp-said-top">{[how, what].filter(Boolean).join(" · ")}</small>}
      {photo.note && <small className="muted">{w("photo.youSaid", { words: photo.note })}</small>}
    </div>
  );
}

// DT228 v2 (0.3.63, board Stories168; Coach Milan 2 November 19:50 to 22:00): help Chef Mealan read the meal. The photos (the
// first is the plate's), ＋ Photo for the inside, another side or the menu, and a line in the person's words, typed or said.
// Read it again sends them all; the new read replaces the foods and the corrections, as Read the photo again did.
// B144 (0.3.150, board Stories225): the same form as before the read: how much of a pot is yours, which dish of the meal,
// and what is in it, with the answers given before.
export function HelpRead({ photo, read, incoming, meal }: { photo: NonNullable<import("../pilot").PilotState["photo"]>; read: (more: string[], note: string, pot: { share?: "whole" | "portion"; dish?: import("../served").Dish }) => void; incoming?: { file: File; at: number } | null; meal: string | null }) {
  const [share, setShare] = useState<"whole" | "portion">(() => photo.share ?? "whole");
  const [dish, setDish] = useState<import("../served").Dish>(() => photo.dish ?? "main");
  // 0.3.65 (Coach Milan 22:53, Go): after a read it folds into one link and opens on a tap
  const [open, setOpen] = useState(false);
  const [more, setMore] = useState<string[]>(() => photo.more ?? []);
  const [note, setNote] = useState(() => photo.note ?? "");
  const [hearing, setHearing] = useState(false);
  const S = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const add = (file?: File | null) => { if (!file) return; const r = new FileReader(); r.onload = () => thumbnailBase64(String(r.result), 640).then((d) => setMore((m) => (m.length < 3 ? [...m, d] : m))).catch(() => {}); r.readAsDataURL(file); };
  const listen = () => { if (!S || hearing) return; try { const r = new S(); r.lang = speechLang(getLang()); r.interimResults = false; r.onresult = (e: any) => { const t = String(e.results?.[0]?.[0]?.transcript ?? "").trim(); if (t) setNote((n) => (n ? `${n} ${t}` : t).slice(0, 300)); }; r.onend = () => setHearing(false); r.onerror = () => setHearing(false); setHearing(true); r.start(); } catch { setHearing(false); } };
  // DT230: ＋ Photo under the large photo opens this with that photo in it
  useEffect(() => { if (incoming) { setOpen(true); add(incoming.file); } }, [incoming?.at]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = 1 + more.length, words = note.trim();
  const label = n > 1 ? w(words ? "make.readAgainPhotosThis" : "make.readAgainPhotos", { n }) : w(words ? "make.readAgainThis" : "make.readAgain");
  // DT318 (0.3.160, board DT318): words for Chef Mealan have one place, the field on the read. This form opens only with
  // one more photo of the same plate (＋ Photo); the link Wrong foods? Help Chef Mealan read it is gone.
  if (!open) return null;
  return (
    <section className="mp-help" aria-label={w("make.helpChefMealanReadIt")}>
      <b>{w("make.helpChefMealanReadIt")}</b>
      <div className="mp-help-photos">
        <img src={photo.image} alt={w("make.photoOfPlate")} />
        {more.map((m, i) => <button key={i} type="button" className="mp-help-more" aria-label={w("make.removePhotoN", { n: i + 2 })} onClick={() => setMore((x) => x.filter((_, j) => j !== i))}><img src={m} alt="" /><span aria-hidden="true">✕</span></button>)}
        {more.length < 3 && <label className="pill pill-small mp-help-add">{w("plate.addPhoto")}<input type="file" accept="image/*" capture="environment" onChange={(e) => { add(e.target.files?.[0]); e.target.value = ""; }} /></label>}
      </div>
      <PotRows vessel={photo.vessel} share={share} setShare={setShare} dish={dish} setDish={setDish} meal={meal} />
      <label className="mp-help-note"><span>{w("photoask.whatIsInIt")}</span><textarea className="search pa-words" rows={3} value={note} maxLength={300} placeholder={w("photoask.wordsPlaceholder")} onChange={(e) => setNote(e.target.value)} /></label>
      <div className="button-row">
        <button type="button" className="pill pill-small pill-primary" onClick={() => read(more, words, { ...(holdsMore(photo.vessel) ? { share } : {}), ...(meal ? { dish } : {}) })}>{label}</button>
        {S && <button type="button" className="pill pill-small" aria-pressed={hearing} onClick={listen}>{hearing ? w("make.listening") : w("make.sayIt")}</button>}
      </div>
      <small className="muted">{w("make.thePhotosAndYourWords")}</small>
    </section>
  );
}

// DT318 (0.3.160, board DT318; Coach Milan 18 and 19 November): on the read, one field for what Chef Mealan could not see.
// A tap on a chip first makes the words about that food; with none marked the field takes a missing food. Typed or said:
// the microphone is inside the field. Send to Chef Mealan makes him look again with these words.
export function TellChef({ about, send }: { about: string | null; send: (words: string) => void }) {
  const [note, setNote] = useState("");
  const [hearing, setHearing] = useState(false);
  const S = typeof window !== "undefined" ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
  const listen = () => { if (!S || hearing) return; try { const r = new S(); r.lang = speechLang(getLang()); r.interimResults = false; r.onresult = (e: any) => { const t = String(e.results?.[0]?.[0]?.transcript ?? "").trim(); if (t) setNote((n) => (n ? `${n} ${t}` : t).slice(0, 300)); }; r.onend = () => setHearing(false); r.onerror = () => setHearing(false); setHearing(true); r.start(); } catch { setHearing(false); } };
  const words = note.trim();
  return (
    <section className="rv-tell" aria-label={w("plate.tellChefCheck")}>
      <b>{w("plate.tellChefCheck")}</b>
      {about ? <small className="rv-tell-about">{w("plate.tellAbout", { food: about })}</small> : <small className="muted rv-tell-hint">{w("plate.tellHint")}</small>}
      <div className="rv-tell-field">
        <textarea className="search pa-words rv-tell-words" rows={2} value={note} maxLength={300} aria-label={w("plate.tellChefCheck")} placeholder={w("plate.tellPlaceholder")} onChange={(e) => setNote(e.target.value)} />
        {S && <button type="button" className={`icon rv-tell-mic${hearing ? " on" : ""}`} aria-label={hearing ? w("make.listening") : w("make.sayIt")} aria-pressed={hearing} onClick={listen}><Mic size={20} /></button>}
      </div>
      <div className="rv-tell-go"><button type="button" className="pill pill-small rv-tell-send" disabled={!words} onClick={() => { send(words); setNote(""); }}>{w("plate.sendToChef")}</button></div>
    </section>
  );
}
