// DT180 to DT187 (0.3.25, boards Stories129 to Stories136; Coach Milan 31 October 11:16 to 13:12): Explorer in one sentence:
// what you eat (Nutrients), what it becomes (The body), when it helps and when it hurts (Situations). This file holds the map
// of The body, the list of Situations, the first situation page in full, and the search index over all of Explorer.
// Every line with a number names its paper; the papers were read again on 31 October 2026 (PubMed) before this was written.
// The wellness line: what happens in anyone; no test read, no level, no condition, no treatment, no supplement.

export type Part = "nutrients" | "body" | "situations";
export type BodyId = "muscle" | "fat" | "glycogen" | "bone" | "gut" | "liver" | "hormones" | "brain";
export type BodyFamily = { id: BodyId; name: string; hint: string; horizon: "meal" | "day" | "week" | "month"; state: "later" | "page" };
// the eight families (DT182, Stories131): the pages come one or two per version; until then each row says later
export const BODY_FAMILIES: BodyFamily[] = [
  { id: "muscle", name: "Muscle", hint: "Built by protein and strength training; the sink for carbs after a session.", horizon: "month", state: "later" },
  { id: "fat", name: "The fat store", hint: "The fat you carry, against the fat you eat. Burned, used over the day, stored; ketones.", horizon: "day", state: "page" },
  { id: "glycogen", name: "Glycogen", hint: "The carb store, muscle and liver, about a day's worth. Only what was used gets refilled.", horizon: "day", state: "page" },
  { id: "bone", name: "Bone", hint: "Calcium and vitamin D from Micros, strength training, oestrogen for everyone.", horizon: "month", state: "later" },
  { id: "gut", name: "The gut", hint: "Starts in the mouth. Digestion, the microbiome, fibre and variety, the fullness messengers.", horizon: "day", state: "later" },
  { id: "liver", name: "The liver", hint: "Makes glucose and ketones, clears alcohol, holds the small glycogen store.", horizon: "day", state: "later" },
  { id: "hormones", name: "Hormones", hint: "The messengers: glucose and insulin, hunger, cortisol, testosterone, oestrogen.", horizon: "day", state: "page" },
  { id: "brain", name: "The brain", hint: "Dopamine, serotonin, adrenaline, endorphins: wanting, mood, stress, the feeling after a session.", horizon: "day", state: "later" },
];

export type SituationId = "sleep" | "late" | "party" | "away" | "rest" | "fatburn";
export type Situation = { id: SituationId; name: string; hint: string; horizon: "day" | "week"; state: "later" | "page" };
export const SITUATIONS: Situation[] = [
  { id: "sleep", name: "A bad night's sleep", hint: "You eat more, sweet looks better, training feels harder. What causes it, and your day.", horizon: "day", state: "page" },
  { id: "late", name: "A late evening after work", hint: "Later", horizon: "day", state: "later" },
  { id: "party", name: "A party or a dinner out", hint: "Later", horizon: "day", state: "later" },
  { id: "away", name: "A day away, no kitchen", hint: "Later", horizon: "day", state: "later" },
  { id: "rest", name: "A day off training", hint: "Later", horizon: "day", state: "later" },
  { id: "fatburn", name: "Fat burning: what is true when", hint: "A walk before breakfast, a hard session, a low-carb day: each claim placed. Your week against the goal.", horizon: "week", state: "page" },
];

export type Line = { title: string; text: string; src?: string };
export type WhenRow = { verdict: "Helps" | "Hurts" | "Watch"; when: string; what: string };
export type SituationPage = { id: SituationId; name: string; intro: string; effects: Line[]; causes: Line[]; loop: Line; when: WhenRow[]; line: string; chips: string[]; sources: string };

// DT180 (Stories129): a bad night's sleep, a day situation. The papers, read on 31 October 2026:
// Al Khatib, Harding, Darzi and Pot 2017, Eur J Clin Nutr 71:614, doi 10.1038/ejcn.2016.201 (meta-analysis, 11 studies: +385 kcal, more fat, less protein, no change in carbs)
// Greer, Goldstein and Walker 2013, Nat Commun 4:2259, doi 10.1038/ncomms3259 (frontal and insular cortex down, amygdala up, more desire for high-calorie food)
// Fullagar et al. 2015, Sports Med 45:161, doi 10.1007/s40279-014-0260-0 (review: some maximal efforts hold; sport-specific performance, cognition worse)
// Drake, Roehrs, Shambroom and Roth 2013, J Clin Sleep Med 9:1195, doi 10.5664/jcsm.3170 (400 mg caffeine at 0, 3 and 6 h before bed, each disturbed sleep)
// Ebrahim et al. 2013, Alcohol Clin Exp Res 37:539, doi 10.1111/acer.12006 (review: alcohol shortens sleep onset, disrupts the second half)
// Crispim et al. 2011, J Clin Sleep Med 7:659, doi 10.5664/jcsm.1476 (52 healthy adults: intake near sleep correlated with poorer sleep)
// Stutz, Eiholzer and Spengler 2019, Sports Med 49:269, doi 10.1007/s40279-018-1015-0 (meta-analysis: evening exercise does not harm sleep; vigorous within 1 h of bed may)
// Afaghi, O'Connor and Chow 2007, Am J Clin Nutr 85:426, doi 10.1093/ajcn/85.2.426 (high-GI meal 4 h before bed: sleep onset 9 min against 17.5)
export const SLEEP_PAGE: SituationPage = {
  id: "sleep", name: "A bad night's sleep",
  intro: "A day situation. What a short night does to the day, what causes it, and your case from what the app already knows. Food, training and timing only. Never a condition: with sleep that stays bad, see your doctor.",
  effects: [
    { title: "You eat more, about 385 kcal", text: "After a short night people ate about 385 kcal more the next day, in a review of 11 studies. As more fat and less protein, not as more carbs.", src: "Al Khatib et al. 2017, European Journal of Clinical Nutrition, meta-analysis" },
    { title: "Sweet and salty foods look better", text: "After a night without sleep, the part of the brain that weighs choices is quieter and the part that wants is louder, and people choose more high-calorie food.", src: "Greer, Goldstein and Walker 2013, Nature Communications" },
    { title: "Training feels harder", text: "Some maximal efforts hold up for one night; sport-specific performance, reaction and judgment get worse. An easy session or a walk keeps the habit without the cost.", src: "Fullagar et al. 2015, Sports Medicine, review" },
    { title: "Your numbers do not change", text: "Today's target is today's target. What changes is where the energy sits in the day." },
  ],
  causes: [
    { title: "Coffee after 14:00", text: "400 mg of caffeine, about two large coffees, taken 6 hours before bed disturbed sleep measurably, and people did not notice it.", src: "Drake et al. 2013, Journal of Clinical Sleep Medicine" },
    { title: "A drink in the evening", text: "Alcohol brings sleep on faster and breaks the second half of the night.", src: "Ebrahim et al. 2013, Alcoholism: Clinical and Experimental Research, review" },
    { title: "A late, heavy dinner", text: "Eating close to bedtime goes with poorer sleep in healthy people. A carb meal four hours before bed did the opposite in one study: sleep came faster. So: a heavy late meal, never no carbs at night.", src: "Crispim et al. 2011; Afaghi, O'Connor and Chow 2007" },
    { title: "A hard session late", text: "Evening training does not harm sleep; a hard session ending within an hour of bed may delay it.", src: "Stutz, Eiholzer and Spengler 2019, Sports Medicine, meta-analysis" },
  ],
  loop: { title: "A loop", text: "A short night makes a late snack likely; a late snack makes the next night short. The way out is one evening done at the usual times." },
  when: [
    { verdict: "Helps", when: "Breakfast and lunch with protein and fibre", what: "The plate holds the hunger that a short night brings." },
    { verdict: "Helps", when: "A planned snack in the afternoon", what: "Instead of a craving at 22:30. On Plan, at a time you pick." },
    { verdict: "Watch", when: "Today's training", what: "An easy session or a walk keeps the habit; a hard one can wait a day. Keep it is always open." },
    { verdict: "Hurts", when: "Coffee after 14:00, a drink tonight", what: "Both make the next night short too." },
  ],
  line: "Never a condition, a diagnosis or a treatment. With sleep that stays bad, the line is the same as for any health question: see your doctor.",
  chips: ["Why am I hungrier today?", "What do I eat tonight?", "Should I train today?"],
  sources: "Al Khatib et al. 2017, Eur J Clin Nutr 71:614; Greer, Goldstein and Walker 2013, Nat Commun 4:2259; Fullagar et al. 2015, Sports Med 45:161; Drake et al. 2013, J Clin Sleep Med 9:1195; Ebrahim et al. 2013, Alcohol Clin Exp Res 37:539; Crispim et al. 2011, J Clin Sleep Med 7:659; Stutz, Eiholzer and Spengler 2019, Sports Med 49:269; Afaghi, O'Connor and Chow 2007, Am J Clin Nutr 85:426. Educational, approximate, not medical advice.",
};
export const SITUATION_PAGES: Partial<Record<SituationId, SituationPage>> = { sleep: SLEEP_PAGE };

// ---- search (Milan 13:12: Explorer grew, one bar finds a nutrient, a food, a family, a situation, a claim, a line) ----
export type Hit = { part: Part; kind: "page" | "family" | "member" | "food" | "situation" | "line"; title: string; hint: string; go: { part: Part; family?: string; body?: BodyId; situation?: SituationId; member?: string } };
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export function buildIndex(extra: { nutrients: { family: string; name: string; members: string[]; foods: string[]; hint: string }[] }): Hit[] {
  const out: Hit[] = [];
  for (const n of extra.nutrients) {
    out.push({ part: "nutrients", kind: "page", title: n.name, hint: n.hint, go: { part: "nutrients", family: n.family } });
    for (const m of n.members) out.push({ part: "nutrients", kind: "member", title: m, hint: `In ${n.name}`, go: { part: "nutrients", family: n.family, member: m } });
    for (const f of n.foods) out.push({ part: "nutrients", kind: "food", title: f, hint: `A food on ${n.name}`, go: { part: "nutrients", family: n.family } });
  }
  for (const b of BODY_FAMILIES) out.push({ part: "body", kind: "family", title: b.name, hint: b.state === "page" ? b.hint : `${b.hint} Its page comes later.`, go: { part: "body", body: b.id } });
  for (const s of SITUATIONS) out.push({ part: "situations", kind: "situation", title: s.name, hint: s.state === "page" ? s.hint : "Its page comes later.", go: { part: "situations", situation: s.id } });
  for (const pg of Object.values(BODY_PAGES)) {
    out.push({ part: "body", kind: "page", title: pg.name, hint: pg.intro.slice(0, 90) + "…", go: { part: "body", body: pg.family, member: pg.key } });
    for (const s of pg.sections) for (const l of s.lines) out.push({ part: "body", kind: "line", title: l.title, hint: `${pg.name}: ${l.text.slice(0, 90)}${l.text.length > 90 ? "…" : ""}`, go: { part: "body", body: pg.family, member: pg.key } });
    for (const w of pg.when) out.push({ part: "body", kind: "line", title: w.when, hint: `${pg.name}, ${w.verdict.toLowerCase()}: ${w.what}`, go: { part: "body", body: pg.family, member: pg.key } });
  }
  for (const m of HORMONE_MEMBERS) if (!m.page) out.push({ part: "body", kind: "member", title: m.name, hint: `${m.hint} Its page comes later.`, go: { part: "body", body: "hormones" } });
  for (const pg of Object.values(SITUATION_PAGES)) {
    if (!pg) continue;
    for (const l of [...pg.effects, ...pg.causes, pg.loop]) out.push({ part: "situations", kind: "line", title: l.title, hint: `${pg.name}: ${l.text.slice(0, 90)}${l.text.length > 90 ? "…" : ""}`, go: { part: "situations", situation: pg.id } });
    for (const w of pg.when) out.push({ part: "situations", kind: "line", title: w.when, hint: `${pg.name}, ${w.verdict.toLowerCase()}: ${w.what}`, go: { part: "situations", situation: pg.id } });
  }
  return out;
}
// the words typed, each one found in the title or the hint; the title match first, then the hint; a page, family, member or
// situation before a line that starts with the same word (0.3.27: "sleep" finds the situation before Testosterone's Sleep line); at most 12
export function searchIndex(index: Hit[], q: string): Hit[] {
  const words = norm(q).split(/\s+/).filter((w) => w.length >= 2);
  if (!words.length) return [];
  const score = (h: Hit) => { const t = norm(h.title), s = norm(h.hint); let n = 0; for (const w of words) { if (t.includes(w)) n += 3; else if (s.includes(w)) n += 1; else return 0; } return n + (t.startsWith(words[0]) ? 2 : 0) + (h.kind === "line" || h.kind === "food" ? 0 : 3); };
  return index.map((h) => ({ h, n: score(h) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 12).map((x) => x.h);
}

// ---- The body: the first pages (0.3.26; DT181 Stories130, DT182 Stories131). The papers, read on 31 October 2026 (PubMed):
// Ludwig 2002, JAMA 287:2414, doi 10.1001/jama.287.18.2414 (the glycaemic index, a review)
// Atkinson, Foster-Powell and Brand-Miller 2008, Diabetes Care 31:2281 (the GI tables, already on the Carbs page)
// Richter and Hargreaves 2013, Physiol Rev 93:993, doi 10.1152/physrev.00038.2012 (contracting muscle takes up glucose; training raises GLUT4)
// Spiegel, Leproult and Van Cauter 1999, Lancet 354:1435, doi 10.1016/S0140-6736(99)01376-8 (6 nights of 4 h: glucose tolerance lower, evening cortisol up)
// Jensen, Rustad, Kolnes and Lai 2011, Front Physiol 2:112, doi 10.3389/fphys.2011.00112 (glycogen about 500 g in muscle, about 100 g in the liver; refilled after exercise)
// Nilsson and Hultman 1973, Scand J Clin Lab Invest 32:325, doi 10.3109/00365517309084355 (liver glycogen falls with starvation and a carb-poor diet, refilled by carbs)
// Burke, Hawley, Wong and Jeukendrup 2011, J Sports Sci 29 Suppl 1:S17, doi 10.1080/02640414.2011.585473 (carbohydrate availability, refuelling between sessions)
// Venables, Achten and Jeukendrup 2005, J Appl Physiol 98:160, doi 10.1152/japplphysiol.00662.2003 (300 people: fat oxidation peaks at about 48 % of VO2max, about 62 % of max heart rate)
// Hall et al. 2012, Am J Clin Nutr 95:989, doi 10.3945/ajcn.112.036350 (energy balance and its components, a consensus statement)
// Hellerstein 1999, Eur J Clin Nutr 53 Suppl 1:S53, doi 10.1038/sj.ejcn.1600744 (carbs become fat in the liver only when carb energy exceeds total energy expenditure)
// Cahill 2006, Annu Rev Nutr 26:1, doi 10.1146/annurev.nutr.26.061505.111258 (fuel metabolism in starvation: ketones feed the brain)
// Schoenfeld et al. 2014, J Int Soc Sports Nutr 11:54, doi 10.1186/s12970-014-0054-7 (20 women, 4 weeks: fasted and fed cardio lost the same fat)
export type BodyPage = { key: string; family: BodyId; name: string; horizon: string; intro: string; sections: { title: string; lines: Line[] }[]; when: WhenRow[]; line: string; chips: string[]; sources: string };
export const BODY_PAGES: Record<string, BodyPage> = {
  glucose: {
    key: "glucose", family: "hormones", name: "Glucose and insulin", horizon: "meal",
    intro: "After a meal, glucose rises in the blood and insulin carries it into muscle and fat. Both rise and fall again. That is the curve, and anyone with a sensor can watch it. Read at the meal. What food, training and sleep do to it, for anyone. Never a test, a condition or a treatment: for any of those, your doctor.",
    sections: [
      { title: "What it does", lines: [
        { title: "After a meal, glucose rises, insulin answers", text: "Carbs raise it most, protein some, fat and fibre little. In two to three hours both are back where they were. A high curve now and then is normal; a plate that keeps the curve low and long is the one that keeps you full.", src: "Ludwig 2002, JAMA, the glycaemic index review" },
        { title: "How fast depends on the food, not only how much", text: "White bread and a baked potato raise glucose fast (GI about 70 and above); lentils and most fruit slowly (GI under 55). The Carbs page has the table.", src: "Atkinson, Foster-Powell and Brand-Miller 2008, Diabetes Care, International Tables of GI" },
        { title: "Protein and fibre in the same meal slow the rise", text: "The same carbs with protein and fibre on the plate give a lower, longer curve. That is the plate the app builds anyway: protein first, fibre with it.", src: "Ludwig 2002, JAMA" },
      ] },
      { title: "What moves it", lines: [
        { title: "Training", text: "Working muscle takes up glucose during a session and for hours after, with little insulin needed, and training raises the muscle's capacity for it. The meal after training is the one where carbs land best.", src: "Richter and Hargreaves 2013, Physiological Reviews" },
        { title: "Short nights", text: "Six nights of four hours in bed lowered glucose tolerance in healthy young men: the same meal, a higher curve. One short night moves it the same way for that day.", src: "Spiegel, Leproult and Van Cauter 1999, The Lancet" },
        { title: "Meal size", text: "A big meal is a big curve; the same food in two meals is two smaller curves. The eating window from Lifestyle is where this is set.", src: "Ludwig 2002, JAMA" },
        { title: "Glucose and glycogen", text: "Glucose is what moves in the blood, held in a narrow range. Glycogen is the store, in muscle and liver, about a day's worth. A meal fills the liver; work empties the muscle; only what was used gets refilled. Its own page is under The body." },
      ] },
    ],
    when: [
      { verdict: "Helps", when: "Morning, before work", what: "Carbs with protein and fibre: a slow curve, steady until lunch." },
      { verdict: "Helps", when: "Before and after training", what: "The one place where fast carbs land best: the muscle takes them up with little insulin." },
      { verdict: "Helps", when: "A hard day for the body", what: "A hard session, a long walk, a day on your feet: muscle glycogen is used, and a carb dinner refills it. The carbs in your day's range, not a heavy meal; no big meal within an hour of bed." },
      { verdict: "Watch", when: "A hard day for the head", what: "Nothing to refill: the brain runs on the liver's small store, and any meal tops that up. A carb dinner is fine and may help you fall asleep, but it counts like any other carbs in the day." },
      { verdict: "Hurts", when: "A quiet day, a late evening", what: "No work for the carbs to do. The curve lands as a late snack, and a second one follows the first." },
      { verdict: "Watch", when: "After a short night", what: "The curve is higher for the same food that day. Protein first, carbs with it." },
    ],
    line: "This page explains the curve after a meal, in anyone. It does not read your numbers, does not say what a number means for you, and does not name a condition. If you have been told to watch your glucose, your doctor's plan comes first; Chef Mealan follows the numbers you give it.",
    chips: ["Why am I sleepy after lunch?", "Which carbs before training?", "Is fruit sugar different?"],
    sources: "Ludwig 2002, JAMA 287:2414; Atkinson, Foster-Powell and Brand-Miller 2008, Diabetes Care 31:2281; Richter and Hargreaves 2013, Physiol Rev 93:993; Spiegel, Leproult and Van Cauter 1999, Lancet 354:1435. Educational, approximate, not medical advice.",
  },
  glycogen: {
    key: "glycogen", family: "glycogen", name: "Glycogen", horizon: "day",
    intro: "Glucose is what moves in the blood, held in a narrow range all day. Glycogen is the store: about 500 g in muscle, about 100 g in the liver, a day's worth. Read at the day. What food, training and sleep do to it, for anyone. Never a test, a condition or a treatment: for any of those, your doctor.",
    sections: [
      { title: "What it does", lines: [
        { title: "Two stores, two jobs", text: "The liver's store keeps blood glucose steady between meals and overnight; any meal refills it. Muscle's store is for the muscle only: it is used when muscle works, and refilled by carbs after. Muscle holds about 500 g, the liver about 100 g.", src: "Jensen, Rustad, Kolnes and Lai 2011, Frontiers in Physiology" },
        { title: "Overnight and on a carb-poor day", text: "The liver's store runs down over a night and a day without carbs, and carbs refill it. That is why the first meal after a short night matters most on the Glucose page.", src: "Nilsson and Hultman 1973, Scandinavian Journal of Clinical and Laboratory Investigation" },
        { title: "Only what was used gets refilled", text: "A hard session or a long day on your feet empties muscle glycogen; the next carbs put it back, fastest in the hours after. A full store takes nothing more: what is over goes to the day's total.", src: "Burke, Hawley, Wong and Jeukendrup 2011, Journal of Sports Sciences; Jensen et al. 2011" },
      ] },
    ],
    when: [
      { verdict: "Helps", when: "The meal after a hard session", what: "The store is open; carbs land there first. The biggest carb meal of a training day goes here." },
      { verdict: "Helps", when: "The evening after a day on your feet", what: "Muscle was used; a carb dinner refills it. The carbs in your day's range, not a heavy meal." },
      { verdict: "Watch", when: "A hard day for the head", what: "Nothing to refill in the muscle; the liver's store is topped up by any meal. Carbs count like any others that day." },
      { verdict: "Watch", when: "Two rest days in a row", what: "The store is full. Carbs are still fine inside the range; they just have no special job." },
    ],
    line: "What the store does in anyone. No test, no condition, no supplement. What is refilled is glycogen, never glucose, and only what was used; a heavy meal helps nothing.",
    chips: ["How much do I eat after training?", "Are carbs at night bad?", "What is a rest day's dinner?"],
    sources: "Jensen, Rustad, Kolnes and Lai 2011, Front Physiol 2:112; Nilsson and Hultman 1973, Scand J Clin Lab Invest 32:325; Burke, Hawley, Wong and Jeukendrup 2011, J Sports Sci 29 Suppl 1:S17. Educational, approximate, not medical advice.",
  },
  fat: {
    key: "fat", family: "fat", name: "The fat store", horizon: "day",
    intro: "The fat you eat is fuel and building material. The fat you carry is the store. They are not the same thing, and the one does not become the other by itself. Read at the day. What food, training and sleep do to it, for anyone. Never a test, a condition or a treatment: for any of those, your doctor.",
    sections: [
      { title: "Five words, and what each one means", lines: [
        { title: "In circulation", text: "Fatty acids in the blood are fuel on its way, from the last meal or from the store. Highest a few hours after a meal and during easy work.", src: "Hall et al. 2012, American Journal of Clinical Nutrition, energy balance" },
        { title: "Burned, or oxidised", text: "Muscle burns fat all the time: most in easy work, at about 48 % of your top effort or about 62 % of your top heart rate in 300 people, least in a hard session, where carbs take over. A session burns less fat than the day around it.", src: "Venables, Achten and Jeukendrup 2005, Journal of Applied Physiology" },
        { title: "Used over the day", text: "The honest number. What the store gave up is the day's total out against the day's total in, not what one session did.", src: "Hall et al. 2012, American Journal of Clinical Nutrition" },
        { title: "Stored", text: "What is over the day's total goes to the store, from carbs, fat or protein alike. Fat gets there with the least work; carbs are turned into fat only when carb energy is more than the whole day burns.", src: "Hellerstein 1999, European Journal of Clinical Nutrition" },
        { title: "Ketones", text: "The liver makes them when carbs are low for a day or more; the brain can run on them. Normal in a fast or a low-carb day. Not a sign of fat loss by itself.", src: "Cahill 2006, Annual Review of Nutrition" },
      ] },
    ],
    when: [
      { verdict: "Helps", when: "Easy work: a walk, a slow ride", what: "The most fat burned per minute, and it adds up over hours. The reason steps are in your day." },
      { verdict: "Watch", when: "A hard session", what: "Carbs do the work; fat is burned later, in the hours after. The session still counts, through the day's total." },
      { verdict: "Watch", when: "The hours after a big meal", what: "Storage for a few hours is normal; it is what a meal is for. The day decides, not the meal." },
      { verdict: "Hurts", when: "Counting what a session burned", what: "The number on a watch is the session, not the day. The day's range on Goal is the number that moves the store." },
    ],
    line: "What the store does in anyone. No body fat reading, no target, no fat burner, no ketone strip. Your weigh-ins and the trend on Goal are the app's view of this, and only you choose to share them.",
    chips: ["Does my walk burn fat?", "Is a low-carb day better?", "Why is the scale flat this week?"],
    sources: "Hall et al. 2012, Am J Clin Nutr 95:989; Venables, Achten and Jeukendrup 2005, J Appl Physiol 98:160; Hellerstein 1999, Eur J Clin Nutr 53 Suppl 1:S53; Cahill 2006, Annu Rev Nutr 26:1. Educational, approximate, not medical advice.",
  },
};
// the Hormones family: its members, the first with a page
export const HORMONE_MEMBERS: { key: string; name: string; hint: string; page?: string }[] = [
  { key: "glucose", name: "Glucose and insulin", hint: "The curve after a meal, and the hormone that answers it. Read per meal.", page: "glucose" },
  { key: "hunger", name: "Hunger hormones", hint: "Leptin says full, ghrelin says hungry. Read per day." },
  { key: "cortisol", name: "Cortisol", hint: "The morning hormone. Read per day." },
  { key: "testosterone", name: "Testosterone", hint: "Muscle, drive and recovery, in everyone. Read per month." },
  { key: "oestrogen", name: "Oestrogen", hint: "Bone, where fat sits, recovery, in everyone. Read per month." },
];
// the second situation page (DT182): fat burning, what is true when
export const FATBURN_PAGE: SituationPage = {
  id: "fatburn", name: "Fat burning: what is true when",
  intro: "A week situation. The claims people repeat, each one true in one situation and not in another. The body pages explain the words; this page says when. Food, training and the day's total only. Never a condition: for anything about your health, your doctor.",
  effects: [
    { title: "A walk before breakfast", text: "More fat is burned during the walk than after a meal; that is true. Over four weeks, women who trained fasted and women who ate first lost the same fat on the same diet. Do it if you like it, not for the number.", src: "Schoenfeld et al. 2014, Journal of the International Society of Sports Nutrition" },
    { title: "A long easy walk or ride", text: "The most fat burned per minute, for hours. The steps in your day are this.", src: "Venables, Achten and Jeukendrup 2005, Journal of Applied Physiology" },
    { title: "A hard session", text: "Carbs do the work during it; fat is burned in the hours after. The session counts through the day's total and the muscle it builds.", src: "Venables, Achten and Jeukendrup 2005" },
  ],
  causes: [
    { title: "The hours after a big meal", text: "Storage for a few hours is what a meal is for. Nothing is lost; the day decides.", src: "Hall et al. 2012, American Journal of Clinical Nutrition" },
    { title: "A low-carb day", text: "Ketones appear after a day or more. Normal, and not fat loss by itself: the day's total still decides.", src: "Cahill 2006, Annual Review of Nutrition" },
    { title: "A cut that is too deep", text: "Below the range on Goal, the body saves energy and drops muscle with the fat. Lose fat, faster, is the lowest the app goes." },
  ],
  loop: { title: "The honest number", text: "What the store gave up this week is the week's total out against the week's total in. Your weigh-ins, on the 7-day average, are the app's view of it." },
  when: [
    { verdict: "Helps", when: "A walk after lunch, most days", what: "Easy work that adds up. On Plan as a row, like a meal." },
    { verdict: "Helps", when: "Protein at every meal, the strength days kept", what: "The fat goes, the muscle stays." },
    { verdict: "Watch", when: "The scale, day to day", what: "Water moves a kilo in a day. The 7-day average on Goal is the line to read." },
    { verdict: "Hurts", when: "A harder cut when the week was flat", what: "The range on Goal is the guard. A flat week is a week to look at the record, not the range." },
  ],
  line: "No body fat reading, no target below your range, no fat burner, no ketone strip. The weigh-ins and the trend on Goal are the app's view, shared only by your choice.",
  chips: ["Does my walk burn fat?", "Is a low-carb day better?", "Why is the scale flat this week?"],
  sources: "Schoenfeld et al. 2014, J Int Soc Sports Nutr 11:54; Venables, Achten and Jeukendrup 2005, J Appl Physiol 98:160; Hall et al. 2012, Am J Clin Nutr 95:989; Cahill 2006, Annu Rev Nutr 26:1. Educational, approximate, not medical advice.",
};
SITUATION_PAGES.fatburn = FATBURN_PAGE;

// ---- 0.3.27 (DT181 v2, Stories130; Milan 14:18 "Next release. Go"): Hormones' other four members. The papers, read again on 31 October 2026 (PubMed):
// Spiegel, Tasali, Penev and Van Cauter 2004, Ann Intern Med 141:846, doi 10.7326/0003-4819-141-11-200412070-00008 (12 men, two nights of 4 h: leptin 18 % down, ghrelin 28 % up, hunger 24 % up, for calorie-dense, high-carb food)
// Weigle et al. 2005, Am J Clin Nutr 82:41, doi 10.1093/ajcn.82.1.41 (19 people, protein 15 to 30 % of energy, carbs unchanged: 441 kcal a day less eaten on their own, 4.9 kg over 12 weeks; leptin fell and ghrelin rose, hunger still down)
// Leproult, Copinschi, Buxton and Van Cauter 1997, Sleep 20:865 (evening cortisol 37 % higher after a night cut to 4 h, 45 % after no sleep; the evening fall at least an hour later)
// Lovallo et al. 2005, Psychosom Med 67:734, doi 10.1097/01.psy.0000181270.20036.06 (96 people; 250 mg caffeine raised cortisol; with 300 to 600 mg a day the morning response went, the afternoon one stayed, back to normal by the evening)
// Leproult and Van Cauter 2011, JAMA 305:2173, doi 10.1001/jama.2011.710 (10 young men, a week of 5 h in bed: daytime testosterone 10 to 15 % lower; ageing is 1 to 2 % a year; cortisol unchanged)
// Kraemer and Ratamess 2005, Sports Med 35:339, doi 10.2165/00007256-200535040-00004 (review: testosterone, growth hormone and cortisol up for 15 to 30 minutes after a session with big muscles, high volume, short rests; resting levels often unchanged while strength and muscle grow)
// Camacho et al. 2013, Eur J Endocrinol 168:445, doi 10.1530/EJE-12-0890 (EMAS: 2,395 men aged 40 to 79 over 4.4 years: weight loss went with testosterone up, weight gain with testosterone down; a change in physical activity did not move it)
// Loucks and Thuma 2003, J Clin Endocrinol Metab 88:297, doi 10.1210/jc.2002-020369 (29 women, 5 days: the cycle's signal held at 30 kcal per kg of lean mass a day left after training, and broke below it)
// Finkelstein et al. 2013, N Engl J Med 369:1011, doi 10.1056/NEJMoa1206168 (400 healthy men 20 to 50, 16 weeks: testosterone keeps muscle and strength; the oestrogen made from it is what keeps body fat from rising; both carry desire)
export const HORMONE_PAGES: Record<string, BodyPage> = {
  hunger: {
    key: "hunger", family: "hormones", name: "Hunger hormones", horizon: "day",
    intro: "Leptin tells the brain there is enough; ghrelin says eat. Both are normal, all day, in everyone. Sleep, protein and meal size move them. Read at the day. Never a test, a condition or a treatment: for any of those, your doctor.",
    sections: [
      { title: "What moves them", lines: [
        { title: "Two short nights", text: "After two nights of four hours in bed, leptin was 18 % lower and ghrelin 28 % higher in 12 healthy men. Hunger rose by about a quarter, most of all for calorie-dense, high-carb food.", src: "Spiegel, Tasali, Penev and Van Cauter 2004, Annals of Internal Medicine" },
        { title: "Protein in the meal", text: "Protein raised from 15 to 30 % of the day's energy, carbs unchanged: 19 people ate about 440 kcal a day less without being told to, over 12 weeks. Ghrelin rose and leptin fell as weight came off, and hunger still stayed down.", src: "Weigle et al. 2005, American Journal of Clinical Nutrition" },
        { title: "Fullness arrives late", text: "The signal from the gut takes time to reach the brain. Fibre and volume on the plate, and a meal eaten at a table, give it time to arrive before the plate is empty. The Plate's Fi letter is that lever." },
        { title: "A fat loss phase", text: "As weight falls, ghrelin rises and leptin falls, in everyone. That is why a cut gets harder, not weaker will. Protein at every meal and fibre hold it; your protein range is set for that.", src: "Weigle et al. 2005" },
      ] },
    ],
    when: [
      { verdict: "Helps", when: "Hunger before a planned meal", what: "That is ghrelin doing its job. The meal is on Plan; eat it." },
      { verdict: "Hurts", when: "Hunger at 22:30 after a short night", what: "Ghrelin up, leptin down, and the brain prefers sweet. A planned snack in the afternoon and dinner at the usual time take it away." },
      { verdict: "Watch", when: "A fat loss phase", what: "Hunger rises as weight falls. Protein at every meal and fibre keep it in check; the cut stays inside your range." },
      { verdict: "Helps", when: "Protein first on the plate", what: "The fullest plate for the same energy. That is the plate the app builds anyway." },
    ],
    line: "This page explains hunger in anyone. No page reads a level, names a condition, or names a drug that acts on these messengers. Appetite that worries you is a question for your doctor.",
    chips: ["Why am I hungry at night?", "Which foods keep me full?", "Is hunger on a cut normal?"],
    sources: "Spiegel, Tasali, Penev and Van Cauter 2004, Ann Intern Med 141:846; Weigle et al. 2005, Am J Clin Nutr 82:41. Educational, approximate, not medical advice.",
  },
  cortisol: {
    key: "cortisol", family: "hormones", name: "Cortisol", horizon: "day",
    intro: "The morning hormone: high at waking, so you get up; low at night, so you sleep. It rises for an hour around a hard session, and that is normal. Read at the day. Stress as a feeling is not measured here. Never a test, a condition or a treatment: for any of those, your doctor.",
    sections: [
      { title: "What moves it", lines: [
        { title: "A short night", text: "After a night cut to four hours, the next evening's cortisol was 37 % higher; after no sleep, 45 %. The evening fall came at least an hour later. The morning was unchanged.", src: "Leproult, Copinschi, Buxton and Van Cauter 1997, Sleep" },
        { title: "Caffeine", text: "A 250 mg dose, about one large coffee, raised cortisol in 96 people. With daily caffeine the morning response faded, but the afternoon dose still raised it, and it was back to normal by the evening.", src: "Lovallo et al. 2005, Psychosomatic Medicine" },
        { title: "A hard session", text: "Cortisol rises with testosterone and growth hormone for 15 to 30 minutes after a session with big muscles and short rests. That is part of the training, not a cost.", src: "Kraemer and Ratamess 2005, Sports Medicine, review" },
        { title: "A week of short nights", text: "A week of five hours in bed did not raise daytime cortisol in young men; it lowered testosterone instead. One short night moves the evening; a week moves other things.", src: "Leproult and Van Cauter 2011, JAMA" },
      ] },
    ],
    when: [
      { verdict: "Helps", when: "The morning", what: "High at waking is the design. Breakfast with protein and carbs, and the day starts." },
      { verdict: "Helps", when: "The hour of a session", what: "The rise is the session doing its work. Eat after, and it settles." },
      { verdict: "Hurts", when: "Coffee after 14:00", what: "The afternoon dose keeps it up into the evening; the same coffee at 9:00 does little." },
      { verdict: "Hurts", when: "A short night, the next evening", what: "Higher and later. Dinner at the usual time and bed at the usual time bring the next night back." },
      { verdict: "Watch", when: "A hard session late", what: "Fine most evenings; one ending within an hour of bed can push sleep later. Keep it is always open." },
    ],
    line: "This page explains the daily curve in anyone. No page reads a level, names a condition, or names stress as a diagnosis. A feeling of stress that stays is a question for your doctor.",
    chips: ["Is coffee after lunch a problem?", "Why am I wired at night?", "Does training late hurt sleep?"],
    sources: "Leproult, Copinschi, Buxton and Van Cauter 1997, Sleep 20:865; Lovallo et al. 2005, Psychosom Med 67:734; Kraemer and Ratamess 2005, Sports Med 35:339; Leproult and Van Cauter 2011, JAMA 305:2173. Educational, approximate, not medical advice.",
  },
  testosterone: {
    key: "testosterone", family: "hormones", name: "Testosterone", horizon: "month",
    intro: "Testosterone builds muscle, strength, drive and recovery, in everyone; men have more of it, women have it too. Four levers move it: sleep, strength training, body fat, enough food. Read at the month. No level, no supplement, no booster, ever. If you want your level known, that is a blood test with your doctor.",
    sections: [
      { title: "What moves it", lines: [
        { title: "Sleep", text: "A week of five hours in bed cut daytime testosterone by 10 to 15 % in healthy young men. The usual fall with age is 1 to 2 % a year, so one week of short nights is like ten years, and it comes back with the nights.", src: "Leproult and Van Cauter 2011, JAMA" },
        { title: "Strength training", text: "A session with big movements, high volume and short rests raises it for 15 to 30 minutes. The long-term gain comes from the training itself: resting levels often do not change while strength and muscle grow.", src: "Kraemer and Ratamess 2005, Sports Medicine, review" },
        { title: "Body fat", text: "In 2,395 men aged 40 to 79 followed for four years, losing weight went with testosterone up, and gaining with testosterone down. A change in physical activity alone did not move it. Your weigh-ins and the trend on Goal are the app's view of this.", src: "Camacho et al. 2013, European Journal of Endocrinology, the EMAS study" },
        { title: "Eating far too little", text: "A long, deep cut turns the whole axis down, in everyone. In women the signal broke below 30 kcal per kg of lean mass a day left after training. Your range on Goal is set so that does not happen; Lose fat is the lowest the app goes.", src: "Loucks and Thuma 2003, Journal of Clinical Endocrinology and Metabolism" },
        { title: "What it does, and what oestrogen does", text: "In 400 healthy men, testosterone kept muscle and strength; the oestrogen made from it kept body fat from rising; both carried desire. The two are one system, in everyone.", src: "Finkelstein et al. 2013, New England Journal of Medicine" },
      ] },
    ],
    when: [
      { verdict: "Helps", when: "The hour after a strength session", what: "The rise is normal and useful. Eat, then sleep on it." },
      { verdict: "Hurts", when: "Chasing the hour", what: "Longer sessions and supplements to keep it up do nothing lasting; the training itself does." },
      { verdict: "Hurts", when: "A week of short nights", what: "The one lever that moves fastest, both ways." },
      { verdict: "Watch", when: "A fat loss phase", what: "Losing fat helps in the long run; a cut too deep or too long does the opposite. Your range on Goal keeps it inside." },
    ],
    line: "No page says your level, low or high. No supplement is named, and no booster: the four levers above are the ones with evidence. If you want your level known, that is a blood test with your doctor.",
    chips: ["Does my training raise it?", "How much does sleep matter?", "Is a cut bad for it?"],
    sources: "Leproult and Van Cauter 2011, JAMA 305:2173; Kraemer and Ratamess 2005, Sports Med 35:339; Camacho et al. 2013, Eur J Endocrinol 168:445; Loucks and Thuma 2003, J Clin Endocrinol Metab 88:297; Finkelstein et al. 2013, N Engl J Med 369:1011. Educational, approximate, not medical advice.",
  },
  oestrogen: {
    key: "oestrogen", family: "hormones", name: "Oestrogen", horizon: "month",
    intro: "Oestrogen is in everyone: women make most of it in the ovaries; men make theirs from testosterone. It keeps bone, says where fat sits, and carries recovery and desire. The same levers as testosterone: sleep, training, body fat, enough food. Read at the month. The cycle gets its own page later. Never a test, a condition or a treatment: for any of those, your doctor.",
    sections: [
      { title: "What moves it", lines: [
        { title: "Made from testosterone, in men too", text: "In 400 healthy men, the oestrogen made from testosterone was what kept body fat from rising; testosterone itself kept muscle and strength. Lower one and the other follows.", src: "Finkelstein et al. 2013, New England Journal of Medicine" },
        { title: "Enough food after training", text: "In 29 women, the signal that drives the cycle held at 30 kcal per kg of lean mass a day left over after training, and broke below it within five days. Not body fat: the energy left after the session. Your range on Goal keeps that line.", src: "Loucks and Thuma 2003, Journal of Clinical Endocrinology and Metabolism" },
        { title: "Body fat, both ways", text: "Fat tissue makes some oestrogen in everyone. Too little fat and too little food lower it; too much shifts the balance the other way. The middle of your range on Goal is where it sits best." },
        { title: "Bone", text: "Oestrogen is the hormone that holds bone, in men and women. Strength training, calcium and vitamin D from Micros, and enough food are the levers the app has. Its own page is under Bone." },
      ] },
    ],
    when: [
      { verdict: "Helps", when: "Eating enough on training days", what: "The energy left after the session is what the signal reads. Carbs after training count twice: glycogen and this." },
      { verdict: "Hurts", when: "A deep cut with hard training", what: "The fastest way to push the energy left below the line. Lose fat with the training kept easy, or keep the food up." },
      { verdict: "Watch", when: "A long cut", what: "Weeks matter more than days. The check-in on Goal is where the length is read." },
      { verdict: "Helps", when: "Strength training, twice a week", what: "For bone and for the whole axis, in everyone." },
    ],
    line: "No page reads a level, names a condition, or names a treatment. A cycle that changes, or any question about it, is for your doctor. The cycle's page, when it comes, keeps the same line.",
    chips: ["Do men have oestrogen?", "Is my cut too deep?", "What does it do for bone?"],
    sources: "Finkelstein et al. 2013, N Engl J Med 369:1011; Loucks and Thuma 2003, J Clin Endocrinol Metab 88:297. Educational, approximate, not medical advice.",
  },
};
for (const k of Object.keys(HORMONE_PAGES)) { BODY_PAGES[k] = HORMONE_PAGES[k]; const m = HORMONE_MEMBERS.find((x) => x.key === k); if (m) m.page = k; }
