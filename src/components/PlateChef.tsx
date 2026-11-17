// DT308.3 and DT308.3b (0.3.154, board Stories236; Coach Milan 17 November 16:10 to 18:41): Chef Mealan through his round icon.
// On the empty Plate his chat opens over the Plate: one field for everything, typed or spoken, what you crave or the foods
// you have. He reads which it is. The answer is small cards with + Add: your own recipes for what you typed (only when one
// matches), then his ideas, up to three; or, when your words were foods, one card Your foods and his ideas with them. A tap
// on an idea's title opens it short, its foods only, with a link at the end, See the whole recipe. That opens the recipe as
// a page over the chat: An idea from Chef Mealan, not made yet; Back stays at the top, Save in My recipes and + Add stay at
// the bottom, the page scrolls. + Add closes the chat and the dish is on your plate. Nothing lands by itself.
import { w } from "../words";
import { recipeName } from "../recipeDiff";
import { cookTitle } from "../cookWords";
import { ThinkingCard } from "./ThinkingCard";
import { sameFoodName } from "../mixtip";
import { placeName, placeNameEn } from "../places";
import { carriedLists } from "../carry";
import { tasteOfWords } from "../craving";
import { tasteForReq } from "../tasteChips";
import { getLang, speechLang } from "../lang";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, Mic, ChevronLeft } from "lucide-react";
import type { AppApi, SaidRead } from "../screens/api";
import type { Food, Meal } from "../pilot";
import { uid, validateFood } from "../pilot";
import { fmt, pdVal } from "../ui";
import { fromMeal } from "../planned";
import { membersFor, portionOf, type SharedRecipe } from "../members";
import { blockedByAllergy } from "../safety";
import { tasteForChef } from "../kitchens";
import { estimate } from "./RecipeInBlock";
import { parseCraving, matchesCraving, recipeHay, safeIdeaItem } from "../craving";
import { log } from "../log";

type Ref = { kind: "mine" | "coach"; meal: Meal } | { kind: "member"; r: SharedRecipe };
type Card = { key: string; title: string; kcal: number; protein: number; photo?: string; ref: Ref };
type Answer = { asked: string; said: SaidRead | null; ideas: Meal[]; groups: { key: string; title: string; rows: Card[] }[]; err: string };

const Speech = () => (typeof window === "undefined" ? null : (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null);
const SmallPlate = () => <span className="pc-pic pc-plate" aria-hidden="true"><svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="20" cy="20" r="9.5" fill="currentColor" opacity=".18" /></svg></span>;

export function PlateChef({ p, need, target, close }: { p: AppApi; need: number | null; target: number | null; close: () => void }) {
  const { state, setState } = p;
  const [q, setQ] = useState("");
  const [asking, setAsking] = useState<string | null>(null);
  const [ans, setAns] = useState<Answer | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState<Meal | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [shown, setShown] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const busy = useRef(false), rec = useRef<any>(null), heard = useRef("");
  const allergies = p.safety.allergies ?? [];
  const hasEars = useMemo(() => !!Speech(), []);
  useEffect(() => () => { try { rec.current?.stop(); } catch { /* already stopped */ } }, []);

  // Chef Mealan's idea: every number from its foods; your own food by its name where you have it
  const ideaOf = (one: any, craving: string): Meal | null => {
    const raw: any[] = one?.items ?? [];
    const partOf = (name: string) => { const r = raw.find((x) => String(x?.name ?? "").trim().toLowerCase() === name.toLowerCase()); const pt = typeof r?.part === "string" ? r.part.trim().slice(0, 24) : ""; return pt ? pt.charAt(0).toUpperCase() + pt.slice(1) : undefined; };
    const items = raw.map(safeIdeaItem).filter(Boolean).map((i: NonNullable<ReturnType<typeof safeIdeaItem>>) => {
      const lib = state.foods.find((f) => f.name.toLowerCase() === i.name.toLowerCase()) ?? state.foods.filter(p.inPlace).find((f) => sameFoodName(f.name, i.name));
      const part = partOf(i.name);
      return { id: uid(), food: lib ?? estimate(i), grams: i.grams, locked: true, ...(part ? { part } : {}) };
    }).filter((i: { food: Food }) => !validateFood(i.food).length);
    if (items.length < 2 || items.some((i: { food: Food }) => blockedByAllergy(i.food, allergies))) return null;
    const total = items.reduce((n: number, i: { grams: number }) => n + i.grams, 0);
    return { id: uid(), title: cookTitle(String(one.title).slice(0, 80)), items, portion: total, savedAt: new Date().toISOString(), steps: [], idea: { at: new Date().toISOString(), craving: craving.slice(0, 80), how: (Array.isArray(one.how) ? one.how : []).map((x: unknown) => String(x).slice(0, 220)).filter(Boolean).slice(0, 5) } };
  };
  const askIdeas = async (craving: string, minPd: number | null): Promise<Meal[]> => {
    const res = await fetch("/api/crave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      craving, minPd, target, need, kitchens: p.personal.kitchens ?? [], taste: tasteForChef(p.personal), region: p.region,
      library: state.foods.filter(p.inPlace).slice(0, 40).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })), place: placeNameEn(p.herePlace ?? p.region ?? "") || null, avoid: shown, count: 3, carried: carriedLists(state.meals, state.feedback), tastes: tasteForReq(p.personal.tasteChips, state.preferences) }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || w("craving.errNoAnswer"));
    if (data.error) throw new Error(data.message || w("craving.errNoIdea"));
    const got: any[] = Array.isArray(data.ideas) ? data.ideas : data.idea ? [data.idea] : [];
    const made = got.map((one) => ideaOf(one, craving)).filter((m): m is Meal => !!m).slice(0, 3);
    if (!made.length) throw new Error(w("craving.errNoIdeaWords"));
    return made;
  };
  // your recipes, Coach's and the members' for what you typed
  const groupsFor = async (words: string[]): Promise<Answer["groups"]> => {
    if (!words.length) return [];
    const ok = (m: Meal) => !m.items.some((i) => blockedByAllergy(i.food, allergies));
    const card = (key: string, title: string, x: { kcal: number; protein: number }, ref: Ref, photo?: string): Card => ({ key, title, kcal: x.kcal, protein: x.protein, ref, ...(photo ? { photo } : {}) });
    const mine = state.meals.filter((m) => m.from !== "coach" && ok(m) && matchesCraving(words, recipeHay(m))).map((m) => card(`m:${m.id}`, recipeName(m, state.meals), fromMeal(m, "mine"), { kind: "mine", meal: m }, m.photo));
    const coach = state.meals.filter((m) => m.from === "coach" && ok(m) && matchesCraving(words, recipeHay(m))).map((m) => card(`c:${m.id}`, m.title, fromMeal(m, "coach"), { kind: "coach", meal: m }, m.photo));
    const all: SharedRecipe[] = await fetch("/api/members").then((r) => (r.ok ? r.json() : { recipes: [] })).then((d) => (Array.isArray(d.recipes) ? d.recipes : [])).catch(() => []);
    const mem = membersFor(all.filter((r) => !r.mine), { target, kitchens: p.personal.kitchens ?? [], allergies })
      .filter((r) => matchesCraving(words, { title: r.title, foods: r.items.map((i) => i.food.name), parts: r.items.map((i) => i.part ?? "") }))
      .map((r) => card(`r:${r.id}`, r.title, portionOf(r, need), { kind: "member", r }));
    return [{ key: "mine", title: w("chef.fromYourRecipes"), rows: mine.slice(0, 3) }, { key: "coach", title: w("craving.coachSRecipes"), rows: coach.slice(0, 3) }, { key: "members", title: w("craving.membersRecipes"), rows: mem.slice(0, 3) }].filter((g) => g.rows.length);
  };
  async function send(text0?: string) {
    const text = (text0 ?? q).replace(/\s+/g, " ").trim();
    if (text.length < 2 || busy.current) return;
    busy.current = true; setAsking(text); setQ(""); setAns(null); setOpenId(null);
    const c = parseCraving(text);
    // he reads whether your words are foods you have or what you crave; both go out at the same time
    const [said, ideas, groups] = await Promise.all([
      text.length >= 3 ? p.saidRead(text, { orCraving: true }).catch(() => null) : Promise.resolve(null),
      askIdeas(c.text || text, c.minPd).then((l) => ({ l, err: "" })).catch((e: any) => ({ l: [] as Meal[], err: String(e?.message || w("craving.errNoAnswer")) })),
      groupsFor(c.words).catch((): Answer["groups"] => []),
    ]);
    setShown((l) => [...l, ...ideas.l.map((m) => m.title)].slice(-9));
    setAns({ asked: text, said, ideas: ideas.l, groups: said ? [] : groups, err: ideas.err });
    log("plate_chef", { foods: said ? said.items.length : 0, ideas: ideas.l.length, mine: said ? 0 : groups.reduce((n: number, g) => n + g.rows.length, 0) });
    busy.current = false; setAsking(null);
  }
  // the microphone: tap, say it, tap again and it is sent
  const listen = () => {
    const S = Speech(); if (!S) return;
    // what was heard is sent once, when you tap again or when the browser stops listening
    const sendHeard = () => { if (!rec.current) return; rec.current = null; setListening(false); const t = heard.current.trim(); heard.current = ""; if (t) void send(t); };
    if (listening) { const r = rec.current; sendHeard(); try { r?.stop(); } catch { /* fine */ } return; }
    try {
      const r = new S(); rec.current = r; r.lang = speechLang(getLang()); r.continuous = true; r.interimResults = false; heard.current = q.trim();
      r.onresult = (e: any) => { const parts: string[] = []; for (let i = 0; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal !== false) parts.push(String(x[0].transcript || "").trim()); } heard.current = [heard.current, ...parts.filter((x) => x && !heard.current.includes(x))].filter(Boolean).join(", "); setQ(heard.current); };
      r.onerror = () => { if (rec.current === r) { rec.current = null; setListening(false); } };
      r.onend = () => { if (rec.current === r) sendHeard(); };
      r.start(); setListening(true);
    } catch { setListening(false); }
  };
  const keepTaste = (asked: string) => { const t = tasteOfWords(parseCraving(asked).words); if (t) queueMicrotask(() => p.setPlateTaste(t)); };
  const keepIdea = (m: Meal) => { if (saved.includes(m.id) || state.meals.some((x) => x.id === m.id)) return; setState((s) => ({ ...s, meals: [m, ...s.meals] })); setSaved((l) => [...l, m.id]); };
  const addIdea = (m: Meal) => { keepIdea(m); close(); p.openOnPlate(m); if (ans) keepTaste(ans.asked); };
  const addRef = (ref: Ref) => {
    close();
    if (ref.kind === "member") p.takeMember(ref.r, "make", portionOf(ref.r, need).items); else p.openOnPlate(ref.meal);
    if (ans) keepTaste(ans.asked);
  };
  const addSaid = (s: SaidRead) => { close(); p.saidLand(s); };
  const numsLine = (x: { kcal: number; protein: number }) => w("chef.aboutKcalPd", { kcal: fmt(x.kcal, 0), pd: pdVal(x.kcal > 0 ? (100 * x.protein) / x.kcal : null) });
  const add = (label: string, on: () => void) => <button type="button" className="pill pill-small pc-add" aria-label={label} onClick={on}>+ {w("craving.add")}</button>;
  const pic = (src?: string) => (src ? <img className="pc-pic" src={src} alt="" /> : <SmallPlate />);
  const foodsLine = (m: Meal) => m.items.map((i) => w("craving.gFood", { grams: fmt(i.grams, 0), food: i.food.name.split(",")[0].toLowerCase() })).join(" · ");
  const saidSub = (s: SaidRead) => { const g = s.items.map((i) => Math.round(i.grams)); return g.length > 1 && g.every((x) => x === g[0]) ? w("chef.aboutEach", { grams: fmt(g[0], 0) }) : w("chef.aboutInAll", { grams: fmt(g.reduce((a, b) => a + b, 0), 0) }); };

  if (page) { const nums = fromMeal(page, "mine"), how = page.idea?.how ?? [], kept = saved.includes(page.id) || state.meals.some((x) => x.id === page.id); return (
    <div className="pc-page" role="dialog" aria-label={page.title}>
      <button type="button" className="pc-back" onClick={() => setPage(null)}><ChevronLeft size={18} aria-hidden="true" /> {w("chef.backToChef")}</button>
      <div className="pc-page-body">
        <h2>{page.title}</h2>
        <small className="pc-page-line">{w("chef.ideaNotMade")} · {numsLine(nums)} · {w("chef.gProtein", { protein: fmt(nums.protein, 0) })}</small>
        <div className="pc-read">
          <b>{w("craving.forOneServing")}</b>
          {page.items.some((i) => i.part)
            ? <ul className="crave-foods crave-parts">{[...new Set(page.items.map((i) => i.part ?? w("craving.otherPart")))].map((pt) => <li key={pt}><b>{pt}:</b> {page.items.filter((i) => (i.part ?? w("craving.otherPart")) === pt).map((i) => w("craving.gFood", { grams: fmt(i.grams, 0), food: i.food.name })).join(", ")}</li>)}</ul>
            : <ul className="pc-foods">{page.items.map((i) => <li key={i.id}>{w("craving.gFood", { grams: fmt(i.grams, 0), food: i.food.name })}</li>)}</ul>}
          {how.length > 0 && <><b>{w("craving.howToMakeIt")}</b><ol className="pc-how">{how.map((x, j) => <li key={j}>{x}</li>)}</ol></>}
        </div>
      </div>
      <div className="pc-page-bar">
        {kept ? <b className="pc-saved">✓ {w("craving.savedInMyRecipes")}</b> : <button type="button" className="pill pill-small" onClick={() => keepIdea(page)}>{w("craving.saveInMyRecipes")}</button>}
        <button type="button" className="pill pill-small pill-primary" onClick={() => addIdea(page)}>+ {w("craving.add")}</button>
      </div>
    </div>); }

  return (<>
    <div className="pc-back-drop" onClick={close} />
    <section className="pc-sheet" role="dialog" aria-label={w("app.chefMealan")}>
      <div className="pc-head"><b>{w("app.chefMealan")}</b><button type="button" className="icon" aria-label={w("plate.close")} onClick={close}><X size={22} /></button></div>
      <div className="pc-body">
        {(asking || ans) && <div className="pc-said">{asking ?? ans!.asked}</div>}
        {asking && <ThinkingCard className="pc-thinking" title={/^(a|an|the|some)\b/i.test(asking) ? w("craving.making", { what: asking }) : w("craving.makingIdeaFor", { what: asking })} sub={placeName(p.herePlace ?? p.region ?? "") ? w("craving.fromFoodsSoldIn", { place: placeName(p.herePlace ?? p.region ?? "") }) : w("craving.fromYourFoods")} />}
        {ans && !asking && (<>
          {ans.said && (<>
            <small className="pc-group">{w("craving.yourFoods")}</small>
            <div className="pc-card"><div className="pc-row"><SmallPlate /><div className="pc-text"><b>{ans.said.items.map((i) => i.food.name.split(",")[0]).join(", ")}</b><small>{saidSub(ans.said)}</small></div>{add(w("chef.addYourFoods"), () => addSaid(ans.said!))}</div></div>
          </>)}
          {ans.groups.map((g) => (<div key={g.key} className="pc-block">
            <small className="pc-group">{g.title}</small>
            {g.rows.map((r) => <div className="pc-card" key={r.key}><div className="pc-row">{pic(r.photo)}<div className="pc-text"><b>{r.title}</b><small>{numsLine(r)}</small></div>{add(w("chef.addDish", { title: r.title }), () => addRef(r.ref))}</div></div>)}
          </div>))}
          {ans.ideas.length > 0 && (<div className="pc-block">
            <small className="pc-group">{w(ans.said ? "chef.ideasWithThem" : "craving.chefsIdeas")}</small>
            {ans.ideas.map((m) => { const nums = fromMeal(m, "mine"), open = openId === m.id; return (
              <div className={`pc-card${open ? " open" : ""}`} key={m.id}>
                <div className="pc-row">{pic(m.photo)}<button type="button" className="pc-text pc-title" aria-expanded={open} onClick={() => setOpenId(open ? null : m.id)}><b>{m.title}</b><small>{numsLine(nums)}</small></button>{add(w("chef.addDish", { title: m.title }), () => addIdea(m))}</div>
                {open && <div className="pc-open"><b>{w("craving.forOneServing")}</b><br />{foodsLine(m)}. <button type="button" className="pc-whole" onClick={() => setPage(m)}>{w("chef.seeWholeRecipe")} ›</button></div>}
              </div>); })}
          </div>)}
          {ans.err && <small className="pc-err" role="alert">{ans.err}</small>}
        </>)}
      </div>
      <div className="pc-input">
        <input value={q} aria-label={w("chef.typeOrSay")} placeholder={w("chef.typeOrSay")} maxLength={400} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} enterKeyHint="send" disabled={!!asking} />
        {hasEars && <button type="button" className={`icon pc-mic${listening ? " listening" : ""}`} aria-label={listening ? w("out.listening") : w("out.sayIt")} aria-pressed={listening} onClick={listen} disabled={!!asking}><Mic size={20} /></button>}
      </div>
    </section>
  </>);
}
