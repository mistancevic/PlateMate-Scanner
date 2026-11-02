// DT211 v8 and DT212 v3 (0.3.53, boards Stories158 and Stories159): every question Chef Mealan asks is his line, the chat's
// bubble with his mark, the full width of the block it sits in (v9). Voice will read the same lines later (DT213).
import type { ReactNode } from "react";
import { Mark } from "./Mark";
export function ChefLine({ text, image, children, className }: { text: ReactNode; image?: string | null; children?: ReactNode; className?: string }) {
  return (
    <div className={`bubble mealan chef-line${className ? ` ${className}` : ""}`}>
      <span className="bubble-tag tag-chef"><Mark size={14} color="var(--brand)" />CHEF MEALAN</span>
      {image ? <div className="chef-line-row"><img className="chef-line-img" src={image} alt="your plate" /><p>{text}</p></div> : <p>{text}</p>}
      {children}
    </div>
  );
}
