import { useEffect, useState } from "react";
import { Mark, APP_NAME } from "./Mark";
import { startLine } from "../startTimes";

// What shows while the app checks the sign-in and reads the account: never an empty screen.
// After ten seconds it says so, and offers to try again or to open with what is on this phone.
export function Starting({ onLocal }: { onLocal: (() => void) | null }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 10000); return () => clearTimeout(t); }, []);
  // 0.3.61: once slow, the line of steps counts on, so it shows which step is slow
  const [, tick] = useState(0);
  useEffect(() => { if (!slow) return; const t = setInterval(() => tick((n) => n + 1), 500); return () => clearInterval(t); }, [slow]);
  return (
    <div className="app-shell">
      <main className="starting" aria-live="polite">
        <Mark size={64} color="var(--brand)" />
        <b>{APP_NAME}</b>
        <p>{onLocal ? "Opening your account…" : "Checking your sign-in…"}</p>
        {slow && (
          <div className="starting-slow">
            <p>This is taking longer than usual. The connection may be slow.</p>
            {startLine() && <small className="muted starting-steps">{startLine()}</small>}
            {onLocal && <button className="pill pill-primary action-main" onClick={onLocal}>Open with what's on this phone</button>}
            <button className="link" onClick={() => location.reload()}>Try again</button>
            {onLocal && <small>Chef Mealan keeps trying your account in the background, and nothing you change on this phone is lost.</small>}
          </div>
        )}
      </main>
    </div>
  );
}
