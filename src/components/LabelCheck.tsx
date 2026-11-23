// 0.3.156: moved out of App.tsx as it was.
import { Check, Globe, MessageCircle, TriangleAlert } from "lucide-react";
import { type DayType } from "../personal";
import { Food, KEYS, density, lessThanFromNotes, numberInput, servingOf, servingsFor, snapToServing, validateFood } from "../pilot";
import { KNOWN, type LabelRow, type Unit, displayRows, knownOf, sortEuropean, tidy } from "../labeltable";
import { shownName, printedUnder } from "../labelNames";
import { type Mix, type MixTip, mixLabel } from "../mixtip";
import { SOURCES, dayName, fitnessFor } from "../fitness";
import { type WordKey, w } from "../words";
import { allergyHits } from "../safety";
import { findMatch, mergeFoods } from "../dedupe";
import { findReference, localName, otherNames, referenceFood } from "../reference";
import { fixed, fmt, pdText } from "../ui";
import { iconFor } from "../icons";
import { log } from "../log";
import { packLine } from "../canned";
import { playbookFor } from "../playbook";
import { resizeImageBase64, thumbnailBase64 } from "../utils/image";
import { sig } from "../photos";
import { todayLine } from "../foodjob";
import { useEffect, useRef, useState } from "react";
import { wx } from "../wx";
import { Modal } from "./Modal";
import { inputValue } from "./nutrientFields";

// DT243: a food's source is kept as English words; the label check shows the ones it knows in the app's language
const SOURCE_WORDS: Record<string, WordKey> = { "Reference table": "app.referenceTable", "Manual entry": "app.srcManual", "Photos · review required": "app.srcPhotos", "Barcode and photos · review required": "app.srcBarcodePhotos", "Label photo · review required": "app.srcLabelPhoto", "Product database · review required": "app.srcDatabase", "Product database and photos · review required": "app.srcDatabasePhotos" };
const sourceWord = (s: string) => (SOURCE_WORDS[s] ? w(SOURCE_WORDS[s]) : s);
// DT336 (0.3.174): the line for a product with no values that is obviously 0, named for what it is
const ZERO_LINE: Record<NonNullable<Food["zeroKind"]>, WordKey> = { tea: "app.zeroTea", coffee: "app.zeroCoffee", water: "app.zeroWater", salt: "app.zeroSalt" };
// The label check: the model read it, the person checks it against the pack, then saves. Named after the person's job.
export function LabelCheck({
  food,
  image,
  images,
  dbPhotos,
  library,
  close,
  save,
  mixFor,
  onMix,
  onAsk,
  momentName,
  target,
  day,
  allergies,
  region,
  addTo,
  fromSearch,
  onLookup,
  titleAs,
}: {
  food: Food;
  image?: string;
  images?: string[];
  dbPhotos?: string[];
  library?: Food[];
  close: () => void;
  save: (f: Food, opts?: { open?: boolean; plate?: boolean }) => void;
  mixFor?: (f: Food) => MixTip;
  onMix?: (f: Food, m: Mix) => void;
  onAsk?: (f: Food, tip: MixTip) => void;
  momentName?: string;
  target?: number | null;
  day?: { kcal: number | null; eaten: number; name: string; type: DayType; weightKg: number | null };
  allergies?: string[];
  region?: string | null;
  addTo?: "plate" | "foods";
  fromSearch?: string;
  onLookup?: (code: string) => void;
  titleAs?: string;
}) {
  const [mainIdx, setMainIdx] = useState(0);
  // canvas board C8: each of the database's photos has its own tick, all ticked to start
  const [keepDb, setKeepDb] = useState<boolean[]>(() => (dbPhotos ?? []).map(() => true));
  const [choice, setChoice] = useState<"update" | "both">("update");
  const [servingGrams, setServingGrams] = useState(food.serving ? String(food.serving.grams) : ""),
    [servingName, setServingName] = useState(food.serving?.name ?? ""),
    [name, setName] = useState(food.name),
    [brand, setBrand] = useState(food.brand),
    [notes, setNotes] = useState(food.notes),
    [ready, setReady] = useState(food.readyToEat),
    [reviewed, setReviewed] = useState(false),
    [errors, setErrors] = useState<string[]>([]);
  const [values, setValues] = useState(() => {
    // DT336: a tea, coffee, water or salt with no values starts at 0; fibre stays empty, as the pack says nothing
    if (food.zeroKind) return Object.fromEntries(KEYS.map((k) => [k, k === "fiber" ? "" : "0"])) as Record<string, string>;
    // a blank field with a less-than in the notes gets the printed bound, so the number can be calculated; the note keeps the printed text
    const bounds = lessThanFromNotes(food.notes ?? "");
    return Object.fromEntries(KEYS.map((k) => [k, food[k] === null && bounds[k] !== undefined ? String(bounds[k]) : inputValue(food[k], k)])) as Record<string, string>;
  });
  // the lines as a label prints them, once, when the review opens: typing stays exactly as typed
  const [rows, setRows] = useState<LabelRow[]>(() => displayRows(food).map((r) => ({ ...r, amount: r.amount === null ? null : tidy(r.amount, r.unit) })));
  const [rowDraft, setRowDraft] = useState<Record<number, string>>({});
  const [adding, setAdding] = useState(false);
  const [addKey, setAddKey] = useState("saturates");
  const [addName, setAddName] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addUnit, setAddUnit] = useState<Unit>("g");
  useEffect(() => { const k = knownOf(addKey); if (k) setAddUnit(k.unit); }, [addKey]);
  // the same product, recognised from what's on screen now
  const liveMatch = !(library ?? []).some((x) => x.id === food.id)
    ? findMatch({ ...food, name, brand, ...Object.fromEntries(KEYS.map((k) => [k, numberInput(values[k])])) } as Food, library ?? [])
    : null;
  // the draft as a food, for the mix tip while the sheet is still open
  // readyToEat is true for the tip: the box starts unticked because it is unconfirmed, not because the food needs cooking
  const servingNow = () => servingOf({ grams: numberInput(servingGrams), name: servingName.trim() || "serving" });
  const draft = (): Food => ({ ...food, name: name.trim() || food.name, brand: brand.trim(), readyToEat: true, serving: servingNow(), ...Object.fromEntries(KEYS.map((k) => [k, numberInput(values[k])])) } as Food);
  // DT336: still 0 as long as no value is typed over the 0; a value typed makes it an ordinary food, checked as any other
  const zero = food.zeroKind && KEYS.every((k) => values[k].trim() === "" || numberInput(values[k]) === 0) && values.calories.trim() !== "" && values.protein.trim() !== "" ? food.zeroKind : null;
  const pendingMix = useRef<Mix | null>(null);
  const [askError, setAskError] = useState("");
  // the title is the word the person tapped: Type, Barcode, Scan; the small line above says where the food goes
  const kind = (() => {
    const src = food.source || "";
    const where = addTo === "plate" ? w("app.addToPlate") : w("app.addAFood");
    if (titleAs) return { id: "as", eyebrow: w("app.findAFood"), title: titleAs, line: w("app.checkWhatTheDatabaseSays") };
    if (/barcode|product database|open food facts/i.test(src)) return { id: "barcode", eyebrow: where, title: w("app.kindBarcode"), line: w("app.checkWhatTheDatabaseSays") };
    if (/photo|label/i.test(src)) return { id: "scan", eyebrow: where, title: w("plate.scan"), line: w("app.checkWhatWasReadAgainst") };
    return { id: "manual", eyebrow: where, title: w("plate.manual"), line: w("app.nameTheFoodFillThe") };
  })();
  const [refOpen, setRefOpen] = useState(() => Boolean(food.name) && /manual/i.test(food.source || ""));
  const [code, setCode] = useState(food.barcode ?? "");
  const [refPicked, setRefPicked] = useState<string | null>(null);
  // the mix tip shown on the review sheet is logged once per food
  const loggedTip = useRef<string | null>(null);
  function noteTip(tip: MixTip, d: Food) {
    if (loggedTip.current === food.id || tip.case === "fits" || tip.case === "unknown") return;
    loggedTip.current = food.id;
    log("mix_tip", { food: d.name, where: "review", moment: momentName, case: tip.case, offered: tip.mixes.map((m) => ({ partners: m.partners.map((x) => x.name), kind: m.kind, pd: Math.round(m.pd * 10) / 10, kcal: m.kcal })) });
  }
  // Tell Mealan from the sheet: the food goes in with what is typed (name, energy, protein), unreviewed, so the conversation can start now
  function askNow(tip: MixTip) {
    const f = { ...draft(), readyToEat: ready, notes, icon: food.icon || iconFor(name.trim() || food.name) } as Food;
    const e = validateFood(f);
    setAskError(e[0] ?? "");
    if (e.length || !onAsk) return;
    save(f);
    onAsk(f, tip);
  }
  function submit() {
    const { dbEmpty: _e, zeroKind: _z, ...base } = food;
    const noValues = w("app.noValuesOnPack");
    const f = {
      ...base,
      ...(zero ? { zeroKind: zero } : {}),
      ...(refPicked ? { source: "Reference table" } : {}),
      ...(/^\d{8,14}$/.test(code.trim()) ? { barcode: code.trim() } : {}),
      name: name.trim(),
      brand: brand.trim(),
      serving: servingNow(),
      notes: zero && !notes.includes(noValues) ? (notes.trim() ? notes.trim() + " " : "") + noValues : notes,
      readyToEat: ready,
      reviewedAt: new Date().toISOString(),
      ...Object.fromEntries(KEYS.map((k) => [k, numberInput(values[k])])),
      table: rows.map((r) => { const core = knownOf(r.key)?.core; return core ? { ...r, amount: numberInput(values[core]) } : r; }),
    } as Food;
    const e = validateFood(f);
    if (
      KEYS.some(
        (k) => values[k].trim() !== "" && numberInput(values[k]) === null,
      )
    )
      e.push(
        w("app.useNonNegative"),
      );
    if (!reviewed && !zero)
      e.push(w("app.confirmLabelBasis"));
    setErrors(e);
    if (e.length) return;
    f.icon = f.icon || iconFor(f.name);
    const isNew = !(library ?? []).some((x) => x.id === f.id);
    const match = isNew ? findMatch(f, library ?? []) : null;
    const finish = (g: Food) => {
      const saved = match && choice === "update" ? { ...mergeFoods(match.food, g), reviewedAt: g.reviewedAt } : g;
      const m = pendingMix.current; pendingMix.current = null;
      save(saved, { open: isNew && !(match && choice === "update") && !(m && onMix) && addTo !== "plate", plate: addTo === "plate" && !(m && onMix) });
      if (m && onMix) onMix(saved, m);
    };
    const raw = (images && images.length ? images : image ? [image] : []);
    const mine = raw.length > 1 ? [raw[mainIdx] ?? raw[0], ...raw.filter((_, i) => i !== mainIdx)] : raw;
    // the database's ticked photos first, then the person's own (canvas board C8)
    const fromDb = (dbPhotos ?? []).filter((_, i) => keepDb[i]);
    const all = [...fromDb, ...mine];
    if (all.length && !f.photo)
      Promise.all([thumbnailBase64(all[0]).catch(() => ""), ...all.map((x) => resizeImageBase64(x, 900, 900).catch(() => ""))])
        .then(([thumb, ...big]) => {
          const ok = big.filter(Boolean);
          const credited = big.slice(0, fromDb.length).filter(Boolean).map(sig);
          finish({ ...f, photo: thumb || undefined, photos: ok.length ? ok : undefined, ...(credited.length ? { creditPhotos: credited } : {}) } as Food);
        })
        .catch(() => finish(f));
    else finish(f);
  }
  return (
    <Modal title={kind.title} close={close} eyebrow={kind.eyebrow}>
      <p className="small muted sheet-line">{kind.line}{fromSearch ? <> {wx("app.fromYourSearch", { q: <b>{fromSearch}</b> })}</> : null}</p>
      {dbPhotos && dbPhotos.length > 0 && (
        <div className="db-photos">
          <div className="db-strip" aria-label={w("app.photosFromOpenFoodFacts")}>
            {dbPhotos.map((src, i) => (
              <button key={i} className={`db-photo ${keepDb[i] ? "on" : ""}`} aria-pressed={keepDb[i]} aria-label={w(keepDb[i] ? "app.leaveOutDbPhoto" : "app.keepDbPhoto", { n: i + 1 })} onClick={() => setKeepDb((k) => k.map((x, j) => (j === i ? !x : x)))}>
                <img src={src} alt="" />
                <span className="db-tick" aria-hidden="true">{keepDb[i] ? "✓" : ""}</span>
                <span className="db-globe" aria-hidden="true"><Globe size={12} /></span>
              </button>
            ))}
          </div>
          <small>{w("app.tickedPhotosStayWithThe")}</small>
          <small className="credit"><Globe size={13} /> {w("app.creditOpenFoodFactsCc")}</small>
        </div>
      )}
      {images && images.length > 1 ? (
        <div className="label-previews" aria-label={w("app.yourPhotosOfThisProduct")}>
          {images.map((src, i) => (
            <div className="preview-wrap" key={i}>
              <img className="label-preview" src={src} alt={w("app.photoNOf", { n: i + 1, of: images.length })} />
              <button className={`star ${mainIdx === i ? "on" : ""}`} aria-label={mainIdx === i ? w("app.mainPhoto") : w("app.makeThisTheMainPhoto")} onClick={() => setMainIdx(i)}>{mainIdx === i ? w("app.starMain") : w("app.starMakeMain")}</button>
            </div>
          ))}
        </div>
      ) : image ? (
        <img className="label-preview" src={image} alt={w("app.capturedLabel")} />
      ) : null}
      {images && images.length > 1 && <p className="small center">{w("app.photosSwipe", { n: images.length })}</p>}
      {liveMatch && (
        <section className="match">
          <b>{w("app.looksLikeAFoodYou")}</b>
          <small>{liveMatch.food.name}{liveMatch.food.brand ? `, ${liveMatch.food.brand}` : ""} · {liveMatch.reason === "barcode" ? w("app.sameBarcode") : w("app.sameValues")}</small>
          <div className="moments" style={{ marginTop: 8 }}>
            <button className={`choice ${choice === "update" ? "on" : ""}`} onClick={() => setChoice("update")}>{w("app.updateThatOne")}</button>
            <button className={`choice ${choice === "both" ? "on" : ""}`} onClick={() => setChoice("both")}>{w("app.keepBoth")}</button>
            <button className="pill pill-small" onClick={close}>{w("app.cancel")}</button>
          </div>
          {choice === "update" && <small>{w("app.itKeepsItsNameMissing")}</small>}
        </section>
      )}
      <p className="small">
        {wx("app.sourceCheck", { source: sourceWord(food.source), basis: <strong>{w("app.perG")}</strong> })}
      </p>
      <label>
        {w("app.productName")}
        <input value={name} onChange={(e) => { setName(e.target.value); setRefOpen(true); }} onFocus={() => setRefOpen(true)} autoComplete="off" />
      </label>
      {refOpen && food.source !== "Reference table" && !food.barcode && findReference(name).length > 0 && (
        <div className="ref-suggest" role="listbox" aria-label={w("app.fromTheReferenceTable")}>
          <small className="muted">{w("app.noLabelNeeded")}</small>
          {findReference(name).map((r) => (
            <button key={r.id} type="button" role="option" className="ref-row" onClick={() => {
              const rf = referenceFood(r, region, () => food.id);
              setName(rf.name); setBrand(""); setNotes(rf.notes ?? ""); setReady(rf.readyToEat);
              setValues(Object.fromEntries(KEYS.map((k) => [k, inputValue((rf as any)[k], k)])) as Record<string, string>);
              setRows(displayRows(rf)); setRefPicked(r.id); setRefOpen(false);
            }}>
              <b>{localName(r, region)}</b><small>{w("app.refRowLine", { names: otherNames(r, region).join(" · "), kcal: r.kcal, protein: r.protein })}</small>
            </button>
          ))}
        </div>
      )}
      {refPicked && <p className="small muted">{w("app.valuesFromTheReferenceTable")}</p>}
      <label>
        {w("app.brand")}
        <input value={brand} onChange={(e) => setBrand(e.target.value)} />
      </label>
      {kind.id === "manual" && onLookup && (
        <label className="barcode-field">
          {w("app.barcodeNumberIfThePack")}
          <div className="barcode-row">
            <input inputMode="numeric" placeholder={w("app.barcodeDigits")} value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && /^\d{8,14}$/.test(code.trim())) onLookup(code.trim()); }} />
            <button type="button" className="pill pill-small" disabled={!/^\d{8,14}$/.test(code.trim())} onClick={() => onLookup(code.trim())}>{w("app.lookUp")}</button>
          </div>
          <small className="muted">{w("app.lookUpFillsTheTable")}</small>
        </label>
      )}
      <div className="serving-field">
        <span className="label">{w("app.servingIfThePackPrints")}</span>
        <div className="serving-row">
          <span>1</span>
          <input aria-label={w("app.servingName")} placeholder={w("app.servingExample")} value={servingName} onChange={(e) => setServingName(e.target.value)} />
          <input aria-label={w("app.servingGrams")} type="number" inputMode="decimal" min="0" placeholder="45" value={servingGrams} onChange={(e) => setServingGrams(e.target.value)} />
          <span>g</span>
        </div>
        <small className="muted">{w("app.aCountedFoodWhatChef")}</small>
        {packLine({ pack: food.pack, name: name || food.name }) && <small className="pack-line">{packLine({ pack: food.pack, name: name || food.name })}</small>}
      </div>
      <p className="label">{w("app.nutritionTablePerGAs")}</p>
      {zero && <p className="zero-line">{w(ZERO_LINE[zero])}</p>}
      {food.dbEmpty && KEYS.every((k) => values[k].trim() === "") && (
        <div className="warn-box none-line" role="note"><TriangleAlert size={18} aria-hidden="true" /><b>{w("app.dbNoValues")}</b></div>
      )}
      <div className="label-table">
        {rows.map((r, i) => {
          const core = knownOf(r.key)?.core;
          return (
            <div className={`lt-row ${r.sub ? "sub" : ""}`} key={r.key + i}>
              <span className="lt-name">{shownName(r)}{printedUnder(r) && <small className="lt-printed">{printedUnder(r)}</small>}{r.source === "you" && <em> · {w("app.rowByYou")}</em>}{r.source === "database" && <em> · {w("app.rowDatabase")}</em>}{r.source === "photo" && <em className="from-photo"> · {w("app.rowFromPhoto")}</em>}</span>
              {/* 0.2.121 (Tester 2, Milan 28 October 15:26): a row like salt kept only the number, so "0." became 0 and a decimal
                  could not be typed. What you type stays as typed and counts when you leave the field */}
              <input inputMode="decimal" aria-label={shownName(r)} value={core ? values[core] : rowDraft[i] ?? (r.amount ?? "")} placeholder="–"
                onChange={(e) => core ? setValues((v) => ({ ...v, [core]: e.target.value })) : setRowDraft((d) => ({ ...d, [i]: e.target.value }))}
                onBlur={(e) => { if (core) return; const t = e.target.value; setRows((rs) => rs.map((x, j) => j === i ? { ...x, amount: numberInput(t) } : x)); setRowDraft((d) => { const n = { ...d }; delete n[i]; return n; }); }} />
              <span className="lt-unit">{r.unit}</span>
              {!core ? <button className="lt-x" aria-label={w("app.removeRow", { name: shownName(r) })} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>×</button> : <span className="lt-x" />}
            </div>
          );
        })}
      </div>
      {(() => {
        const d = draft();
        if (d.calories === null || d.protein === null) return null;
        if (zero) return <p className="zero-line fit-none">{w("app.noPdZero")}</p>;
        const pb = playbookFor(d), pd = density(d.protein, d.calories);
        const fit = fitnessFor(d, day?.weightKg ?? null, day?.type ?? "passive");
        const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
        // on its own: the playbook's word, and the number against this plate's target; under the target is never green
        const under = target != null && pd !== null && pd < target;
        const ownText = !pb.alone.ok ? cap(pb.alone.reason) : under ? w("app.underYourTarget", { target: fixed(target!) }) : target != null ? w("app.onYourTarget", { target: fixed(target), reason: cap(pb.alone.reason) }) : cap(pb.alone.reason);
        const ownClass = !pb.alone.ok ? "no" : under ? "mid" : "ok";
        const t = day ? todayLine(d, day.kcal, day.eaten, day.name) : null;
        const sv = d.serving;
        const count = (grams: number) => (sv ? `${servingsFor(d, grams)} ${sv.name}${servingsFor(d, grams) === 1 ? "" : "s"}, ${snapToServing(d, grams)} g` : w("app.aboutG", { g: grams }));
        const beforeText = fit.before.fits && fit.before.grams !== null ? w("app.beforeFits", { amount: count(fit.before.grams), carbs: Math.round((snapToServing(d, fit.before.grams) * (d.carbs ?? 0)) / 100), day: dayName(day?.type ?? "passive") }) : fit.before.reason;
        const afterText = fit.after.fits && fit.after.grams !== null ? w("app.afterFits", { amount: count(fit.after.grams), protein: Math.round((snapToServing(d, fit.after.grams) * (d.protein ?? 0)) / 100), floor: fit.after.floor }) : fit.after.reason;
        return (
          <section className="fit-lines" aria-label={w("app.howItFits")}>
            <p className="label">{w("app.howItFits")}</p>
            <p className="fit-pd"><b>{pdText(pd)}</b><small>{w("app.gProteinPer", { protein: fmt(d.protein), kcal: fmt(d.calories, 0) })}{sv ? ` · ${w("app.servingIs", { name: sv.name, g: sv.grams, kcal: Math.round((sv.grams * (d.calories ?? 0)) / 100), protein: fmt(Math.round((sv.grams * (d.protein ?? 0)) / 100 * 10) / 10) })}` : ""}</small></p>
            <p className={`fit-line ${ownClass}`}><b>{w("app.onItsOwn")}</b> {ownText}.</p>
            <p className={`fit-line ${fit.before.fits ? "ok" : pb.beforeTraining.ok ? "mid" : "no"}`} title={SOURCES.preCarb}><b>{w("app.beforeTrainingLabel")}</b> {cap(beforeText)}.</p>
            <p className={`fit-line ${fit.after.fits ? "ok" : "no"}`} title={SOURCES.proteinDose}><b>{w("app.afterTrainingLabel")}</b> {cap(afterText)}.</p>
            {pb.caveats.length > 0 && <p className="fit-line no"><b>{w("app.labelLabel")}</b> {cap(pb.caveats.join(", "))}.</p>}
            {allergies && allergyHits(d, allergies).length > 0 && <p className="fit-line no"><b>{w("app.containsAvoid")}</b> {w("app.neverSuggested", { list: allergyHits(d, allergies).join(", ") })}</p>}
            {t && <p className="fit-line today">{t}</p>}
          </section>
        );
      })()}
      {adding ? (
        <div className="lt-add">
          <select value={addKey} onChange={(e) => setAddKey(e.target.value)} aria-label={w("app.whichLine")}>
            {KNOWN.filter((k) => !k.core && !rows.some((r) => r.key === k.key)).map((k) => <option key={k.key} value={k.key}>{k.name}</option>)}
            <option value="other">{w("app.otherLine")}</option>
          </select>
          {addKey === "other" && <input placeholder={w("app.nameAsPrinted")} value={addName} onChange={(e) => setAddName(e.target.value)} />}
          <div className="lt-add-row">
            <input inputMode="decimal" placeholder={w("app.amount")} value={addAmount} onChange={(e) => setAddAmount(e.target.value)} />
            <select value={addUnit} onChange={(e) => setAddUnit(e.target.value as Unit)} aria-label={w("app.unit")}>{["g", "mg", "µg", "kcal", "kJ", "%"].map((u) => <option key={u}>{u}</option>)}</select>
            <button className="pill pill-small pill-primary" disabled={addKey === "other" && !addName.trim()} onClick={() => {
              const k = knownOf(addKey);
              const row: LabelRow = { key: k ? k.key : "other:" + addName.trim().toLowerCase(), name: k ? k.name : addName.trim(), amount: numberInput(addAmount), unit: addUnit, sub: k?.sub ?? false, source: "you" };
              setRows((rs) => sortEuropean([...rs, row]).sort((x, y) => { const ix = rs.indexOf(x), iy = rs.indexOf(y); return ix >= 0 && iy >= 0 ? ix - iy : 0; }));
              setAdding(false); setAddName(""); setAddAmount("");
            }}>{w("app.add")}</button>
            <button className="link" onClick={() => setAdding(false)}>{w("app.cancel")}</button>
          </div>
        </div>
      ) : (
        <button className="pill pill-small pill-action" onClick={() => { const first = KNOWN.find((k) => !k.core && !rows.some((r) => r.key === k.key)); setAddKey(first?.key ?? "other"); setAddUnit(first?.unit ?? "g"); setAdding(true); }}>{w("app.addLine")}</button>
      )}
      <label>
        {w("app.labelNotes")}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={w("app.eGFibreNotDeclared")}
        />
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={ready}
          onChange={(e) => setReady(e.target.checked)}
        />{" "}
        {w("app.readyCold")}
      </label>
      {!zero && <label className="check">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={(e) => setReviewed(e.target.checked)}
        />{" "}
        {w("app.iChecked")}
      </label>}
      <p className="small">
        {w("app.perMlNote")}
      </p>
      {errors.map((e) => (
        <p className="notice" key={e}>
          {e}
        </p>
      ))}
      <button className="primary wide" onClick={submit}>
        <Check size={17} /> {w("app.confirmSaveFood")}
      </button>
      {mixFor && onMix && (() => {
        const d = draft();
        if (d.calories === null || d.protein === null) return null;
        const tip = mixFor(d);
        noteTip(tip, d);
        if (tip.case === "fits") return <p className="small center mix-fits">{w("app.fitsYourPlateAsIt")}</p>;
        if (tip.case === "unknown") return null;
        return (
          <section className="mix-tip">
            <div className="mix-head"><span className="pro-badge">{w("app.mixIt")}</span><small>{momentName}: {tip.why}</small></div>
            {tip.mixes.length === 0 && <p className="muted">{w("app.nothingInYourFoodsOr")}</p>}
            {tip.mixes.map((m) => (
              <button key={m.id} className="mix-chip" onClick={() => { pendingMix.current = m; submit(); }}>
                <b>{mixLabel(m)}</b>
                <small>{pdText(m.pd)} · {m.kcal} kcal · {m.kind}{m.cooking ? ` · ${w("app.mixCooking")}` : ""}{m.fromStarter.length ? ` · ${w("app.mixFromStarter")}` : ""}</small>
              </button>
            ))}
            <p className="small">{w("app.aTapSavesTheFood")}</p>
            {onAsk && <button className="link" onClick={() => askNow(tip)}><MessageCircle size={14} /> {w("app.notQuiteTellChefMealan")}</button>}
            {askError && <p className="notice">{askError}</p>}
          </section>
        );
      })()}
    </Modal>
  );
}
