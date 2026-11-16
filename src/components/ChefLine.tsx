// DT211 v8 and DT212 v3 (0.3.53, boards Stories158 and Stories159): every question Chef Mealan asks is his line, the chat's
// bubble with his mark, the full width of the block it sits in (v9). Voice will read the same lines later (DT213).
import type { ReactNode } from "react";
import { Mark } from "./Mark";
// DT305 (0.3.151): side sits under his words, beside the photo (Remove the photo on the photo screen)
export function ChefLine({ text, image, children, className, side }: { text: ReactNode; image?: string | null; children?: ReactNode; className?: string; side?: ReactNode }) {
  return (
    <div className={`bubble mealan chef-line${className ? ` ${className}` : ""}`}>
      <span className="bubble-tag tag-chef"><Mark size={14} color="var(--brand)" />CHEF MEALAN</span>
      {image ? <div className="chef-line-row"><img className="chef-line-img" src={image} alt="your plate" />{side ? <div className="chef-line-side"><p>{text}</p>{side}</div> : <p>{text}</p>}</div> : <p>{text}</p>}
      {children}
    </div>
  );
}
