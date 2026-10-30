// DT177 (0.3.20, board Stories125): the kitchen screen, chefmealan.com/cook. No sign-in: the 4-letter code from the cooking
// phone joins this screen to its session, once. It shows the recipe and the steps, nothing about the person, and forgets all
// of it when the session ends. Chef, look takes one photo of the pan (the camera here, or the phone's camera app) and sends it
// with the step; the photo is not kept.
import { useEffect, useRef, useState } from "react";
import type { Ingredient } from "../pilot";
import { CookMode } from "../components/CookMode";
import { resizeImageBase64 } from "../utils/image";

type Pub = { code: string; title: string; steps: string[]; items: Ingredient[]; step: number; by: "owner" | "kitchen"; ticks: number[]; joined: boolean; ended: boolean; rev: number };
const post = async (url: string, body: unknown) => { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "That didn't work. Try again."); return d; };
const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(f); });

export function KitchenScreen() {
  const first = (() => { try { return (new URLSearchParams(location.search).get("c") || "").toUpperCase().slice(0, 4); } catch { return ""; } })();
  const [code, setCode] = useState(first);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [s, setS] = useState<Pub | null>(null);
  const [ended, setEnded] = useState(false);
  const [remote, setRemote] = useState<{ k: number; rev: number } | null>(null);
  const seen = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const pending = useRef<((f: File | null) => void) | null>(null);
  const join = async (c: string) => {
    setBusy(true); setErr("");
    try { const d = await post("/api/cook/join", { code: c }); setToken(d.token); setS(d.session); seen.current = d.session.rev; setRemote({ k: d.session.step, rev: d.session.rev }); try { history.replaceState(null, "", "/cook"); } catch { /* fine */ } }
    catch (e: any) { setErr(e?.message || "That didn't work. Try again."); } finally { setBusy(false); }
  };
  useEffect(() => { if (first.length === 4) void join(first); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token || !s) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/cook/state?code=${encodeURIComponent(s.code)}&token=${encodeURIComponent(token)}`); const d = await r.json().catch(() => ({}));
        if (stop) return;
        if (!r.ok || d.session?.ended) { setEnded(true); setToken(null); setS(null); return; }
        const n: Pub = d.session;
        if (n.rev > seen.current) { seen.current = n.rev; if (n.by === "owner") setRemote({ k: n.step, rev: n.rev }); setS((o) => (o ? { ...o, ticks: n.ticks } : o)); }
      } catch { /* offline for a moment */ }
    };
    const id = setInterval(tick, 2000);
    return () => { stop = true; clearInterval(id); };
  }, [token, s?.code]); // eslint-disable-line react-hooks/exhaustive-deps
  const leave = () => { if (s && token) void post("/api/cook/update", { code: s.code, token, end: true }).catch(() => {}); setEnded(true); setToken(null); setS(null); };
  // one photo: from the phone's camera app (the file input opens it), resized, sent with the step
  const look = async (k: number) => {
    if (!s || !token) throw new Error("The session ended.");
    const f = await new Promise<File | null>((res) => { pending.current = res; fileRef.current?.click(); });
    if (!f) throw new Error("No photo taken. Tap Chef, look again.");
    const raw = await readFile(f), img = await resizeImageBase64(raw, 1024, 1024).catch(() => raw);
    const d = await post("/api/cook/look", { code: s.code, token, image: img, step: k });
    return String(d.reply || "");
  };
  const fileInput = <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0] ?? null; e.target.value = ""; pending.current?.(f); pending.current = null; }} />;
  if (s && token) return (<>
    {fileInput}
    <CookMode title={s.title} steps={s.steps} items={s.items} ticks={new Set(s.ticks)}
      onTick={(k) => { setS((o) => (o && !o.ticks.includes(k) ? { ...o, ticks: [...o.ticks, k] } : o)); void post("/api/cook/update", { code: s.code, token, tick: k }).catch(() => {}); }}
      onClose={leave}
      link={{ remoteStep: remote, onStep: (k) => { void post("/api/cook/update", { code: s.code, token, step: k }).then((d) => { seen.current = Math.max(seen.current, d.session.rev); }).catch(() => {}); },
        top: <div className="cook-link" role="status"><small>Kitchen screen · joined to the cooking phone</small></div>,
        look, closeLabel: "Leave", doneLabel: "Finish" }} />
  </>);
  return (
    <div className="kitchen-join">
      <b style={{ fontSize: 22 }}>Chef Mealan · Kitchen screen</b>
      {ended ? <>
        <p>The session ended. This screen kept nothing.</p>
        <small className="muted">To cook with it again: on the cooking phone, in cook mode, tap Use another screen.</small>
        <button className="pill pill-wide" onClick={() => { setEnded(false); setCode(""); }}>Join another</button>
      </> : <>
        <small className="muted">Type the code from the phone that is cooking. It is in cook mode, under Use another screen.</small>
        <label htmlFor="kitchen-code" className="sr-only">Code</label>
        <input id="kitchen-code" className="search" value={code} autoComplete="off" autoCapitalize="characters" maxLength={4} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))} placeholder="7K4P" />
        <button className="pill pill-primary pill-wide" disabled={busy || code.length !== 4} onClick={() => void join(code)}>Join</button>
        {err && <small className="error" role="alert">{err}</small>}
        <small className="muted">This screen shows the recipe and the steps of the phone that is cooking. Never that person's numbers, goal or profile. It forgets everything when the session ends.</small>
      </>}
    </div>
  );
}
