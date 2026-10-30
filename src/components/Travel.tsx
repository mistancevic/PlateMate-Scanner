// DT176 (0.3.19, board Stories124; Coach Milan 30 October 19:31 and Go 20:51): Travel mode, a manual switch on Me, above the
// steps. On asks two things, where you are and what you have there; a banner shows on every tab with Turn off; off puts
// everything back and says welcome back once. Buttons 44 px or more; labels 12 px or more.
import { useState } from "react";
import { REGIONS, type RegionId } from "../moments";
import { KITCHENS, placeName, kitchenName, sinceWords, type TravelKitchen } from "../travel";
import type { AppApi } from "../screens/api";

export function TravelBanner({ p }: { p: AppApi }) {
  const t = p.travel; if (!t) return null;
  return (
    <div className="travel-banner" role="status" aria-label="Travel mode">
      <span aria-hidden="true">🧳</span>
      <div><b>Travel mode · {placeName(t.place)}</b><small>{kitchenName(t.kitchen)} · {sinceWords(t.since)}</small></div>
      <button className="pill pill-small" onClick={() => { p.setTravel(null); p.notify("Travel mode is off. Your shops, kitchen and weigh-in are back."); }}>Turn off</button>
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
    <section className="card travel-card on" aria-label="Travel mode">
      <div className="travel-row"><span aria-hidden="true">🧳</span><div><b>Travel mode · {placeName(t.place)}</b><small>{kitchenName(t.kitchen)} · {sinceWords(t.since)}{t.weighPaused ? " · weigh-in paused" : ""}</small></div>
        <button className="pill" onClick={() => { p.setTravel(null); p.notify("Travel mode is off. Your shops, kitchen and weigh-in are back."); }}>Turn off</button></div>
    </section>
  );
  if (back && !open) return (
    <section className="card travel-card" aria-label="Welcome back">
      <div className="travel-row"><span aria-hidden="true">🏠</span><div><b>Welcome back</b><small>Travel mode was on {back.days} {back.days === 1 ? "day" : "days"}, {placeName(back.place)}. Your home shops, kitchen and weigh-in are back. The meals of those days stay in your week, marked as travel.</small></div>
        <button className="pill" onClick={() => p.setPersonal({ ...p.personal, travelBack: null })}>OK</button></div>
    </section>
  );
  if (!open) return (
    <section className="card travel-card" aria-label="Travel mode">
      <div className="travel-row"><span aria-hidden="true">🧳</span><div><b>Travel mode</b><small>Off. Turn it on when you are away: the app serves the place you are in, until you turn it off.</small></div>
        <button className="pill pill-primary" onClick={() => setOpen(true)}>Turn on</button></div>
    </section>
  );
  return (
    <section className="card travel-card travel-setup" aria-label="Turn on travel mode">
      <div className="card-top"><b>Travel mode</b><button className="link" style={{ minHeight: 44 }} onClick={() => setOpen(false)}>Cancel</button></div>
      <small className="muted">For as long as it is on, Chef Mealan serves the place you are in. Your home shops, kitchen and plan wait for you, unchanged.</small>
      <b>Where are you?</b>
      <small className="muted">Products in your search come from this country's shelves.</small>
      <div className="moments" role="radiogroup" aria-label="Where are you">{away.map((r) => (
        <button key={r.id} type="button" role="radio" aria-checked={place === r.id} className={`choice ${place === r.id ? "on" : ""}`} onClick={() => setPlace(r.id)}>{r.name}</button>))}</div>
      <b>What do you have there?</b>
      <div className="travel-kitchens" role="radiogroup" aria-label="What do you have there">{KITCHENS.map((k) => (
        <button key={k.id} type="button" role="radio" aria-checked={kitchen === k.id} className={`choice ${kitchen === k.id ? "on" : ""}`} onClick={() => setKitchen(k.id)}><b>{k.name}</b><small>{k.hint}</small></button>))}</div>
      {p.safety.consentBodyAt && <div className="travel-toggle"><span><b>Pause weigh-in</b><small>A hotel scale is a different scale: your trend keeps your home mornings only.</small></span>
        <button type="button" className={`choice ${weighPaused ? "on" : ""}`} aria-pressed={weighPaused} onClick={() => setWeighPaused(!weighPaused)}>{weighPaused ? "Yes" : "No"}</button></div>}
      <small className="muted">Your numbers and your training week stay the same; where the food comes from changes.</small>
      <button className="pill pill-wide pill-primary" disabled={!kitchen} onClick={() => { if (!kitchen) return; p.setTravel({ place, kitchen, since: new Date().toISOString(), weighPaused: Boolean(p.safety.consentBodyAt) && weighPaused }); setOpen(false); p.notify(`Travel mode is on: ${placeName(place)}, ${kitchenName(kitchen).toLowerCase()}.`); }}>Turn travel mode on</button>
      {!kitchen && <small className="muted">Pick what you have there first.</small>}
    </section>
  );
}
