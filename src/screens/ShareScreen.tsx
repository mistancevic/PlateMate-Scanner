import { useState } from "react";
import { Share2, Copy } from "lucide-react";
import { QrCode } from "../components/QrCode";
import type { AppApi } from "./api";
import { SHARE_TARGETS as TARGETS, inviteUrl } from "../share";

// SH73 (Milan 21 October 2026, 21:10 to 23:42): Share Chef Mealan, from the menu, for Milan only for now. Show the link: a
// QR code for chefmealan.com or for the book, with Share and Copy; both count as QR in Metrics. Invite now: a coach types the person's
// email, makes a personal code and shows it as a QR code; scanning it opens chefmealan.com with the code filled in.

export function ShareScreen(p: AppApi) {
  const coach = p.profile.role === "coach" || !p.cloudEnabled;
  const [tab, setTab] = useState<"link" | "invite">("link");
  return (
    <div className="sh">
      {coach && (
        <div className="mt-tabs" role="tablist" aria-label="What to share">
          {([["link", "Show the link"], ["invite", "Invite now"]] as const).map(([k, t]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={`pill pill-small${tab === k ? " pill-primary" : ""}`} onClick={() => setTab(k)}>{t}</button>
          ))}
        </div>
      )}
      {tab === "link" || !coach ? <ShowLink {...p} /> : <InviteNow {...p} />}
    </div>
  );
}

function ShowLink(p: AppApi) {
  const [to, setTo] = useState<(typeof TARGETS)[number]["id"]>("site");
  const t = TARGETS.find((x) => x.id === to)!;
  const share = async () => {
    try { if (navigator.share) { await navigator.share({ title: "Chef Mealan", url: t.url }); return; } } catch { return; }
    copy();
  };
  const copy = async () => { try { await navigator.clipboard.writeText(t.url); p.notify("Link copied."); } catch { p.notify(t.url); } };
  return (
    <section className="card sh-card">
      <div className="sh-chips" role="radiogroup" aria-label="Where the code opens">
        {TARGETS.map((x) => <button key={x.id} role="radio" aria-checked={to === x.id} className={`pill pill-small${to === x.id ? " pill-primary" : ""}`} onClick={() => setTo(x.id)}>{x.name}</button>)}
      </div>
      <div className="sh-qr"><QrCode text={t.url} label={`QR code that opens ${t.name}`} /></div>
      <b className="sh-name">{t.name}</b>
      <small className="muted sh-line">{t.line}</small>
      <div className="button-row sh-buttons">
        <button className="pill pill-primary" onClick={share}><Share2 size={16} /> Share the link</button>
        <button className="pill" onClick={copy}><Copy size={16} /> Copy</button>
      </div>
      <small className="muted">Turn your screen brightness up, and the code scans from arm's length.</small>
    </section>
  );
}

function InviteNow(p: AppApi) {
  const [name, setName] = useState(""), [email, setEmail] = useState("");
  const [made, setMade] = useState<{ code: string; email: string; name: string; spots?: number | null } | null>(null), [busy, setBusy] = useState(false);
  const make = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), email: email.trim() }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMade(d);
    } catch (e: any) { p.setError(e.message || "Couldn't make the code."); } finally { setBusy(false); }
  };
  if (made)
    return (
      <section className="card sh-card">
        <div className="sh-qr"><QrCode text={inviteUrl(made.code)} label={`QR code with the personal code for ${made.email}`} /></div>
        <b className="sh-code">{made.code}</b>
        <small className="muted sh-line">For {made.name ? `${made.name}, ` : ""}{made.email}. They scan it, sign in with Google using this email, and the code is filled in. Used once, valid 30 days.</small>
        <div className="button-row sh-buttons">
          <button className="pill" onClick={() => { setMade(null); setName(""); setEmail(""); }}>Make another</button>
        </div>
        {typeof made.spots === "number" && <small className="sh-spots">Beta spots left: {made.spots}</small>}
        <small className="muted">You find it in Clients, under Invite a client, where you can take it back.</small>
      </section>
    );
  return (
    <section className="card sh-card">
      <b>Invite someone now</b>
      <small className="muted">A personal code for one Google email: used once, valid 30 days. You show it as a QR code; they scan it, sign in with Google and join. Making a code lowers Beta spots left by one.</small>
      <div className="l-form" style={{ marginTop: 8 }}>
        <input aria-label="Name" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <input aria-label="Their Google email" placeholder="Their Google email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="pill pill-primary" disabled={busy || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim())} onClick={make}>Make a code</button>
      </div>
    </section>
  );
}
