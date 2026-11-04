// DT176 (0.3.19, board Stories124; Coach Milan 30 October 19:31 and Go 20:51): Travel mode, a manual switch on Me, above the
// steps. On asks two things, where you are and what you have there; a banner shows on every tab with Turn off; off puts
// everything back and says welcome back once. Buttons 44 px or more; labels 12 px or more.
import { w } from "../words";
import { useState } from "react";
import { REGIONS, type RegionId } from "../moments";
import { KITCHENS, placeName, kitchenName, sinceWords, type TravelKitchen } from "../travel";
import type { AppApi } from "../screens/api";

export function TravelBanner({ p }: { p: AppApi }) {
  const t = p.travel; if (!t) return null;
  return (
    <div className="travel-banner" role="status" aria-label={w("travel.travelMode")}>
      <span aria-hidden="true">🧳</span>
      <div><b>Travel mode · {placeName(t.place)}</b><small>{kitchenName(t.kitchen)} · {sinceWords(t.since)}</small></div>
      <button className="pill pill-small" onClick={() => { p.setTravel(null); p.notify(w("travel.offBack")); }}>{w("travel.turnOff")}</button>
    </div>
  );
}

export function TravelCard({ p }: { p: AppApi }) {
  const t = p.travel;
  const [open, setOpen] = useState(false);
  const away = REGIONS.filter((r) => r.id !== p.region);
  const [place, setPlace] = useState<RegionId>((away[0]?.id ?? "elsewhere") as RegionId);
  const [kitchen, setKitchen] = useState<TravelKitchen | null>(null);
  const [weighPaused, setWeighPaused] = useState(true);
  const back = p.personal.travelBack;
  if (t) return (
    <section className="card travel-card on" aria-label={w("travel.travelMode")}>
      <div className="travel-row"><span aria-hidden="true">🧳</span><div><b>Travel mode · {placeName(t.place)}</b><small>{kitchenName(t.kitchen)} · {sinceWords(t.since)}{t.weighPaused ? " · weigh-in paused" : ""}</small></div>
        <button className="pill" onClick={() => { p.setTravel(null); p.notify(w("travel.offBack")); }}>{w("travel.turnOff")}</button></div>
    </section>
  );
  if (back && !open) return (
    <section className="card travel-card" aria-label={w("travel.welcomeBack")}>
      <div className="travel-row"><span aria-hidden="true">🏠</span><div><b>{w("travel.welcomeBack")}</b><small>Travel mode was on {back.days} {back.days === 1 ? "day" : "days"}, {placeName(back.place)}. Your home shops, kitchen and weigh-in are back. The meals of those days stay in your week, marked as travel.</small></div>
        <button className="pill" onClick={() => p.setPersonal({ ...p.personal, travelBack: null })}>{w("travel.ok")}</button></div>
    </section>
  );
  if (!open) return (
    <section className="card travel-card" aria-label={w("travel.travelMode")}>
      <div className="travel-row"><span aria-hidden="true">🧳</span><div><b>{w("travel.travelMode")}</b><small>{w("travel.offTurnItOnWhen")}</small></div>
        <button className="pill pill-primary" onClick={() => setOpen(true)}>{w("travel.turnOn")}</button></div>
    </section>
  );
  return (
    <section className="card travel-card travel-setup" aria-label={w("travel.turnOnTravelMode")}>
      <div className="card-top"><b>{w("travel.travelMode")}</b><button className="link" style={{ minHeight: 44 }} onClick={() => setOpen(false)}>{w("travel.cancel")}</button></div>
      <small className="muted">{w("travel.forAsLongAsIt")}</small>
      <b>{w("travel.whereAreYou")}</b>
      <small className="muted">{w("travel.productsInYourSearchCome")}</small>
      <div className="moments" role="radiogroup" aria-label={w("travel.whereAreYou2")}>{away.map((r) => (
        <button key={r.id} type="button" role="radio" aria-checked={place === r.id} className={`choice ${place === r.id ? "on" : ""}`} onClick={() => setPlace(r.id)}>{r.name}</button>))}</div>
      {/* DT207d (0.3.48; Coach Milan 1 November 19:42): the question said plainly, and the three choices wrap on a phone */}
      <b>{w("travel.whereDoYouStay")}</b>
      <div className="travel-kitchens" role="radiogroup" aria-label={w("travel.whereDoYouStay2")}>{KITCHENS.map((k) => (
        <button key={k.id} type="button" role="radio" aria-checked={kitchen === k.id} className={`choice ${kitchen === k.id ? "on" : ""}`} onClick={() => setKitchen(k.id)}><b>{k.name}</b><small>{k.hint}</small></button>))}</div>
      {p.safety.consentBodyAt && <div className="travel-toggle"><span><b>{w("travel.pauseWeighIn")}</b><small>{w("travel.aHotelScaleIsA")}</small></span>
        <button type="button" className={`choice ${weighPaused ? "on" : ""}`} aria-pressed={weighPaused} onClick={() => setWeighPaused(!weighPaused)}>{weighPaused ? "Yes" : "No"}</button></div>}
      <small className="muted">{w("travel.yourNumbersAndYourTraining")}</small>
      <button className="pill pill-wide pill-primary" disabled={!kitchen} onClick={() => { if (!kitchen) return; p.setTravel({ place, kitchen, since: new Date().toISOString(), weighPaused: Boolean(p.safety.consentBodyAt) && weighPaused }); setOpen(false); p.notify(`Travel mode is on: ${placeName(place)}, ${kitchenName(kitchen).toLowerCase()}.`); }}>{w("travel.turnTravelModeOn")}</button>
      {!kitchen && <small className="muted">{w("travel.pickWhereYouStayFirst")}</small>}
    </section>
  );
}
