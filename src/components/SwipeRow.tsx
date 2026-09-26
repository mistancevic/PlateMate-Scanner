import { useRef, useState, type ReactNode } from "react";
// Swipe right to remove, swipe left to swap. Shows the action behind the row while dragging. Works with a finger or a mouse.
export function SwipeRow({ children, onRemove, onSwap }: { children: ReactNode; onRemove: () => void; onSwap: () => void }) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const THRESH = 90;
  const end = () => {
    if (dx > THRESH) onRemove(); else if (dx < -THRESH) onSwap();
    setDx(0); start.current = null;
  };
  return (
    <div className="swipe">
      <div className={`swipe-bg ${dx > 0 ? "right" : dx < 0 ? "left" : ""} ${Math.abs(dx) > THRESH ? "armed" : ""}`}>
        <span className="swipe-remove">Remove</span><span className="swipe-swap">Swap</span>
      </div>
      <div className="swipe-fg" style={{ transform: `translateX(${dx}px)`, transition: start.current === null ? "transform 0.15s" : "none" }}
        onPointerDown={(e) => { if ((e.target as HTMLElement).closest("input,button")) return; start.current = e.clientX; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (start.current === null) return; setDx(Math.max(-140, Math.min(140, e.clientX - start.current))); }}
        onPointerUp={end} onPointerCancel={end}>
        {children}
      </div>
    </div>
  );
}
