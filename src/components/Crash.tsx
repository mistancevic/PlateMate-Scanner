import { Component, type ReactNode } from "react";
import { w } from "../words";

// Never a white screen again: if the app fails to draw, say so, show what failed, and offer the ways out.
// The phone's copy is never deleted here; "Open from the account" moves it aside under a backup key first.
export class Crash extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { try { localStorage.setItem("chefmealan-last-crash", JSON.stringify({ at: new Date().toISOString(), message: error.message, stack: (error.stack ?? "").split("\n").slice(0, 6).join("\n") })); } catch { /* nothing to do */ } }
  render() {
    const e = this.state.error;
    if (!e) return this.props.children;
    const version = `${(import.meta.env.VITE_VERSION as string | undefined) || "0"} · ${(import.meta.env.VITE_COMMIT as string | undefined) || "preview"}`;
    const exportCopy = () => {
      const dump: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; if (/platemate|chefmealan/.test(k)) dump[k] = localStorage.getItem(k); }
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" })); a.download = `chefmealan-phone-copy-${new Date().toISOString().slice(0, 16)}.json`; a.click();
    };
    const fromAccount = () => {
      try { const raw = localStorage.getItem("platemate-pilot-v1"); if (raw) localStorage.setItem(`platemate-pilot-v1-aside-${Date.now()}`, raw); localStorage.removeItem("platemate-pilot-v1"); localStorage.removeItem("chefmealan-state-at"); } catch { /* keep going */ }
      location.reload();
    };
    return (
      <div style={{ padding: 24, fontFamily: "Nunito, system-ui, sans-serif", color: "var(--ink)", background: "var(--base)", minHeight: "100vh", boxSizing: "border-box" }}>
        <h2 style={{ margin: "8px 0" }}>{w("app.crashTitle")}</h2>
        <p>{w("app.crashDataSafe")}</p>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12.5, background: "var(--surface)", padding: 12, borderRadius: 12, border: "1.5px solid var(--line)" }}>{version}{"\n"}{e.message}{"\n"}{(e.stack ?? "").split("\n").slice(1, 5).join("\n")}</pre>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          <button onClick={() => location.reload()} style={btn}>{w("app.crashTryAgain")}</button>
          <button onClick={exportCopy} style={btn}>{w("app.crashSaveCopy")}</button>
          <button onClick={fromAccount} style={{ ...btn, background: "var(--brand)", color: "var(--surface)", borderColor: "var(--brand)" }}>{w("app.crashFromAccount")}</button>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>{w("app.crashFromAccountWhy")}</p>
      </div>
    );
  }
}
const btn = { height: 46, borderRadius: 23, border: "1.5px solid var(--line)", background: "var(--surface)", color: "var(--brand-text)", font: "inherit", fontWeight: 800, fontSize: 15 } as const;
