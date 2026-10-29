// DT151 v3: amino acids per 100 g (g), checked against USDA FoodData Central (SR Legacy / Foundation) via triagemethod, bodbot.
// Need: WHO/FAO/UNU 2007 adult requirement, mg per kg per day. Pairs as WHO counts them.
const NEED = { his: 10, ile: 20, leu: 39, lys: 30, saa: 15, aaa: 25, thr: 15, trp: 4, val: 26 };
const D = {
  whey:    { kcal: 370, p: 90,   g: 30,  aa: { his: 1.70, ile: 6.20, leu: 11.0, lys: 9.50, met: 2.10, cys: 2.26, phe: 3.00, tyr: 2.26, thr: 6.80, trp: 1.70, val: 5.70 } },
  chicken: { kcal: 120, p: 22.3, g: 150, aa: { his: 0.830, ile: 1.096, leu: 1.837, lys: 2.148, met: 0.578, cys: 0.237, phe: 0.889, tyr: 0.800, thr: 0.993, trp: 0.267, val: 1.141 } },
  yogurt:  { kcal: 61,  p: 10.3, g: 200, aa: { his: 0.29, ile: 0.53, leu: 1.0, lys: 0.83, met: 0.29, cys: 0.08, phe: 0.51, tyr: 0.51, thr: 0.41, trp: 0.13, val: 0.67 } },
  salmon:  { kcal: 208, p: 20.4, g: 150, aa: { his: 0.540, ile: 0.959, leu: 1.610, lys: 1.870, met: 0.621, cys: 0.209, phe: 0.840, tyr: 0.750, thr: 0.861, trp: 0.199, val: 1.100 } },
  soy:     { kcal: 172, p: 18.2, g: 150, aa: { his: 0.45, ile: 0.81, leu: 1.36, lys: 1.11, met: 0.22, cys: 0.27, phe: 0.87, tyr: 0.63, thr: 0.72, trp: 0.24, val: 0.83 } },
  egg:     { kcal: 148, p: 12.4, g: 100, aa: { his: 0.28, ile: 0.62, leu: 1.10, lys: 0.83, met: 0.42, cys: 0.27, phe: 0.66, tyr: 0.51, thr: 0.59, trp: 0.17, val: 0.73 } },
  lentils: { kcal: 116, p: 9.0,  g: 200, aa: { his: 0.25, ile: 0.39, leu: 0.65, lys: 0.63, met: 0.08, cys: 0.12, phe: 0.45, tyr: 0.24, thr: 0.32, trp: 0.08, val: 0.45 } },
  oats:    { kcal: 379, p: 13.2, g: 50,  aa: { his: 0.28, ile: 0.50, leu: 0.98, lys: 0.64, met: 0.21, cys: 0.46, phe: 0.67, tyr: 0.40, thr: 0.38, trp: 0.18, val: 0.69 } },
};
const pair = (a) => ({ his: a.his, ile: a.ile, leu: a.leu, lys: a.lys, saa: a.met + a.cys, aaa: a.phe + a.tyr, thr: a.thr, trp: a.trp, val: a.val });
// v4 (Milan 11:02): against one meal. The meal's protein from the day's target; each amino acid against what that much good
// protein needs at the WHO 2007 adult pattern, mg per g protein; the meal's protein is your own target, not the WHO minimum. Leucine against 2.5 g a meal, the amount widely cited for muscle repair.
const PAT = { his: 15, ile: 30, leu: 59, lys: 45, saa: 22, aaa: 38, thr: 23, trp: 6, val: 39 };
const DIAAS = { whey: 1.09, chicken: 1.10, yogurt: 1.14, salmon: 1.09, soy: 0.90, egg: 1.13, lentils: 0.63, oats: 0.57 };
module.exports.meal = (mealP) => { const out = {}; for (const [k, f] of Object.entries(D)) { const a = pair(f.aa), por = {}, need = {};
  for (const n of Object.keys(PAT)) { por[n] = +(a[n] * f.g / 100).toFixed(2); need[n] = +(PAT[n] * mealP / 1000).toFixed(2); }
  const pct = Object.fromEntries(Object.keys(PAT).map((n) => [n, Math.round(100 * por[n] / need[n])]));
  const protein = +(f.p * f.g / 100).toFixed(1);
  // v4c: the nine essential amino acids in the portion, their sum against the ~10 g a meal needs for muscle repair, and per
  // gram of protein against the WHO need (all eight cover it for an adult; the lowest is named)
  const nine = ["his", "ile", "leu", "lys", "met", "phe", "thr", "trp", "val"];
  const eaa = +nine.reduce((t, n) => t + f.aa[n] * f.g / 100, 0).toFixed(1);
  const perg = Object.fromEntries(Object.keys(PAT).map((n) => [n, +((a[n] * 1000 / f.p) / PAT[n]).toFixed(2)]));
  const lowest = Object.entries(perg).sort((x, y) => x[1] - y[1])[0];
  out[k] = { kcal: f.kcal, p: f.p, g: f.g, pd: +(100 * f.p / f.kcal).toFixed(1), protein, closes: Math.round(100 * protein / mealP), mealP, por, need, pct, leu: por.leu, diaas: DIAAS[k], eaa, perg, lowest }; } return out; };
const out = {};
module.exports.day = (kg) => { for (const [k, f] of Object.entries(D)) { const a = pair(f.aa), por = {}, day = {};
  for (const n of Object.keys(NEED)) { por[n] = +(a[n] * f.g / 100).toFixed(2); day[n] = +(NEED[n] * kg / 1000).toFixed(2); }
  const pct = Object.fromEntries(Object.keys(NEED).map((n) => [n, Math.round(100 * por[n] / day[n])]));
  const low = Object.entries(pct).sort((x, y) => x[1] - y[1])[0];
  out[k] = { kcal: f.kcal, p: f.p, g: f.g, pd: +(100 * f.p / f.kcal).toFixed(1), protein: +(f.p * f.g / 100).toFixed(1), por, day, pct, low }; } return out; };
if (require.main === module) { const m = module.exports.meal(60); for (const [k, v] of Object.entries(m)) console.log(k.padEnd(8), v.protein + " g", v.closes + "%", "leu " + v.leu, "eaa " + v.eaa, "lowest " + v.lowest.join(" ")); const r = module.exports.day(85); for (const [k, v] of Object.entries(r)) console.log(k.padEnd(8), v.g + " g", "prot " + v.protein, "PD " + v.pd, JSON.stringify(v.pct), "low", v.low.join(" ")); console.log("day", JSON.stringify(r.egg.day)); }
