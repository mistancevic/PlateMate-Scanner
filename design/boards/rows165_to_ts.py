# DT165: the six mineral foods from rows165_E.json as shared food table rows, the same shape as DT164's
import json, sys
d = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "rows165_E.json"))
META = {"chickpeas": ("Chickpeas, boiled", "🫘", "200 g", 200), "sardines": ("Sardines, canned in oil", "🐟", "1 can, 90 g", 90),
        "pumpkin": ("Pumpkin seeds", "🎃", "A handful, 30 g", 30), "tofu": ("Tofu, firm, set with calcium", "🥢", "100 g", 100),
        "kale": ("Kale, raw", "🥬", "A handful, 50 g", 50), "liver": ("Beef liver, pan-fried", "🥩", "100 g", 100)}
def n(v): return "null" if v is None else (str(int(v)) if float(v).is_integer() and abs(v) >= 100 else repr(round(float(v), 4)).rstrip("0").rstrip(".") if "." in repr(float(v)) else str(v))
def num(v):
    if v is None: return "null"
    v = float(v); s = f"{v:.4f}".rstrip("0").rstrip("."); return s if s not in ("-0", "") else "0"
out = []
for k, r in d.items():
    name, icon, lab, g = META[k]
    A = None if r["retinol"] is None and r["bcar"] is None else round((r["retinol"] or 0) + (r["bcar"] or 0) / 6 + ((r["acar"] or 0) + (r["bcrypt"] or 0)) / 12, 1)
    m = {"a": A, "d": r["vitD"], "e": r["vitE"], "k": r["vitK"], "c": r["vitC"], "b1": r["b1"], "b2": r["b2"], "b3": r["b3"], "b5": r["b5"], "b6": r["b6"], "b7": r["b7"], "b12": r["b12"], "fol": r["fol"], "ca": r["ca"], "fe": r["fe"], "mg": r["mg"], "k_": r["k"], "zn": r["zn"]}
    aa = "null" if r.get("aa") is None or any(v is None for v in r["aa"].values()) else json.dumps({a: float(num(v)) if "." in num(v) else int(num(v)) for a, v in r["aa"].items()}).replace(".0,", ",").replace(".0}", "}")
    ret = f", retinol: {num(r['retinol'])}" if r["retinol"] else ""
    out.append(f'  {{ id: "{k}", name: "{name}", icon: "{icon}", portion: {{"label": "{lab}", "grams": {g}}}, src: "USDA SR Legacy, FDC {r["fdc"]}, {r["name"]}",\n'
      f'    kcal: {num(r["kcal"])}, protein: {num(r["protein"])}, fat: {num(r["fat"])}, carb: {num(r["carb"])}, fibre: {num(r["fibre"])}, sugar: {num(r["sugar"])},\n'
      f'    sfa: {num(r["sfa"])}, mufa: {num(r["mufa"])}, pufa: {num(r["pufa"])}, trans: {num(r["trans"])}, la: {num(r["la"])}, ala: {num(r["ala"])}, epa: {num(r["epa"])}, dpa: {num(r["dpa"])}, dha: {num(r["dha"])},\n'
      f'    aa: {aa},\n    micro: {{ ' + ", ".join(f"{a}: {num(v)}" for a, v in m.items()) + f" }}{ret} }},")
open("foodtable_rows165.ts.txt", "w").write("\n".join(out) + "\n"); print("\n".join(out))
