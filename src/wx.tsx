// DT243 part two: a line with an element in it (a bold word, a link, a number in <b>) is still one line: the element sits in
// its slot, so a language can move it. Plain values (text, numbers, a Val) fill as in w(); an element goes back where its slot lands.
import { Fragment, type ReactNode } from "react";
import { w, type Val, type WordKey } from "./words";

export function wx(k: WordKey, v: Record<string, Val | ReactNode>): ReactNode {
  const plain: Record<string, Val> = {}, els: Record<string, ReactNode> = {};
  for (const [s, x] of Object.entries(v)) {
    if (typeof x === "string" || typeof x === "number" || typeof x === "function") plain[s] = x as Val;
    else { plain[s] = `\u0000${s}\u0000`; els[s] = x; }
  }
  return w(k, plain).split(/\u0000(\w+)\u0000/).map((t, i) => (i % 2 ? <Fragment key={i}>{els[t]}</Fragment> : t));
}
