// DT177 (0.3.20, board Stories125; Coach Milan 30 October 22:16 Go): a second phone on the counter. On the cooking phone, Use
// another screen opens a session with a 4-letter code and a QR code; the other phone or tablet joins at chefmealan.com/cook,
// with no sign-in. Both screens move together: a step or a tick on either shows on both, read every 2 seconds. The kitchen
// screen gets the recipe's name, steps and amounts only. Chef, look on the kitchen screen: one photo with the step.
import { useEffect, useRef, useState } from "react";
import type { Ingredient } from "../pilot";
import { CookMode, type CookLink } from "./CookMode";
import { QrCode } from "./QrCode";

type Pub = { code: string; title: string; steps: string[]; items: Ingredient[]; step: number; by: "owner" | "kitchen"; ticks: number[]; joined: boolean; ended: boolean; rev: number };
// what the kitchen screen gets of a food: its name and amount, how it is counted, a frying pot; no numbers
export const slimItems = (items: Ingredient[]) => items.filter((i) => i.grams > 0).map((i) => ({ id: i.id, grams: i.grams, ...(i.count ? { count: i.count } : {}), ...((i as any).fry ? { fry: (i as any).fry } : {}), food: { name: i.food.name, ...(i.food.brand ? { brand: i.food.brand } : {}) } }));
const post = async (url: string, body: unknown) => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "That didn't work. Try again."); return d; };
const POLL_MS = 2000;

// the cooking phone: cook mode, with Use another screen
export function PairedCookMode(x: Parameters<typeof CookMode>[0] & { notify: (m: string) => void }) {
  const { notify, ...cook } = x;
  const [code, setCode] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [opening, setOpening] = useState(false);
  const [err, setErr] = useState("");
  const [remote, setRemote] = useState<{ k: number; rev: number } | null>(null);
  const [remoteTicks, setRemoteTicks] = useState<number[]>([]);
  const [at, setAt] = useState(0);
  const seen = useRef(0), codeRef = useRef<string | null>(null);
  codeRef.current = code;
  const open = async () => {
    setOpening(true); setErr("");
    try { const d = await post("/api/cook/session", { title: cook.title, steps: cook.steps, items: slimItems(cook.items), step: at, ticks: [...cook.ticks] }); setCode(d.code); setJoined(false); seen.current = d.session.rev; }
    catch (e: any) { setErr(e?.message || "That didn't work. Try again."); } finally { setOpening(false); }
  };
  const end = (say = true) => { const c = codeRef.current; if (c) void post("/api/cook/update", { code: c, end: true }).catch(() => {}); setCode(null); setJoined(false); if (say) notify("The kitchen screen is closed."); };
  useEffect(() => {
    if (!code) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/cook/state?code=${encodeURIComponent(code)}`); const d = await r.json().catch(() => ({}));
        if (stop) return;
        if (!r.ok || d.session?.ended) { setCode(null); setJoined(false); if (joined) notify("The kitchen screen left."); return; }
        const s: Pub = d.session;
        if (s.joined && !joined) { setJoined(true); notify("The kitchen screen is on."); }
        if (s.rev > seen.current) { seen.current = s.rev; if (s.by === "kitchen") setRemote({ k: s.step, rev: s.rev }); setRemoteTicks(s.ticks); }
      } catch { /* offline for a moment: the next read catches up */ }
    };
    const id = setInterval(tick, POLL_MS); void tick();
    return () => { stop = true; clearInterval(id); };
  }, [code, joined]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { const c = codeRef.current; if (c) void post("/api/cook/update", { code: c, end: true }).catch(() => {}); }, []);
  const link: CookLink = {
    remoteStep: remote,
    onStep: (k) => { setAt(k); const c = codeRef.current; if (c && joined) void post("/api/cook/update", { code: c, step: k }).then((d) => { seen.current = Math.max(seen.current, d.session.rev); }).catch(() => {}); },
    top: code && joined ? <div className="cook-link" role="status"><small>Also on the kitchen screen · step {at + 1} of {cook.steps.length}</small><button className="pill pill-small" onClick={() => end()}>End</button></div> : null,
    pair: code && !joined ? (
      <section className="cook-card cook-pair" aria-label="Use another screen">
        <b style={{ fontSize: 17 }}>Use another screen</b>
        <small>On the other phone or tablet, open <b>chefmealan.com/cook</b> and type the code, or scan.</small>
        <span className="pair-code" aria-label={`Code ${code.split("").join(" ")}`}>{code}</span>
        <QrCode text={`${location.origin}/cook?c=${code}`} size={168} label={`QR code for the kitchen screen, code ${code}`} />
        <small className="muted">The code works once and ends after 10 minutes. The other screen sees the recipe and the steps, never your numbers.</small>
        <button className="pill" onClick={() => end(false)}>Cancel</button>
      </section>
    ) : !code ? <>
      <button className="pill pill-wide cook-pair-open" disabled={opening} onClick={() => void open()}>📱 Use another screen</button>
      {err ? <small className="error">{err}</small> : <small className="muted cook-under">A second phone or tablet on the counter shows the steps and can look at the pan.</small>}
    </> : null,
  };
  const ticks = new Set([...cook.ticks, ...remoteTicks]);
  return <CookMode {...cook} ticks={ticks} link={link}
    onTick={(k) => { cook.onTick(k); const c = codeRef.current; if (c && joined) void post("/api/cook/update", { code: c, tick: k }).catch(() => {}); }}
    onClose={() => { end(false); cook.onClose(); }} />;
}
