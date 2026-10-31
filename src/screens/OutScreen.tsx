import { carryReads } from "../carry";
import { useEffect, useRef, useState } from "react";
import { Camera, Send } from "lucide-react";
import { aggregate, density, solveIngredient, uid, type Ingredient, type Food } from "../pilot";
import { fmt, fixed, pdText, pdVal, pdTag, pdRange } from "../ui";
import { CHEF_NAME } from "../components/Mark";
import { resizeImageBase64 } from "../utils/image";
import { log } from "../log";
import type { AppApi } from "./api";
import { SafetyNote } from "../components/SafetyNote";
import { SafetyQuestion } from "../components/SafetyQuestion";
import { FIXED, takeModelFlag } from "../safety";
import { slotsOf, slotsOn, withTimeOn, trainingTime, trainingWhen, workHoursOf } from "../slots";
import { tasteForChef } from "../kitchens";
import { getStore, openList, shortMeals } from "../shopping";
import { intentOf, wantOf, plateAnswer, planAnswer, leftAnswer, moveOf, swapOk, swapFallback, swapLead, type DaySlot } from "../chatIntent";
import { lifestyleOf, dayFor, getDay } from "../personal";
import { ymd } from "../plan";
import { STARTERS, fillDay, fromMeal, sumOf, needOf, type FillRow, type PlannedMeal } from "../planned";
import { dayRecord } from "../record";
import { dayLog } from "../today";
import { chatRows, type ChatRow } from "../chatFoods";
import { failWhy, plateQuestion } from "../chatFail";
import { ClearField } from "../components/ClearField";
import { WaitSteps } from "../components/WaitSteps";
import { cookName } from "../cookWords";
import { planDateShown } from "./PlanScreen";
import { Mic } from "lucide-react";
import type { Tab } from "./api";

type Rec = { name: string; calories: number | null; protein: number | null; fats: number | null; carbs: number | null; typical_grams: number; confidence: string };
export type Turn = { role: "you" | "mealan"; text: string; picks?: Ingredient[]; pd?: number | null; kcal?: number | null; photo?: string; plate?: string[]; fill?: { date: string; dayName: string; rows: FillRow[]; done?: boolean };
  // 0.2.8 (canvas board CH, CH6): where the answer comes from, a swap to tap, a move to confirm
  tag?: "plate" | "day" | "plan" | "chef";
  swap?: { date: string; slotId: string; slotName: string; time: string; options: { meal: PlannedMeal; why: string }[]; done?: string };
  move?: { date: string; slotId: string; from: string; to: string; usual: string; done?: "moved" | "kept" };
  // DT106 (0.2.92): the foods Chef Mealan named, as rows with Add, Take it out or Scan it; done holds what was tapped
  rows?: ChatRow[]; rowsDone?: Record<string, "added" | "out" | "scan">;
  // DT152 (0.2.132): Chef Mealan didn't answer; the question stays, with Ask again
  failed?: { text: string; photo?: string; why: string; plate: boolean; retried?: boolean } };
const TAG: Record<NonNullable<Turn["tag"]>, string> = { plate: "FROM YOUR PLATE", day: "FROM YOUR DAY", plan: "YOUR PLAN", chef: "CHEF MEALAN" };

const asFood = (r: Rec): Food => ({
  id: uid(), name: r.name, brand: "estimate", basis: "100g", source: "estimate", notes: `${r.confidence} confidence`,
  reviewedAt: new Date().toISOString(), readyToEat: true, calories: r.calories, protein: r.protein, fats: r.fats, carbs: r.carbs, fiber: null,
});

// DT153 (0.2.132): a done row is a plain tick, not a pill; Undo under it while the chat is open
function Done({ text, undo, start }: { text: string; undo?: () => void; start?: boolean }) {
  return <span className={`done-tick${start ? " done-start" : ""}`}><b>✓ {text}</b>{undo && <button type="button" className="link done-undo" onClick={undo}>Undo</button>}</span>;
}

export function OutScreen(p: AppApi & { toPlate: () => void; close: () => void; turns: Turn[]; setTurns: (f: (t: Turn[]) => Turn[]) => void; tab: Tab; ask?: "fill" | "plate" | "around" | { q: string } | null; clearAsk: () => void }) {
  const { pdRef, setState, state } = p;
  const [text, setText] = useState("");
  const [doorOpen, setDoorOpen] = useState(false);
  const [chatStage, setChatStage] = useState<"ask" | "match">("ask");
  // The chef in context (0.2.4, canvas S "Chef Mealan, about this screen", H5, H6, H11): the chat opens knowing the screen.
  // One line about where the person is, chips written for that screen; a chip only asks, the button on the answer acts.
  const lifestyle = lifestyleOf(p.personal);
  const WEEKDAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const planDate = p.tab === "plan" ? planDateShown() : ymd(new Date());
  const planDay = (() => { const [y, m, d] = planDate.split("-").map(Number); const x = new Date(y, m - 1, d, 12); return x; })();
  const dayName = planDate === ymd(new Date()) ? "today" : WEEKDAY[(planDay.getDay() + 6) % 7];
  const slots = slotsOn(lifestyle, p.personal.timesOn, planDate);
  const held = p.planned[planDate] ?? {};
  const open = slots.filter((s) => !held[s.id]);
  const training = dayFor(p.personal, planDay)?.day ?? getDay(p.personal, planDay).plan ?? null;
  const tWhen = trainingWhen(training);
  const numbers = p.numbersFor(planDay);
  const rec = dayRecord(slots, p.planned[ymd(new Date())], dayLog(state.feedback, new Date()).logged, ymd(new Date()));
  const plateT = aggregate(state.items); const platePd = density(plateT.protein, plateT.calories);
  // DT93: the meal the plate is for, by the clock: for the chips and the first question from the Plate
  const mealName = (() => { const m = new Date().getHours() * 60 + new Date().getMinutes(); const sl = slots.find((x) => { const [h, mi] = x.time.split(":").map(Number); return h * 60 + mi + 90 >= m; }) ?? slots[slots.length - 1]; return (sl?.name ?? "meal").toLowerCase(); })();
  const about = p.tab === "plan"
    ? `About ${dayName === "today" ? "today" : dayName}: ${open.length ? `${open.length} ${open.length === 1 ? "slot" : "slots"} open` : "every slot set"}${tWhen ? `, ${tWhen.phrase}` : ""}${numbers ? `, ${fmt(numbers.kcal, 0)} kcal and ${numbers.protein} g to place` : ""}.`
    : p.tab === "home"
      ? (rec.planned ? `${rec.open.length} of ${rec.planned} ${rec.planned === 1 ? "slot" : "slots"} to come${rec.extras.length ? `, ${rec.extras.length} extra so far` : ""}.` : "Nothing planned for today yet.")
      : p.tab === "journey"
        ? (state.items.length ? `On the plate: ${state.items.map((i) => i.food.name).join(", ")}, ${pdText(platePd)}${pdRef !== null ? ` against your ${pdVal(pdRef)}` : ""}.` : "The plate is empty.")
        : "Out, missing something, or after an idea.";
  // the next planned meal still to come today (0.2.8: a chip only offers what the chat can do)
  const eatenIds = new Set(rec.eaten.map((f) => f.slot!.slotId)), skippedIds = new Set(rec.skipped.map((x) => x.id));
  const nextHeld = slots.find((x) => held[x.id] && !eatenIds.has(x.id) && !skippedIds.has(x.id));
  const chips: string[] = p.tab === "plan"
    ? [...(open.length ? [`Fill ${dayName === "today" ? "today" : dayName}`] : []), "Make it a vegetarian day", "Lunch from what I have at home", "Something quick for dinner"]
    : p.tab === "home"
      ? [nextHeld ? `Swap ${nextHeld.name.toLowerCase()} for something lighter` : "What is planned today?", "What's left today?", ...(trainingTime(training) && slots.length ? [`Move ${slots[slots.length - 1].name.toLowerCase()} to after training`] : []), "I'm out, what do I take?"]
      : p.tab === "journey"
        ? [...(state.items.length ? ["Swap a food on my plate", `Make my plate a ${mealName}`, "Make my plate a snack"] : []), "What goes with this?", "Better match for my target?", "I'm out, what do I take?"]
        : ["No idea, inspire me", "I'm out, what do I take?", "Hotel breakfast buffet", "Plan food for a trip", "Italian tonight, I want dessert"];
  // Fill a day: from My recipes and the starters, the same picking as the tip; a turn with the rows and one button that acts
  const choices: PlannedMeal[] = [...state.meals.map((m) => fromMeal(m, m.from === "coach" ? "coach" : "mine")), ...STARTERS];
  const target = numbers ? density(numbers.protein, numbers.kcal) : pdRef;
  const fillNow = () => {
    const reads = carryReads(state.meals, state.feedback);
    const rows = fillDay(slots, held, choices, numbers, target, (m) => (m.mealId ? reads.get(m.mealId) : null));
    const sum = sumOf(Object.fromEntries(rows.map((r) => [r.slot.id, r.meal])));
    const heldSum = sumOf(held);
    const text = rows.length
      ? `${dayName === "today" ? "Today" : dayName}, filled: ${rows.map((r) => `${r.slot.name} ${r.meal.title}`).join(", ")}. The day lands at ${fmt(sum.kcal + heldSum.kcal, 0)} kcal and ${fmt(sum.protein + heldSum.protein, 0)} g protein${numbers ? ` of ${fmt(numbers.kcal, 0)} and ${numbers.protein}` : ""}. Change one, or put them in.${rows.some((r) => r.why) ? ` ${rows.map((r) => r.why).filter(Boolean).join(" ")}` : ""}`
      : "Every slot is set already.";
    setTurns((t) => [...t, { role: "you", text: `Fill ${dayName === "today" ? "today" : dayName}` }, { role: "mealan", text, fill: rows.length ? { date: planDate, dayName, rows } : undefined }]);
  };
  const changeOne = (ti: number, slotId: string) => setTurns((t) => t.map((turn, i) => {
    if (i !== ti || !turn.fill) return turn;
    const rows = turn.fill.rows.map((r) => r.slot.id === slotId && r.alternatives.length ? { ...r, meal: r.alternatives[0], alternatives: [...r.alternatives.slice(1), r.meal] } : r);
    return { ...turn, fill: { ...turn.fill, rows } };
  }));
  const putThemIn = (ti: number) => {
    const turn = p.turns[ti]; if (!turn?.fill) return;
    const date = turn.fill.date, before = turn.fill.rows.map((r) => [r.slot.id, p.planned[date]?.[r.slot.id] ?? null] as const);
    for (const r of turn.fill.rows) p.fill(date, r.slot.id, r.meal);
    setTurns((t) => t.map((x, i) => (i === ti && x.fill ? { ...x, fill: { ...x.fill, done: true } } : x)));
    undoable(`${ti}:fill`, () => { for (const [id, m] of before) p.fill(date, id, m); setTurns((t) => t.map((x, i) => (i === ti && x.fill ? { ...x, fill: { ...x.fill, done: false } } : x))); p.notify(`${before.length === 1 ? "The slot is" : "The slots are"} as before.`); });
    p.notify(`${turn.fill.rows.length === 1 ? "The slot is" : `${turn.fill.rows.length} slots are`} set for ${turn.fill.dayName}.`);
  };
  useEffect(() => { if (p.ask === "fill") { p.clearAsk(); fillNow(); } }, [p.ask]); // eslint-disable-line react-hooks/exhaustive-deps
  // DT179 (0.3.23): a question asked from Plan (a quick dinner after a late evening, a meal to carry on a full day)
  useEffect(() => { if (p.ask && typeof p.ask === "object") { const q = p.ask.q; p.clearAsk(); void ask(q); } }, [p.ask]); // eslint-disable-line react-hooks/exhaustive-deps
  // DT93 (0.2.88): Ask Chef Mealan from the Plate: the plate goes in the first question, asked at once
  // DT105 (0.2.92): an ingredient on the plate: ask for a dish around it
  useEffect(() => { if (p.ask === "around") { p.clearAsk(); void ask(plateQuestion(`What dish can I make around what is on my plate, so it makes a ${mealName}?`, state.items.map((i) => `${Math.round(i.grams)} g ${i.food.name}`))); } }, [p.ask]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (p.ask === "plate") { p.clearAsk(); void ask(plateQuestion(`What should I change on my plate so it makes a ${mealName}?`, state.items.map((i) => `${Math.round(i.grams)} g ${i.food.name}`))); } }, [p.ask]); // eslint-disable-line react-hooks/exhaustive-deps
  // the mic (0.2.4): the browser's own speech recognition, when it has one; the words land in the field
  const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const [listening, setListening] = useState(false);
  const listen = () => {
    if (!Speech) return;
    try {
      const r = new Speech(); r.lang = navigator.language || "en"; r.interimResults = false;
      r.onresult = (e: any) => { const said = Array.from(e.results).map((x: any) => x[0].transcript).join(" "); setText((t) => (t ? `${t} ${said}` : said)); };
      r.onend = () => setListening(false); r.onerror = () => setListening(false);
      setListening(true); r.start();
    } catch { setListening(false); }
  };
  const [photo, setPhoto] = useState("");
  const photoNow = photo;
  const { turns, setTurns, close } = p;
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [thinking, setThinking] = useState(false);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [turns, thinking]);
  const history = turns.filter((t) => !t.failed).slice(-6).map((t) => ({ role: t.role === "you" ? "user" : "assistant", content: t.text }));

  const say = (...t: Turn[]) => setTurns((x) => [...x, ...t]);
  // DT153: what each tick can undo, only while the chat is open: the map goes when the chat closes
  const undos = useRef(new Map<string, () => void>());
  const [, bump] = useState(0);
  const undoable = (key: string, fn: () => void) => { undos.current.set(key, fn); bump((n) => n + 1); };
  const undoOf = (key: string) => { const fn = undos.current.get(key); return fn ? () => { undos.current.delete(key); fn(); bump((n) => n + 1); } : undefined; };
  // DT153: the head says where you came from
  const backLabel = p.tab === "journey" ? "Back to the plate" : p.tab === "plan" ? "Back to the plan" : null;
  const usualOf = (id: string) => slotsOf(lifestyle).find((x) => x.id === id)?.time ?? "";
  const trainWhat = (d: { kind?: string } | null) => (d?.kind === "strength" ? "strength session" : d?.kind === "cardio" ? "cardio" : d?.kind === "walk" ? "walk" : "training");
  const dayRows = (): DaySlot[] => slots.map((x) => ({ name: x.name, time: x.time, meal: held[x.id]?.title ?? null, kcal: held[x.id]?.kcal ?? null,
    state: !held[x.id] ? "empty" : planDate === ymd(new Date()) && eatenIds.has(x.id) ? "eaten" : held[x.id]?.skipped ? "skipped" : "planned" }));
  // the swap's candidates: My recipes and Coach's recipes, then Chef Mealan's starters; each with an id Chef Mealan can name
  const swapChoices = () => [...state.meals.map((m) => ({ id: m.id, meal: fromMeal(m, m.from === "coach" ? "coach" : "mine") })), ...STARTERS.map((m, k) => ({ id: `starter-${k}`, meal: m }))];
  async function answerHere(msg: string, it: ReturnType<typeof intentOf>) {
    const you: Turn = { role: "you", text: msg };
    if (it.kind === "plate") {
      const t = aggregate(state.items);
      say(you, { role: "mealan", tag: "plate", text: plateAnswer(state.items.map((i) => ({ name: i.food.name, grams: i.grams })), { kcal: t.calories ?? 0, protein: t.protein ?? 0, pd: platePd !== null ? pdText(platePd) : null }, pdRef !== null ? pdVal(pdRef) : null) });
      return;
    }
    if (it.kind === "day") {
      const today = p.numbersFor(new Date());
      const text = it.ask === "left" ? leftAnswer(today ? { kcal: today.kcal, protein: today.protein } : null, { kcal: rec.kcal, protein: rec.protein })
        : planAnswer(dayRows(), numbers ? { kcal: numbers.kcal, protein: numbers.protein } : null, sumOf(held));
      say(you, { role: "mealan", tag: "day", text });
      return;
    }
    if (it.kind === "move") {
      const slot = slots.find((x) => x.id === it.slotId)!;
      const start = trainingTime(training);
      const m = moveOf(slot, it.to, start ? { start, minutes: training?.minutes ?? 60, what: trainWhat(training) } : null, slots);
      say(you, { role: "mealan", tag: "plan", text: m.text, move: m.ok ? { date: planDate, slotId: slot.id, from: m.from, to: m.to, usual: usualOf(slot.id) } : undefined });
      return;
    }
    if (it.kind === "swap") {
      const slot = slots.find((x) => x.id === it.slotId)!;
      const now = held[slot.id] ?? null, want = wantOf(msg);
      const day = numbers ? { kcal: numbers.kcal, protein: numbers.protein } : null;
      const tgt = day ? density(day.protein, day.kcal) : pdRef;
      const need = needOf(slots, slot, day)?.kcal ?? null;
      const choices = swapChoices().filter((c) => !now || c.meal.title.toLowerCase() !== now.title.toLowerCase());
      say(you); setThinking(true);
      let options: { meal: PlannedMeal; why: string }[] = [];
      try {
        if (p.ai.on) {
          const res = await fetch("/api/swap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
            slot: { name: slot.name, time: slot.time }, now: now ? { title: now.title, kcal: now.kcal, protein: now.protein } : null, ask: msg,
            candidates: choices.map((c) => ({ id: c.id, title: c.meal.title, kcal: c.meal.kcal, protein: c.meal.protein, from: c.meal.source })),
            library: state.foods.slice(0, 30).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })), target: tgt, need, goal: p.goal?.band, region: p.region, kitchens: p.personal.kitchens ?? [], taste: tasteForChef(p.personal) }) });
          const data = await res.json().catch(() => ({}));
          if (res.ok) for (const o of (data.options ?? []) as { id: string | null; title: string; why: string; foods: { name: string; grams: number; calories: number; protein: number }[] }[]) {
            let meal: PlannedMeal | null = choices.find((c) => c.id === o.id)?.meal ?? choices.find((c) => c.meal.title.toLowerCase() === o.title.toLowerCase())?.meal ?? null;
            if (!meal && o.foods?.length) {
              // a new meal: the person's own food values where the name is theirs, else Chef Mealan's estimate
              const items: Ingredient[] = o.foods.map((f) => { const lib = state.foods.find((x) => x.name.toLowerCase() === f.name.toLowerCase()); return { id: uid(), food: lib ?? asFood({ name: f.name, calories: f.calories, protein: f.protein, fats: (f as { fats?: number | null }).fats ?? null, carbs: (f as { carbs?: number | null }).carbs ?? null, typical_grams: f.grams, confidence: "medium" }), grams: f.grams, locked: false }; });
              const t = aggregate(items);
              meal = { title: o.title, kcal: Math.round(t.calories ?? 0), protein: Math.round(t.protein ?? 0), source: "starter", items, portion: Math.round(t.weight) };
            }
            if (meal && swapOk(meal, now, want, tgt) === null && !options.some((x) => x.meal.title === meal!.title)) options.push({ meal, why: o.why });
          }
        }
      } catch { /* the app's own picks below */ }
      // the app's own picks fill what Chef Mealan's ideas did not (failed the checks, or no answer)
      if (options.length < 2) for (const c of swapFallback(choices.map((x) => x.meal).filter((m) => !options.some((o) => o.meal.title === m.title)), now, want, tgt, 2 - options.length))
        options.push({ meal: c, why: c.source === "starter" ? "One of Chef Mealan's starters." : "From your recipes." });
      setThinking(false);
      say({ role: "mealan", tag: "chef", text: swapLead(slot.name, now, want, options.length), swap: options.length ? { date: planDate, slotId: slot.id, slotName: slot.name, time: slot.time, options } : undefined });
    }
  }
  const doSwap = (ti: number, k: number) => {
    const turn = p.turns[ti]; const sw = turn?.swap; if (!sw) return;
    const o = sw.options[k]; const was = p.planned[sw.date]?.[sw.slotId] ?? null; p.fill(sw.date, sw.slotId, o.meal);
    setTurns((t) => t.map((x, i) => (i === ti && x.swap ? { ...x, swap: { ...x.swap, done: o.meal.title } } : x)));
    undoable(`${ti}:swap`, () => { p.fill(sw.date, sw.slotId, was); setTurns((t) => t.map((x, i) => (i === ti && x.swap ? { ...x, swap: { ...x.swap, done: undefined } } : x))); p.notify(`${sw.slotName} is as before.`); });
    p.notify(`${sw.slotName} is now ${o.meal.title.toLowerCase()}.`);
  };
  const doMove = (ti: number, yes: boolean) => {
    const turn = p.turns[ti]; const mv = turn?.move; if (!mv) return;
    const was = p.personal.timesOn;
    if (yes) p.setPersonal({ ...p.personal, timesOn: withTimeOn(p.personal.timesOn, mv.date, mv.slotId, mv.to, mv.usual) });
    setTurns((t) => t.map((x, i) => (i === ti && x.move ? { ...x, move: { ...x.move, done: yes ? "moved" : "kept" } } : x)));
    undoable(`${ti}:move`, () => { if (yes) p.setPersonal({ ...p.personal, timesOn: was }); setTurns((t) => t.map((x, i) => (i === ti && x.move ? { ...x, move: { ...x.move, done: undefined } } : x))); });
    if (yes) p.notify(`Moved to ${mv.to}, for ${mv.date === ymd(new Date()) ? "today" : "that day"}.`);
  };
  async function ask(given?: string, again?: { ti: number; photo?: string }) {
    const msg = (typeof given === "string" ? given : text).trim();
    const photo = again ? again.photo ?? "" : photoNow;
    if (!msg && !photo) return;
    if (/^fill (today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(msg)) { setText(""); fillNow(); return; }
    // sorted first (0.2.8, board CH, CH6): the app answers what it knows, and proposes plan changes; only ideas go to the AI
    const it = intentOf(msg, slots);
    if (!photo && it.kind !== "ideas") { setText(""); await answerHere(msg, it); return; }
    if (!p.ai.on) { setTurns((t) => [...t, { role: "you", text: msg || "(photo)" }, { role: "mealan", text: p.ai.why || FIXED.off }]); setText(""); setPhoto(""); return; }
    const mine: Turn = { role: "you", text: msg || "(photo)", photo: photo || undefined };
    // DT152: Ask again sends the same question; the failed line greys, Asked again
    if (again) setTurns((t) => t.map((x, i) => (i === again.ti && x.failed ? { ...x, failed: { ...x.failed, retried: true } } : x)));
    else { setTurns((t) => [...t, mine]); setText(""); setPhoto(""); }
    const plateSent = p.tab === "journey" || /\bplate\b/i.test(msg);
    setThinking(true); setChatStage("ask");
    try {
      const res = await fetch("/api/out", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: msg, image: photo || undefined, history, screen: about,
          target: { pd: pdRef, mealKcal: state.goals.calories ? Math.round(state.goals.calories * (p.kind === "dessert" ? 0.1 : 0.35)) : null },
          kind: p.kind,
          // DT147 (0.2.128): the work hours, so advice on when to eat and train fits them
          work: workHoursOf(lifestyle),
          plate: p.tab === "journey" || /\bplate\b/i.test(msg) ? state.items.map((i) => ({ name: i.food.name, grams: i.grams, calories: i.food.calories, protein: i.food.protein })) : [],
          today: dayRows().map((r) => ({ slot: r.name, time: r.time, meal: r.meal, kcal: r.kcal, state: r.state })),
          left: (() => { const d = p.numbersFor(new Date()); return d ? { kcal: Math.round(d.kcal - rec.kcal), protein: Math.round(d.protein - rec.protein) } : null; })(),
          goal: p.goal?.band,
          kitchens: p.personal.kitchens ?? [], taste: tasteForChef(p.personal), rhythm: p.usual, moment: p.moment, region: p.region, travelTo: p.moment === "travel" ? p.travelTo : null,
          library: state.foods.slice(0, 24).map((f) => ({ name: f.name, calories: f.calories, protein: f.protein })),
          // SL5 (0.2.63): the meals the open shopping list left short (foods marked Not this time), so Chef Mealan knows when asked
          short: (() => { const l = openList(getStore()); return l ? shortMeals(l).map((m) => ({ day: m.date, slot: m.slot, meal: m.title, not_this_time: m.foods })) : []; })(),
        }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chef Mealan could not answer.");
      const recs: Rec[] = data.recognised ?? [];
      // build the plate from Mealan's picks, then let the solver, not the model, settle the numbers
      let picks: Ingredient[] = (data.picks ?? []).map((pk: { name: string; grams: number }) => {
        const r = recs.find((x) => x.name.toLowerCase() === pk.name.toLowerCase()) ?? recs.find((x) => x.name.toLowerCase().includes(pk.name.toLowerCase()));
        return r ? { id: uid(), food: asFood(r), grams: Math.max(0, pk.grams), locked: true } : null;
      }).filter(Boolean) as Ingredient[];
      let pd = density(aggregate(picks).protein, aggregate(picks).calories);
      let fitNote = "";
      if (picks.length >= 2 && pd !== null && pdRef !== null && pd < pdRef - 0.05) {
        // move the pick with the most protein until the plate fits, within a normal portion
        const lever = [...picks].sort((a, b) => (density(b.food.protein, b.food.calories) ?? -1) - (density(a.food.protein, a.food.calories) ?? -1))[0];
        const trial = picks.map((i) => ({ ...i, locked: i.id !== lever.id }));
        const sol = solveIngredient(trial, lever.id, pdRef, null);
        if (sol.ok && sol.grams <= 400) { picks = sol.items.map((i) => ({ ...i, locked: true })); pd = density(aggregate(picks).protein, aggregate(picks).calories); fitNote = ` I moved the ${lever.food.name} to ${fmt(sol.grams, 0)} g so it fits.`; }
        else fitNote = ` Even with more ${lever.food.name} this stays under your target; it's a treat, not a fit.`;
      }
      const kcal = aggregate(picks).calories;
      const taken = takeModelFlag(data.reply || ""); if (taken.flag) p.flagFromModel(taken.flag);
      setChatStage("match");
      // DT106: the foods he named, as rows under the answer, through the rules; only when a plate is open
      const rows = p.tab === "journey" && state.items.length ? chatRows(data.named ?? [], data.skip ?? [], state.foods, state.items, p.region, uid) : [];
      const reply: Turn = { role: "mealan", tag: "chef", text: taken.text + fitNote, picks, pd, kcal, ...(rows.length ? { rows } : {}) };
      setTurns((t) => [...t, reply]);
      log("out", { picks: picks.length, pd });
    } catch (e: any) {
      // DT152 (0.2.132): the failure is his answer, under the question, with Ask again; not the message at the bottom
      log("out_failed", { why: String(e?.message ?? "").slice(0, 80) });
      setTurns((t) => [...t, { role: "mealan", text: `I didn't answer this time: ${failWhy(e)} Your question${plateSent && state.items.length ? " and the plate are" : " is"} kept.`, failed: { text: msg, photo: photo || undefined, why: failWhy(e), plate: plateSent } }]);
    } finally { setThinking(false); }
  }

  // DT106: what a row does; the turn remembers it
  function rowDone(i: number, key: string, what: "added" | "out" | "scan") { setTurns((ts) => ts.map((t, k) => (k === i ? { ...t, rowsDone: { ...(t.rowsDone ?? {}), [key]: what } } : t))); }
  function rowUndone(i: number, key: string) { setTurns((ts) => ts.map((t, k) => { if (k !== i || !t.rowsDone) return t; const d = { ...t.rowsDone }; delete d[key]; return { ...t, rowsDone: d }; })); }
  function rowAdd(i: number, r: Extract<ChatRow, { kind: "add" }>) {
    const before = new Set(state.items.map((x) => x.id));
    p.add(r.food); rowDone(i, r.name, "added"); p.notify(`${Math.round(r.grams)} g ${cookName(r.food.name).short.toLowerCase()} on the plate.`);
    // DT153: Undo takes off what this tap put on, nothing else
    undoable(`${i}:row:${r.name}`, () => { setState((s) => { const mine = s.items.filter((x) => !before.has(x.id) && (x.food.id === r.food.id || x.food.name.startsWith(r.food.name))); const drop = mine[mine.length - 1]?.id; return { ...s, items: s.items.filter((x) => x.id !== drop), portion: null }; }); rowUndone(i, r.name); p.notify(`${cookName(r.food.name).short} is off the plate.`); });
  }
  function rowOut(i: number, r: Extract<ChatRow, { kind: "drop" }>) {
    const at = state.items.findIndex((x) => x.id === r.itemId), item = state.items[at];
    setState((s) => ({ ...s, items: s.items.filter((x) => x.id !== r.itemId), portion: null })); rowDone(i, r.name, "out");
    if (item) undoable(`${i}:row:${r.name}`, () => { setState((s) => { const items = [...s.items]; items.splice(Math.min(at, items.length), 0, item); return { ...s, items, portion: null }; }); rowUndone(i, r.name); p.notify(`${cookName(item.food.name).short} is back on the plate.`); });
  }
  function rowScan(i: number, r: Extract<ChatRow, { kind: "scan" }>) { rowDone(i, r.name, "scan"); p.openScan(); }
  function toPlate(t: Turn) {
    if (!t.picks?.length) return;
    const items = t.picks.map((i) => {
      const lib = state.foods.find((f) => f.name.toLowerCase() === i.food.name.toLowerCase());
      return { id: uid(), food: lib ?? i.food, grams: i.grams, locked: false };
    });
    setState((s) => ({ ...s, items, portion: null }));
    p.toPlate();
  }
  function keep(t: Turn) {
    if (!t.picks?.length) return;
    const meal = { id: uid(), title: `With Chef Mealan: ${t.picks.map((i) => i.food.name).join(", ")}`, items: t.picks, portion: t.picks.reduce((n, i) => n + i.grams, 0), savedAt: new Date().toISOString() };
    setState((s) => ({ ...s, feedback: [{ id: uid(), meal, status: "eaten" as const, taste: "Chat", notes: turns.filter((x) => x.role === "you").map((x) => x.text).join(" / ").slice(0, 300), createdAt: new Date().toISOString() }, ...s.feedback] }));
    log("feedback", { status: "eaten", taste: "Chat" });
    p.notify("Saved to your meals.");
  }

  return (
    <div className="chat-screen">
      {/* DT153 (0.2.132): the head stays at the top and says where you came from; outside .head, so it can stick */}
      <div className="menu-head chat-head"><h2>{CHEF_NAME}</h2><button className="link" onClick={close}>{backLabel ?? "Close"}</button></div>
      <div className="head">
        <p>{about} Say what you want, or tap a line below.</p>
        {doorOpen ? <SafetyQuestion p={p} doneLabel="Back to the chat" onDone={() => setDoorOpen(false)} /> : <SafetyNote safety={p.safety} ai={p.ai} onAnswer={() => setDoorOpen(true)} />}
      </div>
      <div className="chat">
        {turns.length === 0 && (
          <div className="moments chips-start">
            {chips.map((c) => (
              <button key={c} className="pill pill-small" onClick={() => ask(c)}>{c}</button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className={`bubble ${t.role}${t.failed?.retried ? " bubble-greyed" : ""}`}>
            {t.photo && <img src={t.photo} alt="" />}
            {t.plate && <span className="plate-chip">Plate: {t.plate.join(" · ")}</span>}
            {t.tag && <small className={`bubble-tag tag-${t.tag}`}>{TAG[t.tag]}</small>}
            <p>{t.text}</p>
            {t.failed && (
              <div className="button-row">
                {t.failed.retried ? <span className="done-tick done-start done-quiet"><b>Asked again</b></span>
                  : <><button type="button" className="pill pill-small pill-primary" disabled={thinking} onClick={() => void ask(t.failed!.text, { ti: i, photo: t.failed!.photo })}>Ask again</button>{backLabel && <button type="button" className="pill pill-small" onClick={close}>{backLabel}</button>}</>}
              </div>
            )}
            {t.swap && (
              <div className="picks fill-rows">
                {t.swap.options.filter((o) => !t.swap!.done || o.meal.title === t.swap!.done).map((o, k) => (
                  <div key={o.meal.title} className="fill-row">
                    <div className="fill-text"><small>{t.swap!.slotName}, {t.swap!.time}</small><b>{o.meal.title}</b><small>{fmt(o.meal.kcal, 0)} kcal · {fmt(o.meal.protein, 0)} g · {pdText(density(o.meal.protein, o.meal.kcal))}</small>{o.why && <small className="swap-why">{o.why}</small>}</div>
                    {t.swap!.done ? <Done text="Swapped" undo={undoOf(`${i}:swap`)} /> : <button className="pill pill-small" onClick={() => doSwap(i, t.swap!.options.indexOf(o))}>Swap</button>}
                  </div>
                ))}
              </div>
            )}
            {t.move && (
              <div className="button-row">
                {t.move.done ? <Done start text={t.move.done === "moved" ? `Moved to ${t.move.to}` : `Kept at ${t.move.from}`} undo={undoOf(`${i}:move`)} />
                  : <><button className="pill pill-small pill-primary" onClick={() => doMove(i, true)}>Move it</button><button className="pill pill-small" onClick={() => doMove(i, false)}>Keep {t.move.from}</button></>}
              </div>
            )}
            {t.fill && (
              <div className="picks fill-rows">
                {t.fill.rows.map((r) => (
                  <div key={r.slot.id} className="fill-row">
                    <div className="fill-text"><small>{r.slot.name}, {r.slot.time}</small><b>{r.meal.title}</b><small>{fmt(r.meal.kcal, 0)} kcal · {fmt(r.meal.protein, 0)} g · {pdText(density(r.meal.protein, r.meal.kcal))}</small></div>
                    {!t.fill!.done && r.alternatives.length > 0 && <button className="pill pill-small" onClick={() => changeOne(i, r.slot.id)}>Change</button>}
                  </div>
                ))}
                <div className="button-row">
                  {t.fill.done
                    ? <><Done start text="In the plan" undo={undoOf(`${i}:fill`)} />{backLabel === "Back to the plan" && <button className="pill pill-small pill-primary back-after" onClick={close}>Back to the plan</button>}</>
                    : <button className="pill pill-small pill-primary" onClick={() => putThemIn(i)}>Put them in the plan</button>}
                </div>
              </div>
            )}
            {t.rows && t.rows.length > 0 && (
              <div className="picks chat-rows">
                {t.rows.map((r) => { const done = t.rowsDone?.[r.name]; return (
                  <div key={r.kind + r.name} className="tip-row">
                    {r.kind === "add" && <><div className="tip-text"><b>{r.name}</b><small>{r.from === "mine" ? "in your foods" : "basic food"} · {fmt(r.grams, 0)} g · {pdText(density(r.food.protein, r.food.calories))}{r.reaches !== null ? ` · the plate reaches ${pdVal(r.reaches)}` : ""}</small></div>
                      {done === "added" ? <Done text="On the plate" undo={undoOf(`${i}:row:${r.name}`)} /> : <button type="button" className="pill pill-small pill-primary" onClick={() => rowAdd(i, r)}>+ Add</button>}</>}
                    {r.kind === "drop" && <><div className="tip-text"><b>{r.name}</b><small>on the plate · {fmt(r.grams, 0)} g</small></div>
                      {done === "out" ? <Done text="Out" undo={undoOf(`${i}:row:${r.name}`)} /> : <button type="button" className="pill pill-small" onClick={() => rowOut(i, r)}>Take it out</button>}</>}
                    {r.kind === "scan" && <><div className="tip-text"><b>{r.name}</b><small>not in your foods</small></div>
                      <button type="button" className="pill pill-small" onClick={() => rowScan(i, r)}>Scan it</button></>}
                  </div>); })}
                {/* 02:08: a way back to the Plate under the rows, not only Close at the top */}
                {p.tab === "journey" && <div className="button-row"><button type="button" className={`pill pill-small${Object.values(t.rowsDone ?? {}).some((d) => d === "added") ? " pill-primary" : ""}`} onClick={close}>Back to the plate</button></div>}
              </div>
            )}
            {/* 02:08: the photo block (Work on it with Chef Mealan, This is what I had) belongs to a photo; a written answer with rows never shows it */}
            {t.picks && t.picks.length > 0 && !(t.rows && t.rows.length) && (
              <div className="picks">
                {t.picks.map((i) => <div key={i.id}><b>{fmt(i.grams, 0)} g</b> {i.food.name} <small>~{fmt(i.food.calories, 0)} kcal · {fmt(i.food.protein)} g protein per 100 g</small></div>)}
                <div className="picks-total">{pdText(t.pd ?? null)}{pdRef !== null ? ` · target ${pdVal(pdRef)}` : ""} · {fmt(t.kcal ?? null, 0)} kcal</div>
                <div className="button-row">
                  <button className="pill pill-small pill-primary" onClick={() => toPlate(t)}>Work on it with {CHEF_NAME}</button>
                  <button className="pill pill-small" onClick={() => keep(t)}>This is what I had</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {/* DT107 (0.2.92): the chips come back under every answer, not only in an empty chat */}
        {turns.length > 0 && !thinking && turns[turns.length - 1].role === "mealan" && (
          <div className="moments chips-start chips-again">
            {chips.map((c) => (
              <button key={c} className="pill pill-small" onClick={() => ask(c)}>{c}</button>
            ))}
          </div>
        )}
        {/* DT111 (0.2.94): the wait shows its steps, collapsed, above the field */}
        {thinking && <WaitSteps steps={[{ key: "ask", text: `Asked ${CHEF_NAME}` }, { key: "match", text: "Matching the foods he names to yours" }]} at={chatStage} done={chatStage === "match" ? ["ask"] : []} />}
        <div ref={endRef} />
      </div>
      <div className="chat-bottom">
      {photo && <div className="strip">Photo attached. <button className="link" onClick={() => setPhoto("")}>Remove</button></div>}
      <div className="chat-input">
        <button className="icon" aria-label="Add a photo" onClick={() => fileRef.current?.click()}><Camera size={20} /></button>
        <ClearField value={text} onClear={() => setText("")} label="Clear the question"><input value={text} placeholder="Or ask in your words" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} enterKeyHint="send" /></ClearField>
        {Speech && <button className={`icon ${listening ? "listening" : ""}`} aria-label={listening ? "Listening" : "Say it"} onClick={listen}><Mic size={20} /></button>}
        <button className="icon" aria-label="Send" onClick={() => ask()}><Send size={20} /></button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader(); r.onload = () => resizeImageBase64(String(r.result), 1024, 1024).then(setPhoto).catch(() => {}); r.readAsDataURL(f); e.target.value = "";
        }} />
      </div>
      </div>
    </div>
  );
}
