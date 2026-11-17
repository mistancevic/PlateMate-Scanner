// The app's dialog: a title, a close button, and Back closes it.
// 0.3.156: moved out of App.tsx as it was.
import { type ReactNode } from "react";
import { X } from "lucide-react";
import { useBack } from "../back";
import { w } from "../words";

export function Modal({
  eyebrow,
  title,
  close,
  children,
}: {
  eyebrow?: string;
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  useBack(true, close);
  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={eyebrow ? `${eyebrow}: ${title}` : title}
      >
        <header>
          <div className="modal-titles">{eyebrow && <small className="eyebrow-line">{eyebrow}</small>}<h2>{title}</h2></div>
          <button className="icon" aria-label={w("app.closeDialog")} onClick={close}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
