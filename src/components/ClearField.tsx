// DT112 (0.2.94, board Stories67; Milan 25 October 00:36): a text field with text gets an x at its right; one tap empties it.
import type { ReactNode } from "react";
export function ClearField({ value, onClear, children, label = "Clear the field" }: { value: string; onClear: () => void; children: ReactNode; label?: string }) {
  return (
    <div className="clear-field">
      {children}
      {value ? <button type="button" className="clear-x" aria-label={label} onClick={onClear}>✕</button> : null}
    </div>
  );
}
