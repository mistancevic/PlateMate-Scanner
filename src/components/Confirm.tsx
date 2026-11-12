import { useEffect, useState, type ReactNode } from "react";
// A two-tap confirmation. Browser confirm() is blocked inside some frames, so we never rely on it.
// DT289 (0.3.143, board Stories216): a red-border button; armed (Sure?), filled red
export function ConfirmButton({ className = "pill pill-small pill-danger-line", label, confirmLabel = "Tap again to confirm", onConfirm, ariaLabel }:
  { className?: string; label: ReactNode; confirmLabel?: string; onConfirm: () => void; ariaLabel?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(t); }, [armed]);
  return (
    <button className={className + (armed ? " armed pill-danger" : "")} aria-label={ariaLabel} onClick={() => { if (armed) { setArmed(false); onConfirm(); } else setArmed(true); }}>
      {armed ? confirmLabel : label}
    </button>
  );
}
