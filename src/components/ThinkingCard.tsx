import { useEffect, useState } from "react";

// DT148 (0.2.129, board Stories100 version 2; Tester 3 saw a line of text and could not tell anything was going on): while Chef
// Mealan works, a card that moves. His hat stirs, three dots steam, a bar runs back and forth, the seconds count; after 20
// seconds one more line says it takes longer than usual. Nothing pretends to be a step that is not happening. One card for the
// idea, the recipe read and the method.
// quietSlow: the place has its own slow line (a recipe read says up to two minutes)
export function ThinkingCard({ title, sub, className = "", quietSlow = false }: { title: string; sub?: string; className?: string; quietSlow?: boolean }) {
  const [t, setT] = useState(0);
  useEffect(() => { const s = Date.now(); const id = window.setInterval(() => setT(Math.floor((Date.now() - s) / 1000)), 1000); return () => window.clearInterval(id); }, []);
  return (
    <div className={`card thinking-card ${className}`} role="status" aria-live="polite">
      <div className="thinking-hat" aria-hidden="true"><img src="/icon.svg" alt="" /><span className="thinking-steam"><i /><i /><i /></span></div>
      <div className="thinking-text">
        <b>{title}</b>
        <small className="muted">{sub ? `${sub} · ` : ""}{t} s</small>
        {t >= 20 && !quietSlow && <small className="thinking-slow">Taking longer than usual. Still on it.</small>}
        <div className="thinking-bar"><i /></div>
      </div>
    </div>
  );
}
