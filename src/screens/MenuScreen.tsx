import { numLocale, w, dateText, phoneLoc, mealName, mealV } from "../words";
import { optWord } from "../optWords";
import { SafetyQuestion } from "../components/SafetyQuestion";
import { LanguagePanel } from "../components/LanguagePanel";
import { countByPlace, samePlace, getStarted } from "../places";
import { useState, useEffect, useRef, Fragment, type ReactNode } from "react";
import { profileOdd } from "../profileOdd";
import { setupMissing, takeFocus } from "../setup";
import { QrCode, FlaskConical, ChevronRight, BookOpen, ChevronLeft, Download, Upload, SlidersHorizontal, RotateCcw, Target, User, CalendarDays, ShoppingBasket, Users, KeyRound, LifeBuoy, Info, Calculator, Coffee } from "lucide-react";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { APP_NAME, COACH_NAME } from "../components/Mark";
import { exportLog, clearLog, readLog, log } from "../log";
import { BANDS, bandOf, goalName, SOURCE_LABEL, type GoalEntry } from "../goal";
import { sheetOf, guideOf } from "../goalGuide";
import { GoalSheet, GoalGuide } from "../components/GoalSheet";
import { WeightTrend } from "../components/Weight";
import { weighInsOff, withoutWeighIn } from "../weight";
import { ConfirmButton } from "../components/Confirm";
import { WeightField, HeightField } from "../components/UnitFields";
import { cleanUnits, asF, ftIn, kgToLb, wText, wIn, type Units } from "../units";
import { RHYTHMS, REGIONS } from "../moments";
import { LIFE, DAY_TYPES, calculate, canCalculate, suggestBand, formulaFor, dayModeOf, ownDayNumbers, weekOf, lifeOf, workOf, withWork, planOf, lifestyleOf, ageOf, isMinor, dayFor, KITCHENS, EQUIPMENT, equipmentOf, type Personal, type DayType } from "../personal";
import { CHEF_NAME } from "../components/Mark";
import { KITCHEN, tasteOf, another, anotherLeft, undo, type Taste } from "../kitchens";
import { slotsOf, windowOf, workHoursOf, timesFromWork, timesFromSleep, sleepWindow, SLOT_HOURS, toMin } from "../slots";
import { WEEKDAYS, WEEKDAY_NAMES, HOURS, SLOTS, MOVES, WHERE, DIETS, DIET_MEANS, ALCOHOL, ALCOHOL_AGE, LOAD_NAME, planFromCounts, countsOf, loadOf, planShort, planLine, LOAD_DAY, isoWeek, datesOfWeek, WHERE_KID, SCHOOL_HOURS, COMMUTES, PE_WEEK, weekdayIndex, usualFrom, HOURS_SHOWN, STUDY_HOURS, WEEKDAY_CHOICES, weekdaysOf, dayKindOf, workHintOf, type Plan, type PlanDay, type Lifestyle, moveDay, isTraining } from "../plan";
import { DayEditor } from "../components/DayEditor";
import { ProteinCard } from "../components/ProteinCard";
import { DayTable } from "../components/DayTable";
import { periodsOf, periodLine } from "../goalHistory";
import { DAY_NAMES } from "../coachNotes";
import { FORMULA_NAME } from "../components/FormulaCard";
import { BurnCard } from "../components/Measured";
import { analyse, isOpen as openAt } from "../analysis";
import type { AppApi, MenuSection } from "./api";
import { openStats, savedDataKb } from "../openStats";
import { saveStats } from "../cloud";
import { looseWanted } from "../photos";
import { useViewAs, setViewAs, viewWord } from "../viewAs";
import { SITUATIONS, SITUATION_FOR, EU_ALLERGENS, FIXED, type SituationId } from "../safety";
import { EvalsScreen } from "./EvalsScreen";
import { MetricsScreen } from "./MetricsScreen";
import { ShareScreen } from "./ShareScreen";
import { CostsScreen } from "./CostsScreen";
import { LineChart, Receipt, Microscope, ShieldCheck, Settings } from "lucide-react";
import { dayLog } from "../today";
import { aggregate, uid } from "../pilot";
import { MeScreen, TasteSetting } from "./MeScreen";
import { SummaryPanel } from "./SummaryPanel";
import { ClipboardList, CalendarClock } from "lucide-react";
import { CalendarPage } from "../components/Calendar";
import { ExplorerScreen } from "./ExplorerScreen";
import { AdminPanel } from "./AdminPanel";
import { SettingsList, VoiceSettingsPanel } from "../components/VoiceSettings";

// the sections that belong to the person: they live under Me, and back from them goes to Me
const ME_SECTIONS: MenuSection[] = ["profile", "goal", "life", "week", "calendar", "shop", "coach", "summary", "account"];
const ITEMS: { id: MenuSection; name: string; icon: ReactNode }[] = [
  { id: "profile", get name() { return w("me.rowProfile"); }, icon: <User size={20} /> },
  { id: "goal", get name() { return w("me2.goal"); }, icon: <Target size={20} /> },
  { id: "life", get name() { return w("me2.lifestyle"); }, icon: <Coffee size={20} /> },
  { id: "week", get name() { return w("menu.trainingWeek"); }, icon: <CalendarDays size={20} /> },
  { id: "calendar", get name() { return w("menu.googleCalendar"); }, icon: <CalendarClock size={20} /> },
  { id: "shop", get name() { return w("menu.whereIShopAndCook"); }, icon: <ShoppingBasket size={20} /> },
  { id: "coach", get name() { return w("menu.rowCoach"); }, icon: <Users size={20} /> },
  { id: "summary", get name() { return w("menu.yourSummary"); }, icon: <ClipboardList size={20} /> },
  { id: "account", get name() { return w("me.rowAccount"); }, icon: <KeyRound size={20} /> },
  { id: "support", get name() { return w("menu.rowSupport"); }, icon: <LifeBuoy size={20} /> },
  { id: "about", get name() { return w("menu.about"); }, icon: <Info size={20} /> },
  { id: "evals", name: "Evals", icon: <FlaskConical size={20} /> },
  { id: "metrics", get name() { return w("menu.metrics"); }, icon: <LineChart size={20} /> },
  { id: "costs", get name() { return w("menu.runningCosts"); }, icon: <Receipt size={20} /> },
  { id: "share", get name() { return w("menu.shareChefMealan"); }, icon: <QrCode size={20} /> },
  { id: "explorer", name: "Explorer", icon: <Microscope size={20} /> },
  { id: "admin", get name() { return w("menu.admin"); }, icon: <ShieldCheck size={20} /> },
  // DT215 v3 (0.3.66, board Stories162b): Settings, how the app works for you; Voice while cooking its first page
  { id: "settings", get name() { return w("menu.settings"); }, icon: <Settings size={20} /> },
  { id: "voice", get name() { return w("menu.voiceWhileCooking"); }, icon: <Settings size={20} /> },
  { id: "dev", get name() { return w("menu.devData"); }, icon: <Settings size={20} /> },
  // DT203 (0.3.76, board Stories175 v2): the language Chef Mealan speaks
  { id: "language", name: "Language", icon: <Settings size={20} /> },
];
// Metrics in the menu only for the account the server names (0.2.5+r17, board M, M1); kept so the row shows at once
const OWNER = "chefmealan-metrics-owner";
// (a component of its own: the menu list itself keeps no hooks)
function MetricsRow({ open }: { open: () => void }) {
  const owner = useMetricsOwner(true);
  return owner ? <button className="menu-row" onClick={open}><span className="menu-icon"><LineChart size={20} /></span><b>{w("menu.metrics")}</b><ChevronRight size={18} /></button> : null;
}
// SH73 (Milan 23:42): Share Chef Mealan, only for Milan for now, like Metrics
function ShareRow({ open }: { open: () => void }) {
  const owner = useMetricsOwner(true);
  return owner ? <button className="menu-row" onClick={open}><span className="menu-icon"><QrCode size={20} /></span><b>{w("menu.shareChefMealan")}</b><ChevronRight size={18} /></button> : null;
}
// Running costs, next to Metrics, for the same account only (0.2.7+r1, board M, M6b)
function CostsRow({ open }: { open: () => void }) {
  const owner = useMetricsOwner(true);
  return owner ? <button className="menu-row" onClick={open}><span className="menu-icon"><Receipt size={20} /></span><b>{w("menu.runningCosts")}</b><ChevronRight size={18} /></button> : null;
}
function ShareGuard(p: AppApi) { return useMetricsOwner(true) ? <ShareScreen {...p} /> : null; }
// SH73: one question to the server per menu open for every owner-only row (Metrics, Running costs, Share), and a busy or
// failed answer changes nothing: before, a 429 from the per-minute limit hid Metrics until the next open.
let ownerAsk: { at: number; p: Promise<boolean | null> } | null = null;
const askOwner = () => {
  const now = Date.now();
  if (!ownerAsk || now - ownerAsk.at > 5000) ownerAsk = { at: now, p: fetch("/api/metrics/access").then((r) => (r.ok ? r.json().then((d) => Boolean(d.owner)) : null)).catch(() => null) };
  return ownerAsk.p;
};
export function useMetricsOwner(on: boolean) {
  const [owner, setOwner] = useState(() => { try { return localStorage.getItem(OWNER) === "1"; } catch { return false; } });
  const view = useViewAs();
  useEffect(() => {
    if (!on) return;
    askOwner().then((o) => { if (o === null) return; setOwner(o); try { localStorage.setItem(OWNER, o ? "1" : "0"); } catch { /* shows next time */ } });
  }, [on]);
  // DT232 (0.3.72): viewed as Coach or User, the owner's pages hide on this phone
  return owner && view === "me";
}

export function MenuScreen(p: AppApi & { section: MenuSection; setSection: (s: MenuSection, up?: boolean) => void; close: () => void; from: MenuSection | null; under?: MenuSection | null }) {
  const { section, setSection, close } = p;
  // the back link goes to the page walked before this one; a page opened straight goes to its parent (M6)
  const from = (p.under ?? p.from) as MenuSection | null;
  if (section === "list")
    return (
      <>
        <div className="menu-head"><h2>{w("menu.menu")}</h2><button className="link" onClick={close}>{w("menu.close")}</button></div>
        <div className="menu-list">
          <button className="menu-row" onClick={() => setSection("me")}><span className="menu-icon"><User size={20} /></span><b>{w("menu.me")}</b><ChevronRight size={18} /></button>
          {/* Foods lives here from 0.2.0 (X0): the library, reached day to day from the Plate's search and Quick picks */}
          <button className="menu-row" onClick={() => p.setTab("foods")}><span className="menu-icon"><BookOpen size={20} /></span><b>{w("menu.foods")}</b><ChevronRight size={18} /></button>
          {/* DT215 v3 (0.3.66, board Stories162b; Coach Milan 23:22 to 23:37): Settings, how the app works, not who you are */}
          <button className="menu-row" onClick={() => setSection("settings")}><span className="menu-icon"><Settings size={20} /></span><span className="menu-row-text"><b>{w("menu.settings")}</b><small>Voice while cooking · Language and Units coming soon</small></span><ChevronRight size={18} /></button>
          {/* DT151 Explorer lived here; DT188 (0.3.30) put it on the bar as the fifth tab */}
          {/* DT188: Admin for the superadmin only: people and roles, coach links, the privacy tracker, the walkthroughs */}
          {p.profile.admin && <button className="menu-row" onClick={() => setSection("admin")}><span className="menu-icon"><ShieldCheck size={20} /></span><span className="menu-row-text"><b>{w("menu.admin")}</b><small>{w("menu.superadminOnly")}</small></span><ChevronRight size={18} /></button>}
          {/* SH73 (Milan 21 October 21:10): a QR code to share chefmealan.com or the book, and for a coach a code to join, shown as a QR code */}
          <ShareRow open={() => setSection("share")} />
          {[{ id: "support" as MenuSection, name: "Support", icon: <LifeBuoy size={20} /> }, ...(p.profile.role === "coach" || !p.cloudEnabled ? [{ id: "evals" as MenuSection, name: "Evals", icon: <FlaskConical size={20} /> }] : [])].map((it) => (
            <button key={it.id} className="menu-row" onClick={() => setSection(it.id)}>
              <span className="menu-icon">{it.icon}</span><b>{it.name}</b><ChevronRight size={18} />
            </button>
          ))}
          <MetricsRow open={() => setSection("metrics")} />
          <CostsRow open={() => setSection("costs")} />
          {/* About at the bottom of the list (Milan, 16 October 2026, 18:43) */}
          <button className="menu-row" onClick={() => setSection("about")}><span className="menu-icon"><Info size={20} /></span><b>{w("menu.about")}</b><ChevronRight size={18} /></button>
        </div>
        <p className="small"><a href="/about">{w("menu.whoSBehindIt")}</a> · <a href="/impressum">{w("menu.impressum")}</a> · <a href="/privacy">{w("menu.privacyNotice")}</a> · <a href="/disclaimer">{w("menu.disclaimer")}</a></p>
        {p.user && <SignOut p={p} />}
      </>
    );
  const title = ITEMS.find((i) => i.id === section)?.name ?? "";
  // a section opens at its top, whatever the scroll of the one before
  useEffect(() => { try { window.scrollTo({ top: 0 }); document.querySelector("main")?.scrollTo?.({ top: 0 }); } catch {} }, [section]);
  return (
    <>
      <div className="menu-head"><button className="link" onClick={() => ((from as string) === "me" || ME_SECTIONS.includes(section) && !from ? setSection("me", true) : setSection(from ?? "list", true))}><ChevronLeft size={16} /> {(from as string) === "me" ? w("menu.me") : from ? (ITEMS.find((i) => i.id === from)?.name ?? w("menu.menu")) : ME_SECTIONS.includes(section) ? w("menu.me") : w("menu.menu")}</button><button className="link" onClick={close}>{w("menu.close")}</button></div>
      <h2 className="menu-title">{section === "me" ? w("menu.me") : title}</h2>
      {section === "me" && <MeScreen {...p} />}
      {section === "profile" && <ProfilePanel {...p} />}
      {section === "goal" && <GoalPanel {...p} />}
      {section === "life" && <LifestylePanel {...p} />}
      {section === "week" && <PlanPanel {...p} />}
      {section === "shop" && <ShopPanel {...p} />}
      {section === "coach" && <CoachPanel {...p} />}
      {section === "summary" && <SummaryPanel {...p} />}
      {section === "calendar" && <CalendarPage p={p} />}
      {section === "account" && <AccountPanel {...p} />}
      {section === "support" && <SupportPanel {...p} />}
      {section === "about" && <AboutPanel />}
      {section === "evals" && <EvalsScreen {...p} />}
      {section === "metrics" && <MetricsScreen />}
      {section === "costs" && <CostsScreen />}
      {section === "share" && <ShareGuard {...p} />}
      {section === "explorer" && <ExplorerScreen {...p} />}
      {section === "admin" && <AdminPanel {...p} />}
      {section === "settings" && <><p className="small">{w("menu.howTheAppWorksFor")}</p><DevSettings p={p} open={(id) => setSection(id)} /></>}
      {section === "dev" && <DevGuard p={p} />}
      {section === "language" && <LanguagePanel hasCoach={!!p.profile.coachId} />}
      {section === "voice" && <><p className="small">{w("menu.howChefMealanReadsTo")}</p><VoiceSettingsPanel /></>}
    </>
  );
}

function ProfilePanel(p: AppApi) {
  const [name, setName] = useState(p.clientName);
  const [d, setD] = useState<Personal>(p.personal);
  const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")) || undefined);
  const consented = Boolean(p.safety.consentBodyAt);
  // DT205 (0.3.48, board Stories152; Coach Milan 1 November 19:42): no Save button in the middle of the page. A choice is kept
  // the moment it is tapped, a typed number a moment after typing stops and when you leave the field or the page. A number
  // that cannot be right (a birth year of two digits while typing) waits, and the line under the card says which.
  const odd = profileOdd(d);
  const latest = useRef({ name, d, p }); latest.current = { name, d, p };
  const keep = () => {
    const { name: n, d: x, p: q } = latest.current;
    if (!q.safety.consentBodyAt || profileOdd(x)) return;
    if (n.trim() !== q.clientName) q.setClientName(n.trim());
    if (JSON.stringify(x) !== JSON.stringify(q.personal)) { if (x.pdUnit !== q.personal.pdUnit) log("pd_unit", { unit: x.pdUnit ?? "pd" }); q.setPersonal(x); }
  };
  useEffect(() => { const t = setTimeout(keep, 700); return () => clearTimeout(t); }, [name, d]);
  useEffect(() => () => keep(), []);
  // DT208 (0.3.49, board Stories155): what the numbers still need from this page, read from what is typed now
  const needNow = setupMissing({ personal: d, safety: p.safety, goal: true, region: "x" }).filter((x) => x.step === "profile");
  const [left, setLeft] = useState(false);
  const focusField = (f?: string) => { if (!f) return; const el = document.getElementById(`pf-${f}`); if (!el) return; el.scrollIntoView({ block: "center", behavior: "smooth" }); el.querySelector<HTMLElement>("input, button")?.focus({ preventScroll: true }); };
  // a row on Today or Me sends you to a field
  useEffect(() => { const f = takeFocus(); if (f) window.setTimeout(() => focusField(f), 350); }, []);
  return (
    <>
      <p className="small">{w("menu.allOfThisIsOptional")}</p>
      {consented && (
        <p className="small consent-line">You agreed to the body data on {fmtDay(p.safety.consentBodyAt!)}. It is in your export, and goes with everything else when you delete the account.</p>
      )}
      {!consented && (
        <section className="card consent" aria-label={w("menu.beforeYourNumbers")}>
          <b>{w("menu.beforeYourNumbers")}</b>
          <p className="small">{w("menu.toCalculateYourDayChef")}</p>
          <ul className="small">
            <li><b>Kept:</b> {w("menu.onlyThoseValuesAndThe")}</li>
            <li><b>Where:</b> {w("menu.onThisPhoneAndIn")}</li>
            <li><b>How long:</b> {w("menu.whileTheAccountExists")}</li>
            <li><b>Yours:</b> {w("menu.exportItOrDeleteIt")}</li>
          </ul>
          <p className="small">{w("menu.nothingAboutYourBodyIs")} <a href="/privacy">{w("menu.privacyNotice2")}</a>.</p>
          <div className="button-row">
            <button className="pill pill-small pill-primary" onClick={() => p.declareSafety({ consentBodyAt: new Date().toISOString(), consentBy: "self" })}>{w("menu.iAgree")}</button>
          </div>
        </section>
      )}
      <section className={`card form ${consented ? "" : "shut"}`} aria-disabled={!consented}>
        <label className="field"><span>{w("menu.name")}</span><input value={name} placeholder={w("menu.yourName")} onChange={(e) => setName(e.target.value)} /></label>
        <div className="field" id="pf-sex"><span>{w("menu.yourBody")}</span>
          <div className="moments">
            {(["female", "male"] as const).map((s) => <button key={s} className={`choice ${d.sex === s ? "on" : ""}`} onClick={() => setD({ ...d, sex: d.sex === s ? undefined : s })}>{s === "female" ? "Female" : "Male"}</button>)}
          </div>
        </div>
        <div className="field-row" onBlur={() => setLeft(true)}>
          <label className="field" id="pf-birthYear"><span>{w("menu.birthYear")}</span><input inputMode="numeric" value={d.birthYear ?? ""} placeholder="enter year" onChange={(e) => setD({ ...d, birthYear: num(e.target.value) })} /></label>
          <HeightField id="pf-height" cm={d.heightCm} unit={cleanUnits(d.units).height} onCm={(v) => setD((x) => ({ ...x, heightCm: v }))} />
          <WeightField id="pf-weight" kg={d.weightKg} unit={cleanUnits(d.units).weight} onKg={(v) => setD((x) => ({ ...x, weightKg: v }))} />
        </div>
        {/* DT208 (0.3.49): a field the numbers need says so when you leave it empty */}
        {left && needNow.filter((x) => ["birthYear", "height", "weight"].includes(x.field ?? "")).map((x) => <small key={x.label} className="field-need">{x.label.replace(/^./, (c) => c.toUpperCase())}: needed for your numbers.</small>)}
        <label className="field"><span>Body fat %, if you know it</span><input inputMode="decimal" value={d.bodyFatPct ?? ""} placeholder="from a scale or a scan" onChange={(e) => setD({ ...d, bodyFatPct: num(e.target.value) })} /></label>
        <div className="field"><span>{w("menu.yourWork")}</span>
          <div className="activity-list">
            {LIFE.map((l) => (
              <button key={l.id} className={`activity ${workOf(d) === l.id ? "on" : ""}`} onClick={() => setD(withWork(d, l.id))}>
                <b>{l.name}</b><small>{l.hint}</small>
              </button>
            ))}
          </div>
          <small className="muted">{w("menu.yourTrainingGoesInThe")}</small>
        </div>
        {/* Units (0.2.18, canvas board UN, UN1 and UN2): shown in these, kept in kg, cm and °C */}
        {(() => {
          const u = cleanUnits(d.units), set = (k: keyof Units, v: string) => setD((x) => ({ ...x, units: { ...cleanUnits(x.units), [k]: v } }));
          const chip = (k: keyof Units, v: string, label: string) => <button type="button" key={v} className={`choice ${u[k] === v ? "on" : ""}`} aria-pressed={u[k] === v} onClick={() => set(k, v)}>{label}</button>;
          const h = d.heightCm ? ftIn(d.heightCm) : null;
          return (
            <div className="field units-box" role="group" aria-label={w("menu.units")}><span>{w("menu.units")}</span>
              <b>{w("menu.temperature")}</b>
              <div className="moments">{chip("temp", "c", "°C")}{chip("temp", "f", "°F")}</div>
              <small className="muted">{u.temp === "c" ? `Oven heat in the steps: 175 °C. A recipe in °F is converted for you: 350 °F is ${175} °C.` : `Oven heat in the steps: ${asF(175)} °F. A recipe in °C is converted for you.`}</small>
              <b>{w("menu.bodyWeight")}</b>
              <div className="moments">{chip("weight", "kg", "kg")}{chip("weight", "lb", "lb")}</div>
              <small className="muted">{u.weight === "kg" ? w("menu.weighInsYourGoalAnd") : d.weightKg ? `${Math.round(d.weightKg * 10) / 10} kg is ${(Math.round(kgToLb(d.weightKg) * 10) / 10).toFixed(1)} lb, on weigh-ins and your goal.` : w("menu.weighInsYourGoalAnd2")}</small>
              <b>{w("menu.height")}</b>
              <div className="moments">{chip("height", "cm", "cm")}{chip("height", "ftin", "ft and in")}</div>
              {u.height === "ftin" && h && <small className="muted">{Math.round(d.heightCm!)} cm is {h.ft} ft {h.inch} in.</small>}
              <small className="muted">{w("menu.foodAmountsStayInGrams")}</small>
            </div>
          );
        })()}
        {/* M3 (0.2.5+r4, Milan's layout, 11 October 2026): each chip with its definition beside it, then the day in both forms */}
        <div className="field pd-unit"><span>{w("menu.showProteinDensityAs")}</span>
          <div className="pd-unit-row"><button type="button" className={`choice ${(d.pdUnit ?? "pd") === "pd" ? "on" : ""}`} aria-pressed={(d.pdUnit ?? "pd") === "pd"} onClick={() => setD({ ...d, pdUnit: "pd" })}>PD</button><span>{w("menu.gProteinPerKcal")}</span></div>
          <div className="pd-unit-row"><button type="button" className={`choice ${d.pdUnit === "pct" ? "on" : ""}`} aria-pressed={d.pdUnit === "pct"} onClick={() => setD({ ...d, pdUnit: "pct" })}>%</button><span>% of calories from protein</span></div>
          {(() => {
            const kcal = p.todayMacros?.kcal ?? p.state.goals.calories, pro = p.todayMacros?.protein ?? p.state.goals.protein;
            if (!kcal || !pro) return <small className="pd-unit-day">For example: 5 g of protein in 100 kcal is PD 5, or 20 % (20 of 100 kcal).</small>;
            const pd = (100 * pro) / kcal;
            return <small className="pd-unit-day">Your day: {Math.round(pro)} g of protein in {Math.round(kcal).toLocaleString(numLocale())} kcal. That is PD {pd.toFixed(1)}, or {Math.round(pd * 4)} % ({Math.round(pro * 4).toLocaleString(numLocale())} of {Math.round(kcal).toLocaleString(numLocale())} kcal).</small>;
          })()}
        </div>
        <small className={`muted saved-line ${odd ? "odd" : ""}`} role="status">{!consented ? "" : odd ? `Not kept yet: ${odd}.` : w("menu.keptAsYouGoNothing")}</small>
      </section>
      <div id="pf-health"><SafetyQuestion p={p} /></div>
      <NextLink p={p} to="goal" from="profile" text={w("me2.goal")} hint={canCalculate(d) ? w("menu.calculateYourDailyNumbersFrom") : w("menu.yourGoalAndDailyNumbers")} before={keep} />
      {/* DT208: Next goes on; under it, what is still missing, the whole line a link to that field */}
      {needNow.length > 0 && <button type="button" className="setup-line" onClick={() => focusField(needNow[0].field)}><span>Still needed for your numbers: {needNow.map((x) => x.label).join(", ")}</span><ChevronRight size={18} aria-hidden="true" /></button>}
    </>
  );
}

const fmtDay = (iso: string) => dateText(new Date(iso), { day: "numeric", month: "long", year: "numeric" }, []).replace(/\.$/, "");
// DT168 (0.3.10): sign-out saves everything, then clears the phone. When something can't be saved, it says so and asks
function SignOut({ p, inline }: { p: AppApi; inline?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "unsaved">("idle");
  const go = async (force: boolean) => { setState("busy"); const ok = await p.signOut(force); if (!ok) setState("unsaved"); };
  const btn = state === "unsaved"
    ? <><button className="pill pill-small danger" onClick={() => go(true)}>{w("menu.signOutAnyway")}</button><button className="pill pill-small" onClick={() => setState("idle")}>{w("menu.staySignedIn")}</button></>
    : <button className="pill pill-small" disabled={state === "busy"} onClick={() => go(false)}>{state === "busy" ? w("menu.savingThenSigningOut") : w("menu.signOut")}</button>;
  const note = state === "unsaved" && <small className="setting-hint sign-out-note">{w("menu.notEverythingIsSavedTo")}</small>;
  if (inline) return <>{btn}{note}</>;
  return <div className="button-row" style={{ marginTop: 12, flexWrap: "wrap" }}>{btn}{note}</div>;
}
// DT205 (0.3.48; Coach Milan 1 November 19:42 "Goal as the cta is not prominent"): the next step is the main button at the end
// of each step, the same everywhere, with its line under it
function NextLink({ p, to, from, text, hint, before }: { p: AppApi; to: MenuSection; from: MenuSection; text: string; hint: string; before?: () => void }) {
  return (
    <div className="next-step">
      <button className="pill pill-primary pill-wide" onClick={() => { before?.(); p.openMenu(to, from); }}>Next: {text} <ChevronRight size={18} /></button>
      <small className="muted">{hint}</small>
    </div>
  );
}
function GoalPanel(p: AppApi) {
  const { state, goal, openGoal, resetGoal } = p;
  const band = goal?.band ? bandOf(goal.band) : null;
  const setBy = goal?.setBy === "coach" ? `Coach ${(goal.coachName || p.profile.coachName || COACH_NAME).split(" ")[0]}` : "you";
  const mode = dayModeOf(p.personal);
  const ownWay = goal?.source === "exact" || goal?.source === "coach";
  const c = calculate(p.personal, band?.id ?? "maintain", p.formula);
  const o = ownWay ? ownDayNumbers(p.personal, band?.id ?? "maintain", p.formula) : null;
  // the goal sheet (canvas board K2): what you and your coach agree on
  const approved = p.review?.status === "approved" ? { approvedBy: p.review.by || p.coachLabel, approvedAt: p.review.at } : {};
  const sheet = sheetOf(goal, { weightKg: p.personal.weightKg, trainingAge: p.personal.trainingAge, coachLabel: p.coachLabel, ...approved });
  const [about, setAbout] = useState(false);
  return (
    <>
      <section className="plan goal-head">
        <div className="plan-top"><small className="eyebrow-line">{w("menu.yourGoal")}</small><span className="goal-src">{ownWay ? (goal?.setBy === "coach" ? `set by ${setBy}` : "your own numbers") : "calculated for you"}</span></div>
        <b className="goal-name">{band ? goalName(band.id) : w("menu.notSetYet")}</b>
        {band && <span className="goal-who">{band.who}</span>}
        {p.review && p.review.status !== "closed" && ownWay && (
          <span className={`review-state ${p.review.status}`}>
            {p.review.status === "waiting" ? `Waiting for ${p.coachLabel}: ${p.review.kept?.length ?? 0} kept on purpose` : p.review.status === "approved" ? `Approved by ${p.review.by || p.coachLabel}, ${new Date(p.review.at).toLocaleDateString("en", { day: "numeric", month: "long" })}` : `${p.review.by || p.coachLabel} asks you to change ${p.review.kept?.length === 1 ? "one number" : "your numbers"}`}
          </span>
        )}
        {mode === "same" || (!c && !o) ? (
          <>
            <div className="plan-row">
              <div><b>{pdVal(p.dayPd)}</b><small>{pdTag()} target</small></div>
              <div><b>{fmt(state.goals.calories, 0)}</b><small>{w("menu.kcalADay")}</small></div>
              <div><b>{fmt(state.goals.protein, 0)}</b><small>{w("menu.gProtein")}</small></div>
            </div>
            {state.goals.fats != null && state.goals.carbs != null && <p className="macro-line">{fmt(state.goals.fats, 0)} g fat · {fmt(state.goals.carbs, 0)} g carbs · every day the same</p>}
          </>
        ) : null}
      </section>
      {p.personal.nextGoal && (() => {
        // a goal applied from a later date waits here (canvas board FX, G2)
        const ng = p.personal.nextGoal, day = new Date(`${ng.from}T12:00:00`);
        return (
          <section className="card next-goal" aria-label={w("menu.nextGoal")}>
            <small className="next-goal-when">NEXT, FROM {day.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase().replace(",", "")}</small>
            <b>{goalName(ng.band)}</b>
            <small>{ng.setBy === "coach" ? `Set by ${p.coachLabel}. ` : ""}{ng.kcal.toLocaleString(numLocale())} kcal and {ng.protein} g protein a day on average. Plan already uses it from {day.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.</small>
            {/* a goal from the coach (canvas board CW, CW9): Reply instead of Change the date and Cancel */}
            {ng.setBy === "coach"
              ? <div className="button-row"><button className="pill pill-small" onClick={() => { const r = window.prompt(`Reply to ${p.coachLabel}`); if (r && r.trim()) { p.replyToCoach(r.trim()); p.notify(`Sent to ${p.coachLabel}.`); } }}>Reply to {p.coachLabel}</button></div>
              : <div className="button-row"><button className="pill pill-small" onClick={openGoal}>{w("menu.changeTheDate")}</button><button className="link link-danger" onClick={() => { p.cancelNextGoal(); p.notify("The next goal is cancelled."); }}>{w("menu.cancel")}</button></div>}
          </section>
        );
      })()}
      {sheet && <GoalSheet sheet={sheet} />}
      {band && p.safety.consentBodyAt && !weighInsOff(p.safety) && (
        <WeightTrend list={p.personal.weighIns} band={band.id} weightKg={p.personal.weightKg} trainingAge={p.personal.trainingAge}
          onUpdateWeight={(kg) => { p.setPersonal({ ...p.personal, weightKg: kg }); p.notify(`Your numbers now use ${wText(kg, 0)}.`); }}
          onRemove={(date) => p.setPersonal({ ...p.personal, weighIns: withoutWeighIn(p.personal.weighIns, date) })} />
      )}
      {band && guideOf(band.id) && (
        <>
          <button className="link about-goal" aria-expanded={about} onClick={() => setAbout((v) => !v)}>{about ? w("menu.closeAboutYourGoal") : w("menu.aboutYourGoal")}</button>
          {about && <GoalGuide id={band.id} />}
        </>
      )}
      {!ownWay && c && <ProteinCard c={c} />}
      {p.review?.status === "change" && ownWay && (
        <section className="coach-note">
          <small>{p.review.by || p.coachLabel}, {new Date(p.review.at).toLocaleDateString("en", { day: "numeric", month: "long" })}</small>
          <b>{p.review.note || w("menu.pleaseLookAtYourNumbers")}</b>
          {p.review.kept?.length ? <small>About: {p.review.kept.map((k) => k.title.toLowerCase()).join("; ")}</small> : null}
          <div className="button-row">
            <button className="pill pill-small pill-primary" onClick={openGoal}>{w("menu.changeMyNumbers")}</button>
            <button className="pill pill-small" onClick={() => { const r = window.prompt(`Reply to ${p.review?.by || p.coachLabel}`); if (r && r.trim()) void p.sendReview(p.review?.kept ?? [], p.review?.summary ?? "", r.trim()); }}>Reply to {p.review.by || p.coachLabel}</button>
          </div>
        </section>
      )}
      {mode === "each" && (o || c) && (
        <>
          <p className="label">{w("menu.yourDaysEachItsOwn")}</p>
          {o ? <DayTable rows={o.days} avg={o.avg} week={weekOf(p.personal)} /> : <DayTable rows={c!.days} avg={{ kcal: c!.kcal, protein: c!.protein }} week={c!.week} weekdays={c!.weekdays} />}
        </>
      )}
      {ownWay && (() => {
        const burn = canCalculate(p.personal) ? calculate(p.personal, "maintain", p.formula)?.kcal ?? null : null;
        const src = o ?? (state.goals.calories && state.goals.protein ? { days: Object.fromEntries(DAY_TYPES.map((x) => [x.id, { kcal: state.goals.calories!, protein: state.goals.protein!, fats: state.goals.fats ?? 0, carbs: state.goals.carbs ?? 0, how: [] }])) as any, avg: { kcal: state.goals.calories!, protein: state.goals.protein!, fats: state.goals.fats ?? 0 } } : null);
        if (!src) return null;
        const a = analyse({ days: src.days, avg: src.avg, bandId: band?.id ?? "maintain", personal: p.personal, burn });
        const kept = a.findings.filter((f) => !openAt(f, p.personal)).length, open = a.findings.length - kept;
        return (
          <button className="menu-row analysis-row" onClick={openGoal}>
            <span className="menu-row-text"><b>{w("menu.targetAnalysis")}</b><small>{a.findings.length ? `${a.findings.length} finding${a.findings.length === 1 ? "" : "s"}${kept ? `, ${kept} kept on purpose` : ""}${open ? `, ${open} open` : ""}` : w("menu.everythingInRange")}</small></span><ChevronRight size={18} />
          </button>
        );
      })()}
      <div className="button-row" style={{ marginTop: 12 }}>
        <button className="pill pill-small pill-primary" onClick={openGoal}><Calculator size={14} /> {w("menu.changeTheGoal")}</button>
        <ConfirmButton className="pill pill-small" label={<><RotateCcw size={14} /> {w("menu.reset")}</>} confirmLabel={w("menu.tapAgainToReset")} onConfirm={resetGoal} />
      </div>
      <p className="label">{w("menu.howYourNumbersWork")}</p>
      {/* the formula is picked in the calculator (canvas board FX, G1a); here one line says which one is in use */}
      {canCalculate(p.personal) && !isMinor(p.personal) && (
        <section className="card you-card formula-line">
          <span><b>{w("menu.formula")}</b><small>{p.formula ? `${FORMULA_NAME[p.formula]}, set by ${p.coachLabel}` : p.personal.formula ? FORMULA_NAME[p.personal.formula] : `Automatic: ${p.personal.bodyFatPct ? w("menu.katchMcardle") : w("menu.mifflinStJeor")} now`}{(p.formula ?? p.personal.formula) === "data" && p.personal.measuredUse ? ` · ${p.personal.measuredUse.kcal.toLocaleString(numLocale())} kcal a day to stay the same` : p.formulaKcal ? ` · ${p.formulaKcal.toLocaleString(numLocale())} kcal a day to stay the same` : ""}</small></span>
          <button className="link" onClick={() => openGoal("formula")}>{w("menu.change")}</button>
        </section>
      )}
      {/* the measured burn, next to the formula (0.2.7, board FT, FT3 and FT4) */}
      {p.measured && canCalculate(p.personal) && !isMinor(p.personal) && (
        <BurnCard m={p.measured} formulaKcal={p.formulaKcal} inUse={(p.formula ?? p.personal.formula) === "data" ? p.personal.measuredUse ?? null : null} onUse={p.formula ? undefined : p.useMyData} />
      )}
      <section className="card explain">
        <p><b>{w("menu.atRest")}</b> {w("menu.whatYourBodyBurnsDoing")}</p>
        <p><b>{w("menu.yourEveryday")}</b> {w("menu.thatTimesHowYourWork")}</p>
        <p><b>{w("menu.yourTraining")}</b> {w("menu.eachTrainingDayAddsWhat")}</p>
        <p><b>{w("menu.yourGoal2")}</b> Minus 20 % to lose fat, minus 10 % for recomposition, plus 5 % to build muscle steadily, plus 10 % to build it faster, plus 5 % for performance.</p>
        <p><b>{w("menu.protein")}</b> 1.6 to 2.2 g per kg if you train twice a week or more, else 1.2 to 1.6. The same every day; the energy moves with the training.</p>
        <small>Sources: Mifflin et al. 1990; Katch and McArdle; Schofield 1985 (FAO/WHO/UNU); FAO/WHO/UNU 2004 activity levels; Compendium of Physical Activities 2024; US Dietary Guidelines 2025–2030; ISSN position stand 2017; Morton et al. 2018.</small>
      </section>
      <GoalHistory log={p.goalLog} />
      <NextLink p={p} to="life" from="goal" text={w("me2.lifestyle")} hint={w("me.lifeHint")} />
    </>
  );
}

// History as periods (canvas board FX, G3): only goals that were applied, each with the days it held, newest first
export function GoalHistory({ log }: { log: GoalEntry[] }) {
  const periods = periodsOf(log);
  if (!periods.length) return null;
  return (
    <>
      <p className="label">{w("menu.history")}</p>
      <section className="card history">
        {periods.slice(0, 20).map(({ entry: e, ...pr }) => (
          <div className="history-row" key={e.at}>
            <div><b>{e.band ? goalName(e.band) : "Custom"}{pr.now && <span className="now-tag">NOW</span>}</b><small>{periodLine({ entry: e, ...pr })}{SOURCE_LABEL[e.source] ? `, ${SOURCE_LABEL[e.source].charAt(0).toLowerCase()}${SOURCE_LABEL[e.source].slice(1)}` : ""}{e.weightKg ? `, at ${wText(e.weightKg, Number.isInteger(wIn(e.weightKg)) ? 0 : 1)}` : ""}</small></div>
            <div className="history-num"><b>{e.kcal !== null ? e.kcal.toLocaleString(numLocale()) : "?"}</b><small>kcal, {e.protein ?? "?"} g protein</small></div>
          </div>
        ))}
      </section>
    </>
  );
}

function Seg({ title, why, children }: { title: string; why: string; children: ReactNode }) {
  return (
    <>
      <div className="seg-head"><b>{title}</b><small>{why}</small></div>
      <section className="card seg">{children}</section>
    </>
  );
}
function Setting({ name, hint, children }: { name: string; hint?: string; children: ReactNode }) {
  return <div className="setting"><small className="setting-name">{name}</small>{children}{hint && <small className="setting-hint">{hint}</small>}</div>;
}
function Chips<T extends string | number>({ items, on, pick, multi }: { items: { id: T; name: string }[]; on: T | T[] | undefined; pick: (v: T) => void; multi?: boolean }) {
  const isOn = (v: T) => (multi ? ((on as T[] | undefined) ?? []).includes(v) : on === v);
  return <div className="chip-row">{items.map((x) => <button type="button" key={String(x.id)} className={`choice ${isOn(x.id) ? "on" : ""}`} aria-pressed={isOn(x.id)} onClick={() => pick(x.id)}>{x.name}</button>)}</div>;
}
function Options<T extends string>({ items, on, pick }: { items: { id: T; name: string; hint: string }[]; on: T | undefined; pick: (v: T) => void }) {
  return <div className="opt-grid">{items.map((x) => <button type="button" key={x.id} className={`opt ${on === x.id ? "on" : ""}`} aria-pressed={on === x.id} onClick={() => pick(x.id)}><b>{x.name}</b><small>{x.hint}</small></button>)}</div>;
}

// Lifestyle, as approved on 6 October 2026: how life runs most weeks, set once. Nutrition first, then Work, then Recovery.
function LifestylePanel(p: AppApi) {
  const l = lifestyleOf(p.personal);
  const save = (patch: Partial<Lifestyle>) => {
    const next = { ...l, ...patch };
    p.setPersonal({ ...p.personal, lifestyle: next });
    p.setUsual(usualFrom(next, planOf(p.personal)));
  };
  const age = ageOf(p.personal);
  // under 18: school instead of work, no eating window, no alcohol question; the age comes from the profile
  const minor = isMinor(p.personal);
  // DT166: from Plan's Slots and times, straight to Meals, now below work and sleep
  useEffect(() => { let j: string | null = null; try { j = sessionStorage.getItem("cm-jump"); sessionStorage.removeItem("cm-jump"); } catch {}
    if (j === "meals") { const t = setTimeout(() => document.getElementById("meals")?.closest(".seg")?.previousElementSibling?.scrollIntoView({ block: "start" }), 150); return () => clearTimeout(t); } }, []);
  const wk = weekdaysOf(l);
  const toggle = (v: string) => save({ where: (l.where ?? []).includes(v) ? (l.where ?? []).filter((x) => x !== v) : [...(l.where ?? []), v] });
  const asItems = (xs: string[]) => xs.map((x) => ({ id: x, name: optWord(x) }));
  return (
    <>
      <p className="small muted page-why">{minor ? w("menu.howYourLifeRunsIn") : w("menu.howYourLifeRunsMost")}</p>
      {minor ? (
        <Seg title={w("menu.school")} why={w("life.whySchool")}>
          <Setting name={w("life.schoolHours")}><Options items={SCHOOL_HOURS} on={l.school} pick={(v) => save({ school: v })} /></Setting>
          <Setting name={w("life.toSchool")} hint={w("life.toSchoolHint")}><Chips items={COMMUTES} on={l.commute} pick={(v) => save({ commute: v })} /></Setting>
          <Setting name={w("life.peSchool")} hint={w("life.peHint")}><Chips items={PE_WEEK} on={l.peWeek} pick={(v) => save({ peWeek: v })} /></Setting>
        </Seg>
      ) : (
        // Release B (7 October 2026, canvas B1 and B3): what fills the weekdays first; the questions after it follow the answer
        <Seg title={w("menu.workAndStudy")} why={w("life.whyWeek")}>
          <Setting name={w("life.weekdays")}><Options items={WEEKDAY_CHOICES} on={wk} pick={(v) => save({ weekdays: v, ...(v !== "home" && l.hours === "none" ? { hours: undefined } : {}) })} /></Setting>
          {(wk === "work" || wk === "both") && (
            <>
              <Setting name={w("life.workingHours")} hint={l.hours === "fixed" ? w("menu.withFixedHoursMondayTo") : undefined}>
                <Options items={HOURS_SHOWN} on={l.hours === "none" ? undefined : l.hours} pick={(v) => save({ hours: v })} />
                {l.hours === "fixed" && <Chips items={SLOTS} on={l.slot} pick={(v) => save(v === "my" ? { slot: v, workFrom: l.workFrom ?? SLOT_HOURS[l.slot ?? "9-5"]?.from ?? "09:00", workTo: l.workTo ?? SLOT_HOURS[l.slot ?? "9-5"]?.to ?? "17:00" } : { slot: v })} />}
                {/* DT147 (0.2.128, Tester 3 works Canadian hours from Cyprus): My hours, From and To, your local time */}
                {l.hours === "fixed" && l.slot === "my" && (
                  <div className="time-rows my-hours">
                    <label className="time-row"><span>{w("menu.from")}</span><input type="time" value={l.workFrom ?? "09:00"} aria-label={w("menu.workFrom")} onChange={(e) => e.target.value && save({ workFrom: e.target.value })} /></label>
                    <label className="time-row"><span>{w("menu.to")}</span><input type="time" value={l.workTo ?? "17:00"} aria-label={w("menu.workTo")} onChange={(e) => e.target.value && save({ workTo: e.target.value })} /></label>
                    <small className="setting-hint">{l.workFrom ?? "09:00"} to {l.workTo ?? "17:00"}{toMin(l.workTo ?? "17:00") <= toMin(l.workFrom ?? "09:00") ? " the next day" : ""}, your time. Meals and training fit around it.</small>
                  </div>
                )}
              </Setting>
              <Setting name={w("life.atWork")}><Options items={MOVES} on={l.move ?? "sitting"} pick={(v) => save({ move: v })} /></Setting>
              <Setting name={w("life.workTravel")}><Chips items={[{ id: "none", name: "None" }, { id: "sometimes", name: "Occasionally" }, { id: "often", name: "A lot" }]} on={l.travel} pick={(v) => save({ travel: v as Lifestyle["travel"] })} /></Setting>
            </>
          )}
          {(wk === "study" || wk === "both") && (
            <>
              <Setting name={w("life.studyHours")}><Options items={STUDY_HOURS} on={l.school === "none" ? undefined : l.school} pick={(v) => save({ school: v })} /></Setting>
              <Setting name={w("life.getThere")} hint={w("life.getThereHint")}><Chips items={COMMUTES} on={l.commute} pick={(v) => save({ commute: v })} /></Setting>
              <Setting name={w("life.peStudy")} hint={w("life.peStudyHint")}><Chips items={PE_WEEK} on={l.peWeek} pick={(v) => save({ peWeek: v })} /></Setting>
            </>
          )}
          {wk === "home" && <p className="small muted">{w("menu.yourDaysAreSpentAt")}</p>}
        </Seg>
      )}
      <Seg title={w("menu.recovery")} why={minor ? w("menu.sleepIsWhenYourBody") : w("menu.sleepIsWhereTrainingTurns")}>
        <Setting name={w("life.wake")} hint={minor ? undefined : w("menu.setsYourFirstMealBelow")}><Chips items={minor ? [{ id: "early", name: w("menu.before") }, { id: "mid", name: w("menu.sixToSeven") }, { id: "late", name: w("menu.after") }] : [{ id: "early", name: w("menu.before2") }, { id: "mid", name: w("menu.sixToEight") }, { id: "late", name: w("menu.after2") }, { id: "varies", name: w("menu.variesWithShifts") }]} on={l.wake} pick={(v) => save({ wake: v as Lifestyle["wake"] })} /></Setting>
        <Setting name={w("life.bed")} hint={minor ? undefined : w("menu.setsYourLastMealBelow")}><Chips items={[{ id: "early", name: w("menu.before3") }, { id: "mid", name: w("menu.tenToMidnight") }, { id: "late", name: w("menu.afterMidnight") }, ...(minor ? [] : [{ id: "varies", name: w("menu.variesWithShifts") }])]} on={l.bed} pick={(v) => save({ bed: v as Lifestyle["bed"] })} /></Setting>
      </Seg>
      {/* DT166 (0.3.8, board Stories118 version 2; Coach Milan 30 October 08:28): the natural order. Your work, wake-up and bedtime
          come first and set the meal times; the meal times come after them, and any time you change there stays yours. */}
      <Seg title={w("menu.meals")} why={minor ? w("menu.howManyMealsADay") : w("menu.whenYouEatTheTimes")}>
        <span id="meals" />
        <Setting name={w("life.mealsADay")} hint={minor ? w("menu.snacksCountAsAMeal") : undefined}><Chips items={(minor ? [2, 3, 4, 5] : [1, 2, 3, 4, 5]).map((n) => ({ id: n, name: n === 5 ? w("life.fiveOrMore") : String(n) }))} on={l.meals} pick={(n) => save({ meals: n })} /></Setting>
        {/* 0.2.1: the slots Plan shows, with their times. M8 (11 October 2026): the times are what I set; the eating window
            follows from them, first meal to last, and is no longer set by hand. A window set before is where the times start. */}
        <Setting name={w("life.mealTimes")} hint={w("life.mealTimesHint")}>
          {/* DT147 (0.2.128): one line per meal, the name left and the time right, so it never runs past the card on an iPhone */}
          <div className="time-rows slot-times">
            {slotsOf(l).map((s) => <label key={s.id} className="time-row"><span>{l.meals === 1 ? w("menu.yourMeal") : mealName(s.name)}</span><input type="time" value={s.time} aria-label={w("life.slotTime", { meal: mealV(s.name) })} onChange={(e) => e.target.value && save({ slotTimes: { ...(l.slotTimes ?? {}), [s.id]: e.target.value } })} /></label>)}
            {/* DT166: a time you set yourself stays; when work, wake-up or bedtime would give another, one tap takes it back */}
            {(() => { const auto = slotsOf({ ...l, slotTimes: undefined }); return slotsOf(l).filter((s) => l.slotTimes?.[s.id] && auto.find((a) => a.id === s.id)!.time !== s.time).map((s) => { const a = auto.find((x) => x.id === s.id)!.time;
              const { [s.id]: _drop, ...rest } = l.slotTimes ?? {};
              return <small key={s.id} className="setting-hint own-time">{l.meals === 1 ? "Your meal" : s.name} at {s.time} is your own time. <button type="button" className="link" onClick={() => save({ slotTimes: rest })}>Back to {a}</button></small>; }); })()}
          </div>
          {(() => { const wq = workHoursOf(l); if (!wq || !timesFromWork(l)) return null; const late = toMin(wq.from) >= 11 * 60;
            return <small className="setting-hint from-work">From your work hours, {wq.from} to {wq.to}: {late ? "breakfast late morning, the main meal an hour before work, a small one at the break" : "breakfast before work, lunch at the halfway break, dinner after"}. Change any time and yours stays.</small>; })()}
          {/* DT166 (0.3.8, board Stories118): wake-up and bedtime set the first and last meal, the rest evenly between */}
          {!minor && timesFromSleep(l) && (() => { const sw = sleepWindow(l)!;
            return <small className="setting-hint from-sleep">From your wake-up and bedtime, above: the first meal at {sw.from}, an hour and a half after you wake; the last at {sw.to}, two hours before bed; the rest evenly between. Change any time and yours stays.</small>; })()}
        </Setting>
        {/* DT134 (0.2.113, board Stories89): one meal a day eats within an hour from the meal, and the meal carries the day */}
        {!minor && l.meals === 1 && (() => { const wq = windowOf(l)!; return <p className="window-line">{w("life.windowOne", { from: wq.from, to: wq.to, kcal: fmt(p.state.goals.calories, 0), protein: fmt(p.state.goals.protein, 0) })}</p>; })()}
        {!minor && l.meals !== 1 && (() => { const t = slotsOf(l).map((x) => x.time).sort(); return <p className="window-line">{w("life.window", { from: t[0], to: t[t.length - 1] })}</p>; })()}
      </Seg>
      <Seg title={w("menu.nutrition")} why={minor ? w("menu.howYouUsuallyEatChef") : w("menu.howYouUsuallyEatAnd")}>
        <Setting name={w("life.whereEat")} hint={w("life.pickAll")}><Chips items={asItems(minor ? WHERE_KID : WHERE)} on={l.where} pick={toggle} multi /></Setting>
        <Setting name={w("life.whatEat")}>
          <Chips items={asItems(DIETS)} on={l.diet ?? "Everything"} pick={(v) => save({ diet: v })} />
          {/* DT161 (0.3.3, board Stories113): what each diet means, Meat only's effect on the numbers, Other in your words */}
          {l.diet === "Meat only" && <small className="setting-hint diet-hint">{optWord(DIET_MEANS["Meat only"])} They bring almost no carbs, so your carbs come close to zero. Very low carb fits your numbers: <button type="button" className="link" onClick={() => p.openGoal()}>{w("menu.setItUnderGoal")}</button></small>}
          {l.diet && l.diet !== "Meat only" && DIET_MEANS[l.diet] && <small className="setting-hint diet-hint">{optWord(DIET_MEANS[l.diet])}</small>}
          {l.diet === "Other" && <label className="field diet-other"><span>{w("menu.howYouEatInYour")}</span><input value={l.dietOther ?? ""} maxLength={120} placeholder="for example Mediterranean, no gluten" onChange={(e) => save({ dietOther: e.target.value })} /></label>}
          {!minor && <small className="setting-hint">{w("life.readsThis")}</small>}
        </Setting>
        {/* DT167 (0.3.9): Taste, moved here from the bottom of Me */}
        <TasteSetting {...p} />
        {age !== null && age >= ALCOHOL_AGE && (
          <Setting name={w("life.alcohol")} hint={w("life.alcoholHint")}>
            <Chips items={asItems(ALCOHOL)} on={l.alcohol} pick={(v) => save({ alcohol: v })} />
          </Setting>
        )}
      </Seg>
      <small className="muted page-why">{w("menu.allergiesStayInProfileWith")}</small>
      <NextLink p={p} to="week" from="life" text={w("menu.trainingWeek")} hint={minor ? w("menu.whatEachDayOfYour") : w("menu.whatEachDayOfYour2")} />
    </>
  );
}

// Training week (canvas board TW, TW2, Milan 13 October 2026): the usual week of training only, as an agenda, then the
// picked day's settings. No dates: a change for one date, and the days gone by, live on Plan, the one calendar with dates.
function PlanPanel(p: AppApi) {
  // no plan yet: a week without training, as in Calculate for me (7 October 2026)
  const plan = planOf(p.personal) ?? planFromCounts({ passive: 7, active: 0, easy: 0, hard: 0 });
  const minor = isMinor(p.personal);
  const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
  // DT147 (0.2.128, board Stories99 version 2; Tester 3 tapped a day and saw nothing: it opened below the whole week): a day
  // opens right under itself and stays open until it is tapped again; Move and Copy are one line at its end
  const [open, setOpen] = useState<number[]>([]);
  const toggle = (i: number) => { setOpen((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i])); setAct(null); };
  const [act, setAct] = useState<{ day: number; kind: "move" | "copy"; days: number[] } | null>(null);
  const l = lifestyleOf(p.personal);
  const save = (next: Plan) => { p.setPersonal({ ...p.personal, plan: next }); p.setUsual(usualFrom(l, next)); };
  const setDay = (i: number, d: PlanDay) => save(plan.map((x, n) => (n === i ? d : x)));
  const c = p.goal ? calculate(p.personal, p.goal.band ?? "maintain", p.formula) : null;
  // Release B: the word on the right says Work, Study, or nothing on a day off; the bar keeps its colors
  const wkd = weekdaysOf(l), peOn = !!l.peWeek && l.peWeek !== "none";
  const dayWord = (d: PlanDay) => { if (minor) return d.work ? w("menu.school") : w("menu.noSchool"); const k = dayKindOf(d, l); return k === "work" ? "Work" : k === "study" ? "Study" : wkd === "home" ? "" : w("menu.dayOff"); };
  const wh = workHoursOf(l);
  const workHint = workHintOf(l, minor);
  const counts = countsOf(plan);
  const avg = c ? Math.round(plan.reduce((t, d) => t + c.numbersOf(d).kcal, 0) / 7 / 50) * 50 : null;
  return (
    <>
      <p className="small muted page-why">{w("menu.yourUsualWeekOfTraining")}</p>
      <section className="week-card" aria-label={w("menu.yourTrainingWeek")}>
        <div className="week-card-head"><b>{w("menu.yourUsualTrainingWeek")}</b>{avg !== null && <small>average {avg.toLocaleString(numLocale())} kcal</small>}</div>
        {plan.map((d, i) => (
          <Fragment key={i}>
          <button type="button" className={`agenda-row ${open.includes(i) ? "on open" : ""}`} aria-expanded={open.includes(i)} onClick={() => toggle(i)}>
            <span className={`load-bar load-${loadOf(d)}`} />
            <b>{WEEKDAYS[i]}</b>
            <span className="agenda-what">{planShort(d)}</span>
            <small className={dayWord(d) ? "work" : ""}>{dayWord(d)}</small>
          </button>
          {open.includes(i) && (
            <div className="agenda-open" role="group" aria-label={`${WEEKDAY_NAMES[i]}, every week`}>
              <small className="muted agenda-open-why">Every {WEEKDAY_NAMES[i]}. To change one date, open that day on Plan. Tap {WEEKDAY_NAMES[i]} again to close.</small>
              <DayEditor minor={minor} weekdays={wkd} peOn={peOn} value={d} onChange={(x) => setDay(i, x)} workHint={workHint} work={wh} />
              {/* DT140 (0.2.125) Move to and Copy, since DT147 one line at the end: each opens its day chips right there */}
              {act?.day === i ? (
                <div className="setting day-act" role="group" aria-label={`${act.kind === "move" ? "Move" : "Copy"} ${WEEKDAY_NAMES[i]} to`}>
                  <small className="setting-name">{act.kind === "move" ? `Move ${WEEKDAY_NAMES[i]} to` : `Copy ${WEEKDAY_NAMES[i]} to`}</small>
                  <div className="chip-row">{WEEKDAYS.map((wq, n) => n === i ? null : <button type="button" key={wq} className={`choice ${act.days.includes(n) ? "on" : ""}`} aria-pressed={act.days.includes(n)} onClick={() => {
                    if (act.kind === "move") { save(moveDay(plan, i, n)); setOpen((o) => [...o.filter((x) => x !== i), n]); setAct(null); p.notify(`${WEEKDAY_NAMES[i]}'s training is on ${WEEKDAY_NAMES[n]} now${isTraining(plan[n]) ? `, and ${WEEKDAY_NAMES[n]}'s on ${WEEKDAY_NAMES[i]}` : ""}.`); }
                    else setAct({ ...act, days: act.days.includes(n) ? act.days.filter((x) => x !== n) : [...act.days, n] });
                  }}>{wq}</button>)}</div>
                  <div className="actions">
                    {act.kind === "copy" && <button type="button" className="pill pill-primary action-main" disabled={!act.days.length} onClick={() => { save(plan.map((x, n) => (act.days.includes(n) ? { ...d, work: x.work, study: x.study, pe: x.work && x.study === d.study ? d.pe : false } : x))); setAct(null); }}>Copy to {act.days.length} {act.days.length === 1 ? "day" : "days"}</button>}
                    <button type="button" className="link action-cancel" onClick={() => setAct(null)}>{w("menu.cancel")}</button>
                  </div>
                  <small className="setting-hint">{act.kind === "move" ? w("menu.theTrainingGoesAsIt") : `Copies the activity; each day keeps its ${minor ? "school day or no school" : "work day, study day or day off"}.`}</small>
                </div>
              ) : (
                <div className="day-act-line">
                  {isTraining(d) && <button type="button" className="link" onClick={() => setAct({ day: i, kind: "move", days: [] })}>{w("menu.moveToAnotherDay")}</button>}
                  <button type="button" className="link" onClick={() => setAct({ day: i, kind: "copy", days: [] })}>{w("menu.copyToOtherDays")}</button>
                </div>
              )}
            </div>
          )}
          </Fragment>
        ))}
        <div className="load-key">{(["hard", "easy", "active", "passive"] as DayType[]).filter((t) => counts[t]).map((t) => <span key={t}><i className={`load-${t}`} />{LOAD_NAME[t]} {counts[t]}</span>)}</div>
        <small className="week-card-foot">{minor ? w("week.barFootSchool") : w("week.barFoot")}</small>
      </section>
      <NextLink p={p} to="shop" from="week" text={w("menu.whereIShopAndCook")} hint={w("me.shopHint")} />
    </>
  );
}

function ShopPanel(p: AppApi) {
  // DT136 (0.2.120, board Stories93 version 3; Milan 28 October 14:51): one list of places. Home is where you live, shop and
  // cook: always on. Every other place has a switch: on puts its foods in your search, and the first time its starter foods
  // come with it; off keeps them. Delete unused and Make it home sit with a place that is off and has foods.
  const [more, setMore] = useState(false);
  const counts = countByPlace(p.state.foods);
  const homeN = p.state.foods.filter((f) => !f.places?.length || (p.region ? f.places.some((x) => samePlace(x, p.region!)) : false)).length;
  const rest = REGIONS.filter((r) => r.id !== p.region);
  const known = rest.filter((r) => p.placesOn.includes(r.id) || (counts.get(r.id) ?? 0) > 0 || p.trip?.place === r.id);
  const others = rest.filter((r) => !known.includes(r));
  const row = (r: (typeof REGIONS)[number]) => {
    const on = p.placesOn.includes(r.id), n = counts.get(r.id) ?? 0, unused = !on && n ? p.unusedOf(r.id).filter((f) => f.places!.length === 1).length : 0;
    return (
      <div className="place-row" key={r.id}>
        <span>
          <b>{r.name}</b>
          <small>{n ? `${n} ${n === 1 ? "food" : "foods"}${on ? "" : ", kept"}` : w("menu.aboutTwentyStarterFoods")}{p.trip?.place === r.id ? " · your trip" : ""}</small>
          {!on && n > 0 && <small className="place-kept">Your logs and recipes stay. {unused > 0 && <><button type="button" className="link" onClick={() => p.deleteUnused(r.id)}>Delete {unused} unused</button> · </>}<button type="button" className="link" onClick={() => p.makeHome(r.id)}>{w("menu.makeItHome")}</button></small>}
          {(on || n === 0) && <small><button type="button" className="link" onClick={() => p.makeHome(r.id)}>{w("menu.makeItHome")}</button></small>}
        </span>
        <button type="button" className={`choice ${on ? "on" : ""}`} aria-pressed={on} aria-label={`${r.name}: ${on ? "on" : "off"}`} onClick={() => p.setPlaceOn(r.id, !on)}>{on ? "On" : "Off"}</button>
      </div>
    );
  };
  return (
    <>
    <section className="card place-rows">
      <small>{p.region ? w("menu.whereYouLiveShopAnd") : w("menu.pickHomeWhereYouLive")}</small>
      {p.region && (
        <div className="place-row">
          <span><b>{REGIONS.find((r) => r.id === p.region)?.name}</b><small>Home · {homeN} foods{(REGIONS.find((r) => r.id === p.region)?.tags ?? []).includes("cy") ? ", fifty Cypriot with their Greek names" : ""}</small>
            {!getStarted().includes(p.region) && <small><button type="button" className="link" onClick={p.addStarter}>{w("menu.addItsStarterFoods")}</button></small>}</span>
          <small>{w("menu.alwaysOn")}</small>
        </div>
      )}
      {known.map(row)}
      {more || !p.region ? others.map(row) : others.length > 0 && <div className="place-row"><span><b>{others.length} more places</b><small>{others.map((r) => r.name.replace(/, elsewhere$/, "")).slice(0, 4).join(", ")}…</small></span><button type="button" className="link" onClick={() => setMore(true)}>{w("menu.show")}</button></div>}
    </section>
    <KitchensAndTools {...p} />
      {/* DT209 (0.3.50, board Stories156; Coach Milan 1 November 22:33 to 23:52 Go): the setup steps end on Your summary; My coach is no step */}
      <NextLink p={p} to="summary" from="shop" text={w("menu.yourSummary")} hint={w("me.everythingYouToldChefMealan")} />
    </>
  );
}

// The kitchens you cook and what you cook with: on Me, Where I shop and cook, and in setup's step 4 (DT142, 0.2.127)
export function KitchensAndTools(p: AppApi) {
  return (
    <>
    {/* The kitchens you cook (0.2.9, canvas board CH, CH4): the shops say what you can buy, the kitchens what you like to cook */}
    <p className="label" style={{ marginTop: 14 }}>{w("menu.theKitchensYouCook")}</p>
    <section className="card kitchens" style={{ gap: 8 }}>
      <small>{CHEF_NAME} cooks in these first: the tastes, the herbs, how a meal is put together. Pick one or more.</small>
      <div className="moments" role="group" aria-label={w("menu.theKitchensYouCook")}>
        {KITCHENS.map((k) => { const on = (p.personal.kitchens ?? []).includes(k); return <button key={k} className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={() => p.setPersonal({ ...p.personal, kitchens: on ? (p.personal.kitchens ?? []).filter((x) => x !== k) : [...(p.personal.kitchens ?? []), k] })}>{k}</button>; })}
      </div>
      {/* What a kitchen means (0.2.10, board CH, CH7): a line, three dishes Chef Mealan would cook you, Another and Undo */}
      {(p.personal.kitchens ?? []).filter((k) => KITCHEN[k]).map((k) => {
        const t = tasteOf(p.personal, k), set = (next: Taste) => p.setPersonal({ ...p.personal, kitchenTaste: { ...(p.personal.kitchenTaste ?? {}), [k]: next } });
        const diet = lifestyleOf(p.personal).diet, fits = DIET_MEANS[diet ?? ""] ? diet! : null;
        const last = t.out[t.out.length - 1], more = anotherLeft(t, k, diet);
        return (
          <div className="kt" key={k}>
            <small className="kt-name">{k.toUpperCase()}</small>
            <small className="kt-what">{KITCHEN[k].what}</small>
            <small className="kt-lead">{t.shown.length === 0 ? `No ${k} dish we list fits ${fits}. ${CHEF_NAME} cooks the kitchen your way: tell it in the chat what you cook.` : `${t.shown.length === 3 ? w("menu.threeDishes") : t.shown.length === 2 ? w("menu.twoDishes") : w("menu.oneDish")} ${CHEF_NAME} would cook you${fits ? `, all ${fits}` : ""}:`}</small>
            {t.shown.map((d, i) => (
              <div className={`kt-dish ${last?.with === d ? "kt-new" : ""}`} key={d}><b>{d}</b>{more && <button className="link" aria-label={`Another instead of ${d}`} onClick={() => set(another(t, k, i, diet))}>{w("menu.another")}</button>}</div>
            ))}
            {t.out.length > 0 && <small className="kt-out">Not for you: {t.out.map((o) => o.dish.toLowerCase()).join(", ")}. <button className="link" onClick={() => set(undo(t))}>{w("menu.undo")}</button></small>}
            {!more && t.shown.length > 0 && <small className="kt-out">{fits ? `That's every ${k} dish we have that fits ${fits}. ${CHEF_NAME} cooks the kitchen your way: tell it in the chat what you cook.` : `That's every dish we have for this kitchen. Tell ${CHEF_NAME} in the chat what you cook.`}</small>}
          </div>
        );
      })}
      <small className="setting-hint">{w("menu.aPlateThatAlreadyHas")}</small>
    </section>
    {/* What you cook with (0.2.18, canvas board IM, IM10): the steps are written for these */}
    <p className="label" style={{ marginTop: 14 }}>{w("menu.whatYouCookWith")}</p>
    <section className="card cook-with" style={{ gap: 8 }}>
      <small>{CHEF_NAME} writes the steps for what you have. A recipe that needs something you don't have says how to make it without, or that it can't.</small>
      <div className="moments" role="group" aria-label={w("menu.whatYouCookWith")}>
        {EQUIPMENT.map(([id, name]) => { const has = equipmentOf(p.personal), on = has.includes(id); return <button key={id} className={`choice ${on ? "on" : ""}`} aria-pressed={on} onClick={() => p.setPersonal({ ...p.personal, equipment: on ? has.filter((x) => x !== id) : [...has, id] })}>{name}</button>; })}
      </div>
    </section>
    </>
  );
}

function CoachPanel(p: AppApi) {
  const { profile, cloudEnabled, user, joinCoach, leaveCoach } = p;
  const [code, setCode] = useState("");
  const coachName = profile.coachName || COACH_NAME;
  if (profile.role === "coach")
    return <section className="card"><small>{w("menu.youReACoachYour")}</small><div className="button-row" style={{ marginTop: 8 }}><button className="pill pill-small pill-primary" onClick={() => { p.setTab("clients"); }}>{w("menu.openClients")}</button></div></section>;
  if (!cloudEnabled || !user)
    return <><section className="card person"><span className="avatar avatar-coach">{COACH_NAME.slice(0, 1)}</span><div><b>{COACH_NAME}</b><small>{w("menu.setsYourTargetAndSees")}</small></div></section>
      </>;
  return profile.coachId ? (
    <>
      <section className="card person">
        {profile.coachPhoto ? <img className="avatar avatar-coach" src={profile.coachPhoto} alt="" referrerPolicy="no-referrer" /> : <span className="avatar avatar-coach">{coachName.slice(0, 1)}</span>}
        <div>
          <b>{coachName}</b>
          {profile.coachEmail && <small><a href={`mailto:${profile.coachEmail}`}>{profile.coachEmail}</a></small>}
          <small>Your coach{profile.joinedAt ? ` since ${fmtDay(profile.joinedAt)}` : ""}.</small>
        </div>
      </section>
      {/* 0.2.6 (canvas board CW, CW6): the check-in day, what the coach sees with the week first, and the notes */}
      <section className="card coach-checkin"><span><b>Check-in: {DAY_NAMES[p.checkinDay]}</b><small>{p.coachLabel} looks at your week and sends a note.</small></span></section>
      <section className="card">
        <b>{w("menu.whatYourCoachSees")}</b>
        <ul className="small">
          <li>{w("menu.thePartsOfYourSummary")}</li>
          <li>{w("menu.yourWeekEachDayThe")}</li>
          <li>{w("menu.yourGoalAndTodayS")}</li>
          <li>{w("menu.yourWeighInsAsA")}</li>
          <li>{w("menu.theCardsYouShareWith")}</li>
          <li>{w("menu.whichSituationsYouTickedOn")}</li>
        </ul>
        <b>{w("menu.whatYourCoachNeverSees")}</b>
        <ul className="small">
          <li>{w("menu.yourPhotosAndNotesOn")}</li>
          <li>{w("menu.yourBodyDataHealthAnswers")}</li>
        </ul>
        <ConfirmButton className="link link-danger" label={w("menu.leaveThisCoach")} confirmLabel={w("menu.tapAgainToLeave")} onConfirm={leaveCoach} />
      </section>
      {p.coachNotes.length > 0 && (
        <>
          <p className="label">Notes from {p.coachLabel}</p>
          <section className="card days">{[...p.coachNotes].reverse().slice(0, 20).map((n) => (
            <div className="history-row" key={n.at}><div><b>{new Date(n.at).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).replace(",", "")}</b><small>{n.by === "client" ? w("menu.yourReply") : n.suggest?.kind === "answer" ? `On your ${n.suggest.card?.title ?? "meal"}` : n.suggest?.kind === "reaction" ? `On your ${n.suggest.card?.title ?? "meal"}` : n.suggest ? "A suggestion" : n.verdict === "change" ? w("menu.askedYouToChangeYour") : w("menu.approvedYourWeek")}</small></div><div className="history-num"><small>“{n.text}”</small></div></div>
          ))}</section>
        </>
      )}
    </>
  ) : (
    <>
    <section className="card">
      <small>{w("menu.gotAnInviteFromYour")}</small>
      <div className="button-row" style={{ marginTop: 8 }}>
        <input className="code-input" value={code} placeholder={w("menu.coachCode")} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} />
        <button className="pill pill-small pill-primary" disabled={code.trim().length < 4} onClick={() => joinCoach(code)}>{w("menu.join")}</button>
      </div>
    </section>
    </>
  );
}

function AccountPanel(p: AppApi) {
  const { cloudEnabled, user, cloudStatus, signOut, deleteAccount } = p;
  // the export is the person's whatever the sign-in: on this phone only, the file holds what the phone holds
  if (!cloudEnabled) return (
    <>
      <section className="card"><small>{w("menu.thisPhoneOnlyYourData")}</small></section>
      <section className="card">
        <b>{w("menu.yourData")}</b>
        <p className="small">{w("menu.everythingChefMealanKeepsAbout")}</p>
        <div className="button-row"><button className="pill pill-small" onClick={p.exportMyData}><Download size={14} /> {w("menu.exportMyData")}</button></div>
      </section>
    </>
  );
  return (
    <>
      <section className="card person">
        {user?.photo ? <img className="avatar avatar-img" src={user.photo} alt="" /> : <span className="avatar">{(user?.name || "?").slice(0, 1)}</span>}
        <div><b>{user ? user.name || user.email : w("menu.thisPhoneOnly")}</b><small>{user ? user.email : "no account, data stays here"}</small></div>
      </section>
      {user && cloudStatus.text && <p className={`small sync ${cloudStatus.ok ? "" : "sync-bad"}`}>{cloudStatus.text}{cloudStatus.at ? `, ${new Date(cloudStatus.at).toLocaleTimeString(phoneLoc(), { hour: "2-digit", minute: "2-digit" })}` : ""}.</p>}
      <section className="card">
        <b>{w("menu.yourData")}</b>
        <p className="small">{w("menu.everythingChefMealanKeepsAbout2")}</p>
        <div className="button-row">
          <button className="pill pill-small" onClick={p.exportMyData}><Download size={14} /> {w("menu.exportMyData")}</button>
        </div>
        {user && <p className="small">Delete removes all of it, photos, cards and recipes included, and the sign-in. Not undoable.{p.deleteSteps ? ` ${p.deleteSteps}…` : ""}</p>}
      </section>
      <div className="button-row">
        {user && <SignOut p={p} inline />}
        {user && <ConfirmButton className="pill pill-small danger" label={w("menu.deleteMyAccount")} confirmLabel={w("menu.tapAgainToDeleteEverything")} onConfirm={deleteAccount} />}
        {!user && <button className="pill pill-small" onClick={() => { localStorage.removeItem("chefmealan-local-only"); location.reload(); }}>{w("menu.signIn")}</button>}
      </div>
    </>
  );
}

function SupportPanel(p: AppApi) {
  const { cloudEnabled, coach, setCoach, services, exportData, importRef, setAccessOpen, addStarter, setTab } = p;
  const isCoach = p.profile.role === "coach";
  const n = readLog().length;
  return (
    <>
      <section className="card">
        <small>{w("menu.questionsSomethingBrokenOrAn")}</small>
        <div className="button-row" style={{ marginTop: 8 }}><a className="pill pill-small pill-primary" href="mailto:hello@chefmealan.com?subject=Chef%20Mealan">hello@chefmealan.com</a></div>
      </section>
      {(!cloudEnabled || isCoach) && (
        <>
          <p className="label">{w("menu.tools")}</p>
          <section className="card">
            {!cloudEnabled && <label className="check"><input type="checkbox" checked={coach} onChange={(e) => setCoach(e.target.checked)} /> {w("menu.iAmTheCoach")}</label>}
            {(coach || isCoach) && (
              <div className="coach-tools">
                <small>Pilot log: {n} {n === 1 ? "event" : "events"} on this device.</small>
                <div className="button-row">
                  <button className="pill pill-small" onClick={exportLog}><Download size={14} /> {w("menu.exportLog")}</button>
                  <ConfirmButton className="pill pill-small" label={w("menu.clearLog")} confirmLabel={w("menu.tapAgainToClear")} onConfirm={clearLog} />
                </div>
                <div className="button-row">
                  <button className="pill pill-small" onClick={addStarter}>{w("menu.addStarterFoods")}</button>
                </div>
                <div className="button-row">
                  <button className="pill pill-small" onClick={exportData}><Download size={14} /> {w("menu.backup")}</button>
                  <button className="pill pill-small" onClick={() => importRef.current?.click()}><Upload size={14} /> {w("menu.restore")}</button>
                  <button className="pill pill-small" onClick={() => setTab("recipes")}>{w("menu.recipes")}</button>
                </div>
                <small>AI label reading: {services?.ai ? "on" : "off"}</small>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

// 0.3.71 (Coach Milan 3 November 15:49 to 15:59, Go): Dev data for the account Metrics shows for (the owner), not the superadmin role
function DevSettings({ p, open }: { p: AppApi; open: (id: "voice" | "dev" | "language") => void }) { return <SettingsList open={open} dev={useMetricsOwner(true)} />; }
function DevGuard({ p }: { p: AppApi }) { return useMetricsOwner(true) ? <DevData missing={looseWanted(p.state).length} /> : null; }
// DT231 (0.3.70, board Stories170): what this phone measured and wrote to the account, for the owner only; About keeps the version
function DevData({ missing }: { missing: number }) {
  const x = saveStats();
  const at = x.lastAt ? new Date(x.lastAt).toLocaleTimeString(phoneLoc(), { hour: "2-digit", minute: "2-digit" }) : "";
  const block = (title: string, rows: [string, string][]) => (
    <section className="card dev-block"><b>{title}</b>{rows.map(([k, v]) => <div key={k} className="dev-row"><span>{k}</span><b>{v}</b></div>)}</section>
  );
  return (<>
    <p className="small">{w("menu.onlyYouSeeThisMeasured")}</p>
    {/* DT232 (0.3.72, board Stories171): View the app as, first */}
    <section className="card dev-block" aria-label={w("menu.viewTheAppAs")}>
      <b>{w("menu.viewTheAppAs")}</b>
      <div className="dev-views">{(["me", "coach", "user"] as const).map((v) => <button key={v} type="button" className={`choice ${v === "me" ? "on" : ""}`} aria-pressed={v === "me"} onClick={() => setViewAs(v)}>{viewWord(v)}</button>)}</div>
      <small className="muted">{w("menu.meEverythingYourAccountHas")}</small>
    </section>
    {block("This phone", [["Opened in", openStats.ms !== null ? `${(openStats.ms / 1000).toFixed(1)} s` : "not measured yet"], ["Data kept on the phone", `${savedDataKb()} KB`], ["Photos on the phone", String(openStats.photos)]])}
    {block("Saves to your account", [["Last save", x.lastKb !== null ? `${x.lastKb} KB${at ? `, ${at}` : ""}` : "none today"], ["Today", `${x.saves} save${x.saves === 1 ? "" : "s"}, ${Math.round(x.kb)} KB`], ["Nothing new, not sent", String(x.skipped)],
      // 0.3.71: photos the account's copy names that this phone does not hold; one that stays here is not in the account either
      ["Photos named, not on this phone", String(missing)]])}
    {missing > 0 && <p className="small">{w("menu.chefMealanFetchesThemFrom")}</p>}
    {block("The app", [["Version", (import.meta.env.VITE_VERSION as string | undefined) || "0"], ["Commit", (import.meta.env.VITE_COMMIT as string | undefined) || "preview"]])}
    <DeployBlock />
  </>);
}
// DT233 (0.3.74, board Stories173; Coach Milan 3 November 17:46 to 18:21, Go): Deploy, last in Dev data. Each row opens its page on
// GitHub, where Run workflow starts it; nothing deploys from the app. The versions: main from GitHub, the preview and
// chefmealan.com from their own /api/version.
const GH = "https://github.com/mistancevic/PlateMate-Scanner/actions/workflows";
export const DEPLOY_SOURCES = {
  main: "https://raw.githubusercontent.com/mistancevic/PlateMate-Scanner/main/package.json",
  preview: "https://preview---chefmealan-eovxlu2pqq-ew.a.run.app/api/version",
  live: "https://chefmealan.com/api/version",
};
function DeployBlock() {
  const [v, setV] = useState<{ main?: string | null; preview?: string | null; live?: string | null }>({});
  useEffect(() => {
    let on = true;
    const get = (k: keyof typeof DEPLOY_SOURCES) => fetch(DEPLOY_SOURCES[k], { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => (d && typeof d.version === "string" ? d.version : null)).catch(() => null)
      .then((x) => { if (on) setV((o) => ({ ...o, [k]: x })); });
    void get("main"); void get("preview"); void get("live");
    return () => { on = false; };
  }, []);
  const ver = (x: string | null | undefined) => (x === undefined ? "…" : x ?? "not known");
  const row = (name: string, href: string, line: string, warn = false) => (
    <a key={name} className="menu-row deploy-row" href={href} target="_blank" rel="noopener noreferrer">
      <span className="menu-row-text"><b>{name}</b><small className={warn ? "deploy-warn" : ""}>{line}</small></span><span aria-hidden="true">↗</span>
    </a>
  );
  return (
    <section className="card dev-block deploy-block" aria-label={w("menu.deploy")}>
      <b>{w("menu.deploy")}</b>
      {row("Preview", `${GH}/preview.yml`, `Builds main, ${ver(v.main)}, and puts it on the preview link`)}
      {row("Promote", `${GH}/promote.yml`, `Puts the preview, ${ver(v.preview)}, live on chefmealan.com. Live now: ${ver(v.live)}`)}
      {row("Rollback", `${GH}/rollback.yml`, w("menu.emergencyOnlyChefmealanComGoes"), true)}
      <small className="muted">{w("menu.eachOpensItsPageOn")}</small>
    </section>
  );
}

function AboutPanel() {
  return (
    <section className="card">
      <b>{APP_NAME}</b>
      <p className="small">{w("menu.chefMealanFitsTheFood")}</p>
      <p className="small">{w("menu.pilotBarcodeDataFromOpen")}</p>
      <p className="small">hello@chefmealan.com</p>
      <p className="small"><a href="/about">{w("menu.whoSBehindIt")}</a> · <a href="/impressum">{w("menu.impressum")}</a> · <a href="/privacy">{w("menu.privacyNotice")}</a> · <a href="/disclaimer">{w("menu.disclaimer")}</a></p>
      <p className="small">Version {(import.meta.env.VITE_VERSION as string | undefined) || "0"} · {(import.meta.env.VITE_COMMIT as string | undefined) || "preview"}</p>

    </section>
  );
}
